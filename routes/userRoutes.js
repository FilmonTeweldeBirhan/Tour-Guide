const express = require('express');
const {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout,
} = require('./../controllers/authController');

const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMyAcc,
  getMe,
} = require('./../controllers/userController');

// refactoring the routes
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Middleware runs in sequence so we are using protect
// to protect all the routes after this middleware
router.use(protect);

router.patch('/updateMe', updateMe);
router.patch('/updateMyPassword', updatePassword);
router.delete('/deleteMyAcc', deleteMyAcc);

router.get('/me', getMe, getUser);

// Samething with the restrictTo instead of repeating
// it we use it only once then all rotues after this
// will be restricted!
router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllUsers).post(createUser);

// GET    /api/v1/users/413121
// PATCH  /api/v1/users/413121
// DELETE /api/v1/users/413121
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
