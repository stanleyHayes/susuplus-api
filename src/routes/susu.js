const express = require('express');
const router = express.Router({mergeParams: true});

const {
    createSusu,
    getSusu,
    getSusus,
    updateSusu
} = require('../controllers/susu');
const {authenticate} = require("../middleware/authentication");

router.route('/').post(authenticate, createSusu).get(authenticate, getSusus);
router.route('/:id').get(authenticate, getSusu).put(authenticate, updateSusu);

module.exports = router;
