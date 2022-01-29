const express = require('express');
const router = express.Router({mergeParams: true});

const {
    createGroup,
    deleteGroup,
    getGroup,
    getGroups,
    updateGroup
} = require('../controllers/groups');
const {authenticate, authorize} = require("../middleware/authentication");

router.route('/')
    .post(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'USER'), createGroup)
    .get(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'USER'), getGroups);

router.route('/:id')
    .get(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'USER'),getGroup)
    .put(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'USER'),updateGroup)
    .delete(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'USER'),deleteGroup);

module.exports = router;
