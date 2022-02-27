const dotenv = require("dotenv");
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCustomer = async (name, email, phone) => {
    return await stripe.customers.create({name, email, phone});
}

const createCard = async (customer, card, address) => {
    return await stripe.customers.createSource(customer, {
        source: {
            object: 'card',
            number: card.number,
            exp_month: card.expiryMonth,
            exp_year: card.expiryYear,
            cvc: card.cvc,
            name: card.name,
            address_state: address.state,
            address_city: address.city,
            address_line1: address.addressLine1,
            address_line2: address.addressLine2,
            address_country: address.country,
            address_zip: address.zip,
            last4: card.last4
        }
    });
}

const createBankAccount = async (customer, bank) => {
    return await stripe.customers.createSource(customer, {
        source: {
            object: 'bank_account',
            country: bank.country,
            currency: bank.currency,
            account_holder_name: bank.accountHolderName,
            account_holder_type: bank.accountHolderType,
            routing_number: bank.routingNumber,
            account_number: bank.accountNumber,
            account_type: bank.accountType,
            bank_name: bank.name,
            last4: bank.last4
        }
    });
}

/**
 * @description - A function to charge a user contributing to a susu
 * */

const createCharge = async (amount, currency, customer, receiptEmail, description, source) => {
    return await stripe.charges.create({
        amount,
        currency,
        customer,
        description,
        receipt_email: receiptEmail,
        source
    });
}

/**
 * @description - Move funds from duaba account
 * to group stripe account (investment percent)
 * and group member stripe account (savings percent)
 * */
const createTransfer = async (amount, currency, destination) => {
    return await stripe.transfers.createTransfer({
        amount,
        currency,
        destination
    });
}


module.exports = {
    createCustomer,
    createBankAccount,
    createCharge,
    createCard,
    createTransfer
};
