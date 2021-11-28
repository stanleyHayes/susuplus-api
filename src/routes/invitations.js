const express = require('express');
const {authenticate} = require("../middleware/authentication");

const {
    createInvitation, deleteInvitation, getInvitation, updateInvitation, getInvitations, respondInvitation
} = require('../controllers/invitations');

const router = express.Router();

router.route('/')
    .post(authenticate, createInvitation)
    .get(authenticate, getInvitations);

router.put('/:id/response', authenticate, respondInvitation);

router.route('/:id')
    .get(authenticate, getInvitation)
    .put(authenticate, updateInvitation)
    .delete(authenticate, deleteInvitation);

module.exports = router;
