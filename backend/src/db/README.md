DB module

This folder contains the database access layer. Goals:

- Centralize PostgreSQL pool configuration and tuning.
- Provide transaction helper to keep business logic safe and composable.
- Offer a programmatic migration runner for automation (used by `scripts/run_migration.js`).
- Organize table-specific operations under `repos/` for clarity and testability.

Files
- `index.js` — Pool, `query()`, `getClient()`, `transaction()`, `migrate()` and `shutdown()` helpers.
- `repos/` — small repository modules (e.g. `users.js`, `listings.js`) that expose focused DB functions.

Usage examples

Run migrations programmatically from code:

```js
const db = require('./src/db');
await db.migrate();
```

Use transactions to group multiple operations:

```js
const db = require('./src/db');

await db.transaction(async (client) => {
  await client.query('INSERT INTO ...', [...]);
  await client.query('UPDATE ...', [...]);
});
```

Create a repo-based call (from route/controller):

```js
const users = require('./src/db/repos/users');
const newUser = await users.createUser({ email, password_hash, full_name });
```

Tuning
- Expose pool options via environment variables: `PG_MAX_CLIENTS`, `PG_IDLE_TIMEOUT`, `PG_CONN_TIMEOUT`.
