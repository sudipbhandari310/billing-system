import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(409, `Duplicate value for ${field}`, err.keyValue);
  }

  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(400, 'Validation error', details);
  }

  if (err && err.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  if (!(error instanceof ApiError)) {
    error = new ApiError(
      error.statusCode || 500,
      error.message || 'Internal Server Error'
    );
  }

  const payload = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
  };
  if (error.details) payload.details = error.details;

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
  }

  res.status(error.statusCode).json(payload);
};

export default errorHandler;