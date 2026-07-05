## 1. 文档目标

本文档用于定义 AI 短视频广告生成系统中的核心数据对象、数据关系、状态流转和存储边界。

它的目标不是做复杂数据库设计，而是先把业务流程中的关键实体固定下来，确保后续：

* AI Pipeline 可以按数据流执行
* Worker 可以按状态推进任务
* Codex 可以按明确的数据结构开发
* 前端可以按统一字段展示
* 导出文件可以稳定生成

---

## 2. 数据设计原则

本系统的数据设计遵循以下原则：

### 2.1 Project 是核心容器

所有数据都必须归属于一个 Project。

包括：

* 产品信息
* SKU 信息
* 素材
* 趋势数据
* 脚本
* 分镜
* Prompt
* 任务状态
* 导出文件

---

### 2.2 Pipeline 数据分阶段沉淀

系统不是一次性生成最终结果，而是分阶段生成中间数据。

每个阶段都要有可追踪的数据产物。

核心阶段包括：

* Project
* Product
* Assets
* Asset Analysis
* Asset Gap Detection
* Trend Raw Data
* Trend Structured Data
* Scripts
* Shots
* Model Prompts
* Export Package
* Task Runs

---

### 2.3 原始数据与结构化数据分离

系统中存在两类数据：

第一类是原始数据：

* 用户上传的素材
* TikTok 抓取的原始视频数据
* 用户输入的产品描述
* LLM 原始输出

第二类是结构化数据：

* 素材分析结果
* 趋势结构化结果
* 脚本结构
* 分镜结构
* 视频模型 Prompt

两类数据需要分开存储，避免后续无法调试。

---

### 2.4 状态必须可恢复

因为系统包含多个异步步骤，所以任何阶段失败后，都应该知道：

* 当前执行到哪一步
* 哪个任务失败
* 失败原因是什么
* 是否可以重试
* 是否需要用户补充输入

---

## 3. 核心数据对象总览

系统核心数据对象包括：

| 对象             | 作用            |
| -------------- | ------------- |
| User           | 用户            |
| Project        | 广告生成项目        |
| Product        | 产品信息          |
| SKU            | 商品 SKU 信息     |
| Asset          | 用户上传素材        |
| AssetAnalysis  | 素材分析结果        |
| AssetGapReport | 素材缺口报告        |
| TrendFetch     | 趋势抓取任务        |
| TrendRawItem   | TikTok 原始趋势数据 |
| TrendInsight   | 趋势结构化结果       |
| Script         | 广告脚本          |
| Shot           | 分镜            |
| ShotAssetCheck | 分镜素材复查结果      |
| ModelPrompt    | 视频模型 Prompt   |
| ExportPackage  | 导出包           |
| TaskRun        | 异步任务记录        |

---

## 4. 核心数据关系

整体关系如下：

User
↓
Project
↓
Product / SKU
↓
Assets
↓
AssetAnalysis
↓
AssetGapReport
↓
TrendRawItem
↓
TrendInsight
↓
Scripts
↓
Shots
↓
ShotAssetCheck
↓
ModelPrompts
↓
ExportPackage

同时，TaskRun 贯穿整个流程，用于记录每一步异步任务的执行状态。

---

## 5. User 用户表

### 5.1 作用

记录系统用户。

### 5.2 核心字段

| 字段         | 说明    |
| ---------- | ----- |
| id         | 用户 ID |
| email      | 用户邮箱  |
| name       | 用户名称  |
| plan       | 用户套餐  |
| created_at | 创建时间  |
| updated_at | 更新时间  |

### 5.3 业务说明

User 不是当前系统的业务重点，但所有 Project 都需要绑定到 User。

---

## 6. Project 广告项目表

### 6.1 作用

Project 是一次广告生成任务的主容器。

所有业务数据都必须挂在 Project 下。

### 6.2 核心字段

| 字段              | 说明     |
| --------------- | ------ |
| id              | 项目 ID  |
| user_id         | 用户 ID  |
| name            | 项目名称   |
| status          | 项目状态   |
| target_platform | 目标平台   |
| target_market   | 目标市场   |
| target_language | 目标语言   |
| objective       | 投放目标   |
| current_step    | 当前流程步骤 |
| created_at      | 创建时间   |
| updated_at      | 更新时间   |

---

### 6.3 Project 状态

Project status 包括：

| 状态                 | 说明          |
| ------------------ | ----------- |
| draft              | 草稿          |
| assets_uploaded    | 已上传素材       |
| analyzing_assets   | 正在分析素材      |
| assets_analyzed    | 素材分析完成      |
| fetching_trends    | 正在抓取趋势      |
| trends_ready       | 趋势数据完成      |
| generating_scripts | 正在生成脚本      |
| scripts_ready      | 脚本完成        |
| generating_shots   | 正在生成分镜      |
| shots_ready        | 分镜完成        |
| generating_prompts | 正在生成 Prompt |
| prompts_ready      | Prompt 完成   |
| exporting          | 正在导出        |
| completed          | 已完成         |
| failed             | 失败          |
| needs_user_input   | 需要用户补充信息    |

---

### 6.4 业务说明

Project 的状态用于前端展示整体进度。

TaskRun 负责记录具体任务执行细节。

---

## 7. Product 产品信息表

### 7.1 作用

记录用户输入的产品基础信息。

### 7.2 核心字段

| 字段              | 说明    |
| --------------- | ----- |
| id              | 产品 ID |
| project_id      | 项目 ID |
| name            | 产品名称  |
| category        | 产品品类  |
| description     | 产品描述  |
| selling_points  | 产品卖点  |
| target_audience | 目标用户  |
| usage_scenarios | 使用场景  |
| price           | 价格    |
| brand_name      | 品牌名   |
| created_at      | 创建时间  |
| updated_at      | 更新时间  |

---

### 7.3 selling_points

selling_points 用于记录产品卖点。

示例：

* easy_to_use
* portable
* affordable
* premium_material
* solves_daily_problem

---

### 7.4 usage_scenarios

usage_scenarios 用于记录产品使用场景。

示例：

* home
* travel
* office
* outdoor
* beauty_routine
* fitness
* kitchen

---

## 8. SKU 商品信息表

### 8.1 作用

记录具体商品 SKU 信息。

一个 Project 可以只有一个 SKU，也可以扩展为多个 SKU。

### 8.2 核心字段

| 字段           | 说明     |
| ------------ | ------ |
| id           | SKU ID |
| project_id   | 项目 ID  |
| product_id   | 产品 ID  |
| sku_code     | SKU 编码 |
| product_url  | 商品链接   |
| variant_name | 规格名称   |
| price        | SKU 价格 |
| currency     | 货币     |
| availability | 是否可售   |
| created_at   | 创建时间   |
| updated_at   | 更新时间   |

---

## 9. Asset 素材表

### 9.1 作用

记录用户上传的所有素材。

素材可以是：

* 图片
* 视频
* logo
* 包装图
* 竞品素材
* 参考广告

---

### 9.2 核心字段

| 字段           | 说明    |
| ------------ | ----- |
| id           | 素材 ID |
| project_id   | 项目 ID |
| uploaded_by  | 上传用户  |
| asset_type   | 素材类型  |
| file_name    | 文件名   |
| file_url     | 文件地址  |
| file_size    | 文件大小  |
| mime_type    | 文件类型  |
| duration     | 视频时长  |
| width        | 宽度    |
| height       | 高度    |
| aspect_ratio | 画幅比例  |
| source       | 素材来源  |
| status       | 素材状态  |
| created_at   | 创建时间  |

---

### 9.3 asset_type

asset_type 包括：

| 类型              | 说明      |
| --------------- | ------- |
| product_image   | 产品图片    |
| product_video   | 产品视频    |
| usage_video     | 使用视频    |
| hand_demo_video | 手部操作视频  |
| lifestyle_image | 生活方式图片  |
| lifestyle_video | 生活方式视频  |
| packaging_image | 包装图     |
| logo            | 品牌 logo |
| competitor_ad   | 竞品广告    |
| reference_video | 参考视频    |

---

### 9.4 Asset 状态

Asset status 包括：

| 状态         | 说明   |
| ---------- | ---- |
| uploaded   | 已上传  |
| processing | 分析中  |
| analyzed   | 已分析  |
| failed     | 分析失败 |

---

## 10. AssetAnalysis 素材分析表

### 10.1 作用

记录每个素材的分析结果。

Asset 是原始素材记录，AssetAnalysis 是 AI 或系统对素材的结构化理解。

---

### 10.2 核心字段

| 字段               | 说明      |
| ---------------- | ------- |
| id               | 分析 ID   |
| asset_id         | 素材 ID   |
| project_id       | 项目 ID   |
| detected_objects | 识别出的对象  |
| detected_people  | 是否有人    |
| detected_hands   | 是否有手    |
| detected_product | 是否有产品   |
| scene_type       | 场景类型    |
| quality_score    | 素材质量评分  |
| usability_score  | 广告可用性评分 |
| possible_usage   | 可用于哪些镜头 |
| limitations      | 局限      |
| created_at       | 创建时间    |

---

### 10.3 possible_usage

possible_usage 示例：

* product_close_up
* product_demo
* hook_visual
* before_after
* lifestyle_scene
* trust_building
* conversion_shot

---

### 10.4 limitations

limitations 示例：

* low_resolution
* bad_lighting
* product_not_clear
* no_human_usage
* wrong_aspect_ratio
* too_short
* shaky_video

---

## 11. AssetGapReport 素材缺口报告表

### 11.1 作用

记录系统对当前项目素材缺口的判断。

素材缺口报告会出现两次：

第一次：脚本生成前
第二次：分镜生成后

---

### 11.2 核心字段

| 字段                       | 说明         |
| ------------------------ | ---------- |
| id                       | 报告 ID      |
| project_id               | 项目 ID      |
| stage                    | 检测阶段       |
| missing_assets           | 缺失素材       |
| available_assets         | 可用素材       |
| risk_level               | 风险等级       |
| ai_substitution_possible | 是否可以 AI 替代 |
| recommendations          | 建议补充素材     |
| created_at               | 创建时间       |

---

### 11.3 stage

stage 包括：

| 阶段         | 说明    |
| ---------- | ----- |
| pre_script | 脚本生成前 |
| post_shot  | 分镜生成后 |

---

### 11.4 risk_level

risk_level 包括：

| 风险       | 说明           |
| -------- | ------------ |
| low      | 素材基本足够       |
| medium   | 部分镜头需要 AI 替代 |
| high     | 缺少关键真实素材     |
| blocking | 无法继续生成有效广告方案 |

---

## 12. TrendFetch 趋势抓取任务表

### 12.1 作用

记录一次趋势抓取任务。

---

### 12.2 核心字段

| 字段            | 说明      |
| ------------- | ------- |
| id            | 趋势抓取 ID |
| project_id    | 项目 ID   |
| source        | 数据来源    |
| keyword       | 搜索关键词   |
| hashtag       | 搜索标签    |
| market        | 目标市场    |
| status        | 抓取状态    |
| raw_count     | 原始数据数量  |
| error_message | 错误信息    |
| created_at    | 创建时间    |
| completed_at  | 完成时间    |

---

### 12.3 source

source 包括：

* scrape_creators_api
* tiktok_keyword
* tiktok_hashtag
* manual_reference
* competitor_link

---

## 13. TrendRawItem 趋势原始数据表

### 13.1 作用

保存从 TikTok 或其他来源抓取到的原始趋势内容。

---

### 13.2 核心字段

| 字段             | 说明        |
| -------------- | --------- |
| id             | 原始趋势 ID   |
| project_id     | 项目 ID     |
| trend_fetch_id | 趋势抓取任务 ID |
| platform       | 平台        |
| video_url      | 视频链接      |
| author_name    | 作者        |
| caption        | 文案        |
| hashtags       | 标签        |
| music_title    | 音乐        |
| like_count     | 点赞数       |
| comment_count  | 评论数       |
| share_count    | 分享数       |
| save_count     | 收藏数       |
| published_at   | 发布时间      |
| duration       | 视频时长      |
| raw_payload    | 原始数据      |
| created_at     | 创建时间      |

---

### 13.3 业务说明

TrendRawItem 用于保留原始趋势数据。

后续如果 TrendInsight 生成质量不好，可以回溯原始数据重新结构化。

---

## 14. TrendInsight 趋势结构化结果表

### 14.1 作用

记录 LLM 对原始趋势内容的结构化分析结果。

---

### 14.2 核心字段

| 字段                   | 说明      |
| -------------------- | ------- |
| id                   | 趋势结构 ID |
| project_id           | 项目 ID   |
| trend_fetch_id       | 趋势抓取 ID |
| hook_patterns        | 开头模式    |
| content_structures   | 内容结构    |
| pacing_patterns      | 节奏模式    |
| emotional_angles     | 情绪角度    |
| visual_patterns      | 视觉模式    |
| music_styles         | 音乐风格    |
| caption_styles       | 文案风格    |
| audience_pain_points | 用户痛点    |
| ad_formulas          | 可复用广告公式 |
| summary              | 趋势摘要    |
| created_at           | 创建时间    |

---

### 14.3 示例内容

hook_patterns 示例：

* pain_point_first
* curiosity_gap
* before_after
* mistake_warning
* personal_testimonial

content_structures 示例：

* problem_solution_result
* hook_demo_proof_cta
* before_after_explanation
* ugc_story_reveal
* fast_demo_price_cta

---

## 15. Script 广告脚本表

### 15.1 作用

记录系统生成的广告脚本。

一个 Project 默认生成 5 个 Script。

---

### 15.2 核心字段

| 字段                 | 说明      |
| ------------------ | ------- |
| id                 | 脚本 ID   |
| project_id         | 项目 ID   |
| trend_insight_id   | 趋势结构 ID |
| title              | 脚本标题    |
| creative_angle     | 创意角度    |
| target_emotion     | 目标情绪    |
| target_audience    | 目标用户    |
| hook               | 开头 hook |
| main_message       | 核心信息    |
| voiceover          | 口播文案    |
| subtitles          | 字幕文案    |
| cta                | 行动号召    |
| estimated_duration | 预计时长    |
| required_assets    | 需要素材    |
| risk_notes         | 风险提示    |
| status             | 脚本状态    |
| created_at         | 创建时间    |

---

### 15.3 creative_angle

creative_angle 包括：

* pain_solution
* before_after
* ugc_testimonial
* product_demo
* unboxing
* emotional_trigger
* competitor_comparison
* lifestyle
* price_offer
* problem_warning

---

### 15.4 Script 状态

Script status 包括：

| 状态          | 说明    |
| ----------- | ----- |
| generated   | 已生成   |
| approved    | 已确认   |
| rejected    | 已拒绝   |
| regenerated | 已重新生成 |

---

## 16. Shot 分镜表

### 16.1 作用

记录每个广告脚本拆分后的镜头。

一个 Script 会包含多个 Shot。

---

### 16.2 核心字段

| 字段               | 说明    |
| ---------------- | ----- |
| id               | 分镜 ID |
| project_id       | 项目 ID |
| script_id        | 脚本 ID |
| order_index      | 镜头顺序  |
| duration         | 镜头时长  |
| visual           | 画面描述  |
| action           | 动作描述  |
| voiceover        | 口播    |
| subtitle         | 字幕    |
| shot_type        | 分镜类型  |
| asset_dependency | 素材依赖  |
| camera_motion    | 镜头运动  |
| scene            | 场景    |
| transition       | 转场    |
| purpose          | 镜头目的  |
| created_at       | 创建时间  |

---

### 16.3 shot_type

shot_type 包括：

| 类型      | 说明           |
| ------- | ------------ |
| REAL    | 真实素材镜头       |
| AI      | AI 生成镜头      |
| HYBRID  | 真实素材 + AI 增强 |
| PRODUCT | 强产品展示镜头      |
| TEXT    | 文字强化镜头       |

---

### 16.4 purpose

purpose 包括：

* hook_attention
* show_problem
* reveal_product
* demonstrate_usage
* show_result
* build_trust
* show_offer
* drive_conversion
* cta

---

## 17. ShotAssetCheck 分镜素材复查表

### 17.1 作用

记录每个 shot 是否有足够素材支撑。

---

### 17.2 核心字段

| 字段                   | 说明         |
| -------------------- | ---------- |
| id                   | 复查 ID      |
| project_id           | 项目 ID      |
| shot_id              | 分镜 ID      |
| has_required_asset   | 是否有需要素材    |
| matched_asset_ids    | 匹配到的素材     |
| missing_asset_types  | 缺失素材类型     |
| ai_fallback_possible | 是否可以 AI 替代 |
| realism_risk         | 真实感风险      |
| recommendation       | 建议         |
| created_at           | 创建时间       |

---

### 17.3 realism_risk

realism_risk 包括：

| 风险       | 说明         |
| -------- | ---------- |
| low      | 真实感风险低     |
| medium   | 部分 AI 替代   |
| high     | 关键镜头缺少真实素材 |
| blocking | 无法生成可信视频   |

---

## 18. ModelPrompt 视频模型 Prompt 表

### 18.1 作用

记录每个 Shot 转换后的模型 Prompt。

一个 Shot 可以对应多个模型 Prompt。

例如：

* Kling Prompt
* Seedance Prompt
* 即梦 Prompt

---

### 18.2 核心字段

| 字段                 | 说明        |
| ------------------ | --------- |
| id                 | Prompt ID |
| project_id         | 项目 ID     |
| script_id          | 脚本 ID     |
| shot_id            | 分镜 ID     |
| model              | 视频模型      |
| prompt             | 正向 Prompt |
| negative_prompt    | 负向 Prompt |
| aspect_ratio       | 画幅        |
| duration           | 时长        |
| camera_motion      | 镜头运动      |
| scene_description  | 场景描述      |
| visual_style       | 视觉风格      |
| motion_description | 动作描述      |
| asset_reference    | 素材引用      |
| generation_notes   | 生成备注      |
| created_at         | 创建时间      |

---

### 18.3 model

model 包括：

* kling
* seedance
* jimeng

---

### 18.4 aspect_ratio

默认使用：

* 9:16

可扩展：

* 1:1
* 16:9
* 4:5

---

## 19. ExportPackage 导出包表

### 19.1 作用

记录最终导出的广告生产包。

---

### 19.2 核心字段

| 字段             | 说明     |
| -------------- | ------ |
| id             | 导出包 ID |
| project_id     | 项目 ID  |
| status         | 导出状态   |
| file_url       | 导出包地址  |
| included_files | 包含文件   |
| error_message  | 错误信息   |
| created_at     | 创建时间   |
| completed_at   | 完成时间   |

---

### 19.3 included_files

included_files 包括：

* brief.json
* scripts.md
* shots.json
* kling_prompts.json
* seedance_prompts.json
* jimeng_prompts.json
* asset_gap_report.json
* export.zip

---

## 20. TaskRun 异步任务记录表

### 20.1 作用

记录 Pipeline 中每个异步任务的执行状态。

TaskRun 是系统可恢复、可重试、可观测的关键。

---

### 20.2 核心字段

| 字段            | 说明    |
| ------------- | ----- |
| id            | 任务 ID |
| project_id    | 项目 ID |
| task_type     | 任务类型  |
| status        | 任务状态  |
| input_ref     | 输入引用  |
| output_ref    | 输出引用  |
| error_message | 错误信息  |
| retry_count   | 重试次数  |
| started_at    | 开始时间  |
| completed_at  | 完成时间  |
| created_at    | 创建时间  |

---

### 20.3 task_type

task_type 包括：

* create_project
* upload_asset
* analyze_asset
* detect_asset_gap
* fetch_trends
* structure_trends
* generate_scripts
* generate_shots
* classify_shots
* check_shot_assets
* generate_model_prompts
* export_package

---

### 20.4 TaskRun 状态

TaskRun status 包括：

| 状态               | 说明     |
| ---------------- | ------ |
| pending          | 等待执行   |
| queued           | 已入队    |
| processing       | 执行中    |
| success          | 执行成功   |
| failed           | 执行失败   |
| retrying         | 重试中    |
| needs_user_input | 需要用户输入 |
| cancelled        | 已取消    |

---

## 21. 关键枚举设计

### 21.1 ProjectStatus

* draft
* assets_uploaded
* analyzing_assets
* assets_analyzed
* fetching_trends
* trends_ready
* generating_scripts
* scripts_ready
* generating_shots
* shots_ready
* generating_prompts
* prompts_ready
* exporting
* completed
* failed
* needs_user_input

---

### 21.2 AssetType

* product_image
* product_video
* usage_video
* hand_demo_video
* lifestyle_image
* lifestyle_video
* packaging_image
* logo
* competitor_ad
* reference_video

---

### 21.3 ShotType

* REAL
* AI
* HYBRID
* PRODUCT
* TEXT

---

### 21.4 RiskLevel

* low
* medium
* high
* blocking

---

### 21.5 VideoModel

* kling
* seedance
* jimeng

---

### 21.6 TaskStatus

* pending
* queued
* processing
* success
* failed
* retrying
* needs_user_input
* cancelled

---

## 22. 数据生命周期

### 22.1 创建阶段

用户创建 Project。

生成：

* Project
* Product
* SKU

---

### 22.2 素材阶段

用户上传素材。

生成：

* Asset
* AssetAnalysis
* AssetGapReport

---

### 22.3 趋势阶段

系统抓取 TikTok 趋势。

生成：

* TrendFetch
* TrendRawItem
* TrendInsight

---

### 22.4 创意阶段

系统生成广告脚本。

生成：

* Script

---

### 22.5 分镜阶段

系统拆分脚本为镜头。

生成：

* Shot
* ShotAssetCheck

---

### 22.6 Prompt 阶段

系统将 Shot 转换成模型 Prompt。

生成：

* ModelPrompt

---

### 22.7 导出阶段

系统打包最终结果。

生成：

* ExportPackage

---

## 23. 数据依赖关系

### 23.1 Script 依赖

Script 依赖：

* Product
* SKU
* AssetAnalysis
* AssetGapReport
* TrendInsight

---

### 23.2 Shot 依赖

Shot 依赖：

* Script
* AssetGapReport
* Product

---

### 23.3 ModelPrompt 依赖

ModelPrompt 依赖：

* Shot
* Product
* Asset
* ShotAssetCheck

---

### 23.4 ExportPackage 依赖

ExportPackage 依赖：

* Product
* AssetGapReport
* TrendInsight
* Script
* Shot
* ModelPrompt

---

## 24. 数据完整性规则

### 24.1 Project 规则

每个 Project 必须属于一个 User。

每个 Project 至少需要：

* 一个 Product
* 一个目标市场
* 一个投放目标

---

### 24.2 Asset 规则

每个 Asset 必须属于一个 Project。

每个 Asset 必须有：

* asset_type
* file_url
* mime_type
* status

---

### 24.3 Script 规则

每个 Script 必须属于一个 Project。

每个 Script 必须包含：

* creative_angle
* hook
* main_message
* CTA
* estimated_duration

默认每个 Project 生成 5 个 Script。

---

### 24.4 Shot 规则

每个 Shot 必须属于一个 Script。

每个 Shot 必须包含：

* order_index
* duration
* visual
* action
* shot_type
* purpose

---

### 24.5 ModelPrompt 规则

每个 ModelPrompt 必须对应一个 Shot。

每个 ModelPrompt 必须包含：

* model
* prompt
* aspect_ratio
* duration

---

## 25. 文件存储设计

### 25.1 原始素材存储

原始素材建议按 Project 存储。

路径规则：

projects/{project_id}/assets/original/{asset_id}

---

### 25.2 分析结果存储

素材分析结果存储在数据库中。

如有大字段，可存储为 JSON 文件。

路径规则：

projects/{project_id}/analysis/{asset_id}.json

---

### 25.3 导出文件存储

导出包按 Project 存储。

路径规则：

projects/{project_id}/exports/{export_package_id}.zip

---

## 26. 导出文件数据来源

### 26.1 brief.json

数据来源：

* Project
* Product
* SKU
* TrendInsight
* AssetGapReport

---

### 26.2 scripts.md

数据来源：

* Script

---

### 26.3 shots.json

数据来源：

* Shot
* ShotAssetCheck

---

### 26.4 kling_prompts.json

数据来源：

* ModelPrompt where model = kling

---

### 26.5 seedance_prompts.json

数据来源：

* ModelPrompt where model = seedance

---

### 26.6 jimeng_prompts.json

数据来源：

* ModelPrompt where model = jimeng

---

### 26.7 asset_gap_report.json

数据来源：

* AssetGapReport
* ShotAssetCheck

---

## 27. 最小可开发版本数据范围

MVP 阶段只需要保留以下核心表：

* User
* Project
* Product
* Asset
* AssetAnalysis
* AssetGapReport
* TrendRawItem
* TrendInsight
* Script
* Shot
* ModelPrompt
* ExportPackage
* TaskRun

可以暂缓的表：

* SKU
* TrendFetch
* ShotAssetCheck

暂缓原因：

* SKU 可以先合并进 Product
* TrendFetch 可以先用 TaskRun 记录
* ShotAssetCheck 可以先合并进 Shot 的 asset_dependency 字段

---

## 28. MVP 数据流

MVP 数据流如下：

Project 创建
↓
Product 写入
↓
Asset 上传
↓
AssetAnalysis 生成
↓
AssetGapReport 生成
↓
TrendRawItem 写入
↓
TrendInsight 生成
↓
Script 生成
↓
Shot 生成
↓
ModelPrompt 生成
↓
ExportPackage 生成
↓
TaskRun 记录全过程

---

## 29. 后续扩展方向

后续可以扩展：

* 多 SKU 支持
* 多平台广告支持
* 多语言脚本支持
* 用户手动编辑脚本
* 用户审核脚本
* 用户选择部分脚本继续生成
* 素材版本管理
* Prompt 版本管理
* A/B Test 数据回传
* 广告投放效果分析
* 竞品素材库
* 品类趋势库
* 品牌语气库

---

## 30. 一句话总结

数据设计的核心是：

以 Project 为中心，
把产品、素材、趋势、脚本、分镜、Prompt 和导出包全部结构化沉淀，
并通过 TaskRun 记录异步 Pipeline 的执行过程。

这样后续 AI Pipeline、系统架构和 Codex Tasks 才能基于稳定的数据边界推进。
