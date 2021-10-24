const express = require('express');
const {authenticate} = require("../middleware/authentication");

const {
    createBankAccount,
    deleteBankAccount,
    getBankAccount,
    getBankAccounts,
    updateBankAccount
} = require('../controllers/bank-accounts');

const router = express.Router({mergeParams: true});

router.route('/')
    .post(authenticate, createBankAccount)
    .get(authenticate, getBankAccounts);

router.route('/:id')
    .get(authenticate, getBankAccount)
    .put(authenticate, updateBankAccount)
    .delete(authenticate, deleteBankAccount);

module.exports = router;
