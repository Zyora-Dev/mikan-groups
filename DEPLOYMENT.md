# Deployment

Everything runs on one EC2 instance: the Next.js site, the FastAPI
service and PostgreSQL. Cloudflare sits in front with Flexible SSL.

```
  browser ──HTTPS──> Cloudflare ──HTTP──> nginx :80
                                            ├── /api/*  → uvicorn :8000
                                            └── /*      → next     :3000
                                                             │
                                                      PostgreSQL :5432
                                                      (localhost only)
```

| | |
|---|---|
| Host | `15.252.237.9` (t3.medium, ap-south-1b) |
| Site | https://mikan-demo.zyora.in |
| Code | `/srv/mikan` |
| Uploads | `/srv/mikan-uploads` |
| Config | `/etc/mikan/` (root-only) |

## Deploying a change

```bash
ssh -i aws/zlivo.pem ubuntu@15.252.237.9
cd /srv/mikan && git pull

# API only
cd api && ./.venv/bin/pip install -q -r requirements.txt
sudo systemctl restart mikan-api      # migrations run on start

# Web only
cd ../web && npm ci && npm run build
sudo systemctl restart mikan-web
```

## Checking on it

```bash
curl https://mikan-demo.zyora.in/health

sudo systemctl status mikan-api mikan-web
sudo journalctl -u mikan-api -n 50 --no-pager
sudo journalctl -u mikan-web -n 50 --no-pager
```

## Database

```bash
# the connection string lives here, root-only
sudo cat /etc/mikan/db-url

# a shell
sudo -u postgres psql mikan_portal
```

Backups are **not** automatic. Until they are, take one by hand before
anything risky:

```bash
sudo -u postgres pg_dump -Fc mikan_portal > ~/mikan-$(date +%F).dump
```

Uploaded files are not in that dump — `/srv/mikan-uploads` needs its
own copy.

## Cloudflare

SSL mode is **Flexible**: Cloudflare terminates TLS and talks to the
origin over plain HTTP. Three things follow, and they are easy to trip
over:

- nginx sets `X-Forwarded-Proto: https`, so the app knows the browser
  is on HTTPS even though this hop is not. Auth cookies keep `Secure`
  because of it.
- uvicorn runs with `--proxy-headers`, so rate limiting counts the real
  visitor rather than Cloudflare's address.
- Port 80 is open to the world, so the origin IP answers HTTP directly.
  Restricting the security group to Cloudflare's ranges, or moving to
  Full SSL with a certificate, closes that.

Switching to **Full** later: install a certificate, change nginx to
listen on 443, and nothing in the application needs to change — the
cookie policy already follows what the browser sees.

## Services

`mikan-api` and `mikan-web` are systemd units, both `Restart=always`
and enabled at boot. The API runs migrations on every start, so a
schema change ships with a restart.

PostgreSQL listens on localhost only and `ufw` allows just SSH and
port 80.

## Email

Reset links and notifications go through Zoho ZeptoMail, configured in
the UI at `/internal/erp/team/settings` rather than in a file. Until
those credentials are set, password resets are recorded but not
delivered.
