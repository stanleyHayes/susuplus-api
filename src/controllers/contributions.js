const Contribution = require('../models/contribution');
const Group = require('../models/group');
const GroupMember = require('../models/group-member');
const {sendEmail} = require("../utils/emails");

exports.createContribution = async (req, res) => {
    try {
        let paymentDetails;
        const {group: groupID, amount, paymentMethod, account} = req.body;
        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({message: 'Group does not exist', data: null});
        const groupMember = await GroupMember.findOne({
            user: req.user._id,
            group: groupID
        });
        if (!groupMember)
            return res.status(404).json({message: `User does not belong to the group`});
        //MAKE PAYMENT HERE AND RETURN THE PAYMENT DETAILS
        const payment = {};
        payment['method'] = paymentMethod;
        switch (paymentMethod) {
            case 'MOBILE_MONEY':
                const mobileMoneyAccount = await MobileMoneyAccount
                    .findOne({_id: account, status: {$ne: 'DELETED'}});
                if(!mobileMoneyAccount)
                    return res.status(404).json({message: 'Mobile Money Account not found', data: null});
                payment['mobileMoneyAccount'] = account;
                break;
            case 'DEBIT_CARD':
                const debitCard = await DebitCard
                    .findOne({_id: account, status: {$ne: 'DELETED'}});
                if(!debitCard)
                    return res.status(404).json({message: 'Debit Card not found', data: null});
                payment['debitCard'] = account;
                break;
            case 'BANK_ACCOUNT':
                const bankAccount = await BankAccount
                    .findOne({_id: account, status: {$ne: 'DELETED'}});
                if(!bankAccount)
                    return res.bankAccount(404).json({message: 'Bank Account not found', data: null});
                payment['bankAccount'] = account;
                break;
        }


        const contribution = await Contribution.create({
            group: group._id,
            amount,
            contributor: req.user._id,
            payment,
            paymentDetails
        });

        // Send each group member an email that a contribution has been made
        const groupMembers = await GroupMember.find({group: groupID})
            .populate({path: 'user', select: 'name email'})
            .populate({path: group, select: 'name'});

        for (let i = 0; i < groupMembers.length; i++) {
            if (groupMember.user._id !== req.user._id) {
                const message = `A contribution of ${amount.value} ${amount.currency} has been made by ${req.user.name} towards a group ${group.name} to which you are a member of.`;
                await sendEmail(groupMember.user.email, 'CONTRIBUTION TOWARDS SUSU', message);
            } else if (groupMember.user._id === req.user._id) {
                const message = `You made a contribution of ${amount.value} ${amount.currency} towards the group ${group.name} to which you are a member of.`;
                await sendEmail(groupMember.user.email, 'CONTRIBUTION TOWARDS SUSU', message);
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
