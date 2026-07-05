# Deployment Context

## 1. Deployment Goal

MVP must run locally on MacBook first.
Then the same backend code must be deployable on Mac mini using Docker Compose.
Deployment differences must be handled through environment variables and Docker configuration, not business code changes.

## 2. Development Path

- Stage 1: MacBook local development and MVP pipeline smoke test.
- Stage 2: Mac mini Docker deployment with backend-api, worker, database, queue, and storage volume.
- Stage 3: external access, HTTPS, reverse proxy, and advanced monitoring are deferred.

## 3. Local MacBook Development

Local runtime must include:

- `backend-api`
- `worker`
- `database`
- `queue`
- `local file storage`

Local development target:

- Create Project
- Save Product
- Upload Asset
- Run Pipeline
- Generate Script
- Generate Shot
- Generate ModelPrompt
- Export files locally

Rules:

- local development must not require Docker first
- local storage is file-system based
- local environment is for MVP pipeline validation, not production hardening

## 4. Mac mini Docker Deployment

Mac mini Docker runtime must include:

- `backend-api` container
- `worker` container
- `database` container
- `queue` container
- persistent storage volume

Rules:

- `backend-api` and `worker` may use the same Docker image but different start commands
- database and storage must be persistent across container restarts
- frontend container is optional in MVP
- if frontend remains on MacBook, it may call the Mac mini backend over LAN

## 5. Runtime Services

`backend-api`

- handles HTTP requests
- validates inputs
- reads and writes database through services and repositories
- creates TaskRun
- enqueues Worker tasks
- returns Project status and results
- must not run long AI tasks directly

`worker`

- consumes queue jobs
- runs one Pipeline stage per task
- calls AI Provider when needed
- writes structured outputs
- updates TaskRun status
- advances Pipeline after success
- must not handle HTTP requests

`database`

- stores structured data
- must be configurable through `DATABASE_URL`
- must be persistent in Docker deployment

`queue`

- stores async jobs
- must be configurable through `QUEUE_URL`
- used to decouple API and Worker

`file storage`

- stores uploaded assets
- stores generated export files
- uses `STORAGE_ROOT`
- must be mountable as Docker volume

## 6. Environment Variables

Required:

- `DATABASE_URL`
- `QUEUE_URL`
- `STORAGE_ROOT`
- `AI_API_KEY`
- `AI_MODEL_NAME`
- `ENVIRONMENT`
- `LOG_LEVEL`
- `MAX_RETRY_COUNT`
- `UPLOAD_MAX_SIZE_MB`
- `EXPORT_ROOT`

Startup must check:

- `DATABASE_URL`
- `STORAGE_ROOT`
- `AI_API_KEY`

Missing required values must:

- fail fast with clear error
- not silently continue
- not use fake success state

Environment rules:

- local and Docker environments must use the same code
- only env values and Docker config should differ
- do not hardcode localhost, API keys, usernames, LAN IPs, or absolute paths in business logic

## 7. Storage Rules

- All file paths must be based on `STORAGE_ROOT`.
- Do not hardcode local absolute paths.
- Do not store public absolute server paths in API responses.
- Use project-based storage folders.
- Generated files must be under the Project directory.
- Export files must be under the `exports` directory.
- Docker deployment must mount storage as a persistent volume.

Recommended relative structure under `STORAGE_ROOT`:

```text
projects/{project_id}/assets/original
projects/{project_id}/analysis
projects/{project_id}/prompts
projects/{project_id}/exports
projects/{project_id}/logs
```

Rules:

- use this as a relative structure under `STORAGE_ROOT`
- do not write any fixed MacBook or Mac mini absolute path
- file names should be system-generated and safe

## 8. Docker Compose Rules

MVP Docker Compose services:

- `backend-api`
- `worker`
- `database`
- `queue`

Required volumes:

- database data volume
- storage volume
- optional logs volume

Rules:

- `backend-api` and `worker` use the same codebase
- `backend-api` starts HTTP server
- `worker` starts queue consumer
- database and storage data must survive container restart

## 9. API Runtime Rules

- API routes must not call AI directly.
- API routes must not run full Pipeline synchronously.
- API routes should create TaskRun and enqueue jobs.
- API responses must not expose `AI_API_KEY`.
- API responses must not expose `STORAGE_ROOT` absolute paths.
- API download endpoints must validate Project ownership.

## 10. Worker Runtime Rules

- Worker runs one `task_type` per job.
- Worker must receive `task_run_id`, `project_id`, `task_type`.
- Worker must update TaskRun status.
- Worker must catch errors and write `error_message`.
- Worker must not depend on in-memory Pipeline state.
- Worker must read inputs from database.
- Worker must write outputs to database.
- Worker must advance next Pipeline step only after success.

## 11. Database and Queue Rules

- `DATABASE_URL` controls database connection.
- `QUEUE_URL` controls queue connection.
- Do not hardcode localhost in business logic.
- Local and Docker environments must use the same code.
- Only environment variables and Docker Compose should differ.
- Queue jobs should carry at least `task_run_id`, `project_id`, `task_type`, and payload.

## 12. Security Rules

- `AI_API_KEY` must only come from environment variables.
- Do not commit real secrets.
- Do not return API keys to frontend.
- Do not expose absolute file paths.
- Uploaded file names must be sanitized.
- Uploaded file types and size must be limited.
- Generated export files must come only from project export directory.

## 13. Migration Rules

- Moving from MacBook local to Mac mini Docker must not require business code changes.
- Only env values, Docker Compose config, and volume paths may change.
- Avoid hardcoded paths.
- Avoid hardcoded service URLs.
- Avoid Pipeline state stored only in memory.

## 14. Codex Deployment Rules

- Codex must not hardcode MacBook absolute paths.
- Codex must not hardcode Mac mini absolute paths.
- Codex must not hardcode API keys.
- Codex must not write secrets into `.env.example`.
- Codex must not expose `STORAGE_ROOT` in public API responses.
- Codex must not make API and Worker share runtime responsibilities.
- Codex must not require Docker for local development.
- Codex must not require local development for Docker deployment.
- Codex must not add Kubernetes or cloud object storage in MVP.
- Codex must not add reverse proxy, HTTPS, or public domain setup in MVP.
- Codex must not modify business logic to switch environments.
