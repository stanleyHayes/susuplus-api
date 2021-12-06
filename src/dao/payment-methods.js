const validator = require("validator");
const {verifyBankAccount} = require("../utils/paystack");
const PaymentMethod = require("../models/payment-method");

const addPaymentMethod = async (method, ownership, groupID, userID, bankAccount, card, mobileMoneyAccount) => {
    try {
        if (method === 'Bank Account') {
            const {bankName, accountNumber, bankCode, accountBranch, mobileNumber, accountName} = bankAccount;
            if (!bankName || !accountNumber || !bankCode || !accountBranch || !mobileNumber || !accountName)
                return {code: 400, message: 'Missing required fields', data: null, success: false}

            if (!validator.isMobilePhone(mobileNumber))
                return {code: 400, message: 'Invalid mobile phone', data: null, success: false}

            const {status, message, data} = await verifyBankAccount(accountNumber, bankCode);

            if (!status && !data)
                return {code: 400, message, data, success: status}

            const bankAccountPaymentMethod = await PaymentMethod.create({
                method,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? groupID : undefined,
                    user: ownership === 'Individual' ? userID : undefined
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

            if (bankAccountPaymentMethod)
                return {code: 201, message: 'Bank Account Added', data: bankAccountPaymentMethod, success: true};

        } else if (method === 'Card') {
            const {bankIssuer, cvv, cardHolderName, expiryDate, cardNumber} = card;
            let network;

            switch (cardNumber[0]) {
                case '4':
                    network = 'Visa';
                    if (cardNumber.length !== 16 && cardNumber.length !== 13)
                        return {code: 400, message: 'Invalid Visa', data: null, success: false};
                    break;

                case '5':
                    network = 'MasterCard';
                    if (cardNumber.length !== 16)
                        return {code: 400, message: 'Invalid MasterCard', data: null, success: false};
                    break;

                case '3':
                    network = 'American Express';
                    const secondNumber = cardNumber[1];
                    if (secondNumber !== '4' || secondNumber !== '7')
                        return {code: 400, message: 'Invalid American Express Card', data: null, success: false};
            }
            const [expiryMonth, expiryYear] = expiryDate.split("/");
            if (!expiryMonth && !expiryYear)
                return {code: 400, message: 'Invalid expiry date', data: null, success: false};

            if (parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12)
                return {code: 400, message: 'Invalid month', data: null, success: false};

            if (!expiryYear)
                return {code: 400, message: 'Invalid year', data: null, success: false};
            if (parseInt(expiryYear) < new Date().getFullYear())
                return {code: 400, message: 'Expired card', data: null, success: false};

            const cardPaymentMethod = await PaymentMethod.create({
                method,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? groupID : undefined,
                    user: ownership === 'Individual' ? userID : undefined
                },
                cardDetail: {
                    bankIssuer,
                    cvv,
                    cardHolderName,
                    last4: cardNumber.slice(cardNumber.length - 4),
                    expiryMonth,
                    expiryYear,
                    number: cardNumber,
                    network,
                    expiryDate
                }
            });

            if (cardPaymentMethod)
                return {code: 201, message: 'Card details added', data: cardPaymentMethod, success: true};

        } else if (method === 'Mobile Money') {
            const {mobileMoneyNumber, provider, name} = mobileMoneyAccount;
            if (!validator.isMobilePhone(mobileMoneyNumber)) {
                return {code: 400, message: 'Invalid mobile number', data: null, success: false};
            }

            const mobileMoneyPaymentMethod = await PaymentMethod.create({
                method: 'Mobile Money',
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? groupID : undefined,
                    user: ownership === 'Individual' ? userID : undefined
                },
                mobileMoneyAccount: {
                    provider,
                    name,
                    number: mobileMoneyNumber,
                    last4: mobileMoneyNumber.slice(mobileMoneyNumber.length - 4)
                }
            });
            if (mobileMoneyPaymentMethod)
                return {
                    code: 201,
                    message: 'Mobile money account added',
                    data: mobileMoneyPaymentMethod,
                    success: true
                };
        } else {
            return {code: 400, message: 'Unknown payment method', data: null, success: false};
        }
    } catch (e) {
        return {code: 400, message: 'Something went wrong', data: null, success: false};
    }
}

module.exports = {addPaymentMethod};
