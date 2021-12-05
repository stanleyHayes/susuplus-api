const Invitation = require('../models/invitation');
const moment = require("moment");
const Group = require('../models/group');
const GroupMember = require('../models/group-member');
const User = require('../models/user');
const {sendEmail} = require("../utils/emails");

exports.createInvitation = async (req, res) => {
    try {
        const {group, invitations} = req.body;

        const existingGroup = await Group.findById(group);
        if (!existingGroup)
            return res.status(404).json({message: 'Group does not exist', data: null});

        const groupMember = await GroupMember
            .findOne({group, user: req.user._id})
            .populate({path: 'user', select: 'name email role'})
            .populate({path: 'group', select: 'name'});

        if (!groupMember)
            return res.status(404).json({
                data: null,
                message: `You are not a member of group ${groupMember.group.name}`
            });

        if (groupMember.role !== 'ADMIN')
            return res.status(403).json({
                message: `You are not authorized to send invitation`,
                data: null
            });
        const populatedInvitations = [];

        for (let i = 0; i < invitations.length; i++){
            const email = invitations[i];
            const invitee = await User.findOne({email});
            if (invitee){
                const existingInvitation = await Invitation
                    .findOne({group, email, status: {$ne: 'EXPIRED'}});

                if (!existingInvitation){
                    const expirationDate = moment().add(30, 'days');

                    const invitation = await Invitation.create({
                        expirationDate,
                        group,
                        email,
                        inviter: req.user._id,
                        invitee: invitee._id
                    });
                    const link = `https://susuplus.vercel.app/groups/${group}/invitations/${invitation._id}`;
                    const message = `You have been invited by ${req.user.name} to join the group ${existingGroup.name} on Susu Plus using the link ${link}`;
                    await sendEmail(email, 'GROUP INVITE', message);
                    const populatedInvitation = await Invitation.findById(invitation._id)
                        .populate({path: 'inviter', select: 'name email'})
                        .populate({path: 'group', select: 'name image description'});
                    populatedInvitations.push(populatedInvitation);
                }
            }
        }
        res.status(201).json({data: populatedInvitations, message: 'Invitations sent'});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id)
            .populate({path: 'inviter', select: 'name email'})
            .populate({path: 'invitee', select: 'name email'})
            .populate({path: 'group', select: 'name'});

        if (!invitation)
            return res.status(404).json({
                data: null,
                message: 'Invitation not found'
            });
        if (moment().isAfter(invitation.expirationDate)) {
            invitation.status = 'EXPIRED';
            await invitation.save();
        }
        res.status(200).json({
            data: invitation,
            message: `Invitation Retrieved`
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getInvitations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.size) || 50;
        const skip = (page - 1) * limit;
        const match = {};

        if (req.user.role === 'USER') {
            match['email'] = req.user.email;
        }
        if (req.query.invitee) {
            match['invitee'] = req.query.invitee
        }
        if (req.query.status) {
            match['status'] = req.query.status;
        }
        if (req.query.group) {
            match['group'] = req.query.group;
        }
        const totalInvitations = await Invitation.find(match).countDocuments();
        const invitations = await Invitation.find(match)
            .populate({path: 'inviter', select: 'email name'})
            .populate({path: 'invitee', select: 'email name'})
            .populate({path: 'group', select: 'name description'})
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1});

        res.status(200).json({
            data: invitations,
            totalInvitations,
            message: 'Invitations retrieved'
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.respondInvitation = async (req, res) => {
    try {
        const {id} = req.params;
        console.log(id)
        const invitation = await Invitation.findById(id);
        if (!invitation) {
            return res.status(404).json({message: 'Invitation not found', data: null});
        }

        const invitedUser = await User.findOne({email: invitation.email});
        if(!invitedUser)
            return res.status(404).json({message: 'User not found'});

        if (moment().isAfter(invitation.expirationDate)) {
            invitation.status = 'EXPIRED';
            await invitation.save();
            return res.status(400).json({message: 'Invitation has expired', data: invitation});
        }

        if (invitation.email !== req.user.email) {
            return res.status(403).json({message: 'You are not allowed to perform this operation'});
        }
        if (invitation.status === 'REJECTED')
            return res.status(400).json({message: 'Invitation already rejected', data: invitation});
        if (req.body.response === 'ACCEPT') {
            invitation.status = 'ACCEPTED';
            invitation.acceptanceDate = Date.now();
            await invitation.save();
            await GroupMember.create({
                user: invitedUser._id,
                group: invitation.group,
            });
            res.status(200).json({data: invitation, message: 'Invitation Accepted'});
        } else if (req.body.response === 'REJECT') {
            invitation.status = 'REJECTED';
            invitation.rejectionDate = Date.now();
            await invitation.save();
            res.status(200).json({data: invitation, message: 'Invitation Rejected'});
        } else {
            return res.status(400).json({data: null, message: 'Unknown Operation'});
        }
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.updateInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);
        if (invitation)
            return res.status(404).json({message: 'Invitation not found', data: null});
        const updates = Object.keys(req.body);
        const allowedUpdates = ['status', 'expirationDate'];
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({data: null, message: 'Updates not allowed'});
        for (let key of updates) {
            if (key === 'status') {
                if (req.body['status'] === 'REVOKE') {
                    const group = await Group.findById(invitation.group);
                    if (!group)
                        return res.status(404).json({message: 'Group does not exist', data: null})
                    const groupMember = await GroupMember.findOne(
                        {group: invitation.group, user: req.user._id})
                        .populate({path: 'user', select: 'name email role'});
                    if (!groupMember)
                        return res.status(404).json({message: 'You are not a member of this group', data: null});
                    if (groupMember.user.role !== 'ADMIN')
                        return res.status(403).json({
                            data: null,
                            message: 'You are not allowed to perform this operation'
                        });

                    if (req.user._id === invitation.inviter) {
                        invitation['status'] = 'REVOKED';
                    } else if (req.user.email === invitation.email) {
                        return res.status(403).json({
                            data: null,
                            message: 'You are not allowed to perform this operation'
                        });
                    }
                }
            }
        }
        await invitation.save();
        res.status(200).json({data: invitation, message: 'Invitation Updated'});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.deleteInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);
        if (!invitation) {
            return res.status(404).json({data: null, message: 'Invitation not found'});
        }
        if (req.user.email === invitation.email) {
            await invitation.remove();
            return res.status(200).json({
                data: invitation,
                message: 'Invitation Deleted'
            });
        } else if (req.user._id === invitation.invitee) {
            await invitation.remove();
            res.status(200).json({
                data: invitation,
                message: 'Invitation Deleted'
            });
        } else {
            const group = await Group.findById(invitation.group);
            if (!group) {
                return res.status(404).json({message: 'Group does not exist', data: null});
            }
            const groupMember = await GroupMember
                .findOne({group: invitation.group, user: req.user._id})
                .populate({path: 'group', select: 'name'});
            if (!groupMember)
                return res.status(404).json({message: 'You are not a member of the group', data: null});

            if (groupMember.user.role !== 'ADMIN')
                return res.status(404).json({message: 'You are not allow to perform this operation', data: null});
        }
        res.status(400).json({
            data: null,
            message: 'Operation not allowed'
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
