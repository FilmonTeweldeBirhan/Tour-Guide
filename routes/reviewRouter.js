const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setReviewIDs,
  getReview,
  tourExists,
  OnlyAdminCanDoAll,
  reviewExists,
} = require('./../controllers/reviewController');

// Used the mergeParams inorder to keep the params in this too!
const router = express.Router({ mergeParams: true });

// POST /tours/6214621/reviews
// GET  /tours/6214621/reviews
router
  .route('/')
  .post(protect, restrictTo('user'), setReviewIDs, tourExists, createReview)
  .get(getAllReviews);

// Using the protect middleware inorder to protect
// all routes after this middleware itself!!!
router.use(protect);

// GET    /tours/6214621/reviews/434734
// PATCH  /tours/6214621/reviews/434734
// DELETE /tours/6214621/reviews/434734
router
  .route('/:reviewID')
  .get(setReviewIDs, getReview)
  .patch(
    restrictTo('user', 'admin'),
    setReviewIDs,
    OnlyAdminCanDoAll,
    updateReview,
  )
  .delete(
    restrictTo('user', 'admin'),
    setReviewIDs,
    OnlyAdminCanDoAll,
    deleteReview,
  );

// TODO implement the stats/reviews route problem!

// or go straight from /stats + /reviews path (not nested)
router.route('/reviews').get(restrictTo('admin', 'lead-guide'), getAllReviews);

// /stats + /reviews/434734
router
  .route('/reviews/:id')
  .get(restrictTo('admin', 'lead-guide'), getReview)
  .patch(restrictTo('admin'), updateReview)
  .delete(restrictTo('admin'), deleteReview);

module.exports = router;
