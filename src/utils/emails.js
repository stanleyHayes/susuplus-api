const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, subject, text) => {
    const msg = {
        to: email,
        from: process.env.DUAPA_FROM_EMAIL_KEY,
        subject,
        text,
        templateId: process.env.DUAPA_SENDGRID_SIGN_UP_EMAIL_TEMPLATE_ID
    };
    await sgMail.send(msg);
}

module.exports = {sendEmail};
