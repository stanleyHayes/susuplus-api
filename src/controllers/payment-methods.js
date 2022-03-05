const Source = require("../models/source");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");
const {addPaymentMethod} = require("../dao/payment-methods");


exports.addPaymentMethod = async (req, res) => {
    try {
        const {type, ownership} = req.body;

        if (ownership === 'Group') {
            const group = await Group.findById(req.body.groupID);
            if (!group)
                return res.status(404).json({message: 'Group not found'});
            const groupMember = await GroupMember.findOne({group: req.body.groupID, user: req.user._id});
            if (!groupMember)
                return res.status(403).json({message: 'You are not a member of this group'});
            if (groupMember.role !== 'ADMIN')
                return res.status(403).json({message: 'You do no have the permissions to perform this operation'});
        }

        if (type === 'bank_account') {
            const {
                bankName,
                accountNumber,
                routingNumber,
                accountHolderType,
                accountType,
                accountHolderName,
                country,
                type
            } = req.body;
            if (!bankName || !accountNumber || !routingNumber || !accountHolderType || !accountType || !accountHolderName)
                return res.status(400).json({message: 'Missing required fields'});

            const paymentMethodResponse = await addPaymentMethod(
                type,
                'Individual',
                null,
                req.user._id,
                {bankName,
                    accountNumber,
                    routingNumber,
                    accountHolderType,
                    accountType,
                    accountHolderName,
                    country,
                },
                null);


            if (!paymentMethodResponse.success)
                return res.status(paymentMethodResponse.code).json({message: paymentMethodResponse.message});

        }
        else if (type === 'card') {

            const {
                cardHolderName,
                cvv,
                expiryDate,
                cardNumber,
                type,
                address,
                funding,
            } = req.body;

            const paymentMethodResponse = await addPaymentMethod(
                type,
                'Individual',
                null,
                req.user._id.toString(),
                null,
                {
                    cardNumber,
                    funding,
                    address,
                    cvv,
                    expiryDate,
                    cardHolderName,
                });

            if (!paymentMethodResponse.success)
                return res.status(paymentMethodResponse.code).json({message: paymentMethodResponse.message});

            return res.status(201).json({message: paymentMethodResponse.message, data: paymentMethodResponse.data});
        }
        else {
            return res.status(400).json({message: 'Unknown payment method'});
        }
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updatePaymentMethod = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment method updated', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getPaymentMethod = async (req, res) => {
    try {
        const {ownership} = req.query;
        const {id} = req.params;
        let paymentMethod
        if (ownership === 'Individual') {
            paymentMethod = await Source.findOne({"owner.user": req.user.id, _id: id})
                .populate({path: 'owner.user', select: 'name image'});
        } else if (ownership === 'Group') {
            const groupMember = await GroupMember.findOne({group: req.query.group, user: req.user._id, _id: id});
            if (!groupMember)
                return res.status(403).json({message: 'You are not a member of this group'});
            paymentMethod = await Source.find({"owner.group": req.query.group})
                .populate({path: 'owner.group', select: 'name image'});
        }
        res.status(200).json({message: 'Payment method retrieved', data: paymentMethod});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getPaymentMethods = async (req, res) => {
    try {
        const {ownership} = req.query;
        let paymentMethods;
        if (ownership === 'Individual') {
            paymentMethods = await Source.find({"owner.user": req.user._id})
                .populate({path: 'owner.user', select: 'name image'});
        } else if (ownership === 'Group') {
            const groupMember = await GroupMember.findOne({group: req.query.group, user: req.user._id});
            if (!groupMember)
                return res.status(403).json({message: 'You are not a member of this group'});
            console.log(req.query.group)
            paymentMethods = await Source.find({"owner.group": req.query.group})
                .populate({path: 'owner.group', select: 'name image'});
        }
        res.status(200).json({message: 'Payment methods retrieved', data: paymentMethods});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removePaymentMethod = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment method removed', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
