const {createCard, createBankAccount} = require("../utils/stripe");
const Source = require("../models/source");
const CreditCard = require("credit-card");
const Group = require("../models/group");
const User = require("../models/user");

const addPaymentMethod = async (type, ownership, groupID, userID, bankAccount, card) => {
    try {
        let customer;
        if (ownership === 'Group') {
            customer = await Group.findById(groupID);
            if (!customer) return {message: 'No group found', success: false, code: 404};
        } else if (ownership === 'Individual') {
            customer = await User.findById(userID);
            if (!customer) return {message: 'No user found', success: false, code: 404};
        }
        if (type === 'bank_account') {
            const {
                name,
                accountNumber,
                routingNumber,
                accountHolderType,
                accountType,
                accountHolderName,
                currency,
                country
            } = bankAccount;
            if (!name || !accountNumber || !routingNumber || !accountHolderType || !accountType || !accountHolderName || !currency)
                return {message: 'Missing required fields', code: 400, success: false};

            const stripeResponse = await createBankAccount(
                customer.stripeCustomerID,
                {
                    country,
                    currency,
                    accountHolderName,
                    routingNumber,
                    accountNumber,
                    accountType,
                    name,
                    accountHolderType,
                    last4: accountNumber.slice(accountNumber.length - 4)
                });

            const bankAccountSource = await Source.create({
                sourceID: stripeResponse.id,
                type,
                country,
                customer: stripeResponse.customer,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? groupID : undefined,
                    user: ownership === 'Individual' ? userID : undefined
                },
                bankAccountDetails: {
                    status: stripeResponse.status,
                    name,
                    accountNumber,
                    routingNumber,
                    accountHolderType,
                    accountHolderName,
                    last4: accountNumber.slice(accountNumber.length - 4),
                    currency
                }
            });

            if (bankAccountSource)
                return {message: 'Bank Account Added', status: 201, success: true, data: bankAccountSource};

        }
        else if (type === 'card') {
            const {
                address,
                cvv,
                name,
                expiryDate,
                cardNumber,
                funding,
            } = card;

            const brand = CreditCard.determineCardType(cardNumber);
            const [expiryMonth, expiryYear] = expiryDate.split("/");
            const validatedCard = CreditCard.validate({
                cardType: brand,
                number: cardNumber,
                expiryMonth,
                expiryYear,
                cvv
            });

            if (validatedCard.isExpired)
                return {message: 'Card Expired', code: 400, success: false};

            if (!validatedCard.validCardNumber)
                return {code: 400, message: 'Invalid Card', success: false};

            const stripeCardResponse = await createCard(
                customer.stripeCustomerID,
                {
                    number: cardNumber,
                    last4: cardNumber.slice(cardNumber.length - 4),
                    expiryYear,
                    expiryMonth,
                    cvv,
                    name
                },
                address
            )
            const cardSource = await Source.create({
                sourceID: stripeCardResponse.id,
                type,
                customer: stripeCardResponse.customer,
                country: stripeCardResponse.country,
                owner: {
                    type: ownership,
                    group: ownership === 'Group' ? groupID : undefined,
                    user: ownership === 'Individual' ? userID : undefined
                },
                cardDetails: {
                    cvv,
                    name,
                    expiryMonth,
                    expiryYear,
                    cardNumber,
                    brand: stripeCardResponse.brand,
                    expiryDate,
                }
            });

            if (cardSource)
                return {data: cardSource, status: 201, message: 'Card Added', success: true};
            return {data: cardSource, status: 400, message: 'Unknown payment method', success: false};
        }

    } catch (e) {
        return {code: 400, message: e.message, data: null, success: false};
    }
}

module.exports = {addPaymentMethod};
