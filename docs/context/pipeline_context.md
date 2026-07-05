# Pipeline Context

## 1. Pipeline Principle

- Pipeline must be staged.
- API routes must not run long AI tasks.
- Worker tasks execute one stage only.
- Each stage reads previous outputs from database.
- Each stage writes structured output to database.
- TaskRun records execution status.
- Pipeline must be recoverable and retryable.

MVP notes:

- `project_brief_normalization` can be handled during Project/Product preparation.
- the first queued async task is `asset_understanding`.
- export reads existing structured data only.

## 2. MVP Pipeline Order

1. `project_brief_normalization`
2. `asset_understanding`
3. `asset_gap_detection`
4. `trend_structuring`
5. `script_generation`
6. `shot_breakdown`
7. `shot_classification`
8. `model_prompt_generation`
9. `export_assembly`

## 3. Deferred Pipeline Stages

Do not implement these as independent MVP stages:

- `automatic_trend_fetch`
- `script_quality_check`
- `independent_shot_asset_recheck`
- `pipeline_summary`

Deferred strategy:

- `automatic_trend_fetch` is replaced by user trend input or fallback TrendInsight.
- `script_quality_check` is not an independent MVP stage.
- `independent_shot_asset_recheck` is merged into Shot classification fields.
- `pipeline_summary` is deferred.

## 4. Pipeline Stage Details

### project_brief_normalization

- Goal: normalize user product input into stable Project/Product fields.
- Input: `project_id`, raw Product input, target market, target language, objective.
- Output: normalized Product fields for later stages.
- Worker: no dedicated queued Worker required in MVP.
- Rules: may use rules plus LLM; do not invent product functions or claims; if input is too incomplete, Project may become `needs_user_input`.

### asset_understanding

- Input: `project_id`, Product, Asset list, Asset metadata, user-selected `asset_type`.
- Output: AssetAnalysis records.
- Worker: `run_asset_understanding`.
- Rules: each Asset should produce one AssetAnalysis; if file is missing, fail TaskRun with `error_message`; do not generate scripts here.

### asset_gap_detection

- Input: `project_id`, Product, AssetAnalysis list.
- Output: AssetGapReport.
- Worker: `run_asset_gap_detection`.
- Rules: detect `missing_assets`, `available_assets`, `risk_level`, `recommendations`; if no basic product asset exists, Project may become `needs_user_input`; do not generate scripts here.

### trend_structuring

- Input: `project_id`, Product, optional user trend text, optional reference links, fallback flag.
- Output: TrendInsight.
- Worker: `run_trend_structuring`.
- Rules: do not call TikTok scraping APIs in MVP; if no trend input exists, create fallback TrendInsight; mark `is_fallback`; output structured patterns, not only summary prose.

### script_generation

- Input: `project_id`, Product, AssetGapReport, TrendInsight.
- Output: 5 Script records.
- Worker: `run_script_generation`.
- Rules: generate exactly 5 scripts; each Script must have a different `creative_angle`; each Script must include `hook`, `main_message`, `voiceover`, `subtitles`, `cta`, `estimated_duration`, `required_assets`, `risk_notes`; do not depend strongly on missing assets; do not invent product functions.

### shot_breakdown

- Input: `project_id`, Script list, Product, AssetGapReport.
- Output: Shot records.
- Worker: `run_shot_breakdown`.
- Rules: each Script should produce 4-8 Shots; each Shot must be a single shot; each Shot must include `order_index`, `duration`, `visual`, `action`, `subtitle`, `shot_type`, `purpose`; do not generate ModelPrompt here.

### shot_classification

- Input: `project_id`, Shot list, AssetAnalysis list, AssetGapReport.
- Output: updated Shot classification and asset risk fields.
- Worker: `run_shot_classification`.
- Rules: set or validate `shot_type`, `asset_dependency`, `missing_asset_types`, `ai_fallback_possible`, `realism_risk`, `recommendation`; do not create independent ShotAssetCheck table in MVP.

### model_prompt_generation

- Input: `project_id`, Shot list, Product, AssetGapReport, target models.
- Output: ModelPrompt records.
- Worker: `run_model_prompt_generation`.
- Rules: each Shot must have at least one ModelPrompt; default models are `kling`, `seedance`, `jimeng`; each ModelPrompt must include `prompt`, `negative_prompt`, `aspect_ratio`, `duration`, `model`; prompt duration must align with Shot duration; do not generate final video.

### export_assembly

- Input: `project_id`, Project, Product, AssetGapReport, TrendInsight, Script list, Shot list, ModelPrompt list.
- Output: ExportPackage, `brief.json`, `scripts.md`, `shots.json`, `model_prompts.json`, `asset_gap_report.json`, `export.zip`.
- Worker: `run_export_assembly`.
- Rules: only read existing database results; do not call AI; do not regenerate Script, Shot, or ModelPrompt; if required data is missing, fail TaskRun with `error_message`.

## 5. Worker Task Mapping

- `asset_understanding` -> `run_asset_understanding`
- `asset_gap_detection` -> `run_asset_gap_detection`
- `trend_structuring` -> `run_trend_structuring`
- `script_generation` -> `run_script_generation`
- `shot_breakdown` -> `run_shot_breakdown`
- `shot_classification` -> `run_shot_classification`
- `model_prompt_generation` -> `run_model_prompt_generation`
- `export_assembly` -> `run_export_assembly`

## 6. TaskRun Rules

- Every async Pipeline stage must have a TaskRun.
- Each TaskRun belongs to one Project.
- Each TaskRun has one `task_type`.
- Worker must set `status = processing` before execution.
- Worker must set `status = success` after successful write.
- Worker must set `status = failed` on exception.
- Worker failure must write `error_message`.
- Worker must not leave TaskRun stuck in `processing`.
- `retry_count` must be checked before retry.
- success TaskRun must not be re-executed.

MVP TaskRun status:

- `pending`
- `queued`
- `processing`
- `success`
- `failed`
- `retrying`
- `needs_user_input`
- `cancelled`

## 7. Project Step Rules

MVP `current_step` values:

- `project_created`
- `asset_understanding`
- `asset_gap_detecting`
- `trend_structuring`
- `script_generating`
- `shot_breaking_down`
- `shot_classifying`
- `prompt_generating`
- `exporting`
- `completed`
- `failed`

Rules:

- Project `status` is overall status.
- Project `current_step` shows current Pipeline stage.
- TaskRun `status` shows exact task execution status.
- update `current_step` when the next stage begins.
- set Project to `completed` only after successful export.

## 8. AI Output Validation Rules

Script validation:

- output count must be 5
- each Script must include `creative_angle`, `hook`, `cta`, `estimated_duration`, `required_assets`

Shot validation:

- each Script must have 4-8 Shots
- each Shot must include `duration`, `visual`, `action`, `shot_type`
- `shot_type` must be a legal enum

ModelPrompt validation:

- each Shot must have at least one Prompt
- `prompt`, `model`, `aspect_ratio`, `duration` must exist

General validation:

- AI output must be parseable structured data
- missing required fields should fail validation

## 9. Fallback Rules

- if product input is too incomplete, request user input before continuing
- if no trend input exists, generate fallback TrendInsight
- if trend structuring output is incomplete, retry once and then use fallback template
- if a Shot lacks enough detail for rich prompting, generate a basic Prompt and mark `generation_notes`
- if asset risk is high, preserve risk fields instead of inventing missing real footage

## 10. Failure Handling Rules

- every failure must write `error_message`
- retry only the failed stage when possible
- export failure should re-run only `export_assembly`
- missing required upstream data should fail fast
- do not continue to a later stage if required structured output is absent
- Project may move to `needs_user_input` when missing assets or insufficient product input block progress

## 11. Codex Pipeline Rules

- Implement only the MVP stage order in this file.
- Do not add independent `automatic_trend_fetch`, `script_quality_check`, `independent_shot_asset_recheck`, or `pipeline_summary` stages.
- Do not run long AI work inside API routes.
- Do not combine multiple stage responsibilities into one Worker task unless explicitly required by MVP rules.
- Do not bypass TaskRun.
- Do not bypass persisted stage outputs in database.
- Do not generate final video in the Pipeline.
- When a task specifies one file, only modify that file.
