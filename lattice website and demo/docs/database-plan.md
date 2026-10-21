# Database Plan — what we store and the main rules

Plain-English guide to the information our app stores. Written by the builder; no code inside.

## Where the data lives
We use **Supabase** — a free online database that includes user accounts (login with email/Google) and a built-in file area for anything we need later. No credit card needed for the free plan.

## What we store and why
Each piece of information is stored as a simple list (called a "table"). Think of tables like spreadsheets.

1. **Users** — one row per homeowner account. Holds login details and chosen settings.
2. **Homes** — one row per home. Holds the home's total usage and the electricity tariff (₹ per unit). A user owns one or more homes.
3. **Rooms** — one row per room (like "Living Room" or "Master Bedroom"). Each room belongs to one home.
4. **Devices** — one row per appliance (AC, fridge, water heater…). Each device belongs to one room and one home. Stores: name, brand, model, power rating (watts), energy rating / star rating, whether the AI identified it or the user typed it, and whether the user corrected the AI's guess.
5. **Energy readings** — one row per reading: which device it belongs to, the time it was recorded, the power used at that moment (watts), and whether the device was switched on. New readings keep coming in, so this table grows over time — we keep e.g. 12 months of history and then tidy up the oldest.
6. **Known products** — a small library of common Indian appliances with their verified specifications, which the AI's online search draws from.
7. **Sharing consent** — one row per user recording whether they allow their usage patterns (anonymized — no name, no address) to be combined with others' for insights sold to companies, plus the date they gave or withdrew consent.

## The main rules (chosen by the builder)
- **Private by default.** A user can only ever see data for their own homes, rooms, devices, and readings. Nobody else's data is visible — this is enforced by the database, not just by hiding buttons.
- **One home per login to start with** — we keep it simple; adding a second home is a "later" idea. (We'll allow it only if it stays simple.)
- **Derived numbers (like ₹ cost) are calculated, not stored by hand.** The app figures out "this month's cost for the AC" from the stored usage readings and the tariff, every time it's asked. So if the tariff changes, the whole dashboard updates automatically.
- **Correcting the AI always wins.** If a user corrects a device's details, the corrected version is kept and the AI's guess is marked as overridden — the AI won't silently overwrite the user's correction later.
- **Readings are kept for 12 months**, then the oldest are removed to keep things fast and the free plan comfortable.
- **Consent can be withdrawn anytime.** The moment a user withdraws sharing consent, their data is excluded from any insights from that point on.
- **Free users vs Pro users** is just a label on the user row for now — Pro features get decided later, no payment is wired up yet.