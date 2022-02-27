const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sourceSchema = new Schema({
    sourceID: {
        type: String,
        required: true
    },
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
    type: {
        type: String,
        enum: ['bank_account', 'card'],
    },
    bankAccountDetails: {
        accountHolderName: {
            type: String,
            trim: true
        },
        accountHolderType: {
            type: String,
            enum: ['individual', 'company'],
        },
        name: {
            type: String,
        },
        last4: {
            type: String,
        },
        routingNumber: {
            type: String,
        },
        accountType: {
            type: String,
            enum: ['checking', 'savings'],
        },
        accountNumber: {
            type: String,
        },
        status: {
            type: String,
            enum: ['new', 'validated', 'verified', 'verification_failed', 'errored']
        },
        currency: {
            type: String,
        },
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
        },
        expiryMonth: {
            type: String,
            minlength: 2,
            maxlength: 2,
        },
        expiryYear: {
            type: String,
            minlength: 4,
            maxlength: 4,
        },
        funding: {
            type: String,
            enum: ['credit', 'debit', 'prepaid', 'unknown'],
            default: 'unknown'
        },
        last4: {
            type: String,
        },
        name: {
            type: String
        },
        number: {
            type: String,
        },
        cvv: {
            type: String,
        },
        status: {
            type: String,
            enum: ['canceled', 'chargeable', 'consumed', 'failed', 'pending'],
            default: 'pending'
        },
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;
