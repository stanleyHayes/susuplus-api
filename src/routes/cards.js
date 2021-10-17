const express = require('express');
const router = express.Router({mergeParams: true});

const {createCard, getCard, getCards, removeCard, updateCard} = require('../controllers/cards');

router.route('/').post(createCard).get(getCards);
router.route('/:id').get(getCard).put(updateCard).delete(removeCard);

module.exports = router;
