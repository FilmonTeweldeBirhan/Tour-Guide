const express = require('express');
const Tour = require('./../models/tourModel');
const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const APPError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const {
  deleteOne,
  getAll,
  create,
  updateOne,
  getOne,
} = require('./handleController');

exports.setReviewIDs = (req, res, next) => {
  req.body.tourID = req.params.id;
  req.body.userID = req.user.id;
  req.body.id = req.params.reviewID;

  // req.sanitizedInput = {
  //   tourID: req.params.id,
  //   userID: req.user.id,
  //   id: req.params.reviewID,
  //   review: req.body.review,
  //   rating: req.body.rating,
  // };

  next();
};

exports.tourExists = catchAsync(async (req, res, next) => {
  const tourExists = await Tour.findById(req.params.id);
  if (!tourExists)
    return next(new APPError(`Can't review a tour that doesn't exit`, 400));

  next();
});

// exports.reviewExists = catchAsync(async (req, res, next) => {
//   const reviewExists = await Review.find({
//     tourID: req.params.id,
//     userID: req.user.id,
//   });
//   console.log(reviewExists);

//   if (reviewExists.length > 0)
//     return next(
//       new APPError(
//         `Can't create another review because you already have a review.`,
//         400,
//       ),
//     );

//   next();
// });

exports.OnlyAdminCanDoAll = catchAsync(async (req, res, next) => {
  let reviewFilter = req.body.id;
  if (!reviewFilter) {
    reviewFilter = req.params.reviewID;
  }
  const review = await Review.findById(reviewFilter);
  if (!review) return next(new APPError(`No review found with that id.`));

  if (req.user.role === 'admin') {
    return next();
  } else if (review.userID.id !== req.user.id) {
    return next(
      new APPError(`You have no access, because this is not your review`, 403),
    );
  }

  next();
});

exports.createReview = create(Review, 'comment posted', 404);

exports.getAllReviews = getAll(Review, 'no reviews yet, be the first one...');

exports.getReview = getOne(Review);

exports.updateReview = updateOne(Review, 'comment updated!.');

exports.deleteReview = deleteOne(Review);
