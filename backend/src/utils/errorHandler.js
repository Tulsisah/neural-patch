const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: {
      message: isProduction && statusCode >= 500
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error'
    }
  });
};

module.exports = errorHandler;
