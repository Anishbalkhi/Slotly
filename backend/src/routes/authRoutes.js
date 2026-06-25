const express = require('express');
const { signup, login, signupValidation, loginValidation } = require('../controllers/authController');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signupValidation, validate, signup);

// POST /api/auth/login
router.post('/login', loginValidation, validate, login);

module.exports = router;
