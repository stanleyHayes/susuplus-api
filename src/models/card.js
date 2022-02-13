const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cardSchema = new Schema({
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
    address: {
        city: {
            type: String
        },
        country: {

        },
        line1: {

        },
        line2: {

        },
        state: {

        }
    },
    brand: {
        type: String,
        enum: ['American Express', 'Diners Club', 'Discover', 'JCB', 'MasterCard', 'UnionPay', 'Visa', 'Unknown'],
        default: 'Unknown'
    },
    country: {
        type: String
    },
    customer: {
        type: String,
        required: true
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
    currency: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    cvc: {
        type: String,
        required: true
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
