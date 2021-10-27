const Disbursement = require('../models/disbursement');

/*
* Check if recipient is a valid user
* Check if user is a group member
* Check if user's turn to receive the payment
* Check if selected account exists and belongs to user
* Calculate amount to send to user from susu percentage or investment percentage
* Check if group account contains enough money to cover the
* Go ahead and make payment and get details of payment
* Set current recipient to previously received
* Find and set next user disbursement
* Calculate next disbursement date
* Update payment order field and save details
* */
exports.createDisbursement = async (req, res) => {
    try {
        const {recipient, group, payment} = req.body;
        res.status(200).json({message: `Create Disbursement`, data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


// get disbursements of a susu
// get disbursements of a single user
// get disbursements of group
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
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}



exports.getDisbursement = async (req, res) => {
    try {
        const disbursement = await Disbursement.findById(req.params.id)
            .populate({path: 'recipient'})
            .populate({path: 'group'});
        if (!disbursement)
            return res.status(404).json({data: null, message: 'Disbursement not found'});
        res.status(200).json({message: `Get Disbursement`, data: disbursement});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
