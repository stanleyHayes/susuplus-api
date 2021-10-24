const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bankAccountSchema = new Schema({
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    accountBranch: {
        type: String,
        required: true,
        trim: true
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
    creator: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DELETED'],
        default: 'ACTIVE'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports =  BankAccount;
