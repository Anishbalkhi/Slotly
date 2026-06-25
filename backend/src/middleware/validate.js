const { validationResult } = require('express-validator');

/**
 * Express middleware that checks express-validator results.
 * If errors exist, returns 400 with the first error message.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
      details: errors.array(),
    });
  }
  next();
};

module.exports = validate;
