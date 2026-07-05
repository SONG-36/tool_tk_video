## 1. 业务目标

本系统的目标是：

给定一个产品、产品素材、可选竞品信息，以及 TikTok 趋势信号，自动生成一组可拍摄、可生成、可投放的短视频广告方案。

系统最终不是简单生成广告文案，而是生成一套完整的短视频广告生产包，包括：

* 5 个不同角度的广告脚本
* 每个脚本对应的分镜表
* 每个分镜对应的视频生成模型 Prompt
* 素材缺口报告
* 可导出的结构化文件

系统本质是：

AI 驱动的短视频广告生产流水线
Creative Production System

---

## 2. 核心业务问题

如果直接做：

产品信息 → GPT → 广告脚本

会出现三个核心问题。

### 2.1 趋势不匹配

直接生成的脚本可能不符合 TikTok 当前流行内容结构。

例如：

* 开头不够强
* 节奏不符合短视频平台习惯
* 缺少热门 hook
* 缺少平台化表达
* 广告感过重

因此系统必须引入 TikTok 趋势信号，让广告脚本受到真实平台内容结构约束。

---

### 2.2 素材不可执行

如果不判断用户现有素材，AI 很容易生成无法拍摄或无法生成的视频内容。

例如：

* 脚本里写了真人使用场景，但用户没有真人素材
* 脚本里写了户外生活方式场景，但用户只有白底产品图
* 脚本里写了手部操作，但用户没有手部视频
* 脚本里写了 before / after，但没有对比素材

因此系统必须先检测素材缺口，避免生成无法执行的广告方案。

---

### 2.3 无法直接接视频模型

Kling、Seedance、即梦等视频生成模型并不理解完整广告脚本。

它们真正需要的是：

* 单个镜头描述
* 场景信息
* 动作描述
* 镜头运动
* 画面风格
* 时长
* 画幅比例
* prompt / negative prompt

因此系统必须把脚本进一步拆成分镜，再把分镜转换成模型可消费的 Prompt。

---

## 3. 完整业务主流程

完整业务流程如下：

用户创建广告项目
↓
填写产品信息 / SKU / 目标市场 / 投放目标
↓
上传产品图片、视频、品牌素材
↓
系统分析素材
↓
检测素材缺口
↓
抓取 TikTok 趋势信号
↓
结构化趋势内容
↓
生成 5 个不同角度的广告脚本
↓
将每个脚本拆分成 shot list
↓
对每个 shot 进行类型分类
↓
再次检测分镜所需素材是否足够
↓
生成 Kling / Seedance / 即梦等视频模型 Prompt
↓
异步执行任务并追踪状态
↓
导出完整广告生产包

---

## 4. 阶段一：创建广告项目

### 4.1 用户输入

用户首先创建一个广告任务。

需要填写的信息包括：

* 产品名称
* 产品品类
* SKU 信息
* 商品链接
* 产品卖点
* 产品价格
* 目标用户
* 使用场景
* 目标市场
* 目标语言
* 投放平台
* 投放目标

投放目标可以包括：

* 转化
* 测品
* 种草
* 品牌曝光
* 促销活动
* 新品冷启动

---

### 4.2 系统输出

系统创建一个 Project，并生成：

* project_id
* project_status
* created_at
* user_id
* project_brief

初始状态为：

draft

---

### 4.3 业务意义

Project 是整个广告生产任务的容器。

后续所有内容都会绑定到这个 Project 上，包括：

* 产品信息
* 素材
* 趋势数据
* 脚本
* 分镜
* prompt
* 导出文件
* 执行状态

---

## 5. 阶段二：上传与管理素材

### 5.1 用户上传素材

用户上传产品相关素材。

素材类型包括：

* 产品白底图
* 产品详情图
* 产品场景图
* 产品使用视频
* 产品开箱视频
* 手部操作视频
* 真人出镜视频
* 品牌 logo
* 包装图
* 品牌视觉素材
* 可选竞品素材

---

### 5.2 系统分析素材

系统对素材进行基础分析。

分析内容包括：

* 素材类型
* 产品主体是否清晰
* 是否包含真人
* 是否包含手部操作
* 是否包含真实使用场景
* 是否包含产品 close-up
* 是否适合做广告开头
* 是否适合做转化镜头
* 是否适合做产品展示
* 素材清晰度
* 素材画幅
* 素材时长
* 素材质量评分

---

### 5.3 素材结构化结果

系统将素材整理成结构化信息。

示例：

asset_summary:

* product_image_available: true
* product_video_available: true
* hand_usage_video_available: false
* lifestyle_scene_available: false
* human_model_available: false
* close_up_available: true
* packaging_available: true

---

## 6. 阶段三：素材缺口检测

### 6.1 为什么需要素材缺口检测

广告脚本必须受到素材边界约束。

如果系统不知道用户有什么素材，就会生成不可执行内容。

因此在脚本生成前，需要先判断：

* 哪些镜头可以用真实素材实现
* 哪些镜头需要用户补充素材
* 哪些镜头只能使用 AI 生成
* 哪些内容不应该出现在脚本里

---

### 6.2 检测内容

系统判断是否缺少以下素材：

* 产品使用视频
* 手部操作视频
* 真人出镜素材
* 生活方式场景素材
* 产品 close-up 视频
* 产品 before / after 对比素材
* 包装展示素材
* 品牌视觉素材
* 场景氛围素材
* 口播素材

---

### 6.3 输出结果

系统输出 missing_assets。

示例：

missing_assets:

* product_usage_video
* hand_demo_video
* lifestyle_scene
* before_after_visual
* human_reaction_video

---

### 6.4 业务意义

素材缺口检测的作用是：

* 防止 AI 乱编不可拍摄内容
* 约束后续脚本生成
* 提前提示用户补充素材
* 降低视频生成失败率
* 提升最终广告真实感

---

## 7. 阶段四：获取 TikTok 趋势信号

### 7.1 趋势数据来源

系统根据产品品类、关键词、目标市场，获取 TikTok 趋势内容。

数据来源可以包括：

* Scrape Creators API
* TikTok keyword search
* TikTok hashtag
* trending feed
* 达人视频
* 竞品广告
* 行业热门视频
* 用户手动输入的参考链接

---

### 7.2 原始趋势数据

系统抓取的原始数据包括：

* 视频链接
* 视频标题
* caption
* hashtag
* 点赞数
* 评论数
* 分享数
* 收藏数
* 发布时间
* 作者信息
* 音乐信息
* 视频时长
* 视频内容摘要
* 开头 hook
* 评论区反馈
* 竞品卖点
* 用户痛点

---

### 7.3 业务意义

TikTok 趋势信号的作用是：

* 让广告脚本符合平台内容习惯
* 提高开头吸引力
* 提升内容原生感
* 降低广告感
* 增加脚本测试价值
* 提升投放转化可能性

---

## 8. 阶段五：趋势结构化

### 8.1 为什么不能直接使用原始趋势数据

原始趋势数据是杂乱的。

它通常包含：

* 视频列表
* 文案
* 评论
* 互动数据
* 音乐信息
* hashtag

这些数据不能直接用于生成广告脚本。

系统需要用 LLM 将 raw trend 抽象成可复用的创意结构。

---

### 8.2 趋势结构化输出

系统将趋势抽象成：

* hook patterns
* content structure
* pacing
* emotional angle
* visual pattern
* music style
* caption style
* CTA style
* audience pain points
* winning ad formulas

---

### 8.3 示例结构

趋势结构示例：

* 开头 1 秒直接制造痛点
* 2-4 秒展示产品解决方案
* 5-7 秒展示使用过程
* 8-10 秒展示结果对比
* 结尾给出购买理由或行动号召

常见 hook 示例：

* “I wish I knew this earlier”
* “Stop doing this if you have...”
* “This fixed my biggest problem with...”
* “TikTok made me try this”
* “I didn’t expect this to work”

---

### 8.4 业务意义

趋势结构化的作用是：

* 将平台趋势转为广告生成约束
* 让脚本更贴近 TikTok 原生内容
* 让广告结构更可控
* 避免纯 GPT 式泛化文案
* 提高多脚本测试质量

---

## 9. 阶段六：生成 5 个广告脚本

### 9.1 脚本生成输入

系统生成广告脚本时，需要综合以下信息：

* 产品信息
* SKU 信息
* 产品卖点
* 目标用户
* 目标市场
* 投放目标
* 素材分析结果
* 素材缺口
* TikTok 趋势结构
* 竞品信息
* 用户偏好

---

### 9.2 脚本生成目标

系统一次生成 5 个不同角度的广告脚本。

这 5 个脚本不能只是文案不同，而应该在创意角度上不同。

常见角度包括：

* 痛点解决型
* Before / After 对比型
* UGC 种草型
* 测评型
* 开箱体验型
* 情绪冲击型
* 场景代入型
* 价格促销型
* 竞品对比型
* 生活方式型

---

### 9.3 每个脚本包含的内容

每个广告脚本应包含：

* script_id
* script_title
* creative_angle
* target_emotion
* target_audience
* hook
* main_message
* voiceover
* subtitle
* CTA
* estimated_duration
* required_assets
* risk_notes

---

### 9.4 脚本约束

脚本生成必须遵守以下约束：

* 不能使用用户没有的真实素材
* 不能编造不存在的产品功能
* 不能承诺无法验证的效果
* 必须符合目标市场语言习惯
* 必须符合 TikTok 短视频节奏
* 每个脚本必须有明显差异
* 每个脚本都要能继续拆成分镜

---

## 10. 阶段七：脚本拆分为分镜

### 10.1 为什么需要分镜系统

脚本不是最终可执行的视频单位。

脚本通常是连续文本，而视频生成或拍摄需要的是一个个独立镜头。

因此系统必须将脚本拆成 shot list。

---

### 10.2 分镜字段

每个 shot 包含：

* shot_id
* script_id
* order
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

---

### 10.3 分镜示例

Shot 1:

* duration: 2s
* visual: 用户面对某个痛点的生活场景
* action: 快速展示问题
* subtitle: “Still struggling with this?”
* shot_type: TEXT / AI
* purpose: hook attention

Shot 2:

* duration: 3s
* visual: 产品 close-up
* action: 展示产品核心细节
* subtitle: “This makes it easier”
* shot_type: PRODUCT
* purpose: product reveal

Shot 3:

* duration: 4s
* visual: 手部使用产品
* action: 展示真实使用过程
* subtitle: “Just use it like this”
* shot_type: REAL
* purpose: prove usability

---

## 11. 阶段八：Shot 类型分类

### 11.1 分类目的

Shot 分类用于判断每个镜头如何生产。

不同镜头的生产方式不同：

* 有些必须使用真实素材
* 有些可以由 AI 生成
* 有些需要真实产品素材加 AI 背景
* 有些只是文字强化
* 有些是强转化产品镜头

---

### 11.2 Shot 类型

#### REAL

真实素材镜头。

适用于：

* 产品真实拍摄
* 手部操作
* 开箱
* 真人使用
* 真实环境
* 真实反馈

业务价值：

增强真实感和可信度。

---

#### AI

AI 生成镜头。

适用于：

* 无素材补充场景
* 氛围画面
* 概念画面
* 情绪铺垫
* 生活方式补充镜头

业务价值：

弥补素材不足，提高视觉丰富度。

---

#### HYBRID

真实素材 + AI 增强镜头。

适用于：

* 实拍产品换背景
* 产品图结合 AI 场景
* 真实主体加虚拟环境
* 产品与氛围画面结合

业务价值：

在真实感和视觉表现之间取得平衡。

---

#### PRODUCT

强产品展示镜头。

适用于：

* 产品 close-up
* 产品卖点展示
* 包装展示
* 功能细节
* 价格促销
* 购买理由

业务价值：

强化转化。

---

#### TEXT

文字强化镜头。

适用于：

* TikTok 风格字幕
* 强 hook 文案
* 痛点提示
* 结果强调
* CTA
* 节奏切分

业务价值：

提升信息传达效率和平台感。

---

## 12. 阶段九：分镜后素材复查

### 12.1 为什么需要第二次素材检测

第一次素材检测发生在脚本生成前。

但脚本拆成分镜后，系统需要再次判断每个 shot 是否真的能执行。

因为脚本层面的素材需求较粗，而 shot 层面的素材需求更具体。

---

### 12.2 检测内容

系统逐个检查 shot：

* 是否有对应素材
* 是否需要用户补拍
* 是否可以 AI 生成
* 是否需要替换镜头方案
* 是否会降低真实感
* 是否会影响投放可信度

---

### 12.3 输出结果

系统输出 required_assets。

示例：

required_assets:

* hand_usage_video
* close_up_product_video
* lifestyle_scene_video
* before_after_image
* human_reaction_clip

---

### 12.4 用户提示

系统需要给用户明确提示：

当前广告方案中部分镜头缺少真实素材支持。

缺少素材可能导致：

* AI 镜头占比升高
* 视频真实感下降
* 产品可信度下降
* 转化镜头说服力不足

建议补充：

* 手部使用视频
* 产品 close-up 视频
* 真实生活场景视频
* before / after 对比素材

---

## 13. 阶段十：生成视频模型 Prompt

### 13.1 为什么需要 Prompt 适配层

视频模型不直接消费广告脚本。

它们需要结构化、镜头级的 prompt。

因此系统需要将：

Shot → Model Prompt

---

### 13.2 Prompt 生成输入

Prompt 生成需要使用：

* shot list
* shot_type
* 产品信息
* 素材引用
* 画面描述
* 动作描述
* 镜头运动
* 时长
* 画幅
* 视频模型类型
* 风格偏好

---

### 13.3 Prompt 输出字段

每个模型 prompt 包含：

* prompt_id
* shot_id
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

### 13.4 示例

Shot:

* visual: 产品手持展示
* action: 手部轻轻旋转产品，展示质感
* duration: 3s
* shot_type: REAL / PRODUCT

Model Prompt:

cinematic close-up of a hand holding the product, soft natural light, realistic texture, vertical 9:16, smooth camera movement, clean background, high detail, commercial product video style

---

### 13.5 模型适配

不同模型可以有不同 Prompt 输出。

例如：

* kling_prompts.json
* seedance_prompts.json
* jimeng_prompts.json

每个模型的 prompt 可以针对其能力做轻微调整，但核心 shot 信息保持一致。

---

## 14. 阶段十一：异步执行任务

### 14.1 为什么需要异步执行

整个广告生产流程包含多个耗时步骤：

* 素材上传
* 素材分析
* TikTok 趋势抓取
* LLM 趋势结构化
* 脚本生成
* 分镜生成
* Prompt 生成
* 文件导出

这些步骤不能全部同步阻塞执行。

因此系统需要异步 worker 和任务队列。

---

### 14.2 异步任务链路

任务链路如下：

T1 创建 Project
↓
T2 上传 Asset
↓
T3 素材分析
↓
T4 素材缺口检测
↓
T5 TikTok 趋势抓取
↓
T6 趋势结构化
↓
T7 生成 5 个脚本
↓
T8 脚本拆分分镜
↓
T9 Shot 类型分类
↓
T10 分镜素材复查
↓
T11 生成视频模型 Prompt
↓
T12 导出交付包

---

### 14.3 任务状态

每个任务都应该有明确状态：

* pending
* queued
* processing
* success
* failed
* retrying
* needs_user_input
* cancelled

---

### 14.4 失败处理

系统需要支持：

* 任务失败重试
* 单阶段重新执行
* 用户补充素材后继续执行
* 趋势数据为空时使用 fallback
* LLM 输出异常时重新生成
* 导出失败时重新打包

---

## 15. 阶段十二：导出广告生产包

### 15.1 最终输出

系统最终导出一个标准广告生产包。

包括：

* brief.json
* scripts.md
* shots.json
* kling_prompts.json
* seedance_prompts.json
* jimeng_prompts.json
* asset_gap_report.json
* export.zip

---

### 15.2 brief.json

包含：

* 产品信息
* SKU 信息
* 目标市场
* 目标用户
* 投放目标
* 趋势摘要
* 素材摘要
* 生成配置

---

### 15.3 scripts.md

包含 5 个广告脚本：

* 脚本标题
* 创意角度
* 目标情绪
* hook
* 正文台词
* 字幕文案
* CTA
* 预计时长
* 素材需求

---

### 15.4 shots.json

包含每个脚本的分镜：

* shot_id
* script_id
* order
* duration
* visual
* action
* voiceover
* subtitle
* shot_type
* required_assets
* camera_motion
* transition
* purpose

---

### 15.5 model_prompts.json

包含不同视频模型可用的 prompt：

* Kling prompt
* Seedance prompt
* 即梦 prompt

每个 prompt 对应一个 shot。

---

### 15.6 asset_gap_report.json

包含：

* 缺失素材列表
* 受影响脚本
* 受影响 shot
* 建议补充素材
* AI 替代方案
* 真实感风险提示

---

## 16. 用户最终拿到什么

用户最终拿到的不是单纯的广告文案，而是一整套可执行广告生产方案。

包括：

* 5 个可测试广告创意
* 每个创意的完整脚本
* 每个脚本的分镜执行表
* 每个分镜的视频模型 Prompt
* 素材缺口提示
* 视频生成模型适配文件
* 可导出的结构化交付包

---

## 17. 系统核心闭环

系统的核心闭环是：

产品输入
↓
素材边界判断
↓
趋势约束
↓
脚本生成
↓
分镜拆解
↓
镜头分类
↓
素材复查
↓
视频模型 Prompt 适配
↓
导出交付

---

## 18. 系统价值总结

这个系统解决了三个关键问题。

### 18.1 真实性问题

通过 Asset Gap Detection，系统知道用户有什么素材、缺什么素材。

这样可以避免 AI 编造无法拍摄的镜头。

---

### 18.2 可执行性问题

通过 Shot System，系统把脚本拆成可执行的视频镜头。

每个镜头都有：

* 画面
* 动作
* 时长
* 字幕
* 类型
* 素材依赖

这样脚本才能真正进入拍摄或视频生成流程。

---

### 18.3 模型兼容问题

通过 Prompt Adaptation Layer，系统把每个 shot 转成 Kling、Seedance、即梦等模型可消费的 prompt。

这样广告创意才能真正接入 AI 视频生成模型。

---

## 19. 一句话总结

AI短视频广告生成系统不是一个简单的“广告脚本生成器”。

它是一条从产品需求出发，结合素材边界、平台趋势、广告结构、分镜执行和视频模型适配的 AI 广告生产流水线。

核心逻辑是：

先判断素材边界，
再引入趋势约束，
然后生成广告脚本，
再拆成可执行分镜，
最后转换成视频模型 Prompt 并导出交付包。
