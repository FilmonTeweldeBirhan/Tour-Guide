// Refactoring codes
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const APPError = require('./../utils/appError');
const {
  deleteOne,
  updateOne,
  create,
  getAll,
  getOne,
} = require('./handleController');
const Review = require('../models/reviewModel');

exports.getCheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.price = { lte: '1500' };
  req.query.sort = 'price,ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// getAll takes only (Model)
exports.getAllTours = getAll(Tour);

// only in the getOne tour
exports.tourPopulator = catchAsync(async (req, res, next) => {
  req.dataModel = await Tour.findById(req.params.id).populate('reviews');
  next();
});

// getOne takes (Model)
exports.getTour = getOne(Tour);

// create takes (Model, message)
exports.createTour = create(Tour, 'inserted new Tour!');

// updateOne takes (Model, message)
exports.updateTour = updateOne(Tour, 'Tour Updated...');

// deleteOne takes (Model, message)
exports.deleteTour = deleteOne(Tour, 'Tour deleted!...');

// AGGREAGATION
exports.tourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  if (!stats) throw new APPError('not found', 404);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    message: 'Tour stats by difficulty...',
    data: {
      stats,
    },
  });
});

exports.planTours = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numOfTours: -1 },
    },
  ]);

  if (!plan) throw new APPError('not found', 404);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    message: 'Tour stats by months...',
    data: {
      plan,
    },
  });
});

// exports.ratings = catchAsync(async (req, res, next) => {
//   const rating = await Review.aggregate([
//     {
//       $match: {},
//     },
//     {
//       $group: {
//         _id: req.params,
//         ratingsAverage: {
//           $avg: '$rating',
//         },
//         ratingsQuantity: {
//           $sum: 1,
//         },
//       },
//     },
//   ]);

//   const tour = await Tour.findById(req.params.id);
//   if (!tour) return next(new APPError('no tours found with that id', 404));

//   tour.ratingsAverage = rating.ratingsAverage;
//   tour.ratingsQuantity = rating.ratingsQuantity;
//   tour.save({ validateBeforeSave: false });

//   next();
// });

// ###########New Untested Codes####################

// getting tours that are with specified coordinates
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // calculating the raduis of the world in km or mi
  // based on the given unit of course!
  const raduis = unit === 'km' ? distance / 6378.1 : distance / 3963.2;

  if (!lat || !lng) {
    return next(
      new APPError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], raduis] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'km' ? 0.001 : 0.000621;

  if (!lat || !lng) {
    return next(
      new APPError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distance,
    },
  });
});
