# Data Context

## 1. Data Design Principle

- Project is the root container.
- All MVP business data belongs to a Project.
- Raw data and structured AI output should be separated when possible.
- Pipeline state must be recoverable through TaskRun.

## 2. MVP Data Objects

Required MVP objects:

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

## 3. Deferred Data Objects

Do not create independent MVP tables for:

- SKU
- TrendFetch
- TrendRawItem
- ShotAssetCheck

Deferred strategy:

- SKU fields are merged into Product.
- TrendFetch is represented by TaskRun and TrendInsight metadata.
- TrendRawItem is not required in MVP.
- ShotAssetCheck fields are merged into Shot.

## 4. Core Relationships

- User -> Project
- Project -> Product
- Project -> Asset
- Asset -> AssetAnalysis
- Project -> AssetGapReport
- Project -> TrendInsight
- Project -> Script
- Script -> Shot
- Shot -> ModelPrompt
- Project -> ExportPackage
- Project -> TaskRun

Dependency rules:

- Script depends on Product, AssetAnalysis, AssetGapReport, TrendInsight
- Shot depends on Script, Product, AssetGapReport
- ModelPrompt depends on Shot, Product, Asset context
- ExportPackage depends on Product, AssetGapReport, TrendInsight, Script, Shot, ModelPrompt

## 5. Project

Required fields:

- `id`
- `user_id`
- `name`
- `status`
- `target_platform`
- `target_market`
- `target_language`
- `objective`
- `current_step`
- `created_at`
- `updated_at`

MVP `status`:

- `draft`
- `ready`
- `processing`
- `needs_user_input`
- `completed`
- `failed`

MVP `current_step`:

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

## 6. Product

Required fields:

- `id`
- `project_id`
- `name`
- `category`
- `description`
- `selling_points`
- `target_audience`
- `usage_scenarios`
- `price`
- `currency`
- `product_url`
- `sku_code`
- `brand_name`
- `created_at`
- `updated_at`

Rule:

- MVP merges SKU fields into Product.

## 7. Asset

Required fields:

- `id`
- `project_id`
- `uploaded_by`
- `asset_type`
- `file_name`
- `file_url`
- `file_size`
- `mime_type`
- `duration`
- `width`
- `height`
- `aspect_ratio`
- `source`
- `status`
- `created_at`

MVP `asset_type`:

- `product_image`
- `product_video`
- `usage_video`
- `hand_demo_video`
- `lifestyle_image`
- `lifestyle_video`
- `packaging_image`
- `logo`
- `competitor_ad`
- `reference_video`

MVP `status`:

- `uploaded`
- `processing`
- `analyzed`
- `failed`

## 8. AssetAnalysis

Required fields:

- `id`
- `asset_id`
- `project_id`
- `detected_objects`
- `detected_people`
- `detected_hands`
- `detected_product`
- `scene_type`
- `quality_score`
- `usability_score`
- `possible_usage`
- `limitations`
- `created_at`

## 9. AssetGapReport

Required fields:

- `id`
- `project_id`
- `stage`
- `missing_assets`
- `available_assets`
- `risk_level`
- `ai_substitution_possible`
- `recommendations`
- `created_at`

MVP `stage`:

- `pre_script`
- `post_shot`

MVP `risk_level`:

- `low`
- `medium`
- `high`
- `blocking`

## 10. TrendInsight

Required fields:

- `id`
- `project_id`
- `hook_patterns`
- `content_structures`
- `pacing_patterns`
- `emotional_angles`
- `visual_patterns`
- `ad_formulas`
- `trend_source`
- `source_text`
- `reference_links`
- `is_fallback`
- `summary`
- `created_at`

Rule:

- MVP does not require separate TrendFetch or TrendRawItem persistence.

## 11. Script

Required fields:

- `id`
- `project_id`
- `trend_insight_id`
- `title`
- `creative_angle`
- `target_emotion`
- `target_audience`
- `hook`
- `main_message`
- `voiceover`
- `subtitles`
- `cta`
- `estimated_duration`
- `required_assets`
- `risk_notes`
- `status`
- `created_at`

Rules:

- each Project generates exactly 5 Scripts
- each Script must include `creative_angle`, `hook`, `main_message`, `cta`, `estimated_duration`

## 12. Shot

Required fields:

- `id`
- `project_id`
- `script_id`
- `order_index`
- `duration`
- `visual`
- `action`
- `voiceover`
- `subtitle`
- `shot_type`
- `asset_dependency`
- `missing_asset_types`
- `ai_fallback_possible`
- `realism_risk`
- `recommendation`
- `camera_motion`
- `scene`
- `purpose`
- `created_at`

MVP `shot_type`:

- `REAL`
- `AI`
- `HYBRID`
- `PRODUCT`
- `TEXT`

Rules:

- each Script has 4-8 Shots
- Shot absorbs deferred ShotAssetCheck fields in MVP

## 13. ModelPrompt

Required fields:

- `id`
- `project_id`
- `script_id`
- `shot_id`
- `model`
- `prompt`
- `negative_prompt`
- `aspect_ratio`
- `duration`
- `camera_motion`
- `scene_description`
- `visual_style`
- `motion_description`
- `asset_reference`
- `generation_notes`
- `created_at`

MVP `model`:

- `kling`
- `seedance`
- `jimeng`

Rule:

- each Shot must have at least one ModelPrompt

## 14. ExportPackage

Required fields:

- `id`
- `project_id`
- `status`
- `file_url`
- `included_files`
- `error_message`
- `created_at`
- `completed_at`

MVP `included_files`:

- `brief.json`
- `scripts.md`
- `shots.json`
- `model_prompts.json`
- `asset_gap_report.json`
- `export.zip`

## 15. TaskRun

Required fields:

- `id`
- `project_id`
- `task_type`
- `status`
- `input_ref`
- `output_ref`
- `error_message`
- `retry_count`
- `started_at`
- `completed_at`
- `created_at`

MVP `task_type`:

- `asset_understanding`
- `asset_gap_detection`
- `trend_structuring`
- `script_generation`
- `shot_breakdown`
- `shot_classification`
- `model_prompt_generation`
- `export_assembly`

MVP `status`:

- `pending`
- `queued`
- `processing`
- `success`
- `failed`
- `retrying`
- `needs_user_input`
- `cancelled`

Rule:

- every async pipeline stage must create a TaskRun

## 16. Enums

- `ProjectStatus`: `draft`, `ready`, `processing`, `needs_user_input`, `completed`, `failed`
- `ProjectCurrentStep`: `project_created`, `asset_understanding`, `asset_gap_detecting`, `trend_structuring`, `script_generating`, `shot_breaking_down`, `shot_classifying`, `prompt_generating`, `exporting`, `completed`, `failed`
- `AssetType`: `product_image`, `product_video`, `usage_video`, `hand_demo_video`, `lifestyle_image`, `lifestyle_video`, `packaging_image`, `logo`, `competitor_ad`, `reference_video`
- `AssetStatus`: `uploaded`, `processing`, `analyzed`, `failed`
- `RiskLevel`: `low`, `medium`, `high`, `blocking`
- `ShotType`: `REAL`, `AI`, `HYBRID`, `PRODUCT`, `TEXT`
- `VideoModel`: `kling`, `seedance`, `jimeng`
- `TaskRunStatus`: `pending`, `queued`, `processing`, `success`, `failed`, `retrying`, `needs_user_input`, `cancelled`

## 17. Data Integrity Rules

- Every Project belongs to one User.
- Every Project has one Product in MVP.
- Every Project must have `target_market` and `objective`.
- Every Asset belongs to one Project and must have `asset_type`, `file_url`, `mime_type`, `status`.
- Every AssetAnalysis belongs to one Asset and one Project.
- Every AssetGapReport belongs to one Project.
- Every TrendInsight belongs to one Project.
- Every Script belongs to one Project.
- Every Shot belongs to one Script and one Project.
- Every ModelPrompt belongs to one Shot, one Script, and one Project.
- Every ExportPackage belongs to one Project.
- Every TaskRun belongs to one Project.
- Script count per Project is 5 in MVP.
- Shot count per Script is 4-8 in MVP.

## 18. Export Data Sources

- `brief.json` <- Project + Product + TrendInsight + AssetGapReport
- `scripts.md` <- Script
- `shots.json` <- Shot
- `model_prompts.json` <- ModelPrompt
- `asset_gap_report.json` <- AssetGapReport
- `export.zip` <- assembled package of the files above

MVP export rules:

- no separate SKU file; use Product merged fields
- no separate model-specific prompt files required; use one `model_prompts.json`

## 19. Codex Data Rules

- Implement only the MVP objects listed here.
- Do not create SKU, TrendFetch, TrendRawItem, or ShotAssetCheck tables.
- Do not rename frozen fields or enums.
- Do not expand Project status into non-MVP granular states.
- Do not bypass TaskRun for async execution.
- Do not collapse structured MVP outputs into raw blobs when a dedicated object exists.
- When a task specifies one file, only modify that file.
