# MVP Context
## 1. MVP Goal
MVP only validates this minimum closed loop:
Product input -> Asset upload -> Asset analysis -> Asset gap report -> TrendInsight or fallback -> 5 scripts -> Shot breakdown -> ModelPrompt generation -> Export package

The goal is not a full ad platform. The goal is a stable backend workflow that turns one product plus uploaded assets into a structured short-video ad production package.

## 2. Must Build
- Project creation
- Product saving
- Asset upload
- AssetAnalysis
- AssetGapReport
- TrendInsight fallback
- Script generation
- Shot breakdown
- Shot classification
- ModelPrompt generation
- ExportPackage
- TaskRun tracking
- MacBook local run
- Mac mini Docker deployment readiness

## 3. Must Not Build
- automatic TikTok trend scraping
- final video generation
- automatic editing
- automatic ad publishing
- ad account integration
- A/B testing
- advanced permission system
- cloud object storage
- Kubernetes
- cost dashboard
- online script editor
- shot drag-and-drop editor
- prompt editor

## 4. Deferred Features
- script, shot, or prompt online editing
- partial regeneration flows
- multi-version comparison
- script quality check
- independent shot asset recheck
- pipeline summary
- TrendFetch and TrendRawItem independent persistence
- real video generation callbacks and preview

## 5. Required Inputs
- product_name
- category
- product_description
- at least 1 selling_point
- target_market
- target_language
- objective
- at least 1 asset

## 6. Optional Inputs
- product_url
- sku_code
- price
- competitor_description
- tiktok_reference_links
- manual trend text
- brand_name
- usage_scenarios
- target_audience

## 7. Default Values
- `target_platform = TikTok`
- `target_language = English`
- `objective = conversion`
- `aspect_ratio = 9:16`
- `script_count = 5`
- `shot_count_per_script = 4-8`
- `prompt_models = kling, seedance, jimeng`
- `max_retry_count = 3`

## 8. Required Outputs
- `brief.json`
- `scripts.md`
- `shots.json`
- `model_prompts.json`
- `asset_gap_report.json`
- `export.zip`

`model_prompts.json` may keep all model prompts in one file with a `model` field.

## 9. MVP Data Objects
Must persist:
- User
- Project
- Product
- Asset
- AssetAnalysis
- AssetGapReport
- TrendInsight
- Script
- Shot
- ModelPrompt
- ExportPackage
- TaskRun

Deferred as independent tables:
- SKU
- TrendFetch
- TrendRawItem
- ShotAssetCheck

MVP simplifications:
- SKU fields stay in Product
- trend fetch metadata stays in TrendInsight
- shot asset recheck fields stay in Shot

## 10. MVP Pipeline Steps
Required:
- `project_brief_normalization`
- `asset_understanding`
- `asset_gap_detection`
- `trend_structuring`
- `script_generation`
- `shot_breakdown`
- `shot_classification`
- `model_prompt_generation`
- `export_assembly`

Deferred:
- `automatic_trend_fetch`
- `script_quality_check`
- `independent_shot_asset_recheck`
- `pipeline_summary`

Execution notes:
- normalize product input into a structured brief
- analyze asset metadata and basic content
- detect missing assets and constraints
- use manual trend input, references, or fallback templates
- generate exactly 5 scripts
- generate 4-8 shots per script
- classify shot types
- generate at least one prompt per shot
- export reads existing data only and must not call AI again

## 11. Required APIs
- Project API: create, detail, status, list
- Product API: save, get
- Asset API: upload, list assets, list analyses
- Pipeline API: start, list TaskRuns, retry failed TaskRun
- Script API: list by project, detail
- Shot API: list by script, list by project
- Prompt API: list by project, script, model
- Export API: create package, get status, download zip

## 12. Required Worker Tasks
- `run_asset_understanding`
- `run_asset_gap_detection`
- `run_trend_structuring`
- `run_script_generation`
- `run_shot_breakdown`
- `run_shot_classification`
- `run_model_prompt_generation`
- `run_export_assembly`

Each Worker task must:
- read `task_run_id`
- validate TaskRun state
- set status to `processing`
- load only current-stage inputs
- write structured output
- set status to `success` or `failed`
- write `error_message` on failure
- avoid executing other stages

## 13. Storage Rules
- use local filesystem
- derive all paths from `STORAGE_ROOT`
- support Docker volume mounts
- do not hardcode absolute local paths
- do not expose real filesystem paths to clients
- use system-generated safe filenames

Recommended layout:
```text
{STORAGE_ROOT}/projects/{project_id}/
  assets/original/
  analysis/
  prompts/
  exports/
  logs/
```

## 14. Environment Variables
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

Startup must fail loudly if missing:
- `DATABASE_URL`
- `STORAGE_ROOT`
- `AI_API_KEY`

Deployment targets:
- local MacBook runs backend, worker, database, queue, local storage
- Mac mini Docker is ready for backend, worker, database, queue, persistent storage volume

## 15. Error Handling Requirements
Must handle:
- missing product info
- missing product assets
- file not found
- unsupported file type
- missing `AI_API_KEY`
- invalid AI JSON
- AI output missing fields
- Worker task failure
- export dependency data missing
- export directory not writable

Retry rules:
- failed TaskRuns are retryable
- default max retry count is 3
- retry updates status, retry count, timestamps, and error message

## 16. Acceptance Criteria
Business loop:
1. Create Project
2. Save Product
3. Upload Asset
4. Generate AssetAnalysis
5. Generate AssetGapReport
6. Generate TrendInsight or fallback
7. Generate 5 Scripts
8. Generate Shots
9. Generate ModelPrompts
10. Generate ExportPackage

Data:
- database contains all required MVP data objects

Files:
- export contains `brief.json`, `scripts.md`, `shots.json`, `model_prompts.json`, and `asset_gap_report.json`

Status:
- project status, current step, TaskRun status, and failed task error message are queryable

Deployment:
- full loop works on local MacBook
- Mac mini Docker keeps database, uploaded files, and exports persistent after restart

## 17. Codex Execution Rules
- Codex should only implement MVP scope.
- Codex must not add deferred features.
- Codex must not redesign architecture.
- Codex must not rename frozen fields.
- Codex must not bypass Worker.
- Codex must not bypass TaskRun.
- Codex must not call AI directly from API routes.
- Codex must not hardcode local paths.
- Each task should modify only the specified file.
- Do not create extra tables beyond the MVP data objects.
- Do not turn deferred stages into required implementation work.
- Keep this file short and execution-oriented instead of copying full design docs.
