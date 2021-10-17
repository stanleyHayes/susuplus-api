const express = require('express');
const router = express.Router({mergeParams: true});

const {
    createSusu,
    getSusu,
    getSusus,
    updateSusu
} = require('../controllers/susu');

router.route('/').post(createSusu).get(getSusus);
router.route('/:id').get(getSusu).put(updateSusu);

module.exports = router;
