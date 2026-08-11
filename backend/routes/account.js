const express = require("express");
const { check } = require("express-validator");
const accountController = require("../controllers/accountController");
const auth = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth.protect);

// @route   GET /api/account/balance
// @desc    Get account balance
// @access  Private
router.get("/balance", accountController.getBalance);

// @route   POST /api/account/deposit
// @desc    Deposit money
// @access  Private
router.post(
  "/deposit",
  [check("amount", "Veuillez saisir un montant valide").isFloat({ min: 0.001 })],
  accountController.deposit
);

// @route   POST /api/account/withdraw
// @desc    Withdraw money
// @access  Private
router.post(
  "/withdraw",
  [check("amount", "Veuillez saisir un montant valide").isFloat({ min: 0.001 })],
  accountController.withdraw
);

// @route   POST /api/account/transfer
// @desc    Transfer money to another account
// @access  Private
router.post(
  "/transfer",
  [
    check("amount", "Veuillez saisir un montant valide").isFloat({ min: 0.001 }),
    check(
      "recipientAccountNumber",
      "Le numéro de compte du bénéficiaire est requis"
    ).notEmpty(),
  ],
  accountController.transfer
);

// @route   GET /api/account/transactions
// @desc    Get transaction history
// @access  Private
router.get("/transactions", accountController.getTransactions);

// @route   GET /api/account/transactions/export
// @desc    Export transaction history as CSV
// @access  Private
router.get("/transactions/export", accountController.exportTransactions);

module.exports = router;
