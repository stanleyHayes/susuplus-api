const Contribution = require('../models/contribution');
const Group = require('../models/group');
const GroupMember = require('../models/group-member');
const {sendEmail} = require("../utils/emails");
const PaymentMethod = require("../models/payment-method");
const Susu = require("../models/susu");
const moment = require("moment");
const {createCharge, transfer} = require("../utils/paystack");
const Percentage = require("../models/percentage");
const SusuMember = require("../models/susu-member");

exports.createContribution = async (req, res) => {
    try {
        const {
            group: groupID,
            susu: susuID,
            paymentMethod,
            sourceAccount,
            destinationAccount,
            round,
            reason
        } = req.body;
        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({message: 'Group does not exist', data: null});
        const groupMember = await GroupMember.findOne({
            user: req.user._id,
            group: groupID
        });
        const susu = await Susu.findById(susuID);
        if (!susu)
            return res.status(404).json({message: 'Susu not found'});
        if (moment().isBefore(susu.startDate)) {
            susu.status = 'STARTED';
            await susu.save();
            return res.status(400).json({message: 'Susu has not started'});
        }
        const amount = susu.paymentPlan.amount;
        const currency = susu.paymentPlan.currency;

        const paidContribution = await Contribution.findOne({
            round,
            susu: susuID,
            group: groupID,
            contributor: req.user._id
        });

        if (paidContribution)
            return res.status(409).json({message: 'Contribution already made'});

        let paymentDetails;
        let chargeResponse = null;
        if (!groupMember)
            return res.status(404).json({message: `User does not belong to the group`});

        const recipientAccount = await PaymentMethod.findById(sourceAccount);
        if (!recipientAccount)
            return res.status(404).json({message: `${paymentMethod} not found`});

        switch (paymentMethod) {
            case 'Mobile Money':
                const mobileMoneyAccount = await PaymentMethod.findOne(
                    {_id: sourceAccount, method: paymentMethod});
                if (!mobileMoneyAccount)
                    return res.status(404).json({message: 'Mobile Money Account not found'});
                chargeResponse = await createCharge(
                    req.user.email,
                    amount,
                    currency,
                    null,
                    {phone: mobileMoneyAccount.number, provider: mobileMoneyAccount.provider},
                    null,
                    'Mobile Money');
                if (!chargeResponse.status)
                    return res.status(400).json({message: 'Payment failed'});
                paymentDetails = {...chargeResponse.data};
                break;

            case 'Card':
                const cardPaymentMethod = await PaymentMethod.findOne({_id: sourceAccount, method: paymentMethod});
                if (!cardPaymentMethod)
                    return res.status(404).json({message: 'Card not found'});
                chargeResponse = await createCharge(
                    req.user.email,
                    amount,
                    currency,
                    null,
                    null,
                    {
                        number: cardPaymentMethod.cardDetail.number,
                        expiry_month: cardPaymentMethod.cardDetail.expiryMonth,
                        expiry_year: cardPaymentMethod.cardDetail.expiryYear,
                        cvv: cardPaymentMethod.cardDetail.cvv
                    },
                    'Card');
                if (!chargeResponse.status)
                    return res.status(400).json({message: 'Payment failed'});
                paymentDetails = chargeResponse.data;
                break;

            case 'Bank Account':
                const bankAccountPaymentMethod = await PaymentMethod.findOne({
                    _id: sourceAccount,
                    method: paymentMethod
                });
                if (!bankAccountPaymentMethod)
                    return res.status(404).json({message: 'Bank Account not found', data: null});
                chargeResponse = await createCharge(
                    req.user.email,
                    amount,
                    currency,
                    {
                        account_number: bankAccountPaymentMethod.bankAccount.accountNumber,
                        code: bankAccountPaymentMethod.bankAccount.bankCode
                    },
                    null,
                    null,
                    'Bank Account');
                if (!chargeResponse.status)
                    return res.status(400).json({message: 'Payment failed'});
                paymentDetails = chargeResponse.data;
                break;
        }

        const percentage = await Percentage.findOne({});
        const payableAmount = amount - (amount * percentage.percentage / 100)

        const transferResponse = await transfer(
            recipientAccount.recipientCode,
            payableAmount,
            currency,
            reason)

        if (!transferResponse.status)
            return res.status(400).json({message: transferResponse.message});

        const contribution = await Contribution.create({
            group: group._id,
            amount,
            contributor: req.user._id,
            round,
            sourcePaymentMethod: sourceAccount,
            destinationPaymentMethod: destinationAccount,
            paymentDetails,
            susu: susuID
        });

        // Send each group member an email that a contribution has been made
        const susuMembers = await SusuMember.find({susu: susuID})
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

        const populatedContribution = await Contribution.findById(contribution._id)
            .populate({path: 'contributor', select: 'name email phone'})
            .populate({path: 'group', select: 'name'});

        res.status(200).json({
            message: `Contribution made by ${req.user.name} towards group ${group.name}`,
            data: populatedContribution
        });

    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getContributions = async (req, res) => {
    try {
        const match = {};
        if (req.query.contributor) {
            match['contributor'] = req.query.contributor;
        }
        if (req.query.group) {
            match['group'] = req.query.group;
        }
        const limit = parseInt(req.query.size) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const contributions = await Contribution
            .find(match)
            .populate({path: 'contributor', select: 'name email'})
            .populate({path: 'group', select: 'name'})
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1});

        const totalContributions = await Contribution.find(match).countDocuments();
        res.status(200).json({
            message: `${contributions.length} Contribution${contributions.length === 1 ? '' : 's'}`,
            data: contributions, totalContributions
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getContribution = async (req, res) => {
    try {
        const contribution = await Contribution.findById(req.params.id)
            .populate({path: 'contributor', select: 'name email'})
            .populate({path: 'group', select: 'name'})
        if (!contribution)
            return res.status(404).json({message: 'Contribution not found', data: null});
        res.status(200).json({message: `Contribution Retrieved`, data: contribution});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
