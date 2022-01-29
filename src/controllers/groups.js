const Group = require('../models/group');
const GroupMember = require('../models/group-member');
const {createInvitation} = require("../dao/invitation");
const {addPaymentMethod} = require("../dao/payment-methods");
const Susu = require("../models/susu");

exports.createGroup = async (req, res) => {
    try {
        const {
            basicInfo,
            regulations,
            invitations,
            paymentMethod
        } = req.body;

        const {name, susuPercentage, description, investmentPercentage} = basicInfo;
        if (!name || !susuPercentage || !investmentPercentage)
            return res.status(400).json({message: 'Missing required fields'});

        if ((parseInt(susuPercentage) + parseInt(investmentPercentage)) < 100 || (parseInt(susuPercentage) + parseInt(investmentPercentage)) > 100)
            return res.status(400).json({message: 'Investment and susu percentages must add up to 100'});

        const group = await Group.create({
            name,
            description,
            regulations,
            percentages: {
                susu: susuPercentage,
                investment: investmentPercentage,
            },
            creator: req.user._id
        });

        await GroupMember.create({
            group: group._id,
            role: 'ADMIN',
            user: req.user._id
        });

        for (let i = 0; i < invitations.length; i++) {
            await createInvitation(invitations[i].email, group._id, req.user._id);
        }

        const paymentMethodResponse = await addPaymentMethod(
            paymentMethod.method,
            paymentMethod.ownership,
            group._id,
            null,
            paymentMethod.bankAccount,
            paymentMethod.card,
            paymentMethod.mobileMoneyAccount);

        if(!paymentMethodResponse.success)
            return res.status(paymentMethodResponse.code).json({message: paymentMethodResponse.message});

        const createdGroup = await Group.findById(group._id)
            .populate({path: 'creator', select: 'name image'});
        res.status(201).json({message: `${name} group created successfully`, data: createdGroup});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getGroups = async (req, res) => {
    try {
        const match = {};
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.size) || 50;
        const skip = (page - 1) * limit;

        if (req.query.user) {

        }
        const totalGroups = await Group.find(match).countDocuments();

        const groups = await Group.find(match)
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1})
            .populate({path: 'creator', select: 'name role image'})
            .populate({path: 'members'});

        res.status(200).json({
            message: `${groups.length} Group${groups.length === 1 ? '' : 's'} retrieved`,
            data: groups,
            totalGroups
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getGroup = async (req, res) => {
    try {
        const {id} = req.params;
        const group = await Group.findById(id)
            .populate({path: 'creator', select: 'name role image'});

        const members = await GroupMember
            .find({group: id})
            .populate({path: 'user', select: 'name image email'});
        if (!group) return res.status(404).json({message: 'Group Not Found', data: null});
        res.status(200).json({message: `Group ${group.name} retrieved`, data: group, members});

    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateGroup = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'description', 'regulations', 'susuPercentage', 'investmentPercentage'];
        const group = await Group.findById(req.params.id);
        if (!group)
            return res.status(404).json({message: `Group not found`});
        const susu = await Susu.findOne({group: req.params.id, status: 'STARTED'});
        if(susu)
            return res.status(400).json({message: 'Susu has started. Updates not allowed'});
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({message: 'Updates not allowed', data: null});
        for (let key of updates) {
            group[key] = req.body[key];
            if(key === 'susuPercentage'){
                group.percentages.susu = req.body['susuPercentage'];
            }

            if(key === 'investmentPercentage'){
                group.percentages.investment = req.body['investmentPercentage'];
            }
        }
        await group.save();
        const updatedGroup = await Group.findById(req.params.id)
            .populate({path: 'creator', select: 'name role image'});

        const members = await GroupMember
            .find({group: req.params.id})
            .populate({path: 'user', select: 'name image email'});

        res.status(200).json({message: `Group Successfully Updated`, data: updatedGroup, members});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.deleteGroup = async (req, res) => {
    try {
        const {id} = req.params;
        const group = await Group.findById(id);
        if (!group)
            return res.status(404).json({message: `Group not found`, data: null});
        await group.remove();
        res.status(200).json({message: `Group ${group.name} removed`, data: group});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
