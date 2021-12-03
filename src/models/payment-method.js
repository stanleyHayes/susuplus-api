const mongoose = require("mongoose");
const {Schema} = require("mongoose");
const validator = require("validator");


const paymentMethodSchema = new Schema({
    method: {
        type: String,
        enum: ['Bank Account', 'Card', 'Mobile Money'],
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
    cardDetail: {
        type: {
            bankIssuer: {
                type: String,
                required: true
            },
            network: {
                type: String,
                enum: ['Visa', 'MasterCard', 'American Express', 'Discover'],
                required: true
            },
            expiryMonth: {
                type: Number,
                required: true
            },
            expiryYear: {
                type: Number,
                required: true
            },
            number: {
                type: String,
                required: true
            },
            cvv: {
                type: String,
                required: true
            },
            last4: {
                type: String,
                required: true
            },
            cardHolderName: {
                type: String,
                required: true
            },
            expiryDate: {
                type: String,
                required: true
            }
        }
    },
    bankAccount: {
        type: {
            accountName: {
                type: String,
                required: true
            },
            bankName: {
                type: String,
                required: true
            },
            accountNumber: {
                type: String,
                required: true
            },
            bankCode: {
                type: String,
                required: true
            },
            accountBranch: {
                type: String,
                required: true
            },
            mobileNumber: {
                type: String,
                required: true,
                validate(value){
                    if(!validator.isMobilePhone(value)){
                        throw new Error(`Invalid phone ${value}`);
                    }
                }
            },
            last4: {
                type: String,
                minlength: 4,
                maxlength: 4,
                required: true
            }
        }
    },
    mobileMoneyAccount: {
        type: {
            provider: {
                type: String,
                enum: ['mtn', 'vod', 'tgo'],
                required: true
            },
            number: {
                type: String,
                validate(value){
                    if(!validator.isMobilePhone(value)){
                        throw new Error(`Invalid phone ${value}`);
                    }
                }
            },
            name: {
                type: String,
                required: true
            }
        }
    }
}, {timestamps: {createdAt: true, updatedAt: true}});

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

module.exports = PaymentMethod;
