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
        currency: {
            type: String
        }
    },
    contributionPlan: {
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
        type: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                position: {
                    type: Number,
                    required: true
                },
                isPaid: {
                    type: Boolean,
                    default: false
                },
                dateDisbursed : {
                    type: Date
                }
            }
        ]
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['STARTED', 'PAUSED', 'STOPPED', 'PENDING', 'COMPLETED'],
        default: 'PENDING'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Susu = mongoose.model('Susu', susuSchema);

module.exports = Susu;
