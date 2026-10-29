export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      const formattedErrors = error.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ message: 'Validation failed' }];

      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Invalid input data',
        errors: formattedErrors,
      });
    }
  };
}

export function validateQuery(schema) {
  return validate(schema, 'query');
}

export function validateParams(schema) {
  return validate(schema, 'params');
}
