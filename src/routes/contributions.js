const express = require('express');
const router = express.Router({mergeParams: true});

const {
    createContribution,
    getContribution,
    getContributions,
} = require('../controllers/contributions');
const {authenticate} = require("../middleware/authentication");

router.route('/').post(authenticate, createContribution)
    .get(authenticate, getContributions);
router.route('/:id').get(authenticate, getContribution);

module.exports = router;
