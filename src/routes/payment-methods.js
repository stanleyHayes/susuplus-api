const express = require("express");

const router = express.Router({mergeParams: true});

const {
    getPaymentMethod,
    addPaymentMethod,
    getPaymentMethods,
    removePaymentMethod,
    updatePaymentMethod
} = require("../controllers/payment-methods");
const {authenticate} = require("../middleware/authentication");

router.route('/',)
    .post(authenticate, addPaymentMethod)
    .get(authenticate, getPaymentMethods);

router.route('/:id')
    .get(authenticate, getPaymentMethod)
    .put(authenticate, updatePaymentMethod)
    .delete(authenticate, removePaymentMethod);

module.exports = router;
