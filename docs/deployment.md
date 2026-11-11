# BrewLite T5.3 — Deployment and rollback (draft)

## Scope and prerequisites

- Architecture: ADR-003 (Render + GHCR), ADR-007 (Prisma migrate on API startup).
- Do **not** deploy until T5.1a, T5.1b-API and T5.2b have merged and been verified on `main`.
- The workflow `.github/workflows/cd.yml` runs **manually only**, and refuses to run unless the selected ref is `main`.
- `publish` builds both images; `deploy` builds and triggers Render; `rollback` uses an existing release tag.
- The initial workflow is a staging/provisional implementation; do not enable tag-triggered production deploy without team review.

## GitHub configuration

Create Actions **variables** (non-secret):

- `RENDER_API_SERVICE_ID`: API service ID (`srv-...`).
- `RENDER_WEB_SERVICE_ID`: Web service ID (`srv-...`).

- `RENDER_API_URL`: public HTTPS origin of Render NestJS service, no trailing path.
- `RENDER_WEB_URL`: public HTTPS origin of Render Next.js service.

Create Actions **secrets** (do not paste into docs or chats):

- `RENDER_API_DEPLOY_HOOK`: Render API image-backed service's Deploy Hook URL.
- `RENDER_WEB_DEPLOY_HOOK`: Render Web image-backed service's Deploy Hook URL.
- `RENDER_API_KEY`: Render API key used to poll deployment status (never commit).

`GITHUB_TOKEN` with `packages: write` is used for GHCR push. Allow the workflow to access the packages; configure Render registry credentials if GHCR packages are private. Confirm the images are accessible before deployment.

Configure GitHub `production` environment protection / required reviewers where the repository's plan supports it. Keep deployment hooks restricted to this environment where possible.

## Render configuration

- PostgreSQL: use internal connection within the same workspace/region; restrict external access. Do not store production `DATABASE_URL` in GitHub Actions.
- API: image-backed Web Service using `ghcr.io/<owner>/brewlite-api:<tag>`, port `3001`; environment includes `DATABASE_URL` (internal), a strong `JWT_SECRET`, valid `MOCK_PAYMENT_MODE`, and any requirements from the final merged configuration. Health path `/health`.
- Web: image-backed Web Service using `ghcr.io/<owner>/brewlite-web:<tag>`, port `3000`.
- API URL is baked into the Web image with the Docker build argument `NEXT_PUBLIC_API_URL`. **Publish a new Web image if the API domain changes.**
- Disable competing auto-deploy triggers in Render for this workflow.
- Confirm `apps/api/docker-entrypoint.sh` migration/seed logic with T5.2b owner before first deploy. ADR-007 requires `prisma migrate deploy` at startup, but automatic seeding of production data needs explicit approval and an idempotency review.

## Release procedure

1. Review and merge all dependencies to `main`; ensure normal CI is green.
2. Set `RENDER_API_URL`, `RENDER_WEB_URL` and deploy hook secrets.
3. Create Render image-backed API and Web services and confirm their configured image repository paths match the workflow.
4. Set the API key, Render service IDs, and `production` environment protection. Do not put any secret in logs.
5. Go to GitHub **Actions → CD - Render GHCR → Run workflow**, select `main`.
6. Use `operation=publish`, `release_tag=v1.0.0` to publish images (before the initial Render configuration if needed).
7. Use `operation=deploy`, `release_tag=v1.0.0` to publish and trigger deployment of both services.
8. Confirm GitHub Actions success, Render deploy status, `/health`, `/products`, and the live Web site. Preserve evidence without secrets.
9. Create the Git release tag only according to the team's release approval process. This workflow does not itself create a Git tag.

## Rollback

1. Confirm the prior *published* release tag (e.g., `v1.0.0`).
2. Run the CD workflow on `main` with `operation=rollback` and `release_tag` set to that existing version.
3. The workflow asks Render to redeploy **both** images by explicit `imgURL` tag, then runs smoke checks.
4. `scripts/render-deploy.sh` verifies Render reports the expected image reference as LIVE for the returned deploy ID; additionally confirm the running service and user flows manually.
5. Image rollback does **not** roll back database schema changes. All released migrations must be backward compatible or require a separately reviewed recovery plan.

## Security checks and evidence still to complete

- Gitleaks v3 scans repo history before publishing (personal-account repo; for an organization repository, verify licensing). Preserve redacted PASS/FAIL evidence in `docs/evidence/`.
- Demonstrate a negative smoke test without touching production, and record the expected FAIL result.
- `scripts/render-deploy.sh` needs `RENDER_API_KEY`; the deploy hook by itself does not prove a deploy has completed.
- If a deploy hook returns 202/queues without a deploy ID, this script intentionally fails rather than incorrectly claiming success. Retry only after checking Render deploy history.
- Update `docs/traceability-matrix.md` after confirming its existing rows and format.
- Test image builds, smoke-test failure/retry, Render release and rollback before claiming T5.3 completion.
- A Render LIVE status and successful smoke test still require functional verification (including database migration and staff/customer flows) during acceptance.
