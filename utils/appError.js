class APPError extends Error {
  constructor(message, statusCode) {
    super();
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    /* added message here bc of JS inconsistency
    instead of adding it in the super as an argument */
    this.message = message;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = APPError;
