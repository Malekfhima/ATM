const Account = require("../models/Account");
const User = require("../models/User");

// @desc    Get account balance
// @route   GET /api/account/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json({ balance: account.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Deposit money
// @route   POST /api/account/deposit
// @access  Private
exports.deposit = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Please enter a valid amount" });
  }

  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update balance
    account.balance += parseFloat(amount);

    // Add transaction
    account.transactions.push({
      type: "deposit",
      amount: parseFloat(amount),
      description: "Cash deposit",
      balanceAfter: account.balance,
    });

    await account.save();

    res.json({
      message: "Deposit successful",
      newBalance: account.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Withdraw money
// @route   POST /api/account/withdraw
// @access  Private
exports.withdraw = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Please enter a valid amount" });
  }

  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Check sufficient balance
    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Update balance
    account.balance -= parseFloat(amount);

    // Add transaction
    account.transactions.push({
      type: "withdrawal",
      amount: parseFloat(amount),
      description: "Cash withdrawal",
      balanceAfter: account.balance,
    });

    await account.save();

    res.json({
      message: "Withdrawal successful",
      newBalance: account.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Transfer money to another account
// @route   POST /api/account/transfer
// @access  Private
exports.transfer = async (req, res) => {
  const { amount, recipientAccountNumber } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Please enter a valid amount" });
  }

  if (!recipientAccountNumber) {
    return res
      .status(400)
      .json({ message: "Recipient account number is required" });
  }

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
      return res.status(404).json({ message: "Your account not found" });
    }

    // Check sufficient balance
    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Get recipient's account
    const recipientAccount = await Account.findOne({
      accountNumber: recipientAccountNumber,
    }).session(session);
    if (!recipientAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Recipient account not found" });
    }

    // Prevent self-transfer
    if (senderAccount._id.toString() === recipientAccount._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Cannot transfer to the same account" });
    }

    // Update balances
    senderAccount.balance -= parseFloat(amount);
    recipientAccount.balance += parseFloat(amount);

    // Add transactions to both accounts
    const transferDescription = `Transfer to ${recipientAccount.accountNumber}`;
    const receivedDescription = `Transfer from ${senderAccount.accountNumber}`;

    senderAccount.transactions.push({
      type: "transfer",
      amount: parseFloat(amount),
      description: transferDescription,
      balanceAfter: senderAccount.balance,
    });

    recipientAccount.transactions.push({
      type: "deposit",
      amount: parseFloat(amount),
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
      message: "Transfer successful",
      newBalance: senderAccount.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Server error during transfer" });
  }
};

// @desc    Get transaction history
// @route   GET /api/account/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Sort transactions by date in descending order (newest first)
    const transactions = account.transactions.sort((a, b) => b.date - a.date);

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
