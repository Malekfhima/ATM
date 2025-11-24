// DOM Elements
const authSection = document.getElementById("auth-section");
const atmSection = document.getElementById("atm-section");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const depositForm = document.getElementById("deposit-form");
const withdrawForm = document.getElementById("withdraw-form");
const transferForm = document.getElementById("transfer-form");
const logoutBtn = document.getElementById("logout-btn");
const userNameElement = document.getElementById("user-name");
const accountNumberElement = document.getElementById("account-number");
const balanceElement = document.getElementById("balance");
const transactionsList = document.getElementById("transactions-list");
const toast = document.getElementById("toast");

// State
let currentUser = null;
let token = localStorage.getItem("token");

// API Base URL
const API_URL = "http://localhost:5000/api";

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  if (token) {
    fetchUserProfile();
  } else {
    showAuthSection();
  }

  // Tab switching
  setupTabs();

  // Form submissions
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (depositForm) depositForm.addEventListener("submit", handleDeposit);
  if (withdrawForm) withdrawForm.addEventListener("submit", handleWithdraw);
  if (transferForm) transferForm.addEventListener("submit", handleTransfer);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
});

// Tab switching functionality
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      // Update active tab button
      document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show corresponding tab content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add("active");

        // If transactions tab is clicked, load transactions
        if (tabId === "transactions") {
          loadTransactions();
        }
      }

      // Special handling for auth tabs
      if (tabId === "login" || tabId === "register") {
        document.getElementById("login-form").style.display =
          tabId === "login" ? "block" : "none";
        document.getElementById("register-form").style.display =
          tabId === "register" ? "block" : "none";
      }
    });
  });
}

// Show authentication section
function showAuthSection() {
  authSection.style.display = "block";
  atmSection.style.display = "none";
}

// Show ATM section
function showAtmSection() {
  authSection.style.display = "none";
  atmSection.style.display = "block";
}

// Show toast notification
function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// Fetch user profile
async function fetchUserProfile() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const userData = await response.json();
    currentUser = userData;
    updateUI();
    showAtmSection();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    localStorage.removeItem("token");
    showAuthSection();
  }
}

// Update UI with user data
function updateUI() {
  if (!currentUser) return;

  userNameElement.textContent = currentUser.name;
  accountNumberElement.textContent = `Account: ${
    currentUser.account?.accountNumber || "N/A"
  }`;
  updateBalance();
}

// Update balance display
async function updateBalance() {
  try {
    const response = await fetch(`${API_URL}/account/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch balance");
    }

    const data = await response.json();
    balanceElement.textContent = `$${data.balance.toFixed(2)}`;
  } catch (error) {
    console.error("Error updating balance:", error);
    showToast("Failed to update balance", "error");
  }
}

// Load transactions
async function loadTransactions() {
  try {
    const response = await fetch(`${API_URL}/account/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load transactions");
    }

    const transactions = await response.json();
    displayTransactions(transactions);
  } catch (error) {
    console.error("Error loading transactions:", error);
    showToast("Failed to load transactions", "error");
  }
}

// Display transactions in the UI
function displayTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    transactionsList.innerHTML =
      '<div class="no-transactions">No transactions found</div>';
    return;
  }

  transactionsList.innerHTML = transactions
    .map(
      (transaction) => `
        <div class="transaction-item">
            <div>
                <span class="transaction-type transaction-${
                  transaction.type
                }">${transaction.type}</span>
                <div class="transaction-description">${
                  transaction.description || "Transaction"
                }</div>
                <div class="transaction-date">${new Date(
                  transaction.date
                ).toLocaleString()}</div>
            </div>
            <div class="transaction-amount ${
              transaction.amount < 0 ? "text-danger" : "text-success"
            }">
                ${transaction.amount < 0 ? "-" : "+"}$${Math.abs(
        transaction.amount
      ).toFixed(2)}
            </div>
        </div>
    `
    )
    .join("");
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Save token and user data
    token = data.token;
    localStorage.setItem("token", token);
    currentUser = data;

    // Update UI and show ATM section
    updateUI();
    showAtmSection();
    showToast("Login successful", "success");

    // Reset form
    e.target.reset();
  } catch (error) {
    console.error("Login error:", error);
    showToast(error.message || "Login failed", "error");
  }
}

// Handle registration
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // Auto-login after registration
    token = data.token;
    localStorage.setItem("token", token);
    currentUser = data;

    // Update UI and show ATM section
    updateUI();
    showAtmSection();
    showToast("Registration successful", "success");

    // Switch to login tab and reset form
    document.querySelector('[data-tab="login"]').click();
    e.target.reset();
  } catch (error) {
    console.error("Registration error:", error);
    showToast(error.message || "Registration failed", "error");
  }
}

// Handle deposit
async function handleDeposit(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("deposit-amount").value);

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/account/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Deposit failed");
    }

    // Update balance and show success message
    updateBalance();
    showToast(`Successfully deposited $${amount.toFixed(2)}`, "success");

    // Reset form
    e.target.reset();
  } catch (error) {
    console.error("Deposit error:", error);
    showToast(error.message || "Deposit failed", "error");
  }
}

// Handle withdrawal
async function handleWithdraw(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("withdraw-amount").value);

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/account/withdraw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Withdrawal failed");
    }

    // Update balance and show success message
    updateBalance();
    showToast(`Successfully withdrew $${amount.toFixed(2)}`, "success");

    // Reset form
    e.target.reset();
  } catch (error) {
    console.error("Withdrawal error:", error);
    showToast(error.message || "Withdrawal failed", "error");
  }
}

// Handle transfer
async function handleTransfer(e) {
  e.preventDefault();

  const recipientAccountNumber =
    document.getElementById("recipient-account").value;
  const amount = parseFloat(document.getElementById("transfer-amount").value);

  if (!recipientAccountNumber) {
    showToast("Please enter recipient account number", "error");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/account/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        recipientAccountNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Transfer failed");
    }

    // Update balance and show success message
    updateBalance();
    showToast(
      `Successfully transferred $${amount.toFixed(
        2
      )} to account ${recipientAccountNumber}`,
      "success"
    );

    // Reset form
    e.target.reset();
  } catch (error) {
    console.error("Transfer error:", error);
    showToast(error.message || "Transfer failed", "error");
  }
}

// Handle logout
function handleLogout() {
  // Clear token and user data
  localStorage.removeItem("token");
  token = null;
  currentUser = null;

  // Show auth section
  showAuthSection();

  // Reset forms
  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();

  showToast("Successfully logged out", "success");
}

// Add some CSS classes for transaction types
document.head.insertAdjacentHTML(
  "beforeend",
  `
    <style>
        .text-success { color: #27ae60; }
        .text-danger { color: #e74c3c; }
        .no-transactions { 
            text-align: center; 
            padding: 20px; 
            color: var(--text-light);
        }
    </style>
`
);
