# Pocketor — Complete Owner/Admin Guide

---

## Who Is the Admin?

**The owner of the finance company is the admin.** The system works like this:

- The **very first person** to register in the app automatically becomes the admin with full privileges.
- After that, the registration screen is permanently closed. No one else can self-register — only the admin can create new user accounts.
- All subsequent users the admin creates are **agents** (field collectors).

**There are no pre-set login credentials.** You create your admin account yourself on first launch — this is the one-time setup described below.

---

## Step 1 — First-Time Setup (Do This Once)

### 1.1 Start the Backend Server

```bash
cd backend
npm install
npm start
```

### 1.2 Run the Database Migrations (first time only)

In MySQL Workbench or a terminal, run these SQL files in order:

```
database/migrations/001_product_configs.sql
database/migrations/002_payments_gateway.sql
database/migrations/003_user_roles.sql
database/migrations/004_expenses.sql
```

### 1.3 Register Your Admin Account (first launch only)

Open the Pocketor mobile app. On the registration screen, fill in:

| Field | What to enter |
|---|---|
| Name | Your full name |
| Email | Your email address |
| Phone | Your 10-digit mobile number |
| Password | Min 8 characters, include uppercase, number, and symbol |
| Confirm Password | Same password again |

Tap **Register**. The system automatically assigns the **admin** role since you are the first user.

> After this, the Register screen shows "Registration is closed" to everyone else. No one can self-register.

---

## Step 2 — Log In

Every time you open the app, log in with your email/phone and password. Both options are supported:

- Email + Password
- Phone number + Password

---

## Step 3 — Create Field Agents (Employees)

As admin, you manage your field collectors from the **Employees** tab.

**Employees tab → Add Employee**

| Field | What to enter |
|---|---|
| Name | Agent's name |
| Email | Agent's unique email |
| Phone | Agent's 10-digit number |
| Password | A password for them (share it securely) |
| Role | `agent` (default) |

Each agent logs in with their own credentials and can only see their own data — they cannot see your data or other agents' data.

---

## Step 4 — Set Up Your Loan Structure

Loans are organized in a 3-level hierarchy:

```
Line (Loan Product) → Area (Geographic Zone) → Customer → Loan → Payments
```

### 4.1 Create a Line (Loan Product)

A Line defines the loan product type (e.g., "Daily Business Loan", "Weekly Micro Loan").

**Loans tab → Lines → Add Line**

| Field | Example |
|---|---|
| Line Name | "Daily Business Line" |
| Line Type | `Daily`, `Weekly`, or `Monthly` |
| Interest per ₹100 | e.g., `2` means ₹2 interest per ₹100 lent |

### 4.2 Create an Area

An Area is a geographic zone within a line (e.g., "North Market", "Gandhi Nagar").

**Loans tab → Areas → Add Area**

| Field | Example |
|---|---|
| Name | "Gandhi Nagar" |
| Line | Select the line this area belongs to |

### 4.3 Add Customers (Borrowers)

**Borrowers tab → Add Customer**

| Field | Required |
|---|---|
| Name | Yes |
| Line | Yes |
| Area | Yes |
| Phone, Address, etc. | Optional |

---

## Step 5 — Issue a Loan

**Loans tab → Add Loan**

| Field | Description |
|---|---|
| Customer | Select from your borrowers |
| Line & Area | Pre-linked to the customer |
| Principal Amount | The amount being disbursed |
| Total Amount | Principal + Interest (full repayment amount) |
| Installment Amount | Amount due per installment |
| No. of Installments | Total number of payments expected |
| Start Date | When repayment begins |

The loan status starts as **active**. It automatically changes to **completed** when the outstanding balance reaches zero.

---

## Step 6 — Record Daily Collections (Payments)

When a borrower pays: **Loans tab → tap the Loan → Record Payment**

| Field | Example |
|---|---|
| Amount | Amount collected today |
| Payment Date | Today's date |

The outstanding loan balance updates immediately. When the balance hits ₹0, the loan closes automatically.

To reverse a mistaken payment, delete it — the loan balance is restored.

---

## Step 7 — Track Expenses

**Expense tab → Add Expense**

Record business operating costs (vehicle fuel, staff costs, office expenses, etc.). You can:

- Add, edit, and delete expense entries
- View a category-wise summary of total spending

---

## Step 8 — Collections (Group Savings Pools)

**Collection tab**

Use this for chit fund / savings group management. A collection is a pool where multiple members contribute on a schedule.

1. **Create a Collection** — set name, start date, frequency (daily/weekly/monthly), and total amount
2. **Add Members** — add the people contributing to the pool
3. **Record Contributions** — mark each member's payment as `regular`, `interest`, or `penalty`

---

## Step 9 — Reports

**Reports tab**

View summaries of:

- Loan performance (active vs. completed loans)
- Payment collection history
- Outstanding balances

---

## Step 10 — Settings & Account Management

**Settings tab**

From here you can:

- **Change your password** — enter current password + new password
- **Forgot Password** — sends a reset token to your registered email
- **Manage agents** — update agent roles or reset their passwords (admin only)

---

## Complete Workflow at a Glance

```
Register as Admin (one time only)
        ↓
Create Field Agents in Employees tab
        ↓
Set up Lines (loan products) → Areas (zones)
        ↓
Add Borrowers (customers)
        ↓
Issue Loans to borrowers
        ↓
Collect daily / weekly / monthly payments
        ↓
Loan auto-closes when fully paid
        ↓
Track expenses + View reports
```

---

## Important Notes

- **No pre-set admin password.** You choose it when you register for the first time.
- **Password rules:** at least 8 characters, must include an uppercase letter, a number, and a special character — e.g., `MyPass@2026`.
- **OTP / Forgot Password:** In the current development build, the OTP code is returned directly in the API response. A developer can retrieve it from the server logs. Real email/SMS delivery is planned for a future release.
- **Agent data isolation:** Each agent sees only their own lines, areas, customers, and loans. Cross-agent visibility for the admin is planned as a future enhancement.
