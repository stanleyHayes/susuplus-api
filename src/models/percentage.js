const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const percentageSchema = new Schema({
    percentage: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    }
});

const Percentage = mongoose.model('Percentage', percentageSchema);

module.exports = Percentage;
