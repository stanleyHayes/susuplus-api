const DebitCard = require("../models/debit-card");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");


exports.createDebitCard = async (req, res) => {
    try {
        const {
            cardHolderName,
            cardNumber,
            cvv,
            expiryDate,
            ownershipType,
            groupID,
            issuingNetwork,
            address,
            country
        } = req.body;

        let debitCard;
        let populatedDebitCard;
        if (ownershipType === 'GROUP') {
            // find group card will belong to
            const group = await Group.findById(groupID);
            if (!group)
                return res.status(404).json({message: 'Group  not found', data: null});

            // check if user is member of the group
            const groupMember = await GroupMember
                .findOne({user: req.user._id, group: group._id})
                .populate({path: 'user', select: 'name email role'})
                .populate({group: 'group', select: 'name'});

            if (!groupMember)
                return res.status(404).json({message: "You're not a member of this group", data: null});

            // check if the user is a group admin to create the account
            if (groupMember.user.role !== 'ADMIN')
                return res.status({message: `Only admins can create group accounts`, data: null})

            debitCard = await DebitCard.create({
                cardHolderName,
                cardNumber,
                cvv,
                expiryDate,
                issuingNetwork,
                country,
                address,
                ownership: {type: ownershipType, group: groupID},
                creator: req.user._id
            });

            populatedDebitCard = await DebitCard.findById(debitCard._id)
                .populate({path: 'creator', select: 'name email'})
                .populate({path: 'ownership.group', select: 'name'})
                .populate({path: 'creator', select: 'name email'});

        } else if (ownershipType === 'INDIVIDUAL') {
            debitCard = await DebitCard.create({
                cardHolderName,
                cardNumber,
                cvv,
                issuingNetwork,
                address,
                country,
                expiryDate,
                ownership: {type: ownershipType, user: req.user._id},
                creator: req.user._id
            });

            populatedDebitCard = await DebitCard.findById(debitCard._id)
                .populate({path: 'creator', select: 'name email'})
                .populate({path: 'ownership.user', select: 'name email'})
                .populate({path: 'creator', select: 'name email'});
        }

        res.status(201).json({message: 'Debit Card Created', data: populatedDebitCard});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getDebitCard = async (req, res) => {
    try {
        const {id} = req.params;
        const debitCard = await DebitCard.findById(id)
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});

        if (!debitCard)
            return res.status(404).json({message: 'Debit Card not found'});

        res.status(200).json({message: 'Bank Account Retrieved', data: debitCard});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getDebitCards = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.size) || 50;
        const skip = (page - 1) * limit;

        const match = {};
        if(req.query.status){
            match['status'] = req.query.status;
        }

        if(req.query.group){
            match['ownership.group'] = req.query.group;
        }

        if (req.query.role === 'USER') {
            match['ownership.user'] = req.user._id;
        }

        if(req.query.issuingNetwork){
            match['issuingNetwork'] = req.query.issuingNetwork;
        }
        const totalDebitCards = await DebitCard.find(match).countDocuments();

        const debitCards = await DebitCard.find(match)
            .limit(limit)
            .skip(skip)
            .sort({createdAt: -1})
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});


        res.status(200).json({
            message: `${debitCards.length} Debit Card${debitCards.length === 1 ? '' : 's'} Retrieved`,
            data: debitCards,
            totalDebitCards
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.updateDebitCard = async (req, res) => {
    try {
        const {id} = req.params;
        const debitCard = await DebitCard.findById(id)
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});

        if (!debitCard)
            return res.status(404).json({message: 'Debit card not found', data: null});

        if (req.user.role === 'USER') {

            // if the account is owned by a group
            if (debitCard.ownership.group) {
                // find group
                const group = await Group.findById(debitCard.ownership.group);
                if (!group)
                    return res.status(404).json({message: 'Group not found', data: null});

                // find if user is a member of this group
                const groupMember = await GroupMember.findOne({
                    group: group._id, user: req.user._id
                })
                    .populate({path: 'user', select: 'name role'})
                    .populate({path: 'group', select: 'name'})
                    .populate({path: 'creator', select: 'name email'});

                // return an error if user is not a member
                if (!groupMember)
                    return res.status(404).json({
                        message: `You are not a member of this group`,
                        data: null
                    });

                // check if user is not an admin in the group and return an error message
                if (groupMember.user.role !== 'ADMIN')
                    return res.status(403).json({
                        message: 'You do not have the permission to delete this account',
                        data: null
                    });
            }
            // if user is the creator of the account or he has ownership, remove the account
            if (debitCard.ownership.user !== req.user.id || debitCard.creator !== req.user._id) {
                return res.status(200).json({data: debitCard, message: 'You do not own this card'});
            }
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['cardHolderName', 'cardNumber', 'cvv', 'expiryDate', 'country', 'issuingNetwork', 'address'];
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({data: null, message: 'Updates not allowed'});
        for (let key of updates) {
            debitCard[key] = req.body[key];
        }
        await debitCard.save();

        res.status(200).json({message: 'Debit Card Updated', data: debitCard});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.deleteDebitCard = async (req, res) => {
    try {
        const {id} = req.params;
        let debitCard;

        debitCard = await DebitCard.findById(id);
        if (!debitCard) {
            return res.status(404).json({message: 'Card not found', data: null});
        }

        // if user is a regular user
        if (req.user.role === 'USER') {
            // if user is the creator of the account or he has ownership, remove the account
            if (debitCard.ownership.user === req.user.id || debitCard.creator === req.user._id) {
                debitCard.status = 'DELETED';
                await debitCard.save();
                return res.status(200).json({data: debitCard, message: 'Bank Account Deleted'});
            }

            // if the account is owned by a group
            if (debitCard.ownership.group) {
                const group = await Group.findById(debitCard.ownership.group);
                if (!group)
                    return res.status(404).json({message: 'Group not found', data: null});

                // find if user is a member of this group
                const groupMember = await GroupMember.findOne({
                    group: group._id, user: req.user._id
                }).populate({path: 'user', select: 'name role'})
                    .populate({path: 'group', select: 'name'});

                // return an error if user is not a member
                if (!groupMember)
                    return res.status(404).json({
                        message: `You are not a member of ${group.name} group`,
                        data: null
                    });

                // check if user is not an admin in the group and return an error message
                if (groupMember.user.role !== 'ADMIN')
                    return res.status(403).json({
                        message: 'You do not have the permission to delete this account',
                        data: null
                    });
                debitCard.status = 'DELETED';
                await debitCard.save();
                return res.status(200).json({message: 'Bank Account Deleted', data: debitCard});
            }
        }
        debitCard.status = 'DELETED';
        await debitCard.save();
        res.status(200).json({message: 'Bank Account Deleted', data: debitCard});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
