const mongoose = require('mongoose');
const validator = require("validator");

const Schema = mongoose.Schema;

const invitationSchema = new Schema({
    inviter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    expirationDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'REJECTED'],
        default: 'PENDING'
    },
    acceptanceDate: {
        type: Date
    },
    rejectionDate: {
        type: Date
    },
    revokeDate: {
        type: Date
    },
    email: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error(`Invalid email ${value}`);
            }
        }
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
