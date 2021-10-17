const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

exports.register = async (req, res) => {
    try {
        const {email, phone, password, name, role} = req.body;
        if(!email || !phone || !password || !name)
            return res.status(400).json({message: 'Missing required fields', data: null});
        const existingUser = await User.findOne({email});
        if(existingUser)
            return res.status(409).json({message: `Email ${email} is already taken`, data: null});
        if(!validator.isStrongPassword(password)){
            return res.status(400).json({message: 'Enter a strong password', data: null});
        }
        const user = await User.create({role, email, phone, name, password: await bcrypt.hash(password, 10)});
        const token = await jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '1hr'});
        res.status(201).json({message: `Account Created Successfully`, data: user, token});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password)
            return res.status(400).json({message: 'Missing required fields', data: null});
        const user = await User.findOne({email});
        if(!user)
            return res.status(401).json({data: null, message: 'Authentication Failed'});
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if(!passwordsMatch)
            return res.status(401).json({data: null, message: 'Authentication Failed'});
        const token = await jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '1hr'});
        res.status(200).json({message: `Successfully Logged In`, data: user, token});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getProfile = async (req, res) => {
    try {
        res.status(200).json({message: `User profile retrieved`, data: req.user, token: req.token});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.deactivateProfile = async (req, res) => {
    try {
        res.status(200).json({message: `Deactivate User`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.changePassword = async (req, res) => {
    try {
        const {currentPassword, password} = req.body;
        if(!currentPassword || !password)
            return res.status(400).json({message: 'Missing required fields', data: null});
        if(!validator.isStrongPassword(password))
            return res.status(400).json({message: 'Weak Password', data: null});
        const matchPassword = await bcrypt.compare(currentPassword, req.user.password);
        if(!matchPassword)
            return res.status(401).json({message: 'Auth Failed'});
        req.user['password'] = await bcrypt.hash(password, 10);
        await req.user.save();
        res.status(200).json({message: `Password changed successfully`, data: req.user});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.forgotPassword = async (req, res) => {
    try {

        res.status(200).json({message: `Forgot Password`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.resetPassword = async (req, res) => {
    try {
        res.status(200).json({message: `Reset User`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.verifyAccount = async (req, res) => {
    try {
        res.status(200).json({message: `Verify User`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.resendOTP = async (req, res) => {
    try {
        res.status(200).json({message: `Resend OTP`, data: {}});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}


exports.updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'email', 'phone'];
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if(!isAllowed)
            return res.status(400).json({message: 'Updates not allowed', data: null});
        for(let key of updates){
            if(key === 'email') {
                const user = await User.findOne({email: req.body['email']});
                if (!user)
                    req.user['email'] = req.body['email'];
                else
                    return res.status(409).json({data: null, message: `Email already taken`});
            }else if(key === 'phone') {
                const user = await User.findOne({phone: req.body['phone']});
                if (!user)
                    req.user['phone'] = req.body['phone'];
                else
                    return res.status(409).json({data: null, message: `Phone number already taken`});
            }else {
                req.user[key] = req.body[key];
            }
        }
        await req.user.save();
        res.status(200).json({data: req.user, message: 'Account Successfully Updated'});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}
