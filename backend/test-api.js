/**
 * End-to-end API test suite for the ATM backend.
 * Requires the server to be running (npm start) and MongoDB reachable.
 * Usage: node test-api.js
 */
const BASE = process.env.API_URL || "http://localhost:5000/api";

let passed = 0;
let failed = 0;

function check(name, condition, extra = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  return { status: res.status, data, headers: res.headers };
}

async function main() {
  console.log("\n== ATM API tests ==\n");

  // --- Health ---
  console.log("Health check:");
  const health = await request("GET", "/health");
  check("health returns ok", health.status === 200 && health.data.status === "ok");

  // --- Registration ---
  console.log("\nRegistration:");
  const suffix = Date.now();
  const userA = {
    name: "Alice Test",
    email: `alice${suffix}@test.com`,
    password: "secret123",
  };
  const userB = {
    name: "Bob Test",
    email: `bob${suffix}@test.com`,
    password: "secret123",
  };

  const regA = await request("POST", "/auth/register", { body: userA });
  check("register A returns 201", regA.status === 201, `got ${regA.status}`);
  check("register A returns token", !!regA.data.token);
  check("register A links account id", !!regA.data.account);

  const regB = await request("POST", "/auth/register", { body: userB });
  check("register B returns 201", regB.status === 201, `got ${regB.status}`);

  const duplicate = await request("POST", "/auth/register", { body: userA });
  check("duplicate email rejected", duplicate.status === 400);

  const invalid = await request("POST", "/auth/register", {
    body: { name: "X", email: "not-an-email", password: "123" },
  });
  check("invalid register data rejected", invalid.status === 400);

  const tokenA = regA.data.token;
  const tokenB = regB.data.token;

  // --- Login ---
  console.log("\nLogin:");
  const loginA = await request("POST", "/auth/login", {
    body: { email: userA.email, password: userA.password },
  });
  check("login A returns 200", loginA.status === 200, `got ${loginA.status}`);
  check("login A returns token", !!loginA.data.token);

  const badLogin = await request("POST", "/auth/login", {
    body: { email: userA.email, password: "wrong-password" },
  });
  check("wrong password rejected", badLogin.status === 401);

  // --- Profile ---
  console.log("\nProfile:");
  const meA = await request("GET", "/auth/me", { token: tokenA });
  check("GET /auth/me returns 200", meA.status === 200, `got ${meA.status}`);
  check(
    "profile includes populated account number",
    !!meA.data.account?.accountNumber,
    `account=${JSON.stringify(meA.data.account)}`
  );
  const accountNumberA = meA.data.account.accountNumber;
  check("account number format AC-...", /^AC[A-Z0-9]+$/.test(accountNumberA));

  const meB = await request("GET", "/auth/me", { token: tokenB });
  const accountNumberB = meB.data.account.accountNumber;

  const noToken = await request("GET", "/auth/me");
  check("no token → 401", noToken.status === 401);

  const badToken = await request("GET", "/auth/me", { token: "invalid.token.here" });
  check("invalid token → 401", badToken.status === 401);

  // --- Balance ---
  console.log("\nBalance:");
  const bal0 = await request("GET", "/account/balance", { token: tokenA });
  check("initial balance is 0", bal0.status === 200 && bal0.data.balance === 0);

  // --- Deposit ---
  console.log("\nDeposit:");
  const dep = await request("POST", "/account/deposit", {
    token: tokenA,
    body: { amount: 100.5 },
  });
  check("deposit 100.5 → 200", dep.status === 200 && dep.data.newBalance === 100.5);

  const dep2 = await request("POST", "/account/deposit", {
    token: tokenA,
    body: { amount: 0.25 },
  });
  check("deposit 0.25 → 100.75", dep2.status === 200 && dep2.data.newBalance === 100.75);

  const depBad = await request("POST", "/account/deposit", {
    token: tokenA,
    body: { amount: 0 },
  });
  check("deposit 0 rejected", depBad.status === 400);

  const depNeg = await request("POST", "/account/deposit", {
    token: tokenA,
    body: { amount: -5 },
  });
  check("deposit negative rejected", depNeg.status === 400);

  // --- Withdraw ---
  console.log("\nWithdraw:");
  const wd = await request("POST", "/account/withdraw", {
    token: tokenA,
    body: { amount: 30 },
  });
  check("withdraw 30 → 70.75", wd.status === 200 && wd.data.newBalance === 70.75);

  const wdTooMuch = await request("POST", "/account/withdraw", {
    token: tokenA,
    body: { amount: 99999 },
  });
  check("insufficient funds rejected", wdTooMuch.status === 400);

  // --- Transfer ---
  console.log("\nTransfer:");
  const tr = await request("POST", "/account/transfer", {
    token: tokenA,
    body: { amount: 20.5, recipientAccountNumber: accountNumberB },
  });
  check("transfer 20.5 → 50.25", tr.status === 200 && tr.data.newBalance === 50.25);

  const balB = await request("GET", "/account/balance", { token: tokenB });
  check("recipient received 20.5", balB.data.balance === 20.5, `got ${balB.data.balance}`);

  const selfTr = await request("POST", "/account/transfer", {
    token: tokenA,
    body: { amount: 1, recipientAccountNumber: accountNumberA },
  });
  check("self-transfer rejected", selfTr.status === 400);

  const badRecipient = await request("POST", "/account/transfer", {
    token: tokenA,
    body: { amount: 1, recipientAccountNumber: "ACDOESNOTEXIST" },
  });
  check("unknown recipient rejected", badRecipient.status === 404);

  const trOver = await request("POST", "/account/transfer", {
    token: tokenA,
    body: { amount: 99999, recipientAccountNumber: accountNumberB },
  });
  check("transfer with insufficient funds rejected", trOver.status === 400);

  // --- Transactions ---
  console.log("\nTransactions:");
  const tx = await request("GET", "/account/transactions", { token: tokenA });
  check("transactions list returns 200", tx.status === 200);
  check("at least 3 transactions recorded", tx.data.length >= 3, `got ${tx.data.length}`);
  const sorted = tx.data.every(
    (t, i, arr) => i === 0 || new Date(arr[i - 1].date) >= new Date(t.date)
  );
  check("transactions sorted newest first", sorted);
  check(
    "transfer transaction has description",
    tx.data.some((t) => t.type === "transfer" && t.description.includes(accountNumberB))
  );

  // --- CSV export ---
  console.log("\nCSV export:");
  const csv = await request("GET", "/account/transactions/export", { token: tokenA });
  check("CSV export returns 200", csv.status === 200);
  check(
    "CSV has correct content type",
    (csv.headers.get("content-type") || "").includes("text/csv")
  );
  check(
    "CSV contains French header row",
    csv.data.startsWith("Date;Type;Description;Montant;Solde après")
  );
  check("CSV contains French deposit label", csv.data.includes("Dépôt"));

  // --- Final balance sanity ---
  const balFinal = await request("GET", "/account/balance", { token: tokenA });
  check("final balance = 50.25", balFinal.data.balance === 50.25, `got ${balFinal.data.balance}`);

  console.log(`\n== Results: ${passed} passed, ${failed} failed ==\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
