## 1. 文档目标

本文档用于定义 AI 短视频广告生成系统中的核心 AI Pipeline。

它的目标是把业务流程中的 AI 处理步骤拆成可执行、可追踪、可重试的流水线。

本文档重点回答：

* AI Pipeline 分成哪些阶段
* 每个阶段的输入是什么
* 每个阶段的输出是什么
* 每个阶段由什么模型或服务完成
* 哪些阶段需要异步执行
* 哪些阶段可以失败重试
* 哪些阶段需要用户补充信息
* 如何从产品信息最终生成广告脚本、分镜和视频模型 Prompt

---

## 2. Pipeline 总体目标

AI Pipeline 的总体目标是：

将用户输入的产品信息、素材和趋势信号，逐步转换成可执行的短视频广告生产包。

完整转化路径是：

产品信息
↓
素材理解
↓
素材缺口检测
↓
趋势信号获取
↓
趋势结构化
↓
广告脚本生成
↓
脚本分镜拆解
↓
Shot 类型分类
↓
分镜素材复查
↓
视频模型 Prompt 生成
↓
导出结构化文件

---

## 3. Pipeline 核心原则

### 3.1 不直接从产品生成脚本

系统不能直接执行：

产品 → LLM → 脚本

因为这样会导致：

* 不符合 TikTok 内容趋势
* 不考虑真实素材
* 生成不可执行镜头
* 无法适配视频模型

正确方式是：

产品 + 素材边界 + 趋势结构 → 脚本 → 分镜 → Prompt

---

### 3.2 每一步都必须有结构化输出

Pipeline 中每个阶段都必须沉淀中间结果。

不能只依赖一段自然语言输出。

每个阶段都应该输出结构化数据，方便：

* 存储
* 调试
* 重试
* 展示
* 导出
* 给下一阶段使用

---

### 3.3 AI 输出必须被约束

LLM 不能自由发挥。

每个 AI 阶段都必须明确：

* 输入字段
* 输出格式
* 禁止事项
* 质量标准
* fallback 逻辑

---

### 3.4 素材边界优先

所有创意生成都必须受素材边界约束。

如果用户没有某类真实素材，AI 不应该默认生成必须实拍的内容。

例如：

用户没有手部操作视频，则脚本中不应该强依赖真实手部操作镜头。

---

### 3.5 Shot 是视频生产的最小单位

脚本不是最终执行单位。

视频生产的最小单位是 Shot。

每个 Shot 都必须具备：

* 画面描述
* 动作描述
* 时长
* 字幕
* 镜头类型
* 素材依赖
* 视频模型 Prompt

---

## 4. Pipeline 总览

完整 AI Pipeline 如下：

P0 Project Brief Normalization
↓
P1 Asset Understanding
↓
P2 Asset Gap Detection
↓
P3 Trend Fetch
↓
P4 Trend Structuring
↓
P5 Script Generation
↓
P6 Script Quality Check
↓
P7 Shot Breakdown
↓
P8 Shot Classification
↓
P9 Shot Asset Re-check
↓
P10 Model Prompt Generation
↓
P11 Export Assembly
↓
P12 Pipeline Summary

---

## 5. P0：Project Brief Normalization

### 5.1 阶段目标

将用户输入的产品信息、SKU 信息、目标市场和投放目标整理成标准 Project Brief。

### 5.2 输入

* 产品名称
* 产品品类
* 产品描述
* 产品卖点
* 商品链接
* 价格
* 目标用户
* 目标市场
* 目标语言
* 投放目标
* 用户补充说明

### 5.3 输出

Project Brief。

包含：

* product_name
* category
* selling_points
* target_audience
* target_market
* target_language
* objective
* usage_scenarios
* claim_constraints
* tone_preference

### 5.4 AI 处理方式

可以使用 LLM 对用户输入做标准化。

主要任务是：

* 提取产品卖点
* 提取使用场景
* 提取目标用户
* 识别投放目标
* 识别不能夸大的产品声明

### 5.5 输出要求

输出必须简洁、结构化。

不能新增用户没有提供的产品功能。

### 5.6 失败处理

如果产品信息过少，Project 状态进入：

needs_user_input

提示用户补充：

* 产品用途
* 核心卖点
* 目标用户
* 使用场景

---

## 6. P1：Asset Understanding

### 6.1 阶段目标

理解用户上传的素材，并判断每个素材能用于什么广告镜头。

### 6.2 输入

* Asset 文件
* Project Brief
* 文件元信息
* 素材类型

### 6.3 输出

AssetAnalysis。

包含：

* asset_id
* asset_type
* detected_product
* detected_people
* detected_hands
* scene_type
* visual_quality
* aspect_ratio
* possible_usage
* limitations
* usability_score

### 6.4 AI 处理方式

图片素材可使用视觉模型分析。

视频素材可先抽取关键帧，再用视觉模型分析。

MVP 阶段可以简化为：

* 用户手动选择素材类型
* 系统读取文件元信息
* AI 对图片或关键帧做基础描述

### 6.5 possible_usage 示例

* hook_visual
* product_close_up
* product_demo
* hand_usage
* lifestyle_scene
* packaging_showcase
* trust_building
* conversion_shot

### 6.6 limitations 示例

* low_resolution
* wrong_aspect_ratio
* no_product_visible
* no_usage_scene
* no_human
* no_hand_operation
* bad_lighting
* too_short

### 6.7 失败处理

如果素材无法分析：

* Asset status = failed
* TaskRun status = failed
* Project 不一定失败
* 后续可以用用户手动标注继续执行

---

## 7. P2：Asset Gap Detection

### 7.1 阶段目标

根据产品类型和素材分析结果，判断当前项目缺少哪些关键素材。

### 7.2 输入

* Project Brief
* AssetAnalysis 列表
* 产品品类
* 投放目标

### 7.3 输出

AssetGapReport。

包含：

* available_assets
* missing_assets
* risk_level
* ai_substitution_possible
* recommendations
* generation_constraints

### 7.4 检测逻辑

系统需要判断是否具备：

* 产品图片
* 产品 close-up
* 产品使用视频
* 手部操作视频
* 真人使用素材
* 生活方式场景
* 包装图
* before / after 素材
* 品牌素材
* 促销信息素材

### 7.5 风险等级

low：

素材基本足够，可以生成较真实广告。

medium：

部分镜头需要 AI 生成或弱化真实使用场景。

high：

缺少关键使用素材，视频真实感会明显下降。

blocking：

缺少最基础产品素材，无法继续生成有效广告方案。

### 7.6 输出示例

missing_assets:

* hand_demo_video
* lifestyle_scene_video
* before_after_visual

recommendations:

* 补充一段 3-5 秒手部使用视频
* 补充一张产品在真实场景中的图片
* 补充一张使用前后对比图

### 7.7 业务作用

该阶段决定后续脚本生成的边界。

脚本生成时必须遵守：

* 不强依赖 missing_assets
* 可以用 AI 替代的镜头需要标记
* 高风险素材缺口需要在脚本 risk_notes 中说明

---

## 8. P3：Trend Fetch

### 8.1 阶段目标

获取与产品品类、目标市场、目标平台相关的 TikTok 趋势信号。

### 8.2 输入

* Project Brief
* 产品品类
* 产品关键词
* 目标市场
* 目标语言
* 可选竞品链接
* 可选用户提供的参考视频链接

### 8.3 数据来源

可选来源包括：

* Scrape Creators API
* TikTok keyword search
* TikTok hashtag
* trending feed
* 竞品广告链接
* 用户手动输入参考链接

### 8.4 输出

TrendRawItem 列表。

包含：

* video_url
* author_name
* caption
* hashtags
* music_title
* like_count
* comment_count
* share_count
* save_count
* published_at
* duration
* raw_payload

### 8.5 MVP 简化方案

MVP 阶段可以不强依赖真实 TikTok 抓取。

可以支持三种输入方式：

1. 用户手动粘贴 TikTok 视频链接
2. 用户手动粘贴趋势文本
3. 系统使用内置趋势模板 fallback

### 8.6 失败处理

如果趋势抓取失败：

* 不阻塞整个流程
* 使用 fallback trend templates
* 在最终报告中标记 trend_source = fallback

### 8.7 业务作用

Trend Fetch 的目标不是直接生成脚本，而是为趋势结构化阶段提供原始材料。

---

## 9. P4：Trend Structuring

### 9.1 阶段目标

将原始趋势数据转化成可用于广告生成的结构化创意约束。

### 9.2 输入

* TrendRawItem 列表
* Project Brief
* 产品品类
* 目标市场
* 目标平台

### 9.3 输出

TrendInsight。

包含：

* hook_patterns
* content_structures
* pacing_patterns
* emotional_angles
* visual_patterns
* music_styles
* caption_styles
* audience_pain_points
* ad_formulas
* summary

### 9.4 处理方式

使用 LLM 对趋势数据进行归纳。

LLM 需要提取：

* 常见开头方式
* 常见视频结构
* 内容节奏
* 情绪触发点
* 评论区痛点
* 高互动内容共性
* 可复用广告公式

### 9.5 输出约束

TrendInsight 不能只是摘要。

必须输出可被 Script Generation 使用的结构化模式。

例如：

content_structures:

* hook_problem_solution_result_cta
* ugc_story_product_reveal_proof
* before_after_demo_offer

hook_patterns:

* pain_point_first
* curiosity_gap
* mistake_warning
* surprising_result
* personal_testimonial

### 9.6 失败处理

如果 LLM 输出结构不完整：

* 重新生成一次
* 第二次失败后使用默认模板
* 标记 confidence_score = low

---

## 10. P5：Script Generation

### 10.1 阶段目标

基于产品信息、素材边界和趋势结构，生成 5 个不同角度的广告脚本。

### 10.2 输入

* Project Brief
* AssetGapReport
* TrendInsight
* Product
* 目标市场
* 投放目标

### 10.3 输出

Script 列表，默认 5 条。

每条 Script 包含：

* title
* creative_angle
* target_emotion
* target_audience
* hook
* main_message
* voiceover
* subtitles
* cta
* estimated_duration
* required_assets
* risk_notes

### 10.4 生成约束

Script Generation 必须遵守：

* 不能编造产品功能
* 不能承诺无法验证的效果
* 不能强依赖缺失素材
* 必须符合目标市场语言
* 必须符合短视频节奏
* 5 个脚本必须角度不同
* 每个脚本必须可以拆分成分镜

### 10.5 推荐 5 个脚本角度

默认生成以下 5 类：

1. 痛点解决型
2. Before / After 型
3. UGC 种草型
4. 产品演示型
5. 情绪冲击型

### 10.6 输出质量标准

每个脚本必须满足：

* 前 1-2 秒有 hook
* 中间有产品出现
* 后半段有结果或理由
* 结尾有 CTA
* 总时长适合 10-20 秒短视频
* 能继续拆成 4-8 个 shot

### 10.7 失败处理

如果生成脚本数量不足：

* 自动补足到 5 条

如果脚本重复度过高：

* 重新生成重复脚本

如果脚本使用缺失素材：

* 标记风险或重新生成

---

## 11. P6：Script Quality Check

### 11.1 阶段目标

检查生成的脚本是否符合系统约束。

### 11.2 输入

* Script 列表
* AssetGapReport
* TrendInsight
* Project Brief

### 11.3 输出

ScriptQualityResult。

包含：

* script_id
* pass
* issues
* severity
* fix_suggestion

### 11.4 检查项

检查内容包括：

* 是否编造产品功能
* 是否强依赖缺失素材
* 是否缺少 hook
* 是否缺少 CTA
* 是否过长
* 是否结构重复
* 是否不符合目标语言
* 是否广告感过重
* 是否无法拆分成 shot

### 11.5 处理方式

MVP 阶段可以由 LLM 检查。

后续可加入规则引擎。

### 11.6 失败处理

如果某个脚本质量不合格：

* 优先局部修复
* 修复失败则重新生成该脚本
* 不影响其他脚本

---

## 12. P7：Shot Breakdown

### 12.1 阶段目标

将每个广告脚本拆分成可执行 shot list。

### 12.2 输入

* Script
* Project Brief
* AssetGapReport

### 12.3 输出

Shot 列表。

每个 Shot 包含：

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
* transition
* purpose

### 12.4 拆分规则

每个脚本拆成 4-8 个 Shot。

每个 Shot 应控制在 1-4 秒。

Shot 顺序通常为：

1. Hook
2. Problem / Context
3. Product Reveal
4. Demo / Proof
5. Result / Benefit
6. CTA

### 12.5 输出约束

每个 Shot 必须是单一镜头。

不能一个 Shot 同时包含多个复杂场景。

错误示例：

一个镜头里同时出现开箱、使用、结果对比和购买 CTA。

正确示例：

Shot 1：痛点画面
Shot 2：产品出现
Shot 3：使用动作
Shot 4：结果展示
Shot 5：CTA

### 12.6 失败处理

如果 shot 数量过少：

* 重新拆分

如果单个 shot 过复杂：

* 拆成多个 shot

如果 shot 无法执行：

* 标记为 needs_revision

---

## 13. P8：Shot Classification

### 13.1 阶段目标

为每个 Shot 判断生产方式。

### 13.2 输入

* Shot 列表
* AssetAnalysis
* AssetGapReport
* Project Brief

### 13.3 输出

更新后的 Shot。

重点字段：

* shot_type
* asset_dependency
* production_method
* realism_risk

### 13.4 Shot 类型

REAL：

必须使用真实素材。

适合：

* 产品实拍
* 手部操作
* 真人使用
* 开箱
* 真实场景

AI：

可以由 AI 生成。

适合：

* 氛围镜头
* 场景补充
* 情绪镜头
* 概念画面

HYBRID：

真实素材加 AI 增强。

适合：

* 产品图换背景
* 产品主体真实，场景 AI 补充
* 实拍素材增强氛围

PRODUCT：

强产品转化镜头。

适合：

* 产品 close-up
* 卖点展示
* 包装展示
* 价格促销
* 购买理由

TEXT：

文字强化镜头。

适合：

* 开头 hook
* 痛点字幕
* 结果强调
* CTA
* TikTok 风格文本

### 13.5 分类原则

分类必须遵守：

* 有真实素材优先用 REAL
* 缺素材但可补场景则用 AI
* 有产品图但缺环境则用 HYBRID
* 强转化镜头标记 PRODUCT
* 信息强化镜头标记 TEXT

### 13.6 失败处理

如果无法判断类型：

默认标记为 AI，并添加 risk_notes。

---

## 14. P9：Shot Asset Re-check

### 14.1 阶段目标

在 shot 级别复查素材是否足够。

### 14.2 输入

* Shot 列表
* AssetAnalysis
* AssetGapReport

### 14.3 输出

ShotAssetCheck 或更新 Shot 的 asset_dependency。

包含：

* shot_id
* has_required_asset
* matched_asset_ids
* missing_asset_types
* ai_fallback_possible
* realism_risk
* recommendation

### 14.4 检查逻辑

逐个 Shot 判断：

* 是否需要真实素材
* 是否已有对应素材
* 是否可以 AI 替代
* 是否影响真实感
* 是否建议用户补充素材

### 14.5 输出示例

Shot 3：

* has_required_asset: false
* missing_asset_types: hand_demo_video
* ai_fallback_possible: true
* realism_risk: high
* recommendation: 建议补充 3 秒手部使用视频，否则该镜头只能用 AI 生成，真实感下降。

### 14.6 业务作用

该阶段是最终视频生成前的重要风控点。

它决定：

* 哪些镜头可以直接生成 Prompt
* 哪些镜头需要提示用户补素材
* 哪些镜头需要 AI fallback
* 哪些脚本不适合继续执行

---

## 15. P10：Model Prompt Generation

### 15.1 阶段目标

将每个 Shot 转换成视频生成模型可消费的 Prompt。

### 15.2 输入

* Shot
* ShotAssetCheck
* Product
* AssetAnalysis
* 目标视频模型
* 画幅设置
* 时长设置

### 15.3 输出

ModelPrompt。

每个 Shot 可生成多个模型版本：

* Kling Prompt
* Seedance Prompt
* 即梦 Prompt

### 15.4 输出字段

每个 ModelPrompt 包含：

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

### 15.5 Prompt 生成原则

Prompt 必须满足：

* 单个 prompt 只描述一个镜头
* 不包含多个复杂场景
* 明确主体
* 明确动作
* 明确镜头运动
* 明确画面风格
* 明确时长
* 明确画幅
* 不添加未提供的产品功能
* 不制造误导性效果

### 15.6 默认画幅

短视频默认：

9:16

### 15.7 默认视觉风格

默认风格：

* realistic
* commercial product video
* natural lighting
* clean background
* mobile-first vertical video
* TikTok native style

### 15.8 Prompt 示例

Shot：

* visual: 产品 close-up
* action: 镜头缓慢推进展示产品质感
* duration: 3 秒
* shot_type: PRODUCT

Prompt：

cinematic close-up of the product, soft natural light, realistic texture, smooth slow push-in camera movement, clean background, vertical 9:16, commercial product video style, high detail

Negative Prompt：

blurry, distorted product, wrong logo, unrealistic hand, extra objects, text artifacts, low quality, overexposed

### 15.9 失败处理

如果某个 Shot 信息不足：

* 生成基础 Prompt
* 标记 generation_notes
* 不阻塞其他 Shot

---

## 16. P11：Export Assembly

### 16.1 阶段目标

将 Pipeline 生成的所有结构化结果打包为最终交付文件。

### 16.2 输入

* Project Brief
* AssetGapReport
* TrendInsight
* Script
* Shot
* ModelPrompt

### 16.3 输出

ExportPackage。

包含：

* brief.json
* scripts.md
* shots.json
* kling_prompts.json
* seedance_prompts.json
* jimeng_prompts.json
* asset_gap_report.json
* export.zip

### 16.4 导出原则

导出文件必须：

* 可读
* 可复用
* 可追踪
* 与数据库记录一致
* 每个 Prompt 能追溯到对应 Shot
* 每个 Shot 能追溯到对应 Script
* 每个 Script 能追溯到 Project

### 16.5 失败处理

如果导出失败：

* 不重新执行整个 Pipeline
* 只重新执行 Export Assembly
* 保留错误信息
* 允许用户重新导出

---

## 17. P12：Pipeline Summary

### 17.1 阶段目标

生成一个项目级总结，帮助用户理解最终结果。

### 17.2 输入

* Script 列表
* Shot 列表
* AssetGapReport
* ModelPrompt 列表
* TrendInsight

### 17.3 输出

Pipeline Summary。

包含：

* 生成了几个脚本
* 每个脚本的创意角度
* 总共生成多少个 Shot
* AI 镜头占比
* REAL 镜头占比
* 缺失素材列表
* 视频真实感风险
* 推荐优先执行的脚本
* 推荐补充素材

### 17.4 业务作用

Pipeline Summary 用于前端结果页展示。

它让用户快速知道：

* 哪个脚本最适合投放
* 哪个脚本素材风险最低
* 哪些素材最好补充
* 哪些 Prompt 可以直接给视频模型使用

---

## 18. Pipeline 状态设计

### 18.1 总体状态

Project 的 current_step 应随着 Pipeline 推进。

推荐步骤：

* brief_normalizing
* asset_understanding
* asset_gap_detecting
* trend_fetching
* trend_structuring
* script_generating
* script_checking
* shot_breaking_down
* shot_classifying
* shot_asset_checking
* prompt_generating
* exporting
* completed

---

### 18.2 任务状态

每个 Pipeline 阶段对应一个 TaskRun。

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

### 18.3 状态同步原则

Project status 代表整体进度。

TaskRun status 代表单个任务状态。

二者不能混用。

---

## 19. Pipeline 输入输出依赖

### 19.1 P0 输出给 P1 / P2 / P3 / P5

Project Brief 是后续所有阶段的基础输入。

---

### 19.2 P1 输出给 P2 / P5 / P8 / P9 / P10

AssetAnalysis 是素材理解结果，后续用于：

* 检测素材缺口
* 约束脚本
* 判断 shot 类型
* 生成素材引用 prompt

---

### 19.3 P2 输出给 P5 / P7 / P9 / P12

AssetGapReport 用于：

* 约束脚本
* 指导分镜
* 复查素材
* 生成总结

---

### 19.4 P4 输出给 P5

TrendInsight 是脚本生成的趋势约束来源。

---

### 19.5 P5 输出给 P7

Script 是分镜生成的输入。

---

### 19.6 P7 输出给 P8 / P9 / P10

Shot 是视频生成的最小执行单位。

---

### 19.7 P10 输出给 P11

ModelPrompt 是最终导出包的核心内容。

---

## 20. MVP Pipeline 范围

MVP 阶段建议保留以下阶段：

P0 Project Brief Normalization
P1 Asset Understanding
P2 Asset Gap Detection
P4 Trend Structuring
P5 Script Generation
P7 Shot Breakdown
P8 Shot Classification
P9 Shot Asset Re-check
P10 Model Prompt Generation
P11 Export Assembly

MVP 阶段可以暂缓：

P3 自动 Trend Fetch
P6 Script Quality Check
P12 Pipeline Summary

暂缓原因：

* 自动抓取 TikTok 趋势可能涉及第三方接口稳定性
* Script Quality Check 可以先合并到 Script Generation 的输出约束里
* Pipeline Summary 可以后续从已有数据中生成

---

## 21. MVP 简化输入方式

MVP 不强制接入真实 TikTok 抓取。

可以让用户输入：

* 产品信息
* 产品素材
* 目标市场
* 目标语言
* 可选趋势文本
* 可选参考视频链接
* 可选竞品广告描述

如果没有趋势数据，系统使用默认趋势模板。

默认趋势模板包括：

* pain_solution
* before_after
* ugc_testimonial
* product_demo
* problem_warning

---

## 22. 本地开发与部署考虑

### 22.1 推荐开发路线

当前开发环境建议按以下顺序推进：

第一阶段：MacBook 本地开发跑通
第二阶段：Mac mini 本地服务器 Docker 部署
第三阶段：稳定后再考虑云部署或外部访问

---

### 22.2 为什么先在 MacBook 跑通

先在 MacBook 本地跑通有几个好处：

* 调试快
* 文件路径简单
* 日志查看方便
* 不需要先处理部署问题
* 可以先验证 Pipeline 是否成立
* 可以快速修改数据结构和 Prompt 逻辑

---

### 22.3 MacBook 本地运行目标

MacBook 阶段只需要跑通最小闭环：

Project 创建
↓
素材上传或模拟素材
↓
素材分析
↓
素材缺口检测
↓
趋势结构化
↓
脚本生成
↓
分镜生成
↓
Prompt 生成
↓
本地导出文件

---

### 22.4 Mac mini Docker 部署目标

Mac mini 部署阶段需要解决：

* 后端服务容器化
* 数据库容器化或本地持久化
* 文件存储目录挂载
* Worker 后台任务运行
* 队列服务运行
* 日志持久化
* 导出文件持久化
* 局域网访问

---

### 22.5 Pipeline 对部署方式的要求

AI Pipeline 设计必须满足：

* 不依赖 MacBook 本地绝对路径
* 文件路径必须可配置
* API Key 必须走环境变量
* Worker 必须可以独立启动
* 每个阶段必须可重试
* 导出文件路径必须可配置
* 数据库连接必须可配置
* 队列连接必须可配置

---

## 23. Pipeline 执行方式

### 23.1 同步阶段

适合同步执行的阶段：

* Project Brief Normalization
* Project 创建
* 用户输入校验
* 简单数据保存

---

### 23.2 异步阶段

适合异步执行的阶段：

* Asset Understanding
* Asset Gap Detection
* Trend Fetch
* Trend Structuring
* Script Generation
* Shot Breakdown
* Shot Classification
* Shot Asset Re-check
* Model Prompt Generation
* Export Assembly

---

### 23.3 Worker 执行原则

每个 Worker 任务必须：

* 只处理一个 Project 或一个 Project 的一个阶段
* 读取明确输入
* 写入明确输出
* 更新 TaskRun 状态
* 失败时记录 error_message
* 不直接跳过中间数据
* 不直接覆盖历史结果，除非明确是重新生成

---

## 24. Pipeline 重试策略

### 24.1 可重试阶段

以下阶段允许重试：

* Asset Understanding
* Trend Fetch
* Trend Structuring
* Script Generation
* Shot Breakdown
* Model Prompt Generation
* Export Assembly

---

### 24.2 不建议自动重试的阶段

以下情况不建议无限自动重试：

* 用户输入不足
* 素材缺失
* API Key 错误
* 文件不存在
* 数据格式严重错误

这些情况应该进入：

needs_user_input 或 failed

---

### 24.3 最大重试次数

默认最大重试次数：

3 次

超过后：

* TaskRun status = failed
* Project status = failed 或 needs_user_input
* 记录 error_message

---

## 25. Pipeline Fallback 设计

### 25.1 Trend Fallback

如果趋势抓取失败：

使用内置趋势模板。

默认模板：

* pain_solution
* before_after
* ugc_testimonial
* fast_demo
* product_reveal

---

### 25.2 Asset Fallback

如果素材分析失败：

使用用户上传时选择的 asset_type。

例如：

用户标记为 product_image，则系统至少知道该素材可作为产品图使用。

---

### 25.3 Script Fallback

如果 5 个脚本生成失败：

先生成 1 个基础脚本。

基础结构：

Hook
Problem
Product Reveal
Benefit
CTA

---

### 25.4 Prompt Fallback

如果模型 Prompt 生成失败：

根据 Shot 的 visual、action、duration 生成基础 Prompt。

---

## 26. AI 调用边界

### 26.1 LLM 适合处理

LLM 适合处理：

* 产品信息标准化
* 趋势结构化
* 脚本生成
* 脚本质量检查
* 分镜拆解
* Prompt 生成

---

### 26.2 视觉模型适合处理

视觉模型适合处理：

* 图片内容识别
* 产品主体识别
* 场景识别
* 素材质量判断
* 视频关键帧理解

---

### 26.3 规则引擎适合处理

规则引擎适合处理：

* 状态流转
* 必填字段校验
* 素材类型判断
* 风险等级计算
* Shot 时长校验
* Prompt 文件分组导出

---

## 27. Prompt 模板管理

### 27.1 为什么需要 Prompt 模板

系统中多个阶段都依赖 LLM。

如果 Prompt 写死在代码里，后续维护困难。

建议将 Prompt 模板独立管理。

---

### 27.2 需要管理的 Prompt 模板

至少包括：

* project_brief_normalization_prompt
* asset_gap_detection_prompt
* trend_structuring_prompt
* script_generation_prompt
* script_quality_check_prompt
* shot_breakdown_prompt
* shot_classification_prompt
* model_prompt_generation_prompt

---

### 27.3 Prompt 模板字段

每个模板应包含：

* template_name
* version
* input_schema
* output_schema
* system_instruction
* user_instruction
* constraints
* examples

---

### 27.4 版本管理

Prompt 应该有版本号。

例如：

script_generation_v1
script_generation_v2

这样可以追踪不同版本生成结果。

---

## 28. AI 输出校验

### 28.1 为什么需要输出校验

LLM 可能输出：

* 缺字段
* 格式错误
* 多余解释
* JSON 不合法
* 内容重复
* 使用缺失素材
* 编造产品功能

因此每个 AI 输出都需要校验。

---

### 28.2 校验方式

校验方式包括：

* JSON schema 校验
* 必填字段校验
* 枚举值校验
* 长度校验
* 数量校验
* 业务规则校验

---

### 28.3 校验失败处理

校验失败后：

第一次：要求 LLM 修复输出
第二次：重新生成
第三次：使用 fallback 或标记 failed

---

## 29. Pipeline 质量指标

系统需要追踪以下质量指标：

* 脚本数量是否为 5
* 每个脚本是否有不同 creative_angle
* 每个脚本是否有 hook
* 每个脚本是否有 CTA
* 每个脚本是否能拆成 4-8 个 Shot
* 每个 Shot 是否有明确 duration
* 每个 Shot 是否有 shot_type
* Prompt 是否覆盖所有 Shot
* AI 镜头占比
* REAL 镜头占比
* 素材缺口风险等级
* 导出文件是否完整

---

## 30. 最小可执行闭环

MVP 最小闭环如下：

用户创建 Project
↓
输入产品信息
↓
上传至少 1 个产品素材
↓
系统生成 AssetAnalysis
↓
系统生成 AssetGapReport
↓
用户输入或系统 fallback 趋势结构
↓
系统生成 5 个 Script
↓
系统将每个 Script 拆成 Shot
↓
系统分类 Shot
↓
系统生成 ModelPrompt
↓
系统导出文件

---

## 31. 不在 MVP 范围内的内容

MVP 阶段暂不实现：

* 自动投放广告
* 自动生成最终视频
* 自动剪辑成片
* TikTok 官方数据深度分析
* 多用户团队协作
* 多品牌管理
* A/B Test 数据回流
* 自动预算优化
* 广告账户接入
* 高级素材版本管理
* Prompt 多版本对比实验

---

## 32. 和后续文档的关系

本文档定义 AI Pipeline。

后续文档分工如下：

04_system_architecture.md：

* 后端服务结构
* Docker 部署结构
* MacBook 本地开发方式
* Mac mini 服务器部署方式
* API 层
* Worker 层
* 队列
* 数据库
* 文件存储

05_risk_checklist.md：

* AI 生成风险
* 素材风险
* 趋势数据风险
* 部署风险
* 成本风险
* 合规风险

06_mvp_scope.md：

* 第一版具体做什么
* 第一版不做什么
* 哪些 Pipeline 阶段必须实现
* 哪些阶段使用 fallback

07_codex_execution_plan.md：

* 按阶段拆 Codex tasks
* 每个 task 只改一个文件
* 每个 task 明确输入输出
* 每个 task 限制 Codex 不许扩展

---

## 33. 一句话总结

AI Pipeline 的核心是：

不要让 AI 一步生成广告脚本，
而是让 AI 按阶段完成素材理解、趋势结构化、脚本生成、分镜拆解和模型 Prompt 适配。

每个阶段都要有明确输入、结构化输出、失败处理和可重试机制。

开发上建议先在 MacBook 本地跑通最小闭环，再将后端、Worker、数据库、队列和文件存储迁移到 Mac mini 的 Docker 环境中部署。
