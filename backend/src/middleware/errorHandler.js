export function errorHandler(err, req, res, next) {
  console.error('[Backend Error]:', err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'An unexpected internal server error occurred.',
      code: err.code || 'INTERNAL_ERROR',
      status: statusCode
    }
  });
}
