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
    verifyAccount
} = require('../controllers/authentication');
const {authenticate} = require("../middleware/authentication");

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.delete('/profile', authenticate, deactivateProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/verify', verifyAccount);
router.post('/resend-otp', register);

module.exports = router;
