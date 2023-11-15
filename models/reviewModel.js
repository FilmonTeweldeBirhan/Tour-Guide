const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    // The tourID and userID are refered by the reviewSchema!
    tourID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },

    userID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },

    review: {
      type: String,
      required: [true, 'Reveiw can not be empty.'],
    },
    rating: {
      type: Number,
      max: [5, 'Rating can not be above 5'],
      min: [1, 'Rating can not be below 1'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userID',
    select: 'name photo',
  });

  // .populate({
  //   path: 'tourID',
  //   select: 'name',
  // });

  next();
});

// Used index with unique so that no duplicate
// documents happens with tour and user
reviewSchema.index({ tourID: 1, userID: 1 }, { unique: true });

reviewSchema.statics.calculateRating = async function (tourID) {
  // aggregating the reviews
  const stats = await this.aggregate([
    {
      $match: { tourID },
    },
    {
      $group: {
        _id: '$tourID',
        numReview: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  if (stats.length > 0) {
    // storing the calculated result in the tours
    await Tour.findByIdAndUpdate(tourID, {
      ratingsQuantity: stats[0].numReview,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

// the post method doesn't accept the next function like pre
reviewSchema.post('save', function () {
  // this points to the current review
  this.constructor.calculateRating(this.tourID);
});

/* This code didn't work for me, saying you
executed the query twice so i used other solution
at the expense of DRY */
// the pre method works with query unlike the post method
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.rev = await this.findOne();

//   console.log(this.rev);

//   next();
// });

// reviewSchema.post(/^findOneAnd/, async function () {
//   await this.rev.constructor.calculateRating(this.rev.tourID);
// });

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;
