# Deployment Guide — TechMatch Japan on AWS

This walks through deploying the full stack to AWS by hand, the same
sequence the [build prompt's Week 4](#) called for: RDS → EC2 → S3 →
CloudFront. Budget roughly half a day the first time; a redeploy after
that takes minutes using the `deploy/` scripts.

**Architecture recap:**

```
User Browser → [S3 + CloudFront] → [EC2: nginx :80 → Node/PM2 :5000] → [RDS PostgreSQL]
```

**Prerequisites**
- An AWS account (the steps below fit in the free tier: RDS `db.t3.micro`,
  EC2 `t2.micro`, S3, and CloudFront's free tier allowance)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  installed locally, then run `aws configure` with an IAM user that has
  permissions for RDS, EC2, S3, and CloudFront
- This repo pushed to GitHub (the EC2 instance pulls from there — it
  doesn't receive your local working directory)
- An SSH key pair for EC2 (create one in step 2, or reuse an existing one)

---

## 1. RDS — PostgreSQL database

1. AWS Console → **RDS** → **Create database**.
2. **Engine**: PostgreSQL, version 15.x (matching `schema.sql`'s target).
3. **Templates**: Free tier.
4. **Settings**:
   - DB instance identifier: `techmatch-db`
   - Master username: `techmatch_admin`
   - Master password: generate a strong one and save it — you'll put it in
     `DATABASE_URL` shortly.
5. **Instance configuration**: `db.t3.micro` (free tier eligible).
6. **Connectivity**:
   - VPC: default is fine.
   - **Public access: Yes** — simplest for a portfolio project, since the
     EC2 instance and your local machine (for the initial schema/seed) both
     need to reach it. For production-grade security you'd put RDS in a
     private subnet and only allow the EC2 security group, but that adds
     a NAT gateway cost that isn't worth it here.
   - VPC security group: create new, name it `techmatch-rds-sg`.
7. **Additional configuration**: initial database name `techmatch` (this
   saves a manual `CREATE DATABASE` step).
8. Create the database. It takes a few minutes — wait for status
   **Available**, then copy the **Endpoint** from the RDS console
   (something like `techmatch-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`).
9. **Security group**: open `techmatch-rds-sg` → Inbound rules → Edit →
   Add rule: Type `PostgreSQL` (port 5432), Source = **your IP** (for
   running schema/seed from your laptop) — you'll add the EC2 security
   group here too once it exists (step 2.6).

**Load the schema and sample data** (from your local machine, now that RDS
allows your IP):

```bash
cd server
DATABASE_URL="postgresql://techmatch_admin:YOUR_PASSWORD@techmatch-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/techmatch" \
  psql -f schema.sql "$DATABASE_URL"
# (or: psql "$DATABASE_URL" -f schema.sql — either order works with modern psql)

DATABASE_URL="postgresql://techmatch_admin:YOUR_PASSWORD@techmatch-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/techmatch" \
  node data/seed.js
```

You should see `[seed] Inserted 50 job listings and 252 skill rows.` — same
as local dev, just pointed at RDS.

---

## 2. EC2 — the API server

1. AWS Console → **EC2** → **Launch instance**.
2. **Name**: `techmatch-api`.
3. **AMI**: Amazon Linux 2023 (the commands below use `dnf`; swap in `apt`
   equivalents if you pick Ubuntu instead).
4. **Instance type**: `t2.micro` (free tier).
5. **Key pair**: create a new one, name it `techmatch-japan`, download the
   `.pem` file, and `chmod 400 techmatch-japan.pem` locally. This is the
   `EC2_KEY_PATH` you'll put in `deploy/deploy.config.sh`.
6. **Network settings** → Edit → create a new security group
   `techmatch-ec2-sg` with:
   - SSH (22) from **your IP**
   - HTTP (80) from **Anywhere** (this is what nginx will listen on)
   - Leave port 5000 **closed** to the internet — nginx is the only thing
     that should reach Node directly, over localhost.
7. Launch. Once it's running, copy the **Public DNS** (e.g.
   `ec2-XX-XX-XX-XX.compute-1.amazonaws.com`) — that's `EC2_HOST`.
8. Go back to the RDS security group (`techmatch-rds-sg`) → Inbound rules
   → Add rule: Type `PostgreSQL`, Source = `techmatch-ec2-sg` (search for
   it by security group ID). Now the API server can reach the database.

**SSH in and set up the box:**

```bash
ssh -i techmatch-japan.pem ec2-user@ec2-XX-XX-XX-XX.compute-1.amazonaws.com
```

```bash
# Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git nginx

# PM2, globally, so `pm2` works outside the repo too
sudo npm install -g pm2

# Clone the repo
git clone https://github.com/tejas-5/techmatch-japan.git
cd techmatch-japan/server
npm ci --omit=dev
```

**Configure the environment** — copy the production template and fill in
the real RDS endpoint, a fresh JWT secret, and your frontend origin(s)
(you'll come back and add the CloudFront URL once step 4 gives you one —
CLIENT_ORIGIN accepts a comma-separated list, so you can add it without
removing what's already there):

```bash
cp .env.production.example .env
nano .env   # or vim — fill in DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN
```

Generate a real `JWT_SECRET` (don't reuse your local-dev one):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Start the API under PM2:**

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # prints a command — copy/paste and run it once, so PM2
              # survives an instance reboot
```

Sanity check from inside the instance:

```bash
curl http://localhost:5000/api/health
# {"status":"ok"}
```

**Set up nginx** so the API is reachable on port 80 instead of 5000:

```bash
sudo cp ~/techmatch-japan/deploy/nginx/techmatch-api.conf /etc/nginx/conf.d/
```

Edit the copied file and replace `server_name api.yourdomain.com;` with
your EC2 public DNS name (or `_;` to match any hostname, which is fine for
a portfolio project without a custom domain):

```bash
sudo nano /etc/nginx/conf.d/techmatch-api.conf
sudo nginx -t              # should print "syntax is ok" / "test is successful"
sudo systemctl enable nginx
sudo systemctl start nginx
```

From your **local machine**, confirm it's reachable over the internet:

```bash
curl http://ec2-XX-XX-XX-XX.compute-1.amazonaws.com/api/health
# {"status":"ok"}
```

That URL + `/api` is what `VITE_API_URL` points to in step 3.

---

## 3. Frontend build — point it at the API

Locally:

```bash
cd client
cp .env.production.example .env.production
nano .env.production   # VITE_API_URL=http://ec2-XX-XX-XX-XX.compute-1.amazonaws.com/api
```

Don't build yet — do that after CloudFront exists in step 4, since nothing
about the build depends on S3/CloudFront being ready first, but it saves a
redundant build to do it once at the end of step 4 instead.

---

## 4. S3 + CloudFront — the frontend

**S3 bucket:**

1. AWS Console → **S3** → **Create bucket**.
2. Name: something globally unique, e.g. `techmatch-japan-frontend-yourname`.
3. **Uncheck** "Block all public access" and acknowledge the warning — a
   static site bucket needs to be readable (CloudFront will be the only
   path in, configured below, but the bucket policy below still needs
   public `GetObject` for CloudFront's legacy S3-website-origin mode; see
   the note after step 6 for the more locked-down OAC alternative).
4. Create the bucket, then **Properties** tab → **Static website hosting**
   → Enable → Index document: `index.html` → Error document: `index.html`
   (this second part matters — see the SPA routing note below).
5. **Permissions** tab → **Bucket policy** → paste, replacing the bucket name:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::techmatch-japan-frontend-yourname/*"
    }
  ]
}
```

6. Note the **Static website hosting** endpoint URL shown on the Properties
   tab (e.g. `http://techmatch-japan-frontend-yourname.s3-website-us-east-1.amazonaws.com`)
   — you'll use this as the CloudFront origin.

**Why the error document matters:** React Router handles routes like
`/jobs/12` client-side, but S3 has no idea `/jobs/12` exists — it'll 404.
Pointing the error document back at `index.html` means S3 serves the app
shell for any unknown path, and React Router takes it from there.

**CloudFront distribution:**

1. AWS Console → **CloudFront** → **Create distribution**.
2. **Origin domain**: paste the S3 **static website hosting** endpoint from
   step 6 above (not the bucket's default `.s3.amazonaws.com` domain —
   that one doesn't support the SPA fallback behavior).
3. **Viewer protocol policy**: Redirect HTTP to HTTPS (CloudFront gives you
   free HTTPS on its own `*.cloudfront.net` domain automatically).
4. **Default cache behavior**: leave defaults (GET/HEAD, caching optimized).
5. Under **Custom error responses**, add one: HTTP error code `403`
   (S3 website endpoints return 403 for a missing key, not 404) → Response
   page path `/index.html` → HTTP response code `200`. This is the
   CloudFront-level version of the same SPA-fallback fix.
6. Create the distribution. It takes 5–15 minutes to deploy — status
   flips from "Deploying" to enabled. Copy the **Distribution domain name**
   (e.g. `dxxxxxxxxxxxxx.cloudfront.net`).

> **Locking it down further (optional):** the public-bucket-policy approach
> above is the simplest path and fine for a portfolio project, but AWS's
> current recommendation is Origin Access Control (OAC), which keeps the
> bucket fully private and lets only CloudFront read it. If you want that:
> create the distribution with the S3 **REST** endpoint (not the website
> endpoint) as origin, enable OAC in the origin settings, copy the bucket
> policy CloudFront generates for you, and handle SPA fallback purely
> through the custom-error-response step above (skip the S3 static-website
> and bucket-policy steps entirely). It's a few more clicks for a bit more
> security depth than this project needs.

**Now build and deploy the frontend:**

```bash
cd client
npm run build
aws s3 sync dist/ s3://techmatch-japan-frontend-yourname --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

(`npm run build` picks up `client/.env.production` automatically — that's
why step 3's `VITE_API_URL` matters.)

---

## 5. Close the loop — CORS

Back on the EC2 instance, add the CloudFront domain to `CLIENT_ORIGIN` in
`server/.env` (comma-separated if you're keeping the S3 website URL around
for testing too), then reload:

```bash
nano ~/techmatch-japan/server/.env
# CLIENT_ORIGIN=https://dxxxxxxxxxxxxx.cloudfront.net

pm2 reload techmatch-api --env production
```

---

## 6. Test the live site

Open `https://dxxxxxxxxxxxxx.cloudfront.net` in a browser and walk through:
register → browse jobs → filter → open a job detail → run the analyzer →
save a search → log out → log back in and confirm the saved search and
skills are still there. If the Dashboard/Jobs pages show their red error
state instead of data, it's almost always `CLIENT_ORIGIN` (CORS) or
`VITE_API_URL` pointing at the wrong place — check the browser console's
Network tab for the actual failing request.

---

## 7. Using the deploy scripts for future updates

Once the above is done once by hand, `deploy/deploy-backend.sh` and
`deploy/deploy-frontend.sh` automate steps 2 and 3–4 for every subsequent
change:

```bash
cp deploy/deploy.config.sh.example deploy/deploy.config.sh
nano deploy/deploy.config.sh   # fill in EC2_HOST, S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, etc.

# after pushing a backend change to GitHub:
./deploy/deploy-backend.sh

# after any frontend change:
./deploy/deploy-frontend.sh
```

`deploy.config.sh` holds your real host/bucket names and is gitignored —
never commit it.

---

## 8. Optional: a real custom domain + HTTPS on the API

This project works fine on `*.cloudfront.net` and the EC2 public DNS name.
If you own a domain and want it to look fully custom:

1. **Route 53**: create a hosted zone for your domain (or subdomain).
2. **ACM** (in `us-east-1`, required for CloudFront): request a public
   certificate for `app.yourdomain.com`, validate via the DNS record ACM
   gives you (Route 53 can insert it automatically).
3. **CloudFront**: edit the distribution → Alternate domain name (CNAME) →
   `app.yourdomain.com` → attach the ACM certificate → Route 53 → add an
   `A` record (Alias) for `app.yourdomain.com` pointing at the distribution.
4. **API subdomain + HTTPS**: point `api.yourdomain.com` (an `A` record) at
   the EC2 instance's Elastic IP (allocate one first — EC2 → Elastic IPs —
   so the address doesn't change on instance restart). Update
   `server_name` in `deploy/nginx/techmatch-api.conf` to
   `api.yourdomain.com`, then on the instance:
   ```bash
   sudo dnf install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```
   Certbot edits the nginx config in place to add the TLS listener and sets
   up auto-renewal. Update `CLIENT_ORIGIN` and `VITE_API_URL` to the new
   `https://` URLs and redeploy both sides.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Dashboard/Jobs show the red error state | `CLIENT_ORIGIN` on the API doesn't include the CloudFront domain, or `VITE_API_URL` was wrong at build time (check what URL the failed request actually went to, in the browser's Network tab) |
| `/jobs/12` (or any deep link) 404s on direct load | S3 error-document or the CloudFront custom-error-response step was skipped — see the SPA routing note in step 4 |
| API unreachable entirely | EC2 security group doesn't allow port 80 from your IP/anywhere, or nginx isn't running (`sudo systemctl status nginx`) |
| `pm2 status` shows the app crash-looping | `pm2 logs techmatch-api` — almost always a missing/wrong `DATABASE_URL`, or the RDS security group doesn't allow the EC2 security group |
| Login works but `/auth/me` fails after refresh | `JWT_SECRET` differs between what issued the token and what's verifying it now — happens if you changed `.env` and forgot to `pm2 reload` |
