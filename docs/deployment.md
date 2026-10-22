# Deployment Guide

The supported deployment shape is one Node.js process with a persistent SQLite file behind a TLS
reverse proxy. The backend is stateless apart from that file and the in-memory rate-limit store.

## 1. Build

On the server, install with the lockfile and build:

```bash
npm ci
npm run verify
npm run build
```

`npm run verify` is not optional for a release: it runs lint, formatting, typechecks, the test suite,
and the production build. `npm start` runs the compiled output from `apps/api/dist/src/server.js`.

Node.js 20.19+ or 22 is required. CI uses Node 22.

## 2. Production environment

Create an untracked `apps/api/.env` (or inject the variables through the process manager). Example
values:

```dotenv
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGINS=https://shop.example.com
APP_URL=https://shop.example.com
DATABASE_PATH=/var/lib/loqta/loqta.db
SESSION_TTL_DAYS=7
PASSWORD_RESET_TTL_MINUTES=30
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=20
TRUST_PROXY=true
```

Notes:

- `DATABASE_PATH` is resolved relative to `apps/api` when it is relative. An absolute path is
  clearer in production.
- `CORS_ORIGINS` is a comma-separated allow-list. A wildcard is rejected in production because
  credentialed CORS cannot safely use `*`.
- `APP_URL` is used in password-reset links. It must be the public frontend URL.
- `TRUST_PROXY=true` is correct only behind one trusted proxy. If the process is directly exposed,
  leave it `false` so rate limiting sees the real socket address.
- Raise `BCRYPT_ROUNDS` above the development default if login latency allows. Do not lower it in
  production.
- `NODE_ENV=production` makes the session cookie `Secure` and switches logs to JSON.

## 3. Database and first admin

The process applies pending migrations at startup. You can also run them explicitly:

```bash
npm run db:migrate
```

**Do not run `npm run db:seed` in production.** It creates demo products and known demo passwords.
For a real deployment:

1. Start the API with an empty database.
2. Register the first account through `POST /api/v1/auth/register`.
3. Promote it with a deliberate, audited SQL command while the server is stopped, or add an
   administrative CLI in a future change:

   ```sql
   UPDATE users SET role = 'Admin' WHERE email = 'owner@example.com';
   ```

4. Log in again and create the real catalog through `/api/v1/admin/*`.

Keep the database file and its directory writable only by the service account. SQLite uses `-wal`
and `-shm` files next to the database; they must live on the same local filesystem. Do not place the
database on an object store or a network share that does not provide correct locking.

## 4. Run under a process manager

Use systemd, a container entrypoint, or another supervisor. A minimal systemd unit:

```ini
[Unit]
Description=Loqta API
After=network.target

[Service]
Type=simple
User=loqta
WorkingDirectory=/srv/loqta
Environment=NODE_ENV=production
ExecStart=/usr/bin/node apps/api/dist/src/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/loqta

[Install]
WantedBy=multi-user.target
```

If you use the environment file instead, add `EnvironmentFile=/srv/loqta/apps/api/.env`. The service
user needs write access to the database directory, not to the source tree.

The process handles `SIGINT` and `SIGTERM`, stops accepting connections, closes the HTTP server, and
closes the database. Allow it time to finish before force-killing.

## 5. HTTPS reverse proxy

Terminate TLS at Nginx, Caddy, or a cloud load balancer. Nginx example:

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `TRUST_PROXY=true` when exactly this proxy fronts the app. If there is an additional CDN or load
balancer, configure Express's trust proxy with the actual hop count instead of a blanket `true`.

Production cookies are `Secure`; login over plain HTTP will appear to succeed but the browser will
not store the cookie. Always test over HTTPS.

## 6. Health and monitoring

- Liveness: `GET /api/v1/health` returns `200` with `{ "data": { "status": "ok", ... } }`. It does not
  touch the database.
- Logs are JSON on stdout in production and include a request id. Ship them to your log platform.
- Monitor HTTP 5xx rate, p95 latency, process restarts, database file size, and disk space.
- Monitor failed-login/rate-limit spikes. The in-memory limiter resets on restart.

The OpenAPI document is at `/api/v1/openapi.json`; Swagger UI is at `/api/v1/docs`. Block the docs
path at the proxy if it should not be public.

## 7. Backups

SQLite backups must be consistent with the write-ahead log. The safest options are:

```bash
# Stop the service, then copy the database and any -wal/-shm files.
systemctl stop loqta
cp /var/lib/loqta/loqta.db* /backup/loqta-$(date +%F)/
systemctl start loqta
```

Or use SQLite's online backup command from a maintenance job:

```bash
sqlite3 /var/lib/loqta/loqta.db ".backup '/backup/loqta-$(date +%F).db'"
```

Test a restore into a staging directory. A backup that has never been restored is not verified.
Retain backups according to your privacy policy; the database contains emails, phones, addresses,
and order history.

## 8. Upgrades and rollbacks

1. Take a backup.
2. Deploy the new build with `npm ci && npm run build`.
3. Restart the process; pending migrations run at startup.
4. Check `/api/v1/health`, a catalog read, and an authenticated read.
5. Keep the previous release directory and database backup for rollback.

Migrations are forward-only and additive in this phase. If a future migration is destructive, add a
separate ADR and a tested rollback plan; restarting the old binary against a migrated database is not
automatically safe.

## 9. Scaling limits

- One process with one SQLite file is the supported topology.
- Rate limiting is per process. Multiple instances need a shared rate-limit store.
- For multiple instances or serverless deployment, implement a Cloudflare D1 adapter behind
  `DatabaseClient` (ADR 0004). The services and repositories are already asynchronous.
- The order transaction relies on the database's atomicity. Do not split stock reservation and order
  insertion into separate services without redesigning that boundary.

## 10. Release checklist

- [ ] `npm run verify` passed on the release commit.
- [ ] Production environment values validated, with no demo credentials.
- [ ] HTTPS and `Secure` cookie verified in a browser.
- [ ] CORS allow-list contains only real frontend origins.
- [ ] Proxy trust configured and client IP verified.
- [ ] Database directory permissions and disk space checked.
- [ ] Backup created and restore tested.
- [ ] Real email delivery configured and password reset tested.
- [ ] Rate limiting either shared or enforced at the edge.
- [ ] Logs and alerts receiving production traffic.
