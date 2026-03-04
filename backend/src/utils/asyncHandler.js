export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch((error) => {
      // Log the error for debugging
      console.error('Async Handler Error:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        params: req.params,
        query: req.query
      });
      
      // Pass to error middleware
      next(error);
    });
};