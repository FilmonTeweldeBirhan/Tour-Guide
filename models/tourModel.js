const mongoose = require('mongoose');
const validator = require('validator');
const moment = require('moment-timezone');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less than or equals to 40 characters'],
      minlength: [5, 'A tour must have more than or equals to 5 characters'],
      // validate: [
      //   validator.isAlpha,
      //   "tour name must be letter and doesn't include spaces.",
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above or equal to 1'],
      max: [5, 'Rating must be less than or equal to 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this keyword only points to current doc on NEW document creation
          return val < this.price;
        },
        message: '({VALUE}) must be less than the actual price value.',
      },
    },
    summary: {
      type: String,
      required: [true, 'A Tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have an image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: new Date(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // Geo JSON (it takes longitude, latitude vice versa of maps)
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: ['Point'],
          message: 'Only a value of Point is allowed.',
        },
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: {
            values: ['Point'],
            message: 'Only a value of Point is allowed.',
          },
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Adding index to improve performance
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Adding virtual properties to the schema
tourSchema.virtual('durationWeek').get(function () {
  return (this.duration / 7) * 1;
});

// Adding virtual populate
tourSchema.virtual('reviews', {
  ref: 'review',
  foreignField: 'tourID',
  localField: '_id',
});

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// this is not working for some reason!
// tourSchema.post(/^findOneAnd/, function () {
//   this.slug = slugify(this.name, { lower: true });
// });

/* DOCUMENT MIDDLEWARE: save event runs only on 
  .save() and .create() hence document */
/* runs before .save() and .create() 
    because of the pre method! */
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromise);

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('will save Documents...');
//   next();
// });

// /* runs after .save() and .create()
//     because the post method! */
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// ^ means everything that have find word in it
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  this.find({ secretTour: { $ne: true } });
  // this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   // console.log('query took:', Date.now() - this.start, 'miliseconds');
//   next();
// });

// AGGREGATION MIDDLEWARE:
tourSchema.pre('aggregate', function (next) {
  /* checking if there is a geoNear stage in the pipeline
  so if there is it can skip the "unshift" code
  cause we don't want anything first in our
  pipeline besides the $geoNear if it there ofcourse */
  this.pipeline().forEach((el) => {
    if (el.$geoNear) return next();
  });
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
