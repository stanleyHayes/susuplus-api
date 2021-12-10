const express = require('express');
const router = express.Router({mergeParams: true});

const {
    addSusuMembers,
    getSusuMember,
    getSusuMembers,
    removeSusuMember,
    getSusuOfUser
} = require('../controllers/susu-members');
const {authenticate} = require("../middleware/authentication");

router.route('/')
    .post(authenticate, addSusuMembers)
    .get(authenticate, getSusuMembers);

router.route('/:id')
    .delete(removeSusuMember);

router.get('/:user/:susu', authenticate, getSusuMember);
router.get('/:user', authenticate, getSusuOfUser);

module.exports = router;
