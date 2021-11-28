const Group = require('../models/group');
const SusuMember = require('../models/susu-member');
const Susu = require('../models/susu');
const User = require('../models/user');
const GroupMember = require('../models/group-member');
const moment = require("moment");

/*
*
* Check if group exists
* Check if there is no susu that is currently active for the group
* Check if user creating the susu is a group member and a group admin
* set payment order of the susu group
* Create susu members and send them messages and emails for those subscribed for it
* Calculate end date based on the start date, payment plan, and the number of current members
* set current Recipient
* set next recipient
* calculate next payment date
* calculate current payment date
*
* */
exports.createSusu = async (req, res) => {
    try {
        const {
            group: groupID,
            paymentAmount,
            paymentCurrency,
            members,
            startDate,
            intervalAmount,
            intervalUnit
        } = req.body;

        let status = 'PENDING';

        // check if the group exists
        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({
                data: null,
                message: 'Group not found'
            });

        const susuMembers = [req.user._id, ...members];

        // check if the user creating the susu is a member of the group
        const groupMember = await GroupMember.findOne({user: req.user._id, group: groupID});
        if (!groupMember)
            return res.status(403).json({message: 'You are not a member of this group'});

        // check if user is an admin of the group
        if (groupMember.role !== 'ADMIN')
            return res.status(403).json({message: 'You do not have the permission to perform this operation'});

        // cannot create a susu if a susu has already started in the group
        const activeSusu = await Susu.findOne({
            group: groupID,
            $or: [{status: 'STARTED'}, {status: 'PENDING'}, {status: 'PAUSED'}]
        });

        if (activeSusu)
            return res.status(400).json({message: 'A susu is already active in this group'});

        if (moment().isSameOrAfter(startDate)) {
            status = 'STARTED';
        }

        if (!['days', 'day', 'week', 'weeks', 'month', 'months', 'year', 'years'].includes(intervalUnit.toLowerCase())) {
            return res.status(400).json({message: 'Invalid interval unit'});
        }

        const paymentOrder = [];
        let nextDate = startDate;

        const susu = await Susu.create({
            group: groupID,
            paymentPlan: {
                amount: paymentAmount,
                currency: paymentCurrency
            },
            contributionPlan: {
                interval: intervalAmount,
                unit: intervalUnit
            },
            creator: groupMember._id,
            startDate,
            status
        });

        let position = 0;
        for (let memberID of susuMembers) {
            // find user associated with memberID
            const member = await User.findById(memberID);
            if (member) {
                // if there's a member, find if the member is part of the group
                const groupMember = await GroupMember
                    .findOne({user: memberID, group: groupID});
                if (groupMember) {
                    nextDate = moment(nextDate).add(intervalAmount, intervalUnit);
                    position++;
                    paymentOrder.push({
                        member: groupMember._id,
                        position,
                        disbursementDate: nextDate
                    });
                    if (position === 1) {
                        susu.currentRecipient.member = groupMember._id;
                        susu.currentRecipient.date = nextDate;
                    } else if (position === 2) {
                        susu.nextRecipient.member = groupMember._id;
                        susu.nextRecipient.date = nextDate;
                    }
                    // if the member is part of the group, create a susu member
                    await SusuMember
                        .create({susu: susu._id, user: memberID, group: groupID, position});
                }
            }
        }
        susu.endDate = nextDate;
        susu.paymentOrder = paymentOrder;
        await susu.save();
        const createdSusu = await Susu.findById(susu._id).populate({path: 'creator',  populate: {path: "user", select: 'name image'}})
            .populate({path: "currentRecipient.member", populate: {path: "user", select: 'name image'}})
            .populate({path: "nextRecipient.member"})
            .populate({path: 'group'})
            .populate({path: 'paymentOrder.member',  populate: {path: "user", select: 'name image'}});

        res.status(200).json({message: `Susu created for group ${group.name}`, data: createdSusu});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

//get susu by groups
//get susu by user
//get susu by status
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
