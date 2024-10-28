const Joi = require('joi');
const { validationResult} = require('express-validator')


// validation request
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
  validateRequest
};

