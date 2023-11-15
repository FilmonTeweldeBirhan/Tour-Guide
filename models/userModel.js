const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const moment = require('moment-timezone');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter your email.'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a correct email.'],
    },
    photo: {
      type: String,
      default: 'avatar.png',
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'guide', 'lead-guide', 'admin'],
        message: 'Invalid role.',
      },
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please enter your password.'],
      minlength: [8, 'Password should have 8 or more characters.'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password.'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: "Password didn't match, please enter your password correctly.",
      },
    },
    passwordChangedAt: Date,
    passwordReseter: String,
    passwordReseterExpires: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre('save', async function (next) {
  // check if password is modified or not.
  if (!this.isModified('password')) return next();
  // we don't want to save pwdChangedAt prop. if doc is new
  if (!this.isNew) {
    // changing the passwordChangedAt field
    // substracting 1sec to make sure pwd to be faster than the token
    this.passwordChangedAt = Date.now - 1000;
  }

  // hashing the password
  this.password = await bcrypt.hash(this.password, 12);
  // deleting the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    // console.log(changedTimeStamp, JWTTimeStamp);

    /* if the changedTimeStamp is greater than the iat
    it means that the token was given before the user
    changed his password, so it will return true w/c
    we'll handle this error by saying you've changed 
    you're password so log in again, to get new token! */
    return JWTTimeStamp < changedTimeStamp;
  }

  // false means not changed, it returns false by default
  return false;
};

userSchema.methods.createPwdRestToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordReseter = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordReseterExpires = Date.now() + 10 * 60 * 1000;

  // console.log({ resetToken }, this.passwordReseter);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
