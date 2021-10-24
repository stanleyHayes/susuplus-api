const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const contributionSchema = new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    amount: {
        value: {
            type: Number
        },
        currency: {
            type: String
        }
    },
    contributor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment: {
        method: {
            type: String,
            enum: [ 'MOBILE_MONEY', 'DEBIT_CARD', 'BANK_ACCOUNT'],
            required: true
        },
        bankAccount: {
            type: Schema.Types.ObjectId,
            ref: 'BankAccount'
        },
        debitCard: {
            type: Schema.Types.ObjectId,
            ref: 'DebitCard'
        },
        mobileMoneyAccount: {
            type: Schema.Types.ObjectId,
            ref: 'MobileMoneyAccount'
        }
    },
    paymentDetails: {
        type: String
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;
