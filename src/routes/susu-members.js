const express = require('express');
const router = express.Router({mergeParams: true});

const {
    addSusuMember,
    getSusuMember,
    getSusuMembers,
    removeSusuMember,

} = require('../controllers/susu-members');

router.route('/')
    .post(addSusuMember)
    .get(getSusuMembers);

router.route('/:id')
    .get(getSusuMember)
    .delete(removeSusuMember);

module.exports = router;
