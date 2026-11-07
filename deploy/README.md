# Dokploy deployment foundation — NOT YET READY FOR PRODUCTION

This folder contains a **review candidate**, not a tested release. Do **not** click Deploy or collect client/patient data until the blockers below have been resolved.

## What's changed

- `docker-compose.prod.yml` defines MySQL, Redis, API, worker and dashboard without any public host ports.
- API and frontend production Dockerfiles are separate from upstream development Dockerfiles.
- Nginx serves the React build and proxies `/api/` to the backend internally.
- Backend CORS origins are configurable using `CORS_ALLOWED_ORIGINS`.
- Production signup is restricted to `FORMGRID_SIGNUP_EMAIL`. **This is NOT sufficient to secure onboarding**: an attacker could claim the address first. Implement a one-time invitation/bootstrap flow before exposing this publicly.
- Named volumes persist DB, Redis and upload files, but are **not backups**.

## Blockers before deploying

1. **Build verification**: run Docker builds and resolve dependency / TypeScript errors.
2. **Database initialization**: upstream Prisma schema and the old `init.sql` differ, and there is no versioned migration directory. This candidate uses `prisma db push` only as a temporary bootstrap; create/test migrations before live use.
3. **Admin bootstrap**: disable public signup entirely and add an authenticated, one-time administrator creation mechanism.
4. **Uploaded files**: API currently serves `/uploads` as public static files. Remove or protect this route; disable attachments for contact forms until complete.
5. **Authentication hardening**: dashboard tokens are held in localStorage; add secure cookie sessions and login rate limiting.
6. **Error handling**: audit API error responses, trust proxy settings, spam/CSRF risks, CORS and tenant/user isolation.
7. **Email**: test Resend notification flow end-to-end. Upstream may silently fall back to console email.
8. **Privacy**: document GDPR roles, retention, backup restores, access/deletion controls, and security incident procedures. No medical details.
9. **Operational**: validate backups off-host, restore, resource limits, health checks, and upgrades.
10. **Dokploy compatibility**: confirm path/context and routing behavior against installed Dokploy version.

## Deployment configuration (once blockers are fixed)

In the existing `OpenTab Studio → production → formgrid` Compose service:

- Use Git provider: `https://github.com/ReactOnChain/opentab-formgrid.git`.
- Use vetted branch/ref and Compose path `./deploy/docker-compose.prod.yml` (verify build context in Dokploy).
- Set secrets in Dokploy Environment, **never** in the repository:
  - `MYSQL_PASSWORD`: 32+ random URL-safe hexadecimal characters, generated with `openssl rand -hex 32`
  - `MYSQL_ROOT_PASSWORD`: independent long random string
  - `JWT_SECRET`: independent long random string
  - `FORMGRID_SIGNUP_EMAIL`: initial admin address (temporary until bootstrap flow is built)
  - `APP_URL=https://forms.opentab.studio`
  - `CORS_ALLOWED_ORIGINS=https://forms.opentab.studio,https://boshamphysio.com,https://www.boshamphysio.com` (adjust actual allowed origins)
  - `EMAIL_PROVIDER=console` only for test bootstrap; later switch to `resend`
  - `EMAIL_FROM`: verified Resend sender
  - `RESEND_API_KEY`: private server-side secret
- Route **only the dashboard** service on internal port `80` through a Dokploy HTTPS domain. Don't expose Dokploy port 3000, MySQL 3306, Redis 6379, API 4000 or MinIO ports.
- Prefer a temporary test hostname until verified.

## Notes

The original `docker/docker-compose.yml` uses hardcoded passwords, Vite hot reload, and public service ports. It must not be deployed as-is. Do not delete volumes or run `docker compose down -v` when troubleshooting.

All changes are isolated on a draft branch for review.
