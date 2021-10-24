const express = require('express');
const {authenticate} = require("../middleware/authentication");

const {
    createMobileMoneyAccount,
    deleteMobileMoneyAccount,
    getMobileMoneyAccount,
    getMobileMoneyAccounts,
    updateMobileMoneyAccount
} = require('../controllers/mobile-money-accounts');

const router = express.Router();

router.route('/')
    .post(authenticate, createMobileMoneyAccount)
    .get(authenticate, getMobileMoneyAccounts);

router.route('/:id')
    .get(authenticate, getMobileMoneyAccount)
    .put(authenticate, updateMobileMoneyAccount)
    .delete(authenticate, deleteMobileMoneyAccount);

module.exports = router;
