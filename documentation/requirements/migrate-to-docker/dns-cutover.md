# DNS & Domain Cutover Plan

## Current State

| Component | Detail |
|---|---|
| Domain | `www.codever.dev` |
| Hosting | Linode (Ubuntu 16.04) with a **fixed/static IP** |
| DNS | Domain points to the current Linode server's IP via an A record |
| SSL | Likely Let's Encrypt certificate (managed by certbot on the current nginx) |

---

## Cutover Strategy

Since the domain uses a static IP on Linode, you have **two options** for the cutover:

### Option A: New Linode server → update DNS A record (recommended)

Provision a **new Linode instance** (Ubuntu 22.04/24.04), set up everything with Docker, then update the DNS A record to point to the new server's IP.

#### Step-by-step

**1. Provision new Linode server**
```
- Image: Ubuntu 22.04 LTS or 24.04 LTS
- Region: same region as current server (minimizes latency change)
- Plan: same size or adjust as needed (Codever is small — 2GB+ RAM should suffice)
- Note the new static IP address (e.g., 172.x.x.x)
```

**2. Set up Docker and deploy on the new server**

Follow the [migration-plan.md](migration-plan.md) — install Docker, create `docker-compose.prod.yml`, migrate Mongo data ([mongo-migration.md](mongo-migration.md)), migrate Keycloak ([keycloak-migration.md](keycloak-migration.md)).

**3. Test with the IP directly (before DNS change)**

Verify the new server works by accessing it via IP or a temporary hostname:

```bash
# On your local machine, temporarily override DNS to test
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows):
172.x.x.x  www.codever.dev

# Now open https://www.codever.dev in your browser — it will hit the new server
# Test: login, create bookmark, search, etc.

# IMPORTANT: remove the hosts entry after testing!
```

**4. Set up SSL on the new server BEFORE DNS switch**

You need a valid SSL certificate on the new server. Two approaches:

**Option 4a: Generate cert after DNS switch (brief downtime)**
- Switch DNS first
- Wait for propagation
- Run certbot to get a new Let's Encrypt cert
- ~5-30 min of HTTPS being broken

**Option 4b: Pre-generate cert with DNS challenge (zero downtime, recommended)**
```bash
# On the new server, use DNS-01 challenge (doesn't require the domain to point here yet)
sudo apt install certbot
certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d www.codever.dev \
  -d codever.dev

# Certbot will ask you to create a TXT record like:
#   _acme-challenge.codever.dev → <random-value>
# Add this TXT record in your DNS provider, wait for propagation, then confirm.
# The cert is generated without needing the A record to point here.
```

Mount the certs into the nginx container:
```yaml
# In docker-compose.prod.yml
services:
  nginx:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

Set up auto-renewal:
```bash
# Add to crontab
0 3 1,15 * * certbot renew --quiet && docker exec codever-nginx nginx -s reload
```

**5. Update the DNS A record**

In your DNS provider (Linode DNS Manager, or wherever you manage the domain):

```
Type    Name              Value (old)      →  Value (new)
A       codever.dev       <old-linode-ip>  →  <new-linode-ip>
A       www.codever.dev   <old-linode-ip>  →  <new-linode-ip>
```

> **Tip:** Before switching, lower the TTL to 300 seconds (5 min) a day or two in advance. This ensures DNS caches expire quickly and the switch takes effect fast. After the migration is stable, raise TTL back to 3600+ seconds.

```
# Timeline:
# Day -1: Lower DNS TTL to 300s
# Day  0: Switch A records to new server IP
# Day  0: Monitor for 1-2 hours
# Day +7: Raise TTL back to 3600s
# Day +14: Decommission old server
```

**6. Verify after DNS switch**
```bash
# Check DNS propagation
dig www.codever.dev +short
# Should return the new IP

# Check from multiple locations
# Use https://www.whatsmydns.net/#A/www.codever.dev

# Verify HTTPS works
curl -I https://www.codever.dev
# Should return HTTP/2 200

# Verify API
curl https://www.codever.dev/api/version

# Verify Keycloak
curl -I https://www.codever.dev/auth/
```

---

### Option B: Rebuild the same Linode server (same IP, more risk)

If you want to keep the **same IP address** (e.g., because it's hardcoded in browser extensions or external integrations):

1. **Create a new Linode** with the full Docker setup (same as Option A)
2. **Test thoroughly** on the new server
3. **Delete the old Linode** (this releases its IP)
4. **Immediately transfer the IP** to the new Linode via Linode's IP transfer feature

> ⚠️ **Warning:** Linode IP transfers between instances in the same data center are possible via support ticket or API, but there is a brief window of downtime. This is riskier than Option A — only do this if keeping the same IP is critical.

Alternatively, use **Linode NodeBalancers** or a floating IP to avoid any downtime, but that adds complexity for a small app.

---

## Recommended approach: Option A

For a small app like Codever, Option A is straightforward:

1. Spin up new Linode with Ubuntu 22.04/24.04
2. Set up Docker + deploy everything
3. Migrate data (Mongo dump/restore + Keycloak realm export/import)
4. Pre-generate SSL cert with DNS challenge
5. Lower TTL → switch A record → verify → raise TTL
6. Keep old server for 1-2 weeks as rollback → decommission

**Total expected downtime: near zero** (DNS propagation is usually seconds to minutes with low TTL).

---

## Checklist

- [ ] New Linode server provisioned (Ubuntu 22.04/24.04)
- [ ] Docker + Docker Compose installed
- [ ] All services deployed and tested via IP / hosts file override
- [ ] SSL certificate generated (DNS-01 challenge or post-switch)
- [ ] Auto-renewal cron configured for certbot
- [ ] DNS TTL lowered to 300s (at least 24h before switch)
- [ ] A record(s) updated to new server IP
- [ ] DNS propagation verified (`dig`, whatsmydns.net)
- [ ] HTTPS, API, Keycloak login all working on new server
- [ ] Old server kept running for rollback (1-2 weeks)
- [ ] DNS TTL raised back to 3600s after stable period
- [ ] Old Linode decommissioned

