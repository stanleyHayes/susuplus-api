const express = require('express');
const router = express.Router({mergeParams: true});

const {
    updateUser,
    getUsers,
    getUser,
    deleteUser,
    createUser
} = require('../controllers/users');
const {authenticate, authorize} = require("../middleware/authentication");

router.route('/')
    .post(authenticate, authorize('SUPER_ADMIN'), createUser)
    .get(authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getUsers);

router.route('/:id')
    .get(authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getUser)
    .put(authenticate, authorize('SUPER_ADMIN'), updateUser)
    .delete(authenticate, authorize('SUPER_ADMIN'), deleteUser);

module.exports = router;
