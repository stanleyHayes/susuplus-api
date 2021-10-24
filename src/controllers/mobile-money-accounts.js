const MobileMoneyAccount = require("../models/mobile-money-account");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");


exports.createMobileMoneyAccount = async (req, res) => {
    try {
        const {
            number,
            provider,
            groupID,
            ownershipType
        } = req.body;

        let mobileMoneyAccount;
        let populatedMobileMoneyAccount;
        if (ownershipType === 'GROUP') {
            // find group card will belong to
            const group = await Group.findById(groupID);
            if (!group)
                return res.status(404).json({message: 'Group not found', data: null});

            // check if user is member of the group
            const groupMember = await GroupMember
                .findOne({user: req.user._id, group: group._id})
                .populate({path: 'user', select: 'name role'})
                .populate({group: 'group', select: 'name'});

            if (!groupMember)
                return res.status(404).json({message: "You're not a member of this group", data: null});

            // check if the user is a group admin to create the account
            if (groupMember.user.role !== 'ADMIN')
                return res.status({message: `Only admins can create group accounts`, data: null})

            mobileMoneyAccount = await MobileMoneyAccount.create({
                provider,
                number,
                ownership: {type: ownershipType, group: groupID},
                creator: req.user._id
            });

            populatedMobileMoneyAccount = await MobileMoneyAccount.findById(mobileMoneyAccount._id)
                .populate({path: 'creator', select: 'name email'})
                .populate({path: 'ownership.group'})
                .populate({path: 'creator'});

        } else if (ownershipType === 'INDIVIDUAL') {

            const existingMobileMoneyAccount = await MobileMoneyAccount.findOne({number, provider});
            if(existingMobileMoneyAccount)
                return res.status(409).json({message: `${number} has already been registered`});
            mobileMoneyAccount = await MobileMoneyAccount.create({
                number,
                provider,
                ownership: {type: ownershipType, user: req.user._id},
                creator: req.user._id
            });

            populatedMobileMoneyAccount = await MobileMoneyAccount.findById(mobileMoneyAccount._id)
                .populate({path: 'creator', select: 'name email'})
                .populate({path: 'ownership.user', select: 'name email'})
                .populate({path: 'creator', select: 'name email'});
        } else {
            return res.status(400).json({message: 'Unknown user type', data: null});
        }
        res.status(201).json({message: 'Mobile Money Account Created', data: populatedMobileMoneyAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getMobileMoneyAccount = async (req, res) => {
    try {
        const {id} = req.params;
        const mobileMoneyAccount = await MobileMoneyAccount.findById(id)
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});

        if (!mobileMoneyAccount)
            return res.status(404).json({message: 'Mobile Money Account not found'});

        res.status(200).json({message: 'Bank Account Retrieved', data: mobileMoneyAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getMobileMoneyAccounts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.size) || 50;
        const skip = (page - 1) * limit;

        const match = {};
        if (req.query.status) {
            match['status'] = req.query.status;
        }

        if (req.query.group) {
            match['ownership.group'] = req.query.group;
        }

        if (req.query.role === 'USER') {
            match['ownership.user'] = req.user._id;
        }

        const totalMobileMoneyAccounts = await MobileMoneyAccount.find(match).countDocuments();

        const mobileMoneyAccounts = await MobileMoneyAccount.find(match)
            .limit(limit)
            .skip(skip)
            .sort({createdAt: -1})
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});


        res.status(200).json({
            message: `${mobileMoneyAccounts.length} Mobile Money Account${mobileMoneyAccounts.length === 1 ? '' : 's'} Retrieved`,
            data: mobileMoneyAccounts,
            totalMobileMoneyAccounts
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.updateMobileMoneyAccount = async (req, res) => {
    try {
        const {id} = req.params;
        const mobileMoneyAccount = await MobileMoneyAccount.findById(id)
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});

        if (!mobileMoneyAccount)
            return res.status(404).json({message: 'Mobile Money Account not found', data: null});

        if (req.user.role === 'USER') {

            // if the account is owned by a group
            if (mobileMoneyAccount.ownership.group) {
                // find group
                const group = await Group.findById(mobileMoneyAccount.ownership.group);
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

                if (mobileMoneyAccount.ownership.user !== req.user.id || mobileMoneyAccount.creator !== req.user._id) {
                    return res.status(200).json({data: mobileMoneyAccount, message: 'You do not own this account'});
                }
            }
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['number', 'provider'];
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({data: null, message: 'Updates not allowed'});
        for (let key of updates) {
            mobileMoneyAccount[key] = req.body[key];
        }
        await mobileMoneyAccount.save();

        res.status(200).json({message: 'Mobile Money Account Updated', data: mobileMoneyAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.deleteMobileMoneyAccount = async (req, res) => {
    try {
        const {id} = req.params;
        let mobileMoneyAccount;

        mobileMoneyAccount = await MobileMoneyAccount.findById(id);
        if (!mobileMoneyAccount) {
            return res.status(404).json({message: 'Card not found', data: null});
        }

        // if user is a regular user
        if (req.user.role === 'USER') {
            // if user is the creator of the account or he has ownership, remove the account
            if (mobileMoneyAccount.ownership.user === req.user.id || mobileMoneyAccount.creator === req.user._id) {
                mobileMoneyAccount.status = 'DELETED';
                await mobileMoneyAccount.save();
                return res.status(200).json({data: mobileMoneyAccount, message: 'Bank Account Deleted'});
            }

            // if the account is owned by a group
            if (mobileMoneyAccount.ownership.group) {
                const group = await Group.findById(mobileMoneyAccount.ownership.group);
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
                mobileMoneyAccount.status = 'DELETED';
                await mobileMoneyAccount.save();
                return res.status(200).json({message: 'Mobile Money Account Deleted', data: mobileMoneyAccount});
            }
        }
        mobileMoneyAccount.status = 'DELETED';
        await mobileMoneyAccount.save();
        res.status(200).json({message: 'Mobile Money Account Deleted', data: mobileMoneyAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
