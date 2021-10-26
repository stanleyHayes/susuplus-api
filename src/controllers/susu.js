const Group = require('../models/group');
const SusuMember = require('../models/susu-member');
const Susu = require('../models/susu');
const User = require('../models/user');
const GroupMember = require('../models/group-member');

exports.createSusu = async (req, res) => {
    try {
        const {group: groupID, paymentPlan, members} = req.body;

        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({
                data: null,
                message: 'Group not found'
            });

        const susu = await Susu.create({
            group: groupID,
            paymentPlan,
            creator: req.user._id
        });
        let position = 0;
        for (let memberID of members) {
            // find user associated with memberID
            const member = await User.findById(memberID);
            if (member) {
                // if there's a member, find if the member is part of the group
                const groupMember = await GroupMember
                    .findOne({user: memberID, group: groupID});
                if (groupMember) {
                    position++;
                    // if the member is part of the group, create a susu member
                    await SusuMember
                        .create({susu: susu._id, user: memberID, group: groupID, position});
                }
            }
        }
        res.status(200).json({message: `Susu created for group ${group.name}`, data: susu});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getSusus = async (req, res) => {
    try {
        const match = {};
        if (req.query.group) {
            match['group'] = req.query.group;
        }
        if (req.query.user) {
            match['user'] = req.query.user;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.size) || 50;
        const skip = (page - 1) * limit;

        const totalSusuCount = await Susu.find(match).countDocuments();
        const totalSusu = await Susu.find(match)
            .populate({path: 'group', select: 'name'})
            .populate({path: 'currentRecipient', select: 'name email image'})
            .populate({path: 'previousRecipient', select: 'name email image'})
            .populate({path: 'nextRecipient', select: 'name email image'})
            .populate({path: 'creator', select: 'name email image'})
            .skip(skip).limit(limit).sort({createdAt: -1});
        res.status(200).json({message: `Get Cards`, data: totalSusu, totalSusuCount});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getSusu = async (req, res) => {
    try {
        const susu = await Susu.findById(req.params.id)
            .populate({path: 'group', select: 'name'})
            .populate({path: 'currentRecipient', select: 'name email image'})
            .populate({path: 'previousRecipient', select: 'name email image'})
            .populate({path: 'nextRecipient', select: 'name email image'})
            .populate({path: 'creator', select: 'name email image'});
        if (!susu)
            return res.status(404).json({data: null, message: 'Susu not found'});
        res.status(200).json({message: `${susu.group.name}'s susu retrieved`, data: susu});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateSusu = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['paymentPlan', 'paymentOrder'];
        const susu = await Susu.findById(req.params.id);
        if (!susu)
            return res.status(404).json({message: 'Susu not found', data: null});
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({message: 'Updates not allowed', data: null});
        for (let key of updates) {
            susu[key] = req.body[key];
        }
        await susu.save();
        const populatedSusu = await Susu.findById(req.params.id)
            .populate({path: 'group', select: 'name'})
            .populate({path: 'currentRecipient', select: 'name email image'})
            .populate({path: 'previousRecipient', select: 'name email image'})
            .populate({path: 'nextRecipient', select: 'name email image'})
            .populate({path: 'creator', select: 'name email image'});
        res.status(200).json({
            message: `${populatedSusu.group.name} information updated`,
            data: populatedSusu
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
