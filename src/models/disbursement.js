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
    susu: {
        type: Schema.Types.ObjectId,
        ref: 'Susu',
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
        cardDetail: {
            type: Schema.Types.ObjectId,
            ref: 'CardDetail'
        },
        mobileMoneyAccount: {
            type: Schema.Types.ObjectId,
            ref: 'MobileMoneyAccount'
        }
    },
    paymentDetails: {
        type: String
    },
    status: {
        type: String,
        enum: ['Success', 'Fail', 'Pending'],
        default: 'Pending'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Disbursement = mongoose.model('Disbursement', disbursementSchema);

module.exports = Disbursement;
