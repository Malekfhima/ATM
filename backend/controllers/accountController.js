const mongoose = require("mongoose");
const Account = require("../models/Account");
const { validationResult } = require("express-validator");

// Montants en TND (millimes) : arrondi à 3 décimales
const roundMoney = (value) => Math.round(parseFloat(value) * 1000) / 1000;

// Libellés français des types de transactions
const TYPE_LABELS = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  transfer: "Virement",
};

// Format CSV compatible Excel français : séparateur ; et virgule décimale.
// 2 décimales minimum, 3 maximum (millimes) — identique à l'affichage de l'app.
const frNumber = (n) => {
  const whole = Math.trunc(n);
  const frac = Math.round(Math.abs(n - whole) * 1000); // millimes 0..999
  let fracStr = String(frac).padStart(3, "0").replace(/0$/, "");
  return `${whole},${fracStr}`;
};

const transactionsToCSV = (transactions) => {
  const header = "Date;Type;Description;Montant;Solde après";

  const rows = transactions.map((t) =>
    [
      new Date(t.date).toISOString(),
      `"${TYPE_LABELS[t.type] || t.type}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      frNumber(t.amount),
      frNumber(t.balanceAfter),
    ].join(";")
  );

  return [header, ...rows].join("\n");
};

// @desc    Get account balance
// @route   GET /api/account/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Compte introuvable" });
    }
    res.json({
      balance: account.balance,
      accountNumber: account.accountNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// @desc    Deposit money
// @route   POST /api/account/deposit
// @access  Private
exports.deposit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const amount = roundMoney(req.body.amount);

  try {
    // Mise à jour atomique : incrémente le solde et ajoute la transaction
    // en une seule opération (aucune perte en cas d'accès concurrent).
    const account = await Account.findOneAndUpdate(
      { user: req.user.id },
      [
        { $set: { balance: { $round: [{ $add: ["$balance", amount] }, 3] } } },
        {
          $set: {
            transactions: {
              $concatArrays: [
                "$transactions",
                [
                  {
                    type: "deposit",
                    amount,
                    description: "Dépôt en espèces",
                    balanceAfter: {
                      $round: [{ $add: ["$balance", amount] }, 3],
                    },
                    date: new Date(),
                  },
                ],
              ],
            },
          },
        },
      ],
      { new: true, updatePipeline: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Compte introuvable" });
    }

    res.json({ message: "Dépôt effectué avec succès", newBalance: account.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// @desc    Withdraw money
// @route   POST /api/account/withdraw
// @access  Private
exports.withdraw = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const amount = roundMoney(req.body.amount);

  try {
    // Mise à jour atomique gardée : ne réussit que si le solde est suffisant,
    // donc des retraits concurrents ne peuvent pas mettre le compte à découvert.
    const account = await Account.findOneAndUpdate(
      { user: req.user.id, balance: { $gte: amount } },
      [
        {
          $set: {
            balance: { $round: [{ $subtract: ["$balance", amount] }, 3] },
          },
        },
        {
          $set: {
            transactions: {
              $concatArrays: [
                "$transactions",
                [
                  {
                    type: "withdrawal",
                    amount,
                    description: "Retrait en espèces",
                    balanceAfter: {
                      $round: [{ $subtract: ["$balance", amount] }, 3],
                    },
                    date: new Date(),
                  },
                ],
              ],
            },
          },
        },
      ],
      { new: true, updatePipeline: true }
    );

    if (!account) {
      const exists = await Account.exists({ user: req.user.id });
      if (!exists) {
        return res.status(404).json({ message: "Compte introuvable" });
      }
      return res.status(400).json({ message: "Fonds insuffisants" });
    }

    res.json({ message: "Retrait effectué avec succès", newBalance: account.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// @desc    Transfer money to another account
// @route   POST /api/account/transfer
// @access  Private
exports.transfer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const amount = roundMoney(req.body.amount);
  const { recipientAccountNumber } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get sender's account
    const senderAccount = await Account.findOne({ user: req.user.id }).session(
      session
    );
    if (!senderAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Votre compte est introuvable" });
    }

    // Check sufficient balance
    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Fonds insuffisants" });
    }

    // Get recipient's account
    const recipientAccount = await Account.findOne({
      accountNumber: recipientAccountNumber.trim().toUpperCase(),
    }).session(session);
    if (!recipientAccount) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "Compte du bénéficiaire introuvable" });
    }

    // Prevent self-transfer
    if (senderAccount._id.toString() === recipientAccount._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Impossible de transférer vers votre propre compte" });
    }

    // Update balances
    senderAccount.balance = roundMoney(senderAccount.balance - amount);
    recipientAccount.balance = roundMoney(recipientAccount.balance + amount);

    // Add transactions to both accounts
    const transferDescription = `Virement vers ${recipientAccount.accountNumber}`;
    const receivedDescription = `Virement de ${senderAccount.accountNumber}`;

    senderAccount.transactions.push({
      type: "transfer",
      amount,
      description: transferDescription,
      balanceAfter: senderAccount.balance,
    });

    recipientAccount.transactions.push({
      type: "deposit",
      amount,
      description: receivedDescription,
      balanceAfter: recipientAccount.balance,
    });

    // Save both accounts
    await senderAccount.save({ session });
    await recipientAccount.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Virement effectué avec succès",
      newBalance: senderAccount.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Erreur serveur pendant le virement" });
  }
};

// @desc    Get transaction history
// @route   GET /api/account/transactions?limit=50
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Compte introuvable" });
    }

    const requested = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 1), 500)
      : 100;

    // Sort transactions by date in descending order (newest first)
    const transactions = account.transactions
      .slice()
      .sort((a, b) => b.date - a.date)
      .slice(0, limit);

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// @desc    Export transaction history as CSV
// @route   GET /api/account/transactions/export
// @access  Private
exports.exportTransactions = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Compte introuvable" });
    }

    const transactions = account.transactions
      .slice()
      .sort((a, b) => b.date - a.date);

    const csv = transactionsToCSV(transactions);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transactions-${account.accountNumber}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
