const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getCheapTours,
  tourStats,
  planTours,
  ratings,
  tourPopulator,
  getToursWithin,
  getDistance,
} = require('./../controllers/tourController');

const { protect, restrictTo } = require('../controllers/authController');

const reviewRouter = require('./../routes/reviewRouter');
const { setReviewIDs } = require('../controllers/reviewController');

// refactoring the routes by using mounting
const router = express.Router();

// using the param middleware for checking
// router.param('id', checkId);

// aliasing tour
router.route('/top5-cheap-tours').get(getCheapTours, getAllTours);

// aggregated result
router.route('/tour-stats').get(tourStats);
router
  .route('/tour-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guides'), planTours);

// calculating the tours within specified distance!
router
  .route('/tours-within/distance/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

// calculating the distance to each tours
router.route('/distance/:latlng/unit/:unit').get(getDistance);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(tourPopulator, getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

// Using router.use() inorder to seperate reviews from the tour
// in other word mounting it twice!
// /api/v1/tours + /:tourID/reviews
router.use('/:id/reviews', reviewRouter);

// router
//   .route('/:tourID/reviews')
//   .post(protect, restrictTo('user'), createReview)
//   .get(protect, getAllReview);

module.exports = router;
