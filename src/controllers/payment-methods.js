const PaymentMethod = require("../models/payment-method");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");

const validator = require("validator");
const {createSubAccount} = require("../utils/paystack");

exports.addPaymentMethod = async (req, res) => {
    try {
        const {method, ownership} = req.body;

        if(ownership === 'Group'){
            const group = await Group.findById(req.body.groupID);
            if(!group)
                return res.status(404).json({message: 'Group not found'});
            const groupMember = await GroupMember.findOne({group: req.body.groupID, user: req.user._id});
            if(!groupMember)
                return res.status(403).json({message: 'You are not a member of this group'});
            if(groupMember.role !== 'ADMIN')
                return res.status(403).json({message: 'You do no have the permissions to perform this operation'});
        }


        if (method === 'Bank Account') {
            const {bankName, accountNumber, bankCode, accountBranch, mobileNumber, accountName} = req.body;
            if (!bankName || !accountNumber || !bankCode || !accountBranch || !mobileNumber || !accountName)
                return res.status(400).json({message: 'Missing required fields'});
            if (!validator.isMobilePhone(mobileNumber))
                return res.status(400).json({message: 'Invalid mobile phone'});


            const bankAccountPaymentMethod = await PaymentMethod.create({
                method,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? req.body.groupID: undefined,
                    user: ownership === 'Individual' ? req.user._id: undefined
                },
                bankAccount: {
                    bankName,
                    accountNumber,
                    bankCode,
                    accountBranch,
                    mobileNumber,
                    accountName,
                    last4: accountNumber.slice(accountNumber.length - 4)
                }
            });

            if(bankAccountPaymentMethod)
                return res.status(200).json({message, data: bankAccountPaymentMethod});

        } else if (method === 'Card') {
            const {bankIssuer, cvv, cardHolderNumber, expiryDate, cardNumber} = req.body;
            let network;

            switch (cardNumber[0]) {
                case '4':
                    network = 'Visa';
                    if(cardNumber.length !== 16 && cardNumber.length !== 13)
                        return res.status(400).json({message: 'Invalid MasterCard'});
                    break;

                case '5':
                    network = 'MasterCard';
                    if(cardNumber.length !== 16)
                        return res.status(400).json({message: 'Invalid MasterCard'});
                    break;

                case '3':
                    network = 'American Express';
                    const secondNumber = cardNumber[1];
                    if (secondNumber !== '4' || secondNumber !== '7')
                        return res.status(400).json({message: 'Invalid American Express Card'});
            }
            const [expiryMonth, expiryYear] = expiryDate.split("/");
            if(!expiryMonth)
                return res.status(400).json({message: 'Invalid expiry month'});
            if(parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12)
                return res.status(400).json({message: 'Invalid month'});

            if(!expiryYear)
                return res.status(400).json({message: 'Invalid year'});
            if(parseInt(expiryYear) < new Date().getFullYear())
                return res.status(400).json({message: 'Card expired'});


            const cardPaymentMethod = await PaymentMethod.create({
                method,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? req.body.groupID: undefined,
                    user: ownership === 'Individual' ? req.user._id: undefined
                },
                cardDetail: {
                    bankIssuer,
                    cvv,
                    cardHolderNumber,
                    last4: cardNumber.slice(cardNumber.length - 4),
                    expiryMonth,
                    expiryYear,
                    number: cardNumber,
                    network
                }
            });

            if(cardPaymentMethod)
                return res.status(201).json({message: 'Mobile money account created'});
        } else if (method === 'Mobile Money') {
            const {mobileNumber, provider, name} = req.body;
            if(!validator.isMobilePhone(mobileNumber)){
                return res.status(400).json({message: 'Invalid mobile number'});
            }
            const mobileMoneyPaymentMethod = await PaymentMethod.create({
                method: 'Mobile Money',
                mobileMoneyAccount: {
                    provider, name, number: mobileNumber
                },

            });
            if(mobileMoneyPaymentMethod)
                return res.status(201).json({message: 'Mobile money account created'});
        } else {
            return res.status(400).json({message: 'Unknown payment method'});
        }
        res.status(201).json({message: 'Payment method added', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updatePaymentMethod = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment method updated', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getPaymentMethod = async (req, res) => {
    try {
        const {id} = req.params;
        const paymentMethod = await PaymentMethod.findOne({_id: id, })
        res.status(200).json({message: 'Payment method retrieved', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.getPaymentMethods = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment methods retrieved', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.removePaymentMethod = async (req, res) => {
    try {
        res.status(200).json({message: 'Payment method removed', data: {}});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
