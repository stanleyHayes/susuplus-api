const bcrypt = require('bcryptjs');
const validator = require("validator");

const User = require('../models/user');


exports.createUser = async (req, res) => {
    try {
        const {name, password, email, phone, role} = req.body;
        if(!name || ! password || !email || !phone)
            return res.status(400).json({message: 'Missing required fields', data: null});
        if(!validator.isStrongPassword(password))
            return res.status(400).json({message: 'Enter a strong password', data: null});
        const user = await User.create({role, name, email, phone, password: await bcrypt.hash(password, 10)});
        res.status(200).json({message: `User Created Successfully`, data: user});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getUsers = async (req, res) => {
    try {
        const match = {};
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.size) || 50;
        const skip = (page - 1) * limit;
        if(req.query.role){
            match['role'] = req.query.role
        }
        const users = await User.find(match).skip(skip).limit(limit).sort({createdAt: -1});
        const totalUsers = await User.find(match).countDocuments();
        res.status(200).json({message: `${users.length} user${users.length === 1 ? '' : 's'} retrieved`, data: users, totalUsers});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.getUser = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id);
        if(!user) return res.status(404).json({message: 'Account Not Found', data: null});
        res.status(200).json({message: `Account ${user.email} retrieved`, data: user});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.updateUser = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['email', 'phone', 'password', 'role', 'name'];
        const user = await User.findById(req.params.id);
        if(!user)
            return res.status(404).json({message: `User with id ${req.params.id} not found`});
        const isAllowed = updates.every(update => allowedUpdates.includes(update));
        if(!isAllowed)
            return res.status(400).json({message: 'Updates not allowed', data: null});
        for (let key of updates){
            if(key === 'email') {
                const user = await User.findOne({email: req.body['email']});
                if (!user)
                    user['email'] = req.body['email'];
                else
                    return res.status(409).json({data: null, message: `Email already taken`});
            }else if(key === 'phone') {
                const user = await User.findOne({phone: req.body['phone']});
                if (!user)
                    user['phone'] = req.body['phone'];
                else
                    return res.status(409).json({data: null, message: `Phone number already taken`});
            }else if(key === 'password'){
                if(validator.isStrongPassword(req.body['password'])){
                    user['password'] = await bcrypt.hash(req.body['password'], 10);
                }else{
                    return res.status(400).json({message: 'Enter a strong password', data: null});
                }
            }
            else {
                user[key] = req.body[key];
            }
        }
        const updatedUser = await user.save();
        res.status(200).json({message: `User updated successfully`, data: updatedUser});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id);
        if(!user)
            return res.status(404).json({message: `User not found`, data: null});
        await user.remove();
        res.status(200).json({message: `Account ${user.email} removed`, data: user});
    }catch (e) {
        res.status(500).json({message: e.message});
    }
}
