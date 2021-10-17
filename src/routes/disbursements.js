const express = require('express');
const router = express.Router({mergeParams: true});

const {
    createDisbursement,
    getDisbursement,
    getDisbursements,
} = require('../controllers/disbursements');
const {authenticate} = require("../middleware/authentication");

router.route('/')
    .post(authenticate, createDisbursement)
    .get(authenticate, getDisbursements);
router.route('/:id').get(getDisbursement);

module.exports = router;
