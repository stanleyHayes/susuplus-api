const Contribution = require('../models/contribution');
const Group = require('../models/group');
const GroupMember = require('../models/group-member');

exports.createContribution = async (req, res) => {
    try {
        const {group: groupID, amount, paymentMethod} = req.body;
        const group = await Group.findById(groupID);
        if (!group)
            return res.status(404).json({message: 'Group does not exist', data: null});
        const groupMember = await GroupMember.findOne({
            user: req.user._id,
            group: groupID
        });
        if (!groupMember)
            return res.status(404).json({message: `User does not belong to the group`});
        //MAKE PAYMENT HERE AND RETURN THE PAYMENT DETAILS
        switch (paymentMethod) {
            case 'PAYPAL':
                break;
            case 'MOMO':
                break;
            case 'CARD':
                break;
            case 'BANK':
                break;
        }
        const contribution = await Contribution.create({
            group: group._id,
            amount,
            contributor: req.user._id,
            paymentMethod
        });

        const populatedContribution = await Contribution.findById(contribution._id)
            .populate({path: 'contributor', select: 'name email phone'})
            .populate({path: 'group', select: 'name'});

        res.status(200).json({
            message: `Contribution made by ${req.user.name} towards group ${group.name}`,
            data: populatedContribution
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getContributions = async (req, res) => {
    try {
        const match = {};
        if (req.query.contributor) {
            match['contributor'] = req.query.contributor;
        }
        if (req.query.group) {
            match['group'] = req.query.group;
        }
        const limit = parseInt(req.query.size) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const contributions = await Contribution
            .find(match)
            .populate({path: 'contributor', select: 'name email'})
            .populate({path: 'group', select: 'name'})
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1});

        const totalContributions = await Contribution.find(match).countDocuments();
        res.status(200).json({
            message: `${contributions.length} Contribution${contributions.length === 1 ? '' : 's'}`,
            data: contributions, totalContributions
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getContribution = async (req, res) => {
    try {
        const contribution = await Contribution.findById(req.params.id)
            .populate({path: 'contributor', select: 'name email'})
            .populate({path: 'group', select: 'name'})
        if (!contribution)
            return res.status(404).json({message: 'Contribution not found', data: null});
        res.status(200).json({message: `Contribution Retrieved`, data: contribution});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
