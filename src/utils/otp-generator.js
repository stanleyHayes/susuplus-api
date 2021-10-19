const otpGenerator = require('otp-generator');

const generateOTP = (length, options) => {
    return otpGenerator.generate(length, options);
}

module.exports = {generateOTP};
