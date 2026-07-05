## 1. 文档目标

本文档用于定义 AI 短视频广告生成系统第一版 MVP 的开发范围。

前面 5 个文档已经定义了完整系统：

* 01_business_flow.md：业务流程
* 02_data_design.md：数据设计
* 03_ai_pipeline.md：AI Pipeline
* 04_system_architecture.md：系统架构
* 05_risk_checklist.md：风险清单

本文档的目标是从完整系统中收敛出第一版最小可执行范围，明确：

* MVP 必须实现什么
* MVP 暂时不实现什么
* 哪些能力使用 fallback
* 哪些数据表必须保留
* 哪些 Pipeline 阶段必须跑通
* 哪些 API 必须提供
* 哪些 Worker 必须存在
* 哪些导出文件必须生成
* 本地 MacBook 如何先跑通
* Mac mini Docker 部署需要达到什么程度

---

## 2. MVP 核心目标

MVP 的核心目标不是做一个完整商业化平台，而是先跑通最小闭环：

用户输入产品信息
↓
上传产品素材
↓
系统分析素材边界
↓
生成素材缺口报告
↓
使用趋势输入或 fallback 趋势模板
↓
生成 5 个广告脚本
↓
拆分成分镜 shot list
↓
生成视频模型 Prompt
↓
导出结构化广告生产包

一句话：

MVP 要验证的是：

这个系统能不能从一个产品和素材出发，稳定生成一套可执行的短视频广告生产包。

---

## 3. MVP 成功标准

MVP 成功不以“广告最终投放效果”为标准。

MVP 成功标准是：

1. 用户可以创建一个广告项目
2. 用户可以录入产品信息
3. 用户可以上传至少一个产品素材
4. 系统可以生成素材分析结果
5. 系统可以生成素材缺口报告
6. 系统可以生成趋势结构或使用 fallback 趋势模板
7. 系统可以生成 5 个不同角度的广告脚本
8. 系统可以把每个脚本拆成 4-8 个 Shot
9. 系统可以为每个 Shot 生成视频模型 Prompt
10. 系统可以导出完整文件包
11. Worker 任务失败时可以记录错误
12. Project 可以展示当前执行状态
13. 本地 MacBook 可以完整跑通
14. Mac mini Docker 可以部署后端、Worker、数据库、队列和文件存储

---

## 4. MVP 不追求的目标

MVP 暂不追求：

* 自动生成最终视频
* 自动剪辑成片
* 自动发布 TikTok
* 自动投放广告
* 自动获取投放数据
* 自动做 A/B Test
* 自动优化广告预算
* 完整 TikTok 官方趋势抓取
* 多品牌管理
* 多团队协作
* 高级权限系统
* 大规模并发
* 云端对象存储
* Kubernetes 部署
* 企业级监控
* 复杂费用结算

这些能力不进入 MVP。

---

## 5. MVP 开发路径

MVP 按两个阶段执行。

### 5.1 第一阶段：MacBook 本地跑通

目标：

在 MacBook 本地跑通完整业务闭环。

包括：

* 本地启动后端
* 本地启动 Worker
* 本地启动数据库
* 本地启动队列
* 本地文件系统保存素材和导出文件
* 本地调用 AI Provider
* 本地导出结果文件

这一阶段优先验证：

* 数据结构是否可用
* Pipeline 是否能跑通
* AI 输出是否可解析
* Worker 状态是否可恢复
* 导出文件是否完整

---

### 5.2 第二阶段：Mac mini Docker 部署

目标：

将 MacBook 已跑通的后端系统迁移到 Mac mini 上，通过 Docker Compose 运行。

包括：

* backend-api container
* worker container
* database container
* queue container
* storage volume
* env 配置
* 局域网访问
* 导出文件持久化

迁移原则：

不改业务代码，只改环境变量、Docker 配置和 volume 挂载。

---

## 6. MVP 用户流程范围

MVP 用户流程只保留以下主流程：

创建 Project
↓
填写产品信息
↓
上传素材
↓
启动 Pipeline
↓
查看执行状态
↓
查看脚本结果
↓
查看分镜结果
↓
查看 Prompt 结果
↓
查看素材缺口报告
↓
下载导出包

MVP 不做复杂用户编辑流程。

可以暂缓：

* 用户在线编辑脚本
* 用户选择某几个脚本继续生成
* 用户手动调整 shot
* 用户编辑 prompt
* 用户在线预览视频
* 多版本对比
* 脚本审核流

---

## 7. MVP 输入范围

### 7.1 必填输入

MVP 中用户必须输入：

* 产品名称
* 产品品类
* 产品描述
* 至少 1 个核心卖点
* 目标市场
* 目标语言
* 投放目标
* 至少 1 个产品素材

---

### 7.2 可选输入

MVP 可选输入：

* 商品链接
* SKU 编码
* 产品价格
* 竞品描述
* TikTok 参考链接
* 用户手动输入的趋势文本
* 品牌名
* 使用场景
* 目标用户描述

---

### 7.3 默认值

如果用户未填写部分信息，可使用默认值，但必须明确标记。

默认值建议：

* target_platform = TikTok
* target_language = English
* objective = conversion
* aspect_ratio = 9:16
* script_count = 5
* shot_count_per_script = 4-8
* prompt_models = kling, seedance, jimeng

---

## 8. MVP 输出范围

MVP 最终输出包括：

* brief.json
* scripts.md
* shots.json
* model_prompts.json
* asset_gap_report.json
* export.zip

其中 model_prompts.json 可以先统一保存所有模型 Prompt。

后续再拆分为：

* kling_prompts.json
* seedance_prompts.json
* jimeng_prompts.json

MVP 可以直接在一个文件中保留 model 字段。

---

## 9. MVP 数据表范围

MVP 必须实现以下数据对象：

* User
* Project
* Product
* Asset
* AssetAnalysis
* AssetGapReport
* TrendInsight
* Script
* Shot
* ModelPrompt
* ExportPackage
* TaskRun

MVP 暂不单独实现以下表：

* SKU
* TrendFetch
* TrendRawItem
* ShotAssetCheck

---

## 10. 暂缓数据表处理方式

### 10.1 SKU 暂缓

SKU 信息先合并到 Product 中。

Product 中可保留：

* product_url
* sku_code
* price
* currency

后续多 SKU 再拆表。

---

### 10.2 TrendFetch 暂缓

趋势抓取任务先不独立建表。

趋势来源记录在 TrendInsight 中：

* trend_source
* source_text
* reference_links
* is_fallback

---

### 10.3 TrendRawItem 暂缓

MVP 不强制保存 TikTok 原始视频列表。

如果用户输入趋势文本或参考链接，直接保存到 TrendInsight metadata。

---

### 10.4 ShotAssetCheck 暂缓

Shot 素材复查结果先合并到 Shot 字段中。

Shot 中保留：

* asset_dependency
* missing_asset_types
* ai_fallback_possible
* realism_risk
* recommendation

后续需要更精细追踪时再拆 ShotAssetCheck 表。

---

## 11. MVP Project 状态范围

MVP Project status 使用以下状态：

* draft
* ready
* processing
* needs_user_input
* completed
* failed

为了降低复杂度，Project status 不需要在 MVP 中细分到所有阶段。

具体阶段由 current_step 和 TaskRun 表示。

---

## 12. MVP current_step 范围

Project current_step 使用以下阶段：

* project_created
* asset_understanding
* asset_gap_detecting
* trend_structuring
* script_generating
* shot_breaking_down
* shot_classifying
* prompt_generating
* exporting
* completed
* failed

current_step 用于前端展示当前进度。

---

## 13. MVP TaskRun 范围

MVP 必须为每个异步阶段创建 TaskRun。

TaskRun task_type 包括：

* asset_understanding
* asset_gap_detection
* trend_structuring
* script_generation
* shot_breakdown
* shot_classification
* model_prompt_generation
* export_assembly

TaskRun status 包括：

* pending
* queued
* processing
* success
* failed
* retrying
* needs_user_input
* cancelled

---

## 14. MVP AI Pipeline 范围

MVP 保留以下 Pipeline 阶段：

P0 Project Brief Normalization
P1 Asset Understanding
P2 Asset Gap Detection
P4 Trend Structuring
P5 Script Generation
P7 Shot Breakdown
P8 Shot Classification
P10 Model Prompt Generation
P11 Export Assembly

MVP 暂缓：

P3 自动 Trend Fetch
P6 Script Quality Check
P9 独立 Shot Asset Re-check
P12 Pipeline Summary

---

## 15. MVP Pipeline 简化说明

### 15.1 Project Brief Normalization

MVP 可以先用规则 + LLM 简单标准化产品信息。

输出：

* product_name
* category
* selling_points
* target_audience
* target_market
* target_language
* objective
* usage_scenarios
* claim_constraints

---

### 15.2 Asset Understanding

MVP 允许简化为：

* 用户手动选择 asset_type
* 系统读取文件元信息
* 图片使用视觉模型生成基础描述
* 视频可先不做复杂分析，只保存元信息或抽取首帧分析

输出：

* detected_product
* detected_people
* detected_hands
* scene_type
* quality_score
* possible_usage
* limitations

---

### 15.3 Asset Gap Detection

MVP 必须实现。

根据 Product 和 AssetAnalysis 判断缺少素材。

输出：

* missing_assets
* available_assets
* risk_level
* recommendations
* generation_constraints

---

### 15.4 Trend Structuring

MVP 不强制自动抓 TikTok。

输入来源优先级：

1. 用户输入趋势文本
2. 用户输入参考视频链接和描述
3. 系统 fallback trend templates

输出：

* hook_patterns
* content_structures
* pacing_patterns
* emotional_angles
* visual_patterns
* ad_formulas
* trend_source
* is_fallback

---

### 15.5 Script Generation

MVP 必须生成 5 个脚本。

默认角度：

1. pain_solution
2. before_after
3. ugc_testimonial
4. product_demo
5. emotional_trigger

每个 Script 必须包含：

* title
* creative_angle
* target_emotion
* hook
* main_message
* voiceover
* subtitles
* cta
* estimated_duration
* required_assets
* risk_notes

---

### 15.6 Shot Breakdown

MVP 必须把每个 Script 拆成 4-8 个 Shot。

每个 Shot 必须包含：

* order_index
* duration
* visual
* action
* voiceover
* subtitle
* shot_type
* asset_dependency
* camera_motion
* scene
* purpose

---

### 15.7 Shot Classification

MVP 必须支持以下 shot_type：

* REAL
* AI
* HYBRID
* PRODUCT
* TEXT

分类结果可以在 Shot Breakdown 阶段一并生成，也可以作为独立 Worker 阶段执行。

MVP 建议作为独立 Worker 阶段，方便后续扩展。

---

### 15.8 Model Prompt Generation

MVP 必须为每个 Shot 生成至少一个 ModelPrompt。

默认支持模型：

* kling
* seedance
* jimeng

每个 ModelPrompt 必须包含：

* model
* prompt
* negative_prompt
* aspect_ratio
* duration
* camera_motion
* scene_description
* visual_style
* motion_description
* asset_reference
* generation_notes

---

### 15.9 Export Assembly

MVP 必须生成导出包。

导出内容至少包括：

* brief.json
* scripts.md
* shots.json
* model_prompts.json
* asset_gap_report.json
* export.zip

Export Assembly 只读取已有数据，不重新调用 AI。

---

## 16. MVP API 范围

MVP 需要以下 API。

### 16.1 Project API

必须支持：

* 创建 Project
* 获取 Project 详情
* 获取 Project 状态
* 获取 Project 列表

---

### 16.2 Product API

必须支持：

* 保存 Product 信息
* 获取 Product 信息

---

### 16.3 Asset API

必须支持：

* 上传 Asset
* 获取 Asset 列表
* 获取 AssetAnalysis 列表

---

### 16.4 Pipeline API

必须支持：

* 启动 Pipeline
* 获取 TaskRun 列表
* 重试失败 TaskRun

---

### 16.5 Script API

必须支持：

* 获取当前 Project 下的 Script 列表
* 获取单个 Script 详情

---

### 16.6 Shot API

必须支持：

* 根据 script_id 获取 Shot 列表
* 根据 project_id 获取全部 Shot

---

### 16.7 Prompt API

必须支持：

* 根据 project_id 获取 ModelPrompt 列表
* 根据 script_id 获取 ModelPrompt 列表
* 根据 model 获取 ModelPrompt 列表

---

### 16.8 Export API

必须支持：

* 创建 ExportPackage
* 获取 ExportPackage 状态
* 下载 export.zip

---

## 17. MVP 前端范围

MVP 前端只需要支持最小操作。

页面包括：

### 17.1 Project 创建页

包含：

* 项目名称
* 产品名称
* 产品品类
* 产品描述
* 产品卖点
* 目标市场
* 目标语言
* 投放目标

---

### 17.2 Asset 上传页

包含：

* 文件上传
* asset_type 选择
* 素材列表
* 上传状态

---

### 17.3 Pipeline 状态页

包含：

* Project status
* current_step
* TaskRun 列表
* 失败原因
* 重试按钮

---

### 17.4 结果页

包含：

* 素材缺口报告
* 5 个 Script
* 每个 Script 的 Shot 列表
* 每个 Shot 的 Prompt
* 导出按钮

---

## 18. MVP 前端暂缓功能

MVP 暂缓：

* 在线编辑脚本
* 在线编辑分镜
* 在线编辑 Prompt
* 视频预览
* 拖拽排序
* 多版本比较
* 团队协作
* 评论审核
* 复杂权限
* 移动端适配优化

---

## 19. MVP Worker 范围

MVP 必须有以下 Worker task：

* run_asset_understanding
* run_asset_gap_detection
* run_trend_structuring
* run_script_generation
* run_shot_breakdown
* run_shot_classification
* run_model_prompt_generation
* run_export_assembly

每个 Worker task 必须满足：

* 读取 task_run_id
* 检查 TaskRun 状态
* 更新 status = processing
* 读取必要输入数据
* 执行当前阶段逻辑
* 写入结构化输出
* 成功后 status = success
* 失败后 status = failed
* 失败时写入 error_message
* 不执行其他阶段逻辑

---

## 20. MVP AI Provider 范围

MVP AI Provider 需要支持：

* LLM 调用
* 可选 Vision 调用
* Prompt 模板加载
* JSON 输出解析
* 输出 schema 校验
* 错误标准化

MVP 不需要支持：

* 多模型智能路由
* 成本优化策略
* 多版本 Prompt A/B Test
* 自动模型降级
* 复杂 token 统计看板

---

## 21. MVP Prompt 模板范围

MVP 需要以下 Prompt 模板：

* project_brief_normalization.md
* asset_understanding.md
* asset_gap_detection.md
* trend_structuring.md
* script_generation.md
* shot_breakdown.md
* shot_classification.md
* model_prompt_generation.md

每个模板必须明确：

* 输入字段
* 输出字段
* 禁止事项
* JSON 输出要求
* fallback 要求

---

## 22. MVP 输出校验范围

MVP 必须对以下 AI 输出做校验：

### 22.1 Script 校验

必须校验：

* 数量是否为 5
* creative_angle 是否存在
* hook 是否存在
* cta 是否存在
* estimated_duration 是否存在
* required_assets 是否存在

---

### 22.2 Shot 校验

必须校验：

* 每个 Script 是否有 4-8 个 Shot
* 每个 Shot 是否有 duration
* 每个 Shot 是否有 visual
* 每个 Shot 是否有 action
* 每个 Shot 是否有 shot_type
* shot_type 是否为合法枚举

---

### 22.3 ModelPrompt 校验

必须校验：

* 每个 Shot 是否至少有一个 Prompt
* prompt 是否存在
* model 是否为合法枚举
* aspect_ratio 是否存在
* duration 是否存在

---

## 23. MVP 文件存储范围

MVP 使用本地文件系统。

存储路径必须基于：

STORAGE_ROOT

推荐目录：

storage_root
└── projects
└── {project_id}
├── assets
│   └── original
├── analysis
├── prompts
├── exports
└── logs

MVP 要求：

* 不写死绝对路径
* 不暴露真实路径给前端
* 文件名使用系统生成名称
* 支持 Docker volume 挂载

---

## 24. MVP 导出范围

MVP 导出包必须包含：

### 24.1 brief.json

包含：

* project
* product
* target_market
* target_language
* objective
* trend_source
* asset_summary

---

### 24.2 scripts.md

包含：

* 5 个 Script
* 每个 Script 的 creative_angle
* hook
* voiceover
* subtitles
* CTA
* risk_notes

---

### 24.3 shots.json

包含：

* script_id
* shot_id
* order_index
* duration
* visual
* action
* subtitle
* shot_type
* asset_dependency
* purpose

---

### 24.4 model_prompts.json

包含：

* prompt_id
* shot_id
* script_id
* model
* prompt
* negative_prompt
* aspect_ratio
* duration
* camera_motion
* visual_style

---

### 24.5 asset_gap_report.json

包含：

* missing_assets
* available_assets
* risk_level
* recommendations
* generation_constraints

---

## 25. MVP 部署范围

### 25.1 MacBook 本地开发

MacBook 本地必须能运行：

* backend-api
* worker
* database
* queue
* local storage

MVP 本地开发通过环境变量配置：

* DATABASE_URL
* QUEUE_URL
* STORAGE_ROOT
* AI_API_KEY
* AI_MODEL_NAME
* ENVIRONMENT=local
* LOG_LEVEL=debug

---

### 25.2 Mac mini Docker 部署

Mac mini Docker 需要运行：

* backend-api
* worker
* database
* queue
* storage volume

Docker Compose 至少包含：

* backend-api service
* worker service
* database service
* queue service
* persistent volumes

MVP 不强制部署 frontend container。

如果前端仍在 MacBook 本地运行，可以通过局域网访问 Mac mini backend-api。

---

## 26. MVP 环境变量范围

MVP 必须支持以下环境变量：

* DATABASE_URL
* QUEUE_URL
* STORAGE_ROOT
* AI_API_KEY
* AI_MODEL_NAME
* ENVIRONMENT
* LOG_LEVEL
* MAX_RETRY_COUNT
* UPLOAD_MAX_SIZE_MB
* EXPORT_ROOT

启动时必须检查：

* DATABASE_URL
* STORAGE_ROOT
* AI_API_KEY

缺失时不能静默运行。

---

## 27. MVP 错误处理范围

MVP 必须处理以下错误：

* 产品信息缺失
* 没有产品素材
* 文件不存在
* 文件类型不支持
* AI_API_KEY 缺失
* AI 输出不是合法 JSON
* AI 输出缺字段
* Worker 任务失败
* 导出依赖数据缺失
* 导出目录不可写

---

## 28. MVP 重试范围

MVP 支持对失败 TaskRun 重试。

可重试 task_type：

* asset_understanding
* asset_gap_detection
* trend_structuring
* script_generation
* shot_breakdown
* shot_classification
* model_prompt_generation
* export_assembly

默认最大重试次数：

3 次

重试时必须：

* 检查 retry_count
* 更新 TaskRun.status
* 记录新的 started_at
* 失败时更新 error_message
* 成功时更新 completed_at

---

## 29. MVP 权限范围

MVP 可以先采用简单用户模型。

必须保证：

* Project 属于 User
* 查询 Project 时校验 user_id
* 下载 ExportPackage 时校验 user_id
* 用户不能访问其他用户的 Project

MVP 暂不实现：

* 团队权限
* 角色管理
* 邀请协作
* 组织空间
* 复杂 RBAC

---

## 30. MVP 安全范围

MVP 必须保证：

* API Key 不写入代码
* API Key 不返回前端
* 文件路径不暴露真实绝对路径
* 上传文件限制类型
* 上传文件限制大小
* 上传文件名安全处理
* AI 输出不作为代码执行
* 导出文件只能来自项目目录

---

## 31. MVP 日志范围

MVP 至少记录：

### 31.1 API 日志

* request_id
* path
* method
* status
* project_id
* error_message

### 31.2 Worker 日志

* task_run_id
* project_id
* task_type
* status
* retry_count
* error_message

### 31.3 AI 调用日志

* template_name
* model_name
* validation_result
* error_message

MVP 不要求完整 token 成本看板，但可以保留 metadata 字段。

---

## 32. MVP 验收标准

MVP 通过验收必须满足以下条件。

### 32.1 业务闭环验收

给定一个产品信息和一个产品图片，系统可以完成：

Project 创建
↓
Asset 上传
↓
AssetAnalysis 生成
↓
AssetGapReport 生成
↓
TrendInsight 生成或 fallback
↓
5 个 Script 生成
↓
Shot 生成
↓
ModelPrompt 生成
↓
ExportPackage 生成

---

### 32.2 数据验收

数据库中必须能查到：

* Project
* Product
* Asset
* AssetAnalysis
* AssetGapReport
* TrendInsight
* Script
* Shot
* ModelPrompt
* ExportPackage
* TaskRun

---

### 32.3 文件验收

导出包必须包含：

* brief.json
* scripts.md
* shots.json
* model_prompts.json
* asset_gap_report.json

---

### 32.4 状态验收

前端或 API 必须能看到：

* Project status
* current_step
* TaskRun status
* failed task error_message

---

### 32.5 错误验收

以下情况必须有明确错误：

* 没有产品名称
* 没有产品素材
* 文件不存在
* AI 输出格式错误
* 导出目录不可写

---

### 32.6 部署验收

MacBook 本地必须跑通完整闭环。

Mac mini Docker 必须能运行：

* backend-api
* worker
* database
* queue
* storage volume

容器重启后：

* Project 数据仍存在
* 上传文件仍存在
* 导出文件仍存在

---

## 33. MVP 暂不实现清单

以下内容明确不进入 MVP：

* 自动 TikTok 趋势抓取
* 自动生成最终视频
* 自动剪辑
* 自动投放
* 广告账户接入
* A/B Test 数据回传
* 视频模型 API 实际生成视频
* 多品牌管理
* 多团队协作
* 复杂权限系统
* 云对象存储
* Kubernetes
* 成本统计看板
* Prompt 多版本实验
* 脚本在线编辑器
* Shot 拖拽编辑器
* Prompt 编辑器
* 视频预览播放器

---

## 34. MVP 到后续版本的扩展路径

### 34.1 v1.1

可以增加：

* 用户编辑 Script
* 用户编辑 Shot
* 用户选择部分 Script 继续生成
* 单个阶段重新生成
* 更完整的 Script Quality Check

---

### 34.2 v1.2

可以增加：

* TikTok 趋势自动抓取
* TrendRawItem 独立表
* TrendFetch 独立表
* 趋势相关性评分
* 竞品广告解析

---

### 34.3 v1.3

可以增加：

* 视频模型 API 接入
* Kling / Seedance / 即梦真实生成
* 生成结果回写
* 视频预览
* Prompt 迭代

---

### 34.4 v2.0

可以增加：

* 自动剪辑
* 多版本视频生成
* A/B Test
* 投放数据回传
* 广告账户接入
* ROI 分析
* 多团队协作

---

## 35. Codex 拆解前置规则

在进入 07_codex_execution_plan.md 前，必须基于本文档冻结 MVP 范围。

Codex 拆解必须遵守：

* 只实现 MVP 范围
* 不实现暂缓功能
* 不实现后续版本功能
* 不自行扩展数据表
* 不自行增加复杂架构
* 不绕过 Worker
* 不绕过 TaskRun
* 不直接在 API 中执行 AI 任务
* 不写死本地路径
* 不修改已经冻结的字段名

---

## 36. Codex 阶段上下文策略

Codex 执行时不读取所有母版文档。

正确方式是：

完整设计文档
↓
MVP Scope
↓
Phase Context
↓
单个 Codex Task

每个 Phase 只生成一个小型 context。

例如：

* context/project_context.md
* context/asset_context.md
* context/pipeline_context.md
* context/worker_context.md
* context/export_context.md
* context/deployment_context.md

Codex 每个 task 只读取：

* 当前 phase context
* 当前要修改的文件
* 当前 task 指令

---

## 37. MVP 一句话总结

MVP 的目标不是做完整广告平台，而是先验证核心生产流水线：

产品信息
+
产品素材
+
趋势结构或 fallback
↓
5 个广告脚本
↓
可执行分镜
↓
视频模型 Prompt
↓
结构化导出包

第一阶段先在 MacBook 本地跑通，第二阶段再部署到 Mac mini Docker。

MVP 的边界必须严格控制，所有暂缓功能都不能进入 Codex 第一轮开发任务。
