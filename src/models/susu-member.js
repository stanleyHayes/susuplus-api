const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const susuMemberSchema = new Schema({
    susu: {
        type: Schema.Types.ObjectId,
        ref: 'Susu',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    previousDisbursement: {
        type: Schema.Types.ObjectId,
        ref: 'Disbursement'
    },
    nextDisbursement: {
        type: Schema.Types.ObjectId,
        ref: 'Disbursement'
    },
    previousDisbursementDate: {
        type: Date
    },
    nextDisbursementDate: {
        type: Date
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const SusuMember = mongoose.model('SusuMember', susuMemberSchema);

module.exports = SusuMember;
