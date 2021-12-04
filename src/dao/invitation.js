const User = require("../models/user");
const Group = require("../models/group");
const Invitation = require("../models/invitation");
const moment = require("moment");
const {sendEmail} = require("../utils/emails");

const createInvitation = async (email, group, inviter) => {
    try {
        const invitee = await User.findOne({email});

        const existingGroup = await Group.findById(group);
        if (!existingGroup)
            return {code: 404, message: 'Group not found', data: null, success: false};

        const existingInvitation = await Invitation
            .findOne({group, email, status: {$ne: 'EXPIRED'}});

        if (existingInvitation)
            return {code: 409, message: 'Invitation already sent', data: null, success: false};

        const expirationDate = moment().add(30, 'days');

        const invitation = await Invitation.create({
            expirationDate,
            group,
            email,
            inviter,
            invitee: invitee._id
        });

        const link = `https://susuplus.vercel.app/groups/${group}/invitations/${invitation._id}`;
        const message = `You have been invited by ${req.user.name} to join the group ${existingGroup.name} on Susu Plus using the link ${link}`;
        await sendEmail(email, 'GROUP INVITE', message);

        return {code: 409, message: 'Invitation sent', data: invitation, success: true};

    } catch (e) {
        return {code: 400, message: 'Invitation could not be sent', data: null, success: false};
    }
}

module.exports = {createInvitation};
