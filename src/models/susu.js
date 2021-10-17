const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const susuSchema = new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    currentRecipient: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    previousRecipient: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    nextRecipient: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentPlan: {
        amount: {
            type: Number
        },
        unit: {
            type: String
        }
    },
    nextPaymentDate: {
        type: Date
    },
    previousPaymentDate: {
        type: Date
    },
    currentPaymentDate: {
        type: Date
    },
    paymentOrder: {
        type: [Schema.Types.ObjectId],
        ref: 'User'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Susu = mongoose.model('Susu', susuSchema);

module.exports = Susu;
