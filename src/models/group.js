const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    image: {
        type: String
    },
    regulations: {
        type: [String]
    },
    percentages: {
        susu: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },
        investment: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DELETED', 'SUSPENDED'],
        default: 'ACTIVE'
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

groupSchema.virtual('members', {
    localField: '_id',
    foreignField: 'group',
    ref: 'User',
    justOne: false
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
