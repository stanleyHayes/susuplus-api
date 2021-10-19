const mongoose = require('mongoose');
const validator = require("validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female']
    },
    image: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        validate(value){
            console.log(value);
            if(!validator.isStrongPassword(value)){
                throw new Error(`Enter a password with lowercase, uppercase, digit and a special character`);
            }
        }
    },email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error(`Invalid email ${value}`);
            }
        }
    },phone: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value){
            if(!validator.isMobilePhone(value)){
                throw new Error(`Invalid phone number ${value}`);
            }
        }
    },
    pin: {
        type: String,
        min: 6,
        max: 6
    },
    profile: {
        type: String
    },
    country: {
        type: String
    },
    stateOrProvinceOrRegion: {
        type: String
    },
    city: {
        type: String
    },
    address: {
        type: String
    },
    occupation: {
        type: String
    },
    role: {
        type: String,
        enum: ['ADMIN', 'SUPER_ADMIN', 'USER'],
        default: 'USER'
    },
    otp: {
        type: String
    },
    otpValidUntil: {
        type: Date
    },
    token: {
        type: String
    },
    status: {
        type: String,
        enum: ['VERIFIED', 'SUSPENDED', 'DEACTIVATED', 'PENDING'],
        default: 'PENDING'
    },
    deactivate: {
        reason: {
            type: String
        },
        date: {
            type: Date
        }
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const User = mongoose.model('User', userSchema);

module.exports = User;
