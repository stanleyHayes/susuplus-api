const Source = require("../models/source");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");
const {createBankAccount, createCard} = require("../utils/stripe");
const CreditCard = require("credit-card");

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
                name,
                accountNumber,
                routingNumber,
                accountHolderType,
                accountType,
                accountHolderName,
                currency,
                country
            } = req.body;
            if (!name || !accountNumber || !routingNumber || !accountHolderType || !accountType || !accountHolderName || !currency)
                return res.status(400).json({message: 'Missing required fields'});

            const stripeResponse = await createBankAccount(
                req.user.stripeCustomerID,
                {
                    country,
                    currency,
                    accountHolderName,
                    routingNumber,
                    accountNumber,
                    accountType,
                    name,
                    accountHolderType,
                    last4: accountNumber.slice(accountNumber.length - 4)
                });

            const bankAccountSource = await Source.create({
                sourceID: stripeResponse.id,
                type,
                country,
                customer: stripeResponse.customer,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? req.body.groupID : undefined,
                    user: ownership === 'Individual' ? req.user._id : undefined
                },
                bankAccountDetails: {
                    status: stripeResponse.status,
                    name,
                    accountNumber,
                    routingNumber,
                    accountHolderType,
                    accountHolderName,
                    last4: accountNumber.slice(accountNumber.length - 4),
                    currency
                }
            });

            if (bankAccountSource)
                return res.status(200).json({message: "Bank Account Added", data: bankAccountSource});

        }
        else if (type === 'card') {
            const {
                address,
                cvv,
                name,
                expiryDate,
                number,
                funding,
            } = req.body;

            const brand = CreditCard.determineCardType(number);
            const [expiryMonth, expiryYear] = expiryDate.split("/");
            const validatedCard = CreditCard.validate({
                cardType: brand,
                number,
                expiryMonth,
                expiryYear,
                cvv
            });

            if(validatedCard.isExpired)
                return res.status(400).json({message: 'Card Expired'});

            if(!validatedCard.validCardNumber || !validatedCard.validCvv)
                return res.status(400).json({message: 'Invalid Card'});

            const stripeCardResponse = createCard(
                req.user.stripeCustomerID,
                {
                    number,
                    brand,
                    funding,
                    last4: number.slice(number.length - 4),
                    expiryYear,
                    expiryMonth,
                    cvv,
                    name
                },
                address
            )
            const cardSource = await Source.create({
                sourceID: stripeCardResponse.id,
                type,
                customer: stripeCardResponse.customer,
                country: stripeCardResponse.country,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? req.body.groupID : undefined,
                    user: ownership === 'Individual' ? req.user._id : undefined
                },
                cardDetails: {
                    cvv,
                    name,
                    expiryMonth,
                    expiryYear,
                    number,
                    brand,
                    expiryDate,
                }
            });

            if (cardSource)
                return res.status(201).json({message: 'Card details added', data: cardSource});
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
