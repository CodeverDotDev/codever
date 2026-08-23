const express = require('express');
const helmet = require('helmet');
require('express-async-errors');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const apiBasePathRouter = require('./routes');
const versionRouter = require('./routes/version/version');
const userRouter = require('./routes/users/user.router');
const webPageInfoRouter = require('./routes/webpage-info/webpage-info.router');
const featureToggleRouter = require('./routes/feature-toggle/feature-toggle.router');
const adminRouter = require('./routes/admin/admin.router');
const publicBookmarksRouter = require('./routes/public/public-bookmarks.router');
const feedbackRouter = require('./routes/public/feedback/feedback.router');
const publicNotesRouter = require('./routes/public/public-notes.router');
const publicSearchRouter = require('./routes/public/public-search.router');
const publicUsersRouter = require('./routes/public/public-users.router');
const { MongoError } = require('mongodb');
const ValidationError = require('./error/validation.error');
const NotFoundError = require('./error/not-found.error');
const PublicBookmarkExistingError = require('./error/public-bookmark-existent.error');
const UseridValidationError = require('./routes/users/userid-validation.error');

const fs = require('fs-extra');
const rfs = require('rotating-file-stream/index');

const HttpStatus = require('http-status-codes/index');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/openapi/openapi.yaml');

const app = express();

// Sets "Strict-Transport-Security: max-age=5184000; includeSubDomains".
const sixtyDaysInSeconds = 5184000;
app.use(
  helmet.hsts({
    maxAge: sixtyDaysInSeconds,
  })
);
app.disable('x-powered-by');

const mongoUserName = process.env.MONGODB_BOOKMARKS_USERNAME || 'bookmarks';
const mongoUserPwd = process.env.MONGODB_BOOKMARKS_PASSWORD || 'secret';
const mongoBookmarksCollectionName =
  process.env.MONGODB_BOOKMARKS_COLLECTION || 'dev-bookmarks';
const mongoHost = process.env.MONGODB_HOST || 'localhost';
const mongoPort = process.env.MONGODB_PORT || '27017';

const mongoUrl = `mongodb://${mongoUserName}:${mongoUserPwd}@${mongoHost}:${mongoPort}/${mongoBookmarksCollectionName}`;
mongoose.connect(mongoUrl);

// sets port 3000 to default or unless otherwise specified in the environment
app.set('port', process.env.PORT || 3000);

let setUpLogging = function () {
  const logDirectory = (process.env.CONTAINER_HOME || '.') + '/log';
  // ensure log directory exists
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
  // create a rotating write stream
  let accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory,
  });
  app.use(logger('combined', { stream: accessLogStream })); // logs in file in Apache style format
  app.use(logger('dev')); // logs at the console in 'dev' format
};

setUpLogging();

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); //swagger docs are not protected

// Raised from the default 100kb to support Jupyter notebook uploads (up to 5 MB).
// IMPORTANT: if a reverse proxy (e.g. nginx) sits in front of this server, its own
// body-size limit must also be raised.  For nginx add to server/location block:
//   client_max_body_size 6m;
app.use(bodyParser.json({ limit: '6mb' }));
app.use(bodyParser.urlencoded({ limit: '6mb', extended: false }));

app.set('trust proxy', 'loopback');

//add CORS support
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Location'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Type, Authorization, Location'
  );
  next();
});

app.use('/api', apiBasePathRouter);
app.use('/api/version', versionRouter);
app.use('/api/public/users', publicUsersRouter);
app.use('/api/public/bookmarks', publicBookmarksRouter);
app.use('/api/public/feedback', feedbackRouter);
app.use('/api/public/notes', publicNotesRouter);
app.use('/api/public/search-results', publicSearchRouter);
app.use('/api/personal/users', userRouter);
app.use('/api/webpage-info', webPageInfoRouter);
app.use('/api/feature-toggle', featureToggleRouter);
app.use('/api/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = HttpStatus.NOT_FOUND;
  next(err);
});

// error handlers
app.use(function handleNotFoundError(error, req, res, next) {
  if (error instanceof NotFoundError) {
    return res.status(HttpStatus.NOT_FOUND).send({
      httpStatus: HttpStatus.NOT_FOUND,
      message: error.message,
      stack: app.get('env') === 'development' ? error.stack : {},
    });
  }
  next(error);
});

app.use(function handlePublicBookmarkExistingError(error, req, res, next) {
  if (error instanceof PublicBookmarkExistingError) {
    return res.status(HttpStatus.CONFLICT).send({
      httpStatus: HttpStatus.CONFLICT,
      message: error.message,
      stack: app.get('env') === 'development' ? error.stack : {},
    });
  }
  next(error);
});

app.use(function handleUserIdValidationError(error, req, res, next) {
  if (error instanceof UseridValidationError) {
    res.status(HttpStatus.UNAUTHORIZED);
    return res.send({
      httpStatus: HttpStatus.UNAUTHORIZED,
      message: error.message,
      stack: app.get('env') === 'development' ? error.stack : {},
    });
  }
  next(error);
});

app.use(function handleValidationError(error, request, response, next) {
  if (error instanceof ValidationError) {
    return response.status(HttpStatus.BAD_REQUEST).json({
      httpStatus: HttpStatus.BAD_REQUEST,
      message: error.message,
      validationErrors: error.validationErrors,
      stack: app.get('env') === 'development' ? error.stack : {},
    });
  }
  next(error);
});

app.use(function handleDatabaseError(error, request, response, next) {
  if (error instanceof MongoError) {
    if (error.code === 11000) {
      return response.status(HttpStatus.CONFLICT).json({
        httpStatus: HttpStatus.CONFLICT,
        type: 'MongoError',
        message: error.message,
        stack: app.get('env') === 'development' ? error.stack : {},
      });
    } else {
      return response.status(503).json({
        httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
        type: 'MongoError',
        message: error.message,
        stack: app.get('env') === 'development' ? error.stack : {},
      });
    }
  }
  next(error);
});

// production error handler
// no stacktraces leaked to user
app.use(function (error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    // Multer error - see https://github.com/expressjs/multer/blob/master/lib/multer-error.js && https://github.com/expressjs/multer#error-handling
    return res.status(HttpStatus.BAD_REQUEST).json({
      httpStatus: HttpStatus.BAD_REQUEST,
      message: error.code + ' ' + error.message,
      stack: app.get('env') === 'development' ? error.stack : {},
    });
  } else {
    res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    res.send({
      message: error.message,
      stack: app.get('env') === 'development' ? error.stack : {},
    });
  }
});

module.exports = app;
