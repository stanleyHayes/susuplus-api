const express = require('express');

const router = express.Router({mergeParams: true});

const {
    register,
    login,
    getProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    deactivateProfile,
    updateProfile,
    verifyAccount,
    resendOTP
} = require('../controllers/authentication');
const {authenticate} = require("../middleware/authentication");

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/profile/deactivate', authenticate, deactivateProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/verify/:token', verifyAccount);
router.post('/resend-otp', resendOTP);

module.exports = router;
