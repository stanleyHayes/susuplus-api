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
            type: String,
            default: 'GHS'
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
    },
    round: {
        type: Number,
        min: 1,
        default: 1
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
}, {timestamps: {createdAt: true, updatedAt: true}});

const Disbursement = mongoose.model('Disbursement', disbursementSchema);

module.exports = Disbursement;
