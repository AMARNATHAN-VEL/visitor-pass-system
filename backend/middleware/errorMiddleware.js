const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode =
    error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let errorMessage = error.message || "Internal server error";

  if (error.name === "ValidationError") {
    statusCode = 400;
    errorMessage = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(", ");
  } else if (error.name === "CastError") {
    statusCode = 400;
    errorMessage = `Invalid ${error.path}`;
  } else if (error.code === 11000) {
    statusCode = 409;
    errorMessage = "A record with the same unique value already exists";
  }

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: errorMessage,
    data: null,
  });
};

module.exports = { notFound, errorHandler };
