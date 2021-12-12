const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const moment = require('moment');
const dotenv = require('dotenv');
const Cryptr = require('cryptr');

dotenv.config();
const cryptr = new Cryptr(process.env.CRYPTO_JS_ENCRYPT_KEY);

const {generateOTP} = require("../utils/otp-generator");
const {sendEmail} = require("../utils/emails");

exports.register = async (req, res) => {
    try {
        const {email, phone, password, name, role} = req.body;
        if (!email || !phone || !password || !name)
            return res.status(400).json({message: 'Missing required fields', data: null});
        const existingUser = await User.findOne({email});
        if (existingUser)
            return res.status(409).json({message: `Email ${email} is already taken`, data: null});
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({message: 'Enter a strong password', data: null});
        }
        const otp = generateOTP(process.env.OTP_LENGTH, {
            digits: true, alphabets: false, specialChars: false, upperCase: false
        });
        const otpValidUntil = moment().add(30, 'days');
        const user = await User.create({
            role,
            email,
            phone,
            name,
            password: await bcrypt.hash(password, 10),
            otp,
            otpValidUntil
        });

        const token = await jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '30days'});
        const encryptedToken = cryptr.encrypt(token);
        user.token = token;
        const url = `https://susuplus.vercel.app/auth/verify/${encryptedToken}`;
        const message = `Click on the link ${url} and verify your email with the otp ${otp}`;
        await user.save();
        await sendEmail(email, 'VERIFY ACCOUNT WITH SUSU PLUS', message);
        res.status(201).json({message: `Account Created Successfully`, data: user, token});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password)
            return res.status(400).json({message: 'Missing required fields', data: null});
        const user = await User.findOne({email});
        if (!user)
            return res.status(401).json({data: null, message: 'Authentication Failed'});
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch)
            return res.status(401).json({data: null, message: 'Authentication Failed'});
        if (user.status === 'PENDING')
            return res.status(400).json({message: 'Please verify your account', data: null});
        const token = await jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '24hr'});
        res.status(200).json({message: `Successfully Logged In`, data: user, token});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getProfile = async (req, res) => {
    try {
        res.status(200).json({message: `User profile retrieved`, data: req.user, token: req.token});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.changePassword = async (req, res) => {
    try {
        const {currentPassword, password} = req.body;
        if (!currentPassword || !password)
            return res.status(400).json({message: 'Missing required fields', data: null});
        if (!validator.isStrongPassword(password))
            return res.status(400).json({message: 'Weak Password', data: null});
        const matchPassword = await bcrypt.compare(currentPassword, req.user.password);
        if (!matchPassword)
            return res.status(401).json({message: 'Auth Failed'});
        req.user['password'] = await bcrypt.hash(password, 10);
        await req.user.save();
        res.status(200).json({message: `Password changed successfully`, data: req.user});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if (!user)
            return res.status(404).json({message: `No account associated with email ${email}`});
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
        const encryptedToken = cryptr.encrypt(token);
        user.token = token;
        const url = `https://susuplus.vercel.app/auth/reset-password/${encryptedToken}`;
        const message = `Reset your password using the link ${url}`;
        await user.save();
        await sendEmail(email, 'RESET PASSWORD', message);
        res.status(200).json({
            message: `Reset link has been sent to email ${email}`,
            token: encryptedToken,
            data: null
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.verifyAccount = async (req, res) => {
    try {
        const {token} = req.params;
        const {otp} = req.body;
        const decryptedToken = cryptr.decrypt(token);
        const user = await User.findOne({token: decryptedToken});
        if (!user)
            return res.status(401).json({data: null, message: `Invalid token`});
        if (moment().isAfter(user.otpValidUntil)) {
            return res.status(401).json({message: `OTP has expired. Please request a new one`, data: null});
        }
        if (user.otp !== otp) {
            return res.status(400).json({message: `OTP incorrect`, data: null});
        }
        user.status = 'VERIFIED';
        user.otp = undefined;
        user.otpValidUntil = undefined;
        user.token = undefined;
        await user.save();
        res.status(200).json({message: `Account verified successfully`, data: null});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'email', 'phone'];
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if (!isAllowed)
            return res.status(400).json({message: 'Updates not allowed', data: null});
        for (let key of updates) {
            if (key === 'email') {
                if(req.body['email'] === req.user.email)
                    continue;
                const user = await User.findOne({email: req.body['email']});
                if (!user)
                    req.user['email'] = req.body['email'];
                else
                    return res.status(409).json({data: null, message: `Email already taken`});
            } else if (key === 'phone') {
                if(req.body['phone'] === req.user.phone)
                    continue;
                const user = await User.findOne({phone: req.body['phone']});
                if (!user)
                    req.user['phone'] = req.body['phone'];
                else
                    return res.status(409).json({data: null, message: `Phone number already taken`});
            } else {
                req.user[key] = req.body[key];
            }
        }
        await req.user.save();
        res.status(200).json({data: req.user, message: 'Account Successfully Updated'});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.resendOTP = async (req, res) => {
    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if (!user)
            return res.status(404).json({message: `No account associated with ${email}`, data: null});
        const otp = generateOTP(process.env.OTP_LENGTH, {
            digits: true, alphabets: false, specialChars: false, upperCase: false
        });
        const otpValidUntil = moment().add(30, 'days');
        const token = await jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '30days'});

        const encryptedToken = cryptr.encrypt(token);
        user.token = encryptedToken;
        user.otp = otp;
        user.otpValidUntil = otpValidUntil;
        const url = `https://susuplus.vercel.app/auth/verify/${encryptedToken}`;
        const message = `Click on the link ${url} and verify your email with the otp ${otp}`;
        await user.save();
        await sendEmail(email, 'VERIFY ACCOUNT WITH SUSU PLUS', message);
        res.status(200).json({message: `Verify your account with the link sent to email ${email}`, data: null});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.deactivateProfile = async (req, res) => {
    try {
        req.user.status = 'DEACTIVATED';
        req.user.deactivate.reason = req.body.reason;
        req.user.deactivate.date = Date.now();
        await req.user.save();
        res.status(200).json({
            message: `Account Deactivated. We're sorry to see you go. We hope you come back again`,
            data: null
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;
        const decryptedToken = cryptr.decrypt(token);
        const user = await User.findOne({token: decryptedToken});
        if (!user)
            return res.status(401).json({data: null, message: `Invalid token`});
        if (!validator.isStrongPassword(password))
            return res.status(400).json({message: 'Enter a strong password', data: null});
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        res.status(200).json({message: `Password reset successfully`, data: null});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
