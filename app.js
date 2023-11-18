const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const APPError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
// const sad = require('./dsga');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// setting pug as a server side renderer!
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// setting up static files
app.use(express.static(path.join(__dirname, 'public')));

// using Helmet!
app.use(helmet());

const limitter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many request, please try again later.',
});

app.use('/api', limitter);

/* this is a built-in middleware that uses JSON payload to
parse the request's body */
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against a NoSQL attack
app.use(mongoSanitize());

// Data sanitization against XSS(cross site scripting)
app.use(xss());

// Prevent parameter pollution but with exceptions!
app.use(
  hpp({
    whitelist: [
      'price',
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'maxGroupSize',
    ],
  }),
);

/* just a work around bug fix on windows
  bc the NODE_ENV when used in a block
  it says undefined */
console.log('outside:', process.env.NODE_ENV === 'production');
if (process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'production';
  console.log('inside:', process.env.NODE_ENV === 'production');
}

/* we're using the middlewares here
   this is a third-party middleware,
   i don't want the morgan module
   to run if this is on production
   so i'm using the NODE_ENV to 
   check where i'm currently working on! */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  // console.log('of course we\'re in the development!.');
}

/* and these two under are my own custom build middleware
app.use((req, res, next) => {
    console.log('Hello from the middleware!');
    next();
}); */

/* we add the next argument if it's
our own (custom-build) middleware */
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
// Mounting multiple router using the built-in middleware
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/stats', reviewRouter);

// another router that i'm trying
// app.use(sad);

/* url error handler middleware the all method 
refers to all request method actions */
app.all('*', (req, res, next) => {
  // this next immediately sends it to the error handler middleware
  next(new APPError(`Cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
