const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const disbursementSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    payment: {
        method: {
            type: String,
            enum: ['PAYPAL', 'MOMO', 'CARD', 'BANK'],
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

const Disbursement = mongoose.model('Disbursement', disbursementSchema);

module.exports = Disbursement;
