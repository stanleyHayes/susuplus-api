const Source = require("../models/source");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");
const CreditCard = require("credit-card");
const {addPaymentMethod} = require("../dao/payment-methods");

exports.addSource = async (req, res) => {
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
                ownership,
                req.body.groupID,
                req.user._id,
                {
                    bankName,
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

            const brand = CreditCard.determineCardType(cardNumber);
            const [expiryMonth, expiryYear] = expiryDate.split("/");
            const validatedCard = CreditCard.validate({
                cardType: brand,
                cardHolderName,
                expiryMonth,
                expiryYear,
                cvv
            });

            if(validatedCard.isExpired)
                return res.status(400).json({message: 'Card Expired'});

            const paymentMethodResponse = await addPaymentMethod(
                type,
                ownership,
                req.body.groupID,
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

exports.updateSource = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment method updated', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getSource = async (req, res) => {
    try {
        const {ownership} = req.query;
        const {id} = req.params;
        let source
        if (ownership === 'Individual') {
            source = await Source.findOne({"owner.user": req.user.id, _id: id})
                .populate({path: 'owner.user', select: 'name image'});
        } else if (ownership === 'Group') {
            const groupMember = await GroupMember.findOne({group: req.query.group, user: req.user._id, _id: id});
            if (!groupMember)
                return res.status(403).json({message: 'You are not a member of this group'});
            source = await Source.find({"owner.group": req.query.group})
                .populate({path: 'owner.group', select: 'name image'});
        }
        res.status(200).json({message: 'Payment method retrieved', data: source});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getSources = async (req, res) => {
    try {
        const {ownership} = req.query;
        let source;
        if (ownership === 'Individual') {
            source = await Source.find({"owner.user": req.user.id})
                .populate({path: 'owner.user', select: 'name image'});
        } else if (ownership === 'Group') {
            const groupMember = await GroupMember.findOne({group: req.query.group, user: req.user._id});
            if (!groupMember)
                return res.status(403).json({message: 'You are not a member of this group'});
            source = await Source.find({"owner.group": req.query.group})
                .populate({path: 'owner.group', select: 'name image'});
        }
        res.status(200).json({message: 'Payment methods retrieved', data: source});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removeSource = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment method removed', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
