const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sourceSchema = new Schema({
    owner: {
        type: {
            type: String,
            enum: ['Group', 'Individual'],
            required: true
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: 'Group'
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    customer: {
        type: String,
        required: true
    },
    country: {
        type: String
    },
    currency: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['bank_account', 'card'],
    },
    status: {
        type: String,
        enum: ['canceled', 'chargeable', 'consumed', 'failed', 'pending'],
        default: 'pending'
    },
    bankAccountDetails: {
        accountHolderName: {
            type: String,
            required: true,
            trim: true
        },
        accountHolderType: {
            type: String,
            required: true,
            enum: ['individual', 'company'],
        },
        bankName: {
            type: String,
            required: true
        },
        last4: {
            type: String,
            required: true
        },
        routingNumber: {
            type: String,
            required: true
        },
        accountType: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['new', 'validated', 'verified', 'verification_failed', 'errored']
        }
    },
    cardDetails: {
        address: {
            city: {
                type: String
            },
            country: {
                type: String
            },
            line1: {
                type: String
            },
            line2: {
                type: String
            },
            state: {
                type: String
            }
        },
        brand: {
            type: String,
            enum: ['American Express', 'Diners Club', 'Discover', 'JCB', 'MasterCard', 'UnionPay', 'Visa', 'Unknown'],
            default: 'Unknown'
        },
        expiryMonth: {
            type: String,
            minlength: 2,
            maxlength: 2,
            required: true
        },
        expiryYear: {
            type: String,
            minlength: 4,
            maxlength: 4,
            required: true
        },
        funding: {
            type: String,
            enum: ['credit', 'debit', 'prepaid', 'unknown'],
            default: 'unknown'
        },
        last4: {
            type: String,
            required: true
        },
        name: {
            type: String
        },
        number: {
            type: String,
            required: true
        },
        cvc: {
            type: String,
            required: true
        }
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;
