const GroupMember = require('../models/group-member');
const Group = require('../models/group');
const User = require('../models/user');

exports.addGroupMember = async (req, res) => {
    try {
        const {groupID, userID} = req.body;
        const group = await Group.findById(groupID);
        const user = await User.findById(userID);
        if (!group)
            return res.status(404).json({message: 'Group does not exist', data: null});
        if (!user)
            return res.status(404).json({message: 'User does not exist', data: null});

        const groupAdmin = await GroupMember.findOne({user: req.user._id, group: groupID});
        if (!groupAdmin)
            return res.status(404).json({data: null, message: `You do not belong to ${group.name}`});
        if (groupAdmin.role !== 'ADMIN')
            return res.status(404).json({
                data: null,
                message: `You do not have the permission to add a member to ${group.name}`
            });

        const groupMember = await GroupMember.findOne({group: groupID, user: userID});
        if (groupMember)
            return res.status(409).json({message: 'User already exists in the group', data: null});

        const createdGroupMember = await GroupMember.create({group: groupID, user: userID});

        const populatedGroupMember = await GroupMember.findById(createdGroupMember._id)
            .populate({path: 'user', select: 'name email'})
            .populate({path: 'group', select: 'name'});

        res.status(200).json({
            message: `${populatedGroupMember.user.name} added to ${populatedGroupMember.group.name}`,
            data: populatedGroupMember
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getGroupMembers = async (req, res) => {
    try {
        if (!req.query.group)
            return res.status(400).json({message: 'Group query param required'});

        const group = await Group.findById(req.query.group, {name: 1, percentages: 1});
        if (!group)
            return res.status(404).json({message: 'Group not found', data: null});

        const groupMembers = await GroupMember
            .find({group: req.query.group},
                {user: 1, role: 1})
            .populate({path: 'user', select: 'name email createdAt'});

        res.status(200).json({
            message: `${groupMembers.length} Group Member${groupMembers.length === 1 ? '' : 's'} Retrieved`,
            data: groupMembers,
            group
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getGroupMember = async (req, res) => {
    try {
        const userID = req.params.user;
        const groupID = req.params.group;

        const user = await User.findById(userID);
        if (!user)
            return res.status(404).json({message: 'User not found', data: null});
        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({message: 'Group not found'});

        const groupMember = await GroupMember
            .findOne({user: userID, group: groupID, status: {'$ne': 'REMOVED'}},
                {user: 1, createdAt: 1, updatedAt: 1})
            .populate({path: 'user', select: 'name email'});

        if (!groupMember)
            return res.status(404).json({message: 'Group member is not a member of the group'});

        res.status(200).json({message: `Get Group Member`, data: groupMember});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateGroupMember = async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
        if (!user)
            return res.status(404).json({message: 'User not found', data: null});
        if (!req.body.group)
            return res.status(400).json({message: 'Group ID required'});
        const group = await Group.findById(req.body.group);
        if (!group)
            return res.status(404).json({message: 'Group not found'});

        const groupMember = await GroupMember
            .findOne({user: userID, group: req.body.group}, {user: 1})
            .populate({path: 'user', select: 'name email'});

        if (!groupMember)
            return res.status(404).json({message: 'Group member is not a member of the group'});

        if (req.body.role) {
            groupMember.role = req.body.role;
            await groupMember.save();
        }

        res.status(200).json({message: `Update Group Member`, data: groupMember});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removeGroupMember = async (req, res) => {
    try {
        const userID = req.params.id;
        if (!req.query.group)
            return res.status(404).json({message: 'Group id required', data: null});
        const group = await Group.findById(req.query.group);
        if (!group)
            return res.status(404).json({message: 'Group not found', data: null});
        const user = await User.findById(userID);
        if (!user)
            return res.status(404).json({message: 'User not found', data: null});
        const groupMember = await GroupMember
            .findOne({group: req.query.group, user: userID});
        if (!groupMember)
            return res.status(404).json({message: 'User does not belong to the group', data: null});
        groupMember.status = 'REMOVED';
        await groupMember.save();
        res.status(200).json({message: `${user.name} removed from ${group.name}`, data: groupMember});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getGroupsOfUser = async (req, res) => {
    try {
        const userID = req.params.user;
        const user = await User.findById(userID, {name: 1, email: 1});
        if (!user)
            return res.status(404).json({message: 'User not found', data: null});
        const groups = await GroupMember
            .find({user: userID, status: {'$ne': 'REMOVED'}},
                {group: -1})
            .populate({path: 'group', select: 'name description image'});
        res.status(200).json({
            message: `${groups.length} groups acquired`,
            data: groups,
            user});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
