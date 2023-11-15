const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const APPError = require('../utils/appError');
const {
  deleteOne,
  getAll,
  getOne,
  create,
  updateOne,
} = require('./handleController');

// Filtering unwanted fields
const filterObj = (obj, ...allowed) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach((el) => {
    if (!allowed.includes(el)) {
      delete newObj[el];
    }
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Check if user POSTed password or passwordConfirm
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new APPError(
        `Can't update your password here, for that please checkout this link ${
          req.protocol
        }://${req.get('host')}/api/v1/users/updateMypassword`,
      ),
    );
  }

  // 2) Filtering unwanted field name
  const filteredObj = filterObj(req.body, 'name', 'email');

  // 3) Update the users data
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.deleteMyAcc = catchAsync(async (req, res, next) => {
  if (!req.body.password) {
    return next(new APPError('Enter your password!', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new APPError('Incorrect password!', 401));
  }

  await User.findByIdAndDelete(user._id);

  res.status(204).json({
    status: 'success',
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.getAllUsers = getAll(User);

exports.getUser = getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: `This route is not defined! Please use /signup instead.`,
  });
};

/* Do Not try & change the pwd using the "updateUser" 
bc it won't run the validations from the schema */
exports.updateUser = updateOne(User, `User updated successfully!`);

exports.deleteUser = deleteOne(User, `Deleted user successfully!.`);
