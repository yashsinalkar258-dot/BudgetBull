BUDGETBULL — FIREBASE CLOUD VERSION OF YOUR EXISTING PROJECT
=============================================================

This version is based on your uploaded expense-tracker-mobile project. It
keeps your existing dashboard, stylesheet, bull image, and main files. It is
not a separate redesign.

WHAT THIS VERSION CONNECTS
- Firebase email/password authentication.
- Firestore cloud storage for the current budget and expenses.
- Loads the signed-in user's saved data after login.
- Saves dashboard changes to that user's Firestore document.
- Logout and cloud-save status.
- Each user's data is stored under users/{uid}/private/data, matching the
  Firestore rules provided during setup.

IMPORTANT
- This is a conversion of the existing cloud foundation to Firebase. It has
  not been tested against your actual Firebase project or browser yet.
- Do not publish over your live GitHub Pages website until the local test works.
- It does not add every advanced feature previously discussed.
- Old browser-only expenses are not automatically migrated. Keep a backup.
- Firestore rules must be published before cloud save can work.
- Never put service-account private keys in browser JavaScript.

SETUP — DO THESE IN ORDER
1. Keep your live website/repository unchanged and keep a backup of this folder.
2. Open config.js. In Firebase Console, open Project settings (gear icon) >
   General > Your apps > BudgetBull Web > SDK setup/configuration.
3. Copy the values for apiKey, authDomain, projectId, and appId into config.js.
   Replace only the placeholder strings. Keep quotation marks and commas.
4. Firebase Console > Authentication > Sign-in method: ensure Email/Password
   is enabled.
5. Firestore > Rules should contain the rules allowing a signed-in user to
   access only their own users/{userId}/... path. Do not make the database public.
6. Run the folder through VS Code Live Server, not by opening index.html as a
   file. Use a local server such as http://127.0.0.1:5500 if that is your setup.
7. Create a test account. Add a test expense. Wait for "Cloud saved", refresh,
   and check the expense is still present.
8. Test the same account on your mobile using a reachable hosted test version.
   Do not publish to your main GitHub Pages site until desktop tests pass.
9. Only after all tests work, deploy the updated files together to the existing
   GitHub Pages repository. Keep the old version available for rollback.

DATA STORAGE
This version stores one JSON document per user in Firestore. A user's
data document is at users/{Firebase UID}/private/data.

ADVANCED MONEY CENTER (added)
-----------------------------
The Advanced Money Center is included below the existing dashboard. It adds:
1. Income entries and monthly cash-flow totals.
2. Category-specific monthly spending limits.
3. Overall and category unused-budget rollover (based on months the app has tracked).
4. Recurring bill schedules, with a manual action to add each due bill once.
5. Month-to-date trend and end-of-month spending estimate.
6. Savings goals with target dates and progress tracking.
7. Spending insights and budget alerts.
8. Monthly transaction report, CSV export, and browser Print/Save as PDF.
9. Expense editing, notes, tags, and wallet assignment.
10. Transaction search, category/date filters, sorting, and duplicate warnings.
11. Multiple wallets with opening balances, income/expense assignment, and transfers.
12. JSON backup export and JSON backup restore.
13. CSV transaction import (expects a header row with description/name, amount, date, and category; amount and description are required).
14. Browser notification permission toggle and a date-scoped no-spend challenge.

DATA / BEHAVIOUR NOTES
- Advanced data is stored in the same per-user Firestore document as the existing
  budget and expenses. Keep your Firestore rules restricted to the signed-in
  user's own document.
- Recurring bills are not silently added in the background. Use “Add due bills to
  expenses”; the same due date is generated only once. This avoids surprise or
  duplicate transactions.
- Browser notifications depend on browser support, granted permission, and a
  secure context (HTTPS or localhost). They are in-page/browser notifications,
  not a server push service.
- “Print / Save PDF” opens a print dialog; choose “Save as PDF” in that dialog.
- Forecasts are simple estimates based on current-month average spending.
- Wallet balances use the selected wallet for new transactions. Older expenses
  without a wallet assignment are counted in the first wallet by default.
- CSV import creates expense records; it does not import bank credentials or
  connect to a bank account. Review imported data before relying on it.
- Budget rollover uses the prior month only when that month was tracked by the
  app; category rollover caps are optional.

VALIDATION
- JavaScript syntax checked with Node.js.
- Checked that all static DOM IDs are unique and every direct ID reference in
  the advanced module exists in index.html.
- This is not a substitute for testing with your real Firebase configuration and
  Firestore rules. Configure config.js, then test sign-up/login, save, refresh,
  logout/login, and each feature before publishing the live site.
