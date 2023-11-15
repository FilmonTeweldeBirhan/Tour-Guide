const express = require('express');
const {
  getOverview,
  getTour,
  getLogin,
  aboutMe,
} = require('../controllers/viewsController');
const {
  isLoggedIn,
  logOut,
  protect,
} = require('../controllers/authController');
const { getMe } = require('../controllers/userController');

const router = express.Router();

router.get('/', isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLogin);

router.get('/me', protect, aboutMe);

module.exports = router;
