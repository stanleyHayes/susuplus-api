const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bankAccountSchema = new Schema({
    accountHolderName: {
        type: String,
        required: true,
        trim: true
    },
    accountHolderType: {
        type: String,
        required: true,
        enum: ['individual', 'company'],
    },
    bankName: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    customer: {
        type: String,
        required: true
    },
    last4: {
        type: String,
        required: true
    },
    routingNumber: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['new', 'validated', 'verified', 'verification_failed', 'errored']
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;
