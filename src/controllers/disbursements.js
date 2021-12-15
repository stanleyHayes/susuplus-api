const Disbursement = require('../models/disbursement');
const Group = require('../models/group');
const GroupMember = require('../models/group-member');
const Susu = require('../models/susu');
const SusuMember = require('../models/susu-member');
const PaymentMethod = require('../models/payment-method');
const moment = require("moment/moment");
const {createCharge, transfer} = require("../utils/paystack");
const {sendEmail} = require("../utils/emails");

exports.createDisbursement = async (req, res) => {
    try {
        const {
            reason,
            sourceAccount,
            destinationAccount,
            groupID,
            susuID,
            round,
            paymentMethod
        } = req.body;
        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({message: 'Group not found'});
        const groupMember = await GroupMember.findOne({group: groupID, user: req.user._id});
        if (groupMember)
            return res.status(404).json({message: 'You are not a member of this group'});
        const susu = await Susu.findById(susuID);
        if (susu)
            return res.status(404).json({message: 'Susu not found'});
        const susuMember = await SusuMember.findOne({user: req.user._id, susu: susuID});
        if (!susuMember)
            return res.status(404).json({message: 'You are not a member of the susu'});

        const sourcePaymentMethod = await PaymentMethod.findById(sourceAccount);
        if (!sourcePaymentMethod)
            return res.status(404).json({message: 'Source account not found'});
        const destinationPaymentMethod = await PaymentMethod.findById(destinationAccount);
        if (!destinationPaymentMethod)
            return res.status(404).json({message: 'Destination account not found'});

        if(moment().isBefore(susu.startDate))
            return res.status(400).json({message: 'Susu has not started'});

        if(moment().isSameOrAfter(susu.endDate))
            return res.status(400).json({message: 'Susu has ended'});

        const amount = (group.percentages.susu / 100) * susu.paymentPlan.amount;
        const currency = susu.paymentPlan.currency;

        let paymentDetails = {};
        let chargeResponse = {};

        switch (paymentMethod) {
            case 'Mobile Money':
                chargeResponse = await createCharge(
                    req.user.email,
                    amount,
                    currency,
                    null,
                    {phone: sourcePaymentMethod.number, provider: sourcePaymentMethod.provider},
                    null,
                    'Mobile Money');
                if (!chargeResponse.status)
                    return res.status(400).json({message: 'Payment failed'});
                paymentDetails = {...chargeResponse.data};
                break;

            case 'Card':
                chargeResponse = await createCharge(
                    req.user.email,
                    amount,
                    currency,
                    null,
                    null,
                    {
                        number: sourcePaymentMethod.cardDetail.number,
                        expiry_month: sourcePaymentMethod.cardDetail.expiryMonth,
                        expiry_year: sourcePaymentMethod.cardDetail.expiryYear,
                        cvv: sourcePaymentMethod.cardDetail.cvv
                    },
                    'Card');
                if (!chargeResponse.status)
                    return res.status(400).json({message: 'Payment failed'});
                paymentDetails = chargeResponse.data;
                break;

            case 'Bank Account':
              chargeResponse = await createCharge(
                    req.user.email,
                    amount,
                    currency,
                    {
                        account_number: sourcePaymentMethod.bankAccount.accountNumber,
                        code: sourcePaymentMethod.bankAccount.bankCode
                    },
                    null,
                    null,
                    'Bank Account');
                if (!chargeResponse.status)
                    return res.status(400).json({message: 'Payment failed'});
                paymentDetails = chargeResponse.data;
                break;
        }

        const transferResponse = await transfer(
            destinationPaymentMethod.recipientCode,
            amount,
            currency,
            reason)

        if (!transferResponse.status)
            return res.status(400).json({message: transferResponse.message});


        const disbursement = await Disbursement.create({
            group: group._id,
            amount,
            recipient: destinationPaymentMethod.user,
            round,
            sourcePaymentMethod: sourceAccount,
            destinationPaymentMethod: destinationAccount,
            paymentDetails,
            susu: susuID
        });

        const currentSusuMemberRecipient = await SusuMember.findOne(
            {susu: susuID, user: destinationPaymentMethod.user});
        currentSusuMemberRecipient.isPaid = true;
        currentSusuMemberRecipient.disbursementDate = Date.now();
        await currentSusuMemberRecipient.save();

        const nextSusuMemberRecipient = await SusuMember
            .findOne({susu: susuID, isPaid: false, position: round + 1});

        susu.previousRecipient = {
            user: susu.currentRecipient.user,
            member: susu.currentRecipient.member,
            date: susu.currentRecipient.date
        };

        susu.currentRecipient = {
            user: susu.nextRecipient.user,
            member: susu.nextRecipient.member,
            date: susu.nextRecipient.disbursementDate

        };

        susu.nextRecipient = {
            user: nextSusuMemberRecipient.user,
            member: nextSusuMemberRecipient.member,
            date: moment(currentSusuMemberRecipient.disbursementDate).add(susu.contributionPlan.interval, susu.contributionPlan.unit)
        }

        susu.paymentOrder.map(order => {
            if(order.user === currentSusuMemberRecipient.user) {
                order.isPaid = true;
                order.disbursementDate = Date.now()
            }
        });

        await susu.save();

        // Send each group member an email that a contribution has been made
        const susuMembers = await SusuMember.find({group: groupID})
            .populate({path: 'user', select: 'name email image'})
            .populate({path: group, select: 'name'});

        for (let i = 0; i < susuMembers.length; i++) {
            const susuMember = susuMembers[i];
            if (susuMember.user._id !== req.user._id) {
                const message = `A contribution of ${amount.value} ${amount.currency} has been made by ${req.user.name} towards a group ${group.name} to which you are a member of.`;
                await sendEmail(susuMember.user.email, 'CONTRIBUTION TOWARDS SUSU', message);
            } else if (susuMember.user._id === req.user._id) {
                const message = `You made a contribution of ${amount.value} ${amount.currency} towards the group ${group.name} to which you are a member of.`;
                await sendEmail(susuMember.user.email, 'CONTRIBUTION TOWARDS SUSU', message);
            }
        }

        const populatedDisbursement = await Disbursement.findById(disbursement._id)
            .populate({path: 'recipient', select: 'name email phone'})
            .populate({path: 'group', select: 'name'});

        res.status(200).json({
            message: `Disbursement made by ${group.name} towards member ${req.user.name} `,
            data: populatedDisbursement
        });

        res.status(200).json({message: `Create Disbursement`, data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


// get disbursements of a susu
// get disbursements of a single user
// get disbursements of group
exports.getDisbursements = async (req, res) => {
    try {
        const match = {};
        if (req.query.group) {
            match['group'] = req.query.group;
        }
        if (req.query.user) {
            match['user'] = req.query.user;
        }
        if (req.query.susu) {
            match['susu'] = req.query.susu;
        }
        const disbursements = await Disbursement.find(match);
        res.status(200).json({
            message: `${disbursements.length} disbursements retrieved`,
            data: disbursements
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getDisbursement = async (req, res) => {
    try {
        const disbursement = await Disbursement.findById(req.params.id)
            .populate({path: 'recipient'})
            .populate({path: 'group'});
        if (!disbursement)
            return res.status(404).json({data: null, message: 'Disbursement not found'});
        res.status(200).json({message: `Disbursement retrieved`, data: disbursement});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
