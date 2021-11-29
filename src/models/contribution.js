const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const contributionSchema = new Schema({
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
    contributor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    round: {
        type: Number,
        required: true,
        min: 1
    },
    sourcePaymentMethod: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    destinationPaymentMethod: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
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

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;
