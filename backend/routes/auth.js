const express = require("express");
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Le nom est requis").not().isEmpty(),
    check("email", "Veuillez saisir un e-mail valide").isEmail(),
    check(
      "password",
      "Veuillez saisir un mot de passe d'au moins 6 caractères"
    ).isLength({ min: 6 }),
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Veuillez saisir un e-mail valide").isEmail(),
    check("password", "Le mot de passe est requis").exists(),
  ],
  authController.login
);

// @route   GET /api/auth/me
// @desc    Get user profile
// @access  Private
router.get("/me", auth.protect, authController.getMe);

module.exports = router;
