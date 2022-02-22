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
        type: Number,
        required: true
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
        ref: 'Source',
        required: true
    },
    destinationPaymentMethod: {
        type: Schema.Types.ObjectId,
        ref: 'Source',
        required: true
    },
    stripePaymentDetails: {
        chargeID: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        address: {
            city: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            },
            line1: {
                type: String,
                required: true
            },
            line2: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            }
        },
        email: {
            type: String
        },
        name: {
            type: String
        },
        phone: {
            type: String
        },
        currency: {
            type: String
        },
        customer: {
            type: String
        },
        description: {
            type: String
        },
        paid: {
            type: Boolean,
        },
        paymentMethod: {
            type: String
        },
        paymentMethodDetails: {

        },
    },
    status: {
        type: String,
        enum: ['succeeded', 'failed', 'pending'],
        default: 'pending'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;
