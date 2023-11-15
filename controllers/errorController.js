const APPError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new APPError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Looping through objects values
  const keyValue = Object.values(err.keyValue);
  // outputing a message that goes to the APPError Object constructor
  const message = `Duplicated field value: '${keyValue}' is taken, please use another value instead.`;
  return new APPError(message, 400);
};

const handleValidatorErrorDB = (err) => {
  const message = `${err.message}`;
  return new APPError(message, 400);
};

const handleJWTError = () =>
  new APPError('Invalid token, Please log in again', 401);

const handleJWTExpiredError = () =>
  new APPError('Token has expired, Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // FOR RENDERED PAGE ONLY!
  return res.status(err.statusCode).render('error', {
    title: 'Error 💥',
    status: err.statusCode,
    message: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // if there is an unknown error
    // console.log('ERROR 💥:', err);
    return res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  } else {
    // FOR RENDERED PAGE ONLY!
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Error 💥',
        status: err.statusCode,
        message: err.message,
      });
    }

    return res.status(err.statusCode).render('error', {
      title: 'Error 💥',
      status: 500,
      message: 'Uh oh! Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'Unknown';

  let error = { ...err };

  if (err.name === 'CastError') {
    error = handleCastErrorDB(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidatorErrorDB(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else {
    error = err;
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, req, res);
  }
};
