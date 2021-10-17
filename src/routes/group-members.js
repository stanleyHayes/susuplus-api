const express = require('express');
const router = express.Router({mergeParams: true});

const {
    getGroupMember,
    getGroupMembers,
    removeGroupMember,
    updateGroupMember,
    addGroupMember,
    getGroupsOfUser
} = require('../controllers/group-members');
const {authenticate} = require("../middleware/authentication");

router.route('/')
    .post(authenticate, addGroupMember)
    .get(authenticate, getGroupMembers);

router.route('/:id')
    .put(authenticate, updateGroupMember)
    .delete(authenticate, removeGroupMember);

router.get('/:user/:group', authenticate, getGroupMember);
router.get('/:user', authenticate, getGroupsOfUser);

module.exports = router;
