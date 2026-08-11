const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "transfer"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  balanceAfter: {
    type: Number,
    required: true,
  }
});

const accountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Génère un numéro de compte aléatoire
      return 'AC' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [transactionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Vérifie que le solde reste positif (Mongoose 9 : hooks promisifiés)
accountSchema.pre('save', async function() {
  if (this.balance < 0) {
    throw new Error('Le solde ne peut pas être négatif');
  }
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;