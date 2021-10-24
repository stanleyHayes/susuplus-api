const express = require('express');
const {authenticate} = require("../middleware/authentication");

const {
    createDebitCard,
    deleteDebitCard,
    getDebitCard,
    getDebitCards,
    updateDebitCard
} = require('../controllers/debit-cards');

const router = express.Router();

router.route('/')
    .post(authenticate, createDebitCard)
    .get(authenticate, getDebitCards);

router.route('/:id')
    .get(authenticate, getDebitCard)
    .put(authenticate, updateDebitCard)
    .delete(authenticate, deleteDebitCard);

module.exports = router;
