const crypto = require('crypto');
const { promisify } = require('util');
const APIFeatures = require('./../utils/apiFeatures');
const APPError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message = '') => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secret = true;
  }

  res.cookie('natoursJWT', token, cookieOptions);

  let data = {
    status: 'success',
    token,
  };

  if (message !== '') {
    data.message = message;
  }

  res.status(statusCode).json(data);
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, photo, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name,
    email,
    photo,
    password,
    passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if the password and email exists in the input
  if (!email || !password) {
    return next(new APPError('Please provide email and password', 400));
  }

  // 2) check if user exits and if the pass is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new APPError('Incorrect email or password', 401));
  }

  // 3) if all passed create JWT signiture
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('natoursJWT', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success', message: 'Logging out' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.natoursJWT) {
    token = req.cookies.natoursJWT;
  }

  // console.log(req.headers.authorization);

  if (!token) {
    return next(
      new APPError(
        'You are not logged in, please log in first to get access',
        401,
      ),
    );
  }

  // 2) Verification token with the original signiture
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new APPError(
        'The user belonging to this token does no longer exists',
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new APPError(
        'You recently changed your password, Please log in again.',
        401,
      ),
    );
  }

  // Grant Access if the code reaches here!
  req.user = currentUser;
  res.locals.user = currentUser;

  // console.log(req.user);
  next();
});

// Only to check if user is logged in or not, no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1) Getting token from the cookie and check if it's there
    if (req.cookies.natoursJWT) {
      // cookie-parser parses cookies into req Object
      // same as the body parser but for cookies
      let cookieToken = req.cookies.natoursJWT;

      // 2) Verification token with the original signiture
      const decoded = await promisify(jwt.verify)(
        cookieToken,
        process.env.JWT_SECRET,
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // Loggedin if code reaches here!
      res.locals.user = currentUser;

      return next();
    }
  } catch (error) {
    return next();
  }

  next();
};

// restricting some route only for admin and lead-guide
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // If the logged in person is not admin || lead-guide
    if (!roles.includes(req.user.role)) {
      return next(
        new APPError(
          "You don't have the permission to perform this action.",
          403,
        ),
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) check if the user with the "email" exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new APPError('No user found with that email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPwdRestToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forgot your password, please just go ahead and ignore this message!.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token, valid only for 10 min.',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token was sent to your email!',
    });
  } catch (error) {
    user.passwordReseter = undefined;
    user.passwordReseterExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new APPError('There was an error when sending the email, try again', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get the user based on the given token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) check if token has expired, and there is user, then set new pwd

  // find a user with the given token and whose token didn't expired!
  const user = await User.findOne({
    passwordReseter: hashedToken,
    passwordReseterExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new APPError('Token is invalid or has already expired!', 400));
  }

  // setting the new pwd and deleting the token
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordReseter = undefined;
  user.passwordReseterExpires = undefined;
  // then save it in to the database
  // the .save() also checks for validation
  // bc we set it validations in the model
  await user.save();

  // 4) Log the user in by sending the JWT token
  const token = createSendToken(user._id, 200, res, 'welcome back!');
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findOne({ email: req.user.email }).select(
    '+password',
  );

  // 2) Check if POSTed curr pwd is correct
  const currPwd = req.body.password;
  const newPwd = req.body.newPassword;
  const newPwdConfirm = req.body.newPasswordConfirm;

  if (!newPwd || !newPwdConfirm || !currPwd) {
    return next(new APPError('Please fill all fields.', 400));
  }

  // console.log(user.correctPassword(currPwd, user.password));

  if (!(await user.correctPassword(currPwd, user.password))) {
    return next(new APPError('Your current password is wrong.', 401));
  }

  // 3) If passed, update pwd
  user.password = newPwd;
  user.passwordConfirm = newPwdConfirm;
  // then saving it to the database
  await user.save();

  // 4) Log user in, by sending JWT token
  createSendToken(user, 200, res);
});
