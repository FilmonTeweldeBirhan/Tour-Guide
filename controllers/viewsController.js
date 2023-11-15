const APPError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get specific tour data from collection
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating',
  });

  if (!tour) return next(new APPError(`There is no tour with that name`, 404));

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLogin = (req, res) => {
  res.status(200).render('login', {
    title: 'Log in to your account',
  });
};

exports.aboutMe = (req, res) => {
  res.status(200).render('account', {
    title: 'Manage Account',
  });
};
