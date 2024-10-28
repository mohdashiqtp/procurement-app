const express = require('express');
const { body } = require('express-validator');
const authController = require('../controller/authController');
const rateLimiter = require('../middlewares/rateLimiter');
const { validateRequest } = require('../utils/validation');

const router = express.Router();



const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
];


// Routes
router.post('/login', rateLimiter.loginRateLimiter, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authController.getCurrentUser);

module.exports = router;
