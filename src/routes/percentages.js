const express = require("express");

const router = express.Router({mergeParams: true});

const {
    getPercentage, updatePercentage, createPercentage
} = require("../controllers/percentages");
const {authenticate, authorize} = require("../middleware/authentication");

router.route('/',)
    .post(authenticate, authorize('SUPER_ADMIN'), createPercentage)
    .get(authenticate, getPercentage)
    .put(authenticate, authorize('SUPER_ADMIN'), updatePercentage);


module.exports = router;
