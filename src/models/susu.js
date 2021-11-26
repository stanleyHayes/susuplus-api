const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const susuSchema = new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    currentRecipient: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'GroupMember'
        },
        date: {
            type: Date
        }

    },
    previousRecipient: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'GroupMember'
        },
        date: {
            type: Date
        }
    },
    nextRecipient: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'GroupMember'
        },
        date: {
            type: Date
        }
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
        interval: {
            type: Number,
            min: 1
        },
        unit: {
            type: String,
            enum: ['days', 'day', 'week', 'weeks', 'month', 'months', 'year', 'years'],
            required: true
        }
    },
    paymentOrder: {
        type: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'GroupMember',
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
