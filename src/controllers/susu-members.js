const Group = require('../models/group');
const GroupMember = require('../models/group-member');
const Susu = require('../models/susu');
const SusuMember = require('../models/susu-member');
const User = require('../models/user');

exports.addSusuMember = async (req, res) => {
    try {
        const {groupID, userID, susuID} = req.body;
        const group = await Group.findById(groupID);
        const susu = await Susu.findById(susuID);
        const user = await User.findById(userID);

        if(!group)
            return res.status(404).json({message: `Group not found`, data: null});
        if(!susu)
            return res.status(404).json({message: `Susu not found`, data: null});
        if(!user)
            return res.status(404).json({message: `User not found`, data: null});


        const groupMember = await GroupMember.findOne({group: groupID, user: userID});
        if(!groupMember)
            return res.status(404).json({
                message: `User is not a member of this group`,
                data: null});
        const groupMemberAdmin = await GroupMember
            .findOne({user: req.user._id, group: groupID});

        if(!groupMemberAdmin)
            return res.status(404).json({message: 'You are not a member of this group', data: null});
        if(groupMemberAdmin.role !== 'ADMIN')
            return res.status(403).json({message: 'You do not have the permissions to perform this operation'});

        const susuMembers = await SusuMember
            .find({group: groupID, susu: susuID})
            .sort({position: -1})
            .limit(1);

        const position = susuMembers && susuMembers.length > 0 ? susuMembers[0].position: 1;
        const existingSusuMember = SusuMember.findOne({susu: susuID, group: groupID, user: userID});
        if(existingSusuMember)
            return res.status(409).json({data: null, messsage: 'User already exist in susu group'});

        const newSusuMember = await SusuMember
            .create({susu: susuID, group: groupID, user: userID, position});

        const populatedSusuMember = await SusuMember.findById(newSusuMember._id)
            .populate({path: 'user', select: 'name email'})
            .populate({path: 'group', select: 'name'});

        res.status(200).json({message: `Create Susu Member`, data: populatedSusuMember});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getSusuMembers = async (req, res) => {
    try {
        res.status(200).json({message: `Get Susu Members`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Get Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Update Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removeSusuMember = async (req, res) => {
    try {
        res.status(200).json({message: `Delete Susu Member`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}
