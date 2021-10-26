const BankAccount = require("../models/bank-account");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");


exports.createBankAccount = async (req, res) => {
    try {
        const {
            bankName,
            accountName,
            accountNumber,
            accountBranch,
            ownership,
            ownershipType
        } = req.body;

        let bankAccount;
        let populatedBankAccount;
        if (ownershipType === 'GROUP') {
            const group = await Group.findById(ownership.group);
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
            if (groupMember.role !== 'ADMIN')
                return res.status({message: `Only admins can create group accounts`, data: null})

            bankAccount = await BankAccount.create({
                bankName,
                accountNumber,
                accountName,
                accountBranch,
                ownership,
                creator: req.user._id
            });

            populatedBankAccount = await BankAccount.findById(bankAccount._id)
                .populate({path: 'creator', select: 'name email'})
                .populate({path: 'ownership.group'})
                .populate({path: 'creator'});

        } else if (ownershipType === 'INDIVIDUAL') {

            bankAccount = await BankAccount.create({
                bankName,
                accountNumber,
                accountName,
                accountBranch,
                ownership,
                creator: req.user._id
            });

            populatedBankAccount = await BankAccount.findById(bankAccount._id)
                .populate({path: 'creator', select: 'name email'})
                .populate({path: 'ownership.user'})
                .populate({path: 'creator'});
        }

        res.status(201).json({message: 'Bank Account Created', data: populatedBankAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getBankAccount = async (req, res) => {
    try {
        const {id} = req.params;
        const bankAccount = await BankAccount.findById(id)
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});

        if (!bankAccount)
            return res.status(404).json({message: 'Bank Account not found'});

        res.status(200).json({message: 'Bank Account Retrieved', data: bankAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getBankAccounts = async (req, res) => {
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

        const totalBankAccounts = await BankAccount.find(match).countDocuments();

        const bankAccounts = await BankAccount.find(match)
            .limit(limit)
            .skip(skip)
            .sort({createdAt: -1})
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});


        res.status(200).json({
            message: `${bankAccounts.length} Bank Account${bankAccounts.length === 1 ? '' : 's'} Retrieved`,
            data: bankAccounts,
            totalBankAccounts
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.updateBankAccount = async (req, res) => {
    try {
        const {id} = req.params;
        const bankAccount = await BankAccount.findById(id)
            .populate({path: 'ownership.group', select: 'name'})
            .populate({path: 'ownership.user', select: 'name email'})
            .populate({path: 'creator', select: 'name email'});

        if (!bankAccount)
            return res.status(404).json({message: 'Bank account not found', data: null});

        if (req.user.role === 'USER') {

            // if the account is owned by a group
            if (bankAccount.ownership.group) {
                // find group
                const group = await Group.findById(bankAccount.ownership.group);
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
                if (groupMember.role !== 'ADMIN')
                    return res.status(403).json({
                        message: 'You do not have the permission to delete this account',
                        data: null
                    });
                bankAccount.status = 'DELETED';
                await bankAccount.save();
                return res.status(200).json({message: 'Bank Account Deleted', data: bankAccount});
            }
            // if user is the creator of the account or he has ownership, remove the account
            if (bankAccount.ownership.user !== req.user.id || bankAccount.creator !== req.user._id) {
                return res.status(200).json({data: bankAccount, message: 'You do not own this Bank Account'});
            }
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['bankName', 'accountName', 'accountNumber', 'accountBranch'];
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({data: null, message: 'Updates not allowed'});
        for (let key of updates) {
            bankAccount[key] = req.body[key];
        }
        await bankAccount.save();

        res.status(200).json({message: 'Bank Account Updated', data: bankAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.deleteBankAccount = async (req, res) => {
    try {
        const {id} = req.params;
        let bankAccount;

        bankAccount = await BankAccount.findById(id);
        if (!bankAccount) {
            return res.status(404).json({message: 'Account not found', data: null});
        }

        // if user is a regular user
        if (req.user.role === 'USER') {
            // if user is the creator of the account or he has ownership, remove the account
            if (bankAccount.ownership.user === req.user.id || bankAccount.creator === req.user._id) {
                bankAccount.status = 'DELETED';
                await bankAccount.remove();
                return res.status(200).json({data: bankAccount, message: 'Bank Account Deleted'});
            }

            // if the account is owned by a group
            if (bankAccount.ownership.group) {
                const group = await Group.findById(bankAccount.ownership.group);
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
                if (groupMember.role !== 'ADMIN')
                    return res.status(403).json({
                        message: 'You do not have the permission to delete this account',
                        data: null
                    });
                bankAccount.status = 'DELETED';
                await bankAccount.save();
                return res.status(200).json({message: 'Bank Account Deleted', data: bankAccount});
            }
        }
        bankAccount.status = 'DELETED';
        await bankAccount.save();
        res.status(200).json({message: 'Bank Account Deleted', data: bankAccount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
