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
        type: {
            id: {
                type: String,
                required: true
            },
            status: {
                type: String,
                enum: ['success', 'failed'],
                required: true
            },
            reference: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            paid_at: {
                type: Date,
                required: true
            },
            created_at: {
                type: Date,
                required: true
            },
            channel: {
                type: String,
                required: true
            },
            currency: {
                type: String,
                required: true
            },
            ip_address: {
                type: String
            },
            fees: {
                type: Number
            },
            authorization: {
                authorization_code: {
                    type: String
                },
                bin: {
                    type: String
                },
                last4: {
                    type: String
                },
                exp_month: {
                    type: String
                },
                exp_year: {
                    type: String
                },
                channel: {
                    type: String
                },
                card_type: {
                    type: String
                },
                bank: {
                    type: String
                },
                country_code: {
                    type: String
                },
                brand: {
                    type: String
                }
            },
        }
    },
    status: {
        type: String,
        enum: ['Success', 'Fail', 'Pending'],
        default: 'Pending'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;
