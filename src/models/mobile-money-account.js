const validator = require("validator");
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mobileMoneyAccountSchema = new Schema({

    number: {
        unique: true,
        type: String,
        required: true,
        validate(value) {
            if (!validator.isMobilePhone(value)) {
                throw new Error(`Invalid phone ${value} Enter a valid phone number.`)
            }
        }
    },
    provider: {
        type: String,
        required: true,
        enum: ['VODAFONE', 'MTN', 'AIRTEL_TIGO']
    },
    ownership: {
        type: {
            type: String,
            enum: ['GROUP', 'INDIVIDUAL'],
            default: 'INDIVIDUAL'
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: 'Group'
        }
    },
    status: {
        type: String,
        enum: ['DELETED', 'ACTIVE'],
        default: 'ACTIVE'
    },
    creator: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const MobileMoneyAccount = mongoose.model('MobileMoneyAccount', mobileMoneyAccountSchema);

module.exports = MobileMoneyAccount;
