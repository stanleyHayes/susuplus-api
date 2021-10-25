const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cardSchema = new Schema({
    issuingNetwork: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    cardHolderName: {
        type: String,
        required: true
    },
    cardNumber: {
        type: String,
        required: true
    },
    cvv: {
        type: String,
        required: true
    },
    expiryDate: {
        type: String
    },
    ownership: {
        type: {
            type: String,
            enum: ['GROUP', 'INDIVIDUAL'],
            default: 'INDIVIDUAL'
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: 'Group'
        }
    },
    creator: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    country: {
        type: String,
        required: true
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const DebitCard = mongoose.model('DebitCard', cardSchema);

module.exports = DebitCard;
