const User = require('../models/user');
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
    try {
        if(!req.headers || !req.headers['authorization'])
            return res.status(400).json({message: `Authorization required`});
        const [bearer, token] = req.headers['authorization'].split(' ');
        if(!bearer || !token)
            return res.status(400).json({message: `Bearer and token required`});
        const decoded = jwt.verify(token, process.env.JWT_SECRET, null, null);
        const user = await User.findById(decoded._id);
        if(!user)
            return res.status(400).json({message: `Invalid token`});
        req.user = user;
        req.token = token;
        next();
    }catch (e) {
        return res.status(400).json({message: e.message});
    }
}


const authorize = (...roles) => {
    return (req, res, next) => {
        if(roles.includes(req.user.role)){
            return next();
        }
        return res.status(403).json({message: 'Not authorized to access this role'});
    }
}


module.exports = {authenticate, authorize};
