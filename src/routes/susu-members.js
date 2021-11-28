const express = require('express');
const router = express.Router({mergeParams: true});

const {
    addSusuMember,
    getSusuMember,
    getSusuMembers,
    removeSusuMember,
    getSusuOfUser
} = require('../controllers/susu-members');
const {authenticate} = require("../middleware/authentication");

router.route('/')
    .post(authenticate, addSusuMember)
    .get(authenticate, getSusuMembers);

router.route('/:id')
    .delete(removeSusuMember);

router.get('/:user/:susu', authenticate, getSusuMember);
router.get('/:user', authenticate, getSusuOfUser);

module.exports = router;
