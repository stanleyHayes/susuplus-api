const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const groupMemberSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'REMOVED'],
        default: 'ACTIVE'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

module.exports = GroupMember;
