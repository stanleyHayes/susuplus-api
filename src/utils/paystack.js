const axios = require("axios");

exports.createSubAccount = async (accountName, bankCode, accountNumber, email, mobilePhone) => {
    try {
        const response = await axios({
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            url: `https://api.paystack.co/subaccount`,
            data: {
                business_name: accountName,
                account_number: accountNumber,
                primary_contact_phone: mobilePhone,
                primary_contact_email: email,
                primary_contact_name: accountName,
                settlement_bank: bankCode
            }
        });

        return response.data;
    } catch (e) {
        return {status: false, data: null, message: e.message};
    }
}

exports.createCharge = async (email, amount, currency, bank, mobile_money, card, method) => {
    try {
        const data = {email, amount: amount * 100, currency};
        switch (method) {
            case 'Mobile Money':
                data['mobile_money'] = mobile_money;
                break;

            case 'Card':
                data['card'] = card;
                break;

            case 'Bank Account':
                data['bank'] = bank;
                break;
        }
        const response = await axios({
            method: 'POST',
            url: `https://api.paystack.co/charge`,
            data,
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (e) {
        return {data: null, message: e.message, status: false};
    }
}

exports.verifyBankAccount = async (accountNumber, bankCode) => {
    try {
        const response = await axios({
            method: 'GET',
            url: `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(response.data);
        return response.data;
    } catch (e) {
        console.log(e.message)
        return {message: 'Something Went wrong', data: null, status: false};
    }
}
