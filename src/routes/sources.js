const express = require("express");

const router = express.Router({mergeParams: true});

const {
    addSource,
    getSources,
    getSource,
    removeSource,
    updateSource
} = require("../controllers/sources");
const {authenticate} = require("../middleware/authentication");

router.route('/',)
    .post(authenticate, addSource)
    .get(authenticate, getSources);

router.route('/:id')
    .get(authenticate, getSource)
    .put(authenticate, updateSource)
    .delete(authenticate, removeSource);

module.exports = router;
