const catchAsync = require('./../utils/catchAsync');
const APPError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const Review = require('./../models/reviewModel');
const User = require('./../models/userModel');
const APIFeatures = require('./../utils/apiFeatures');
const slugify = require('slugify');

// Helper function to know what kind of model
// are going to be in the responses' data Object!
const dataIdentifier = (Model, modelType) => {
  const data = {};
  if (Model === Tour) {
    modelType.length > 1 ? (data.tours = modelType) : (data.tour = modelType);
  } else if (Model === User) {
    modelType.length > 1 ? (data.users = modelType) : (data.user = modelType);
  } else if (Model === Review) {
    modelType.length > 1
      ? (data.reviews = modelType)
      : (data.review = modelType);
  }

  return data;
};

// Refactoring the "controllers" to achieve DRY!.
exports.getAll = (Model, message) => {
  return catchAsync(async (req, res, next) => {
    // using the created class by initialising it
    let features, allDoc;
    // console.log(req.params.id);
    if (Model === Review && req.params.id) {
      // allDoc = await Model.find({ tourID: req.params.id });
      features = new APIFeatures(
        Model.find({ tourID: req.params.id }),
        req.query,
      )
        .filter()
        .sort()
        .limitFields()
        .pagination();

      // EXECUTE THE QUERY
      allDoc = await features.query;
    } else {
      features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

      // EXECUTE THE QUERY
      allDoc = await features.query;
    }

    if (Model === Review) {
      if (allDoc.length === 0) {
        return res.status(200).json({
          status: 'success',
          message,
        });
      }
    }

    const data = dataIdentifier(Model, allDoc);

    // SENDING A RESPONSE
    res.status(200).json({
      status: 'success',
      results: allDoc.length,
      data,
    });
  });
};

exports.getOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    let doc;
    if (Model === Review) {
      doc = await Model.findById(req.body.id);
    } else if (Model === Tour) {
      doc = req.dataModel;
    } else {
      doc = await Model.findById(req.params.id);
    }

    if (!doc) throw new APPError('document not found.', 404);

    const data = dataIdentifier(Model, doc);

    res.status(200).json({
      status: 'success',
      result: 'found',
      data,
    });
  });
};

exports.create = (Model, message, statusCode) => {
  return catchAsync(async (req, res, next) => {
    const created = await Model.create(req.body);

    const data = dataIdentifier(Model, created);

    if (Model === Review && !data) {
      return next(new APPError("Can't create review", statusCode));
    }

    res.status(201).json({
      status: 'success',
      message,
      data,
    });
  });
};

exports.updateOne = (Model, message = '') => {
  return catchAsync(async (req, res, next) => {
    let updated;
    if (Model === Review) {
      req.params.id = req.params.reviewID;
      updated = await Model.findById(req.params.id);

      updated.review = req.body.review || updated.review;
      updated.rating = req.body.rating || updated.rating;
      updated.save();
    } else {
      // creating a slug when updating tour
      if (req.body.name && Model === Tour) {
        req.body.slug = slugify(req.body.name, { lower: true });
      }
      // console.log(req.body);

      updated = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    if (Model === Review) {
      Review.calculateRating(updated.tourID);
    }

    if (!updated) throw new APPError('file not found', 404);

    const data = dataIdentifier(Model, updated);

    res.status(200).json({
      status: 'success',
      message,
      data,
    });
  });
};

exports.deleteOne = (Model, message = '') => {
  return catchAsync(async (req, res, next) => {
    // Generating different errMsg & statusCode for d/t models
    let ErrorMessage, statusCode;
    if (Model === Review) {
      ErrorMessage = `No review found with that ID`;
      statusCode = 400;
      req.params.id = req.body.id;
    } else if (Model === Tour) {
      ErrorMessage = `not found`;
      statusCode = 404;
    } else if (Model === User) {
      ErrorMessage = `no user found with that ID!.`;
      statusCode = 404;

      const userRole = await Model.findById(req.params.id);
      if (!userRole) return next(new APPError(ErrorMessage, statusCode));
      /* setting some rules like
           -Admin can't be deleted  
           -lead-guide can't delete another
            lead-guide, only an admin can
        */
      if (userRole.role === 'admin') {
        return next(new APPError(`You can't delete an ADMIN!.`, 403));
      } else if (userRole.role === 'lead-guide' && req.user.role !== 'admin') {
        return next(new APPError(`Only an admin can delete lead-guide!`, 403));
      }
    }
    // console.log(req.params);
    const deleted = await Model.findByIdAndDelete(req.params.id);

    if (Model === Review) {
      Review.calculateRating(deleted.tourID);
    }

    if (!deleted) return next(new APPError(ErrorMessage, statusCode));

    res.status(204).json({
      status: 'success',
      message,
      data: null,
    });
  });
};
