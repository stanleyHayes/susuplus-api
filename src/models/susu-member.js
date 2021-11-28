const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const susuMemberSchema = new Schema({
    susu: {
        type: Schema.Types.ObjectId,
        ref: 'Susu',
        required: true
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    member: {
        type: Schema.Types.ObjectId,
        ref: 'GroupMember',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    position: {
        type: Number,
        required: true
    },
    disbursementDate: {
        type: Date
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const SusuMember = mongoose.model('SusuMember', susuMemberSchema);

module.exports = SusuMember;
