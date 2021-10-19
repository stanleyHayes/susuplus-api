const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmail = async (email, subject, text) => {
    try {
        const msg = {
            to: email,
            from: process.env.DUAPA_FROM_EMAIL_KEY,
            subject,
            text
        };
        await sgMail.send(msg);
    }catch (e) {
        console.log(e.message)
    }
}

module.exports = {sendEmail};
