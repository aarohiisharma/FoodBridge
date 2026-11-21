const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(validations) {
  return async (request, response, next) => {
    await Promise.all(validations.map((validation) => validation.run(request)));

    const result = validationResult(request);
    if (result.isEmpty()) {
      next();
      return;
    }

    next(
      new AppError(
        'Validation failed',
        422,
        result.array().map(({ msg, path, location }) => ({ message: msg, field: path, location })),
      ),
    );
  };
}

module.exports = validate;
