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
  },
  relatedAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
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

// Corrigez le middleware de validation
accountSchema.pre('save', function(next) {
  if (this.balance < 0) {
    const err = new Error('Le solde ne peut pas être négatif');
    return next(err);
  }
  next();
});

// Méthode pour ajouter une transaction
accountSchema.methods.addTransaction = async function(transactionData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Mettre à jour le solde
    if (transactionData.type === 'deposit') {
      this.balance += transactionData.amount;
    } else if (transactionData.type === 'withdrawal' || transactionData.type === 'transfer') {
      if (this.balance < transactionData.amount) {
        throw new Error('Fonds insuffisants');
      }
      this.balance -= transactionData.amount;
    }

    // Ajouter la transaction
    transactionData.balanceAfter = this.balance;
    this.transactions.push(transactionData);
    
    await this.save({ session });
    await session.commitTransaction();
    return this;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;