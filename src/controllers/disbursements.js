const Disbursement = require('../models/disbursement');

exports.createDisbursement = async (req, res) => {
    try {
        const {disbursement, group, amount, paymentMethod} = req.body;
        res.status(200).json({message: `Create Disbursement`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getDisbursements = async (req, res) => {
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
        const totalDisbursements = await Disbursement.find(match).countDocuments();
        res.status(200).json({message: `Get Disbursements`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getDisbursement = async (req, res) => {
    try {
        const disbursement = await Disbursement.findById(req.params.id)
            .populate({path: 'recipient'})
            .populate({path: 'group'});
        if(!disbursement)
            return res.status(404).json({data: null, message: 'Disbursement not found'});
        res.status(200).json({message: `Get Disbursement`, data: disbursement});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}
