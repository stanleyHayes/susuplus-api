const twilio = require("twilio");
const dotenv = require("dotenv");

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (to, message) => {
    try {
        return await client.messages.create({
            body: message,
            to: process.env.TWILIO_PHONE_NUMBER
        });
    }catch (e) {
        return {status: 'fail', data: null, message: e.message}
    }
}

module.exports = {sendSMS};
