const express = require('express');
const {authenticate} = require("../middleware/authentication");
const {getDashboard} = require("../controllers/dashboard");
const router = express.Router({mergeParams: true});

router.route('/').get(authenticate, getDashboard);

module.exports = router;
