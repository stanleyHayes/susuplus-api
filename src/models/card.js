const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cardSchema = new Schema({
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
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
