## 1. 文档目标

本文档用于识别 AI 短视频广告生成系统在产品、数据、AI Pipeline、系统架构、部署、代码实现和 Codex 执行过程中的主要风险。

本文档的目标不是展开实现细节，而是提前明确：

* 哪些风险必须在 MVP 阶段避免
* 哪些风险可以接受但需要提示
* 哪些风险需要通过代码健壮性处理
* 哪些风险需要在 Codex Tasks 中变成强约束
* 哪些风险后续可以延迟处理

---

## 2. 风险分级

系统风险分为四个等级。

### 2.1 low

低风险。

不会阻塞系统运行，只影响体验或结果质量。

示例：

* 某个脚本创意一般
* 某个 Prompt 不够精细
* 某个导出字段不够丰富

---

### 2.2 medium

中风险。

不会立刻导致系统失败，但会影响广告可执行性、结果可信度或用户体验。

示例：

* 素材不足导致 AI 镜头占比过高
* 趋势数据缺失，只能使用 fallback
* 脚本重复度较高

---

### 2.3 high

高风险。

会明显影响系统结果质量、执行稳定性或开发效率。

示例：

* AI 输出结构不稳定
* Worker 任务失败后无法恢复
* 文件路径写死导致部署失败
* Codex 跨文件大改导致架构漂移

---

### 2.4 blocking

阻塞风险。

会导致系统无法继续执行，必须优先处理。

示例：

* 没有产品信息
* 没有任何产品素材
* 数据库不可用
* AI API Key 缺失
* 导出目录不可写
* Pipeline 状态不可恢复

---

## 3. 风险处理原则

### 3.1 先保护系统可执行

MVP 阶段最重要的是让系统能稳定跑通完整闭环。

优先级如下：

1. Pipeline 可执行
2. 数据可保存
3. 任务可恢复
4. 结果可导出
5. 内容质量逐步优化

---

### 3.2 AI 不可信，输出必须校验

所有 AI 输出都不能直接信任。

必须经过：

* JSON 格式校验
* 必填字段校验
* 枚举值校验
* 数量校验
* 业务规则校验

---

### 3.3 Worker 必须可恢复

任何异步任务都可能失败。

因此每个 Worker 任务必须：

* 有 TaskRun 记录
* 有输入引用
* 有输出引用
* 有状态更新
* 有错误信息
* 有重试机制
* 不依赖内存状态

---

### 3.4 文件路径必须可迁移

系统需要从 MacBook 本地开发迁移到 Mac mini Docker 部署。

因此所有文件路径必须：

* 通过环境变量配置
* 使用相对 storage_root
* 不写死本机用户名
* 不暴露真实服务器路径
* 支持 Docker volume 挂载

---

### 3.5 Codex 只能执行，不允许设计

Codex 执行阶段必须严格限制。

Codex 不允许：

* 重新设计架构
* 跨模块大规模重构
* 自行新增功能
* 自行调整数据模型
* 把 Worker 逻辑写进 API
* 直接绕过 TaskRun
* 直接调用 AI Provider 以外的模型 API

---

## 4. 产品输入风险

### 4.1 产品信息不足

风险说明：

用户输入的产品信息过少，导致 AI 无法生成有效广告脚本。

常见情况：

* 没有产品名称
* 没有产品用途
* 没有核心卖点
* 没有目标用户
* 没有使用场景

影响：

* 脚本泛化
* 生成内容空洞
* AI 容易编造卖点
* 无法做素材缺口判断

风险等级：

blocking / high

处理方式：

* 创建 Project 时校验必填字段
* 缺少关键信息时进入 needs_user_input
* 不允许进入 Script Generation
* 提示用户补充最小产品信息

MVP 验证条件：

* 缺少产品名称时不能启动 Pipeline
* 缺少产品卖点时需要提示用户补充
* 缺少目标市场时使用默认值前必须明确标记

---

### 4.2 产品卖点不可信

风险说明：

用户提供的卖点可能包含夸张或未经验证的声明。

示例：

* 100% 有效
* 立刻见效
* 永久解决
* 医疗级效果
* 保证转化

影响：

* 广告合规风险
* 平台审核风险
* 用户信任风险

风险等级：

high

处理方式：

* Project Brief Normalization 中提取 claim_constraints
* Script Generation 禁止强化无法验证的绝对化表述
* Prompt 不生成误导性效果画面
* 输出 risk_notes

MVP 验证条件：

* 脚本不得新增用户没有提供的功能声明
* 脚本不得使用绝对化承诺
* 高风险声明必须进入 risk_notes

---

## 5. 素材风险

### 5.1 缺少基础产品素材

风险说明：

用户没有上传任何产品图片或视频。

影响：

* 无法识别产品
* 无法生成可信分镜
* 无法生成产品展示 Prompt
* 导出结果不可用

风险等级：

blocking

处理方式：

* 至少要求一个 product_image 或 product_video
* 缺失时 Project status = needs_user_input
* 不进入后续 AI Pipeline

MVP 验证条件：

* 没有产品素材时不能执行 Script Generation
* 系统必须返回明确的 missing_assets

---

### 5.2 缺少使用场景素材

风险说明：

用户只有产品图，没有使用视频、手部操作或生活场景素材。

影响：

* REAL 镜头比例下降
* AI 镜头比例上升
* 视频真实感降低
* 转化说服力下降

风险等级：

medium / high

处理方式：

* Asset Gap Detection 标记缺口
* Shot Asset Re-check 二次复查
* 对应 Shot 标记 AI fallback
* 在结果页提示真实感风险

MVP 验证条件：

* 缺少 hand_demo_video 时，相关 shot 必须标记 realism_risk
* 缺少 lifestyle_scene 时，不得强制生成 REAL 生活场景镜头

---

### 5.3 素材质量过低

风险说明：

素材分辨率低、模糊、过暗、比例错误或主体不清晰。

影响：

* 视频生成质量下降
* AI 分析不准确
* Prompt 引用效果变差

风险等级：

medium

处理方式：

* AssetAnalysis 记录 quality_score
* limitations 中标记问题
* 低质量素材不作为优先 REAL 镜头来源
* 给出补充素材建议

MVP 验证条件：

* AssetAnalysis 必须包含 quality_score 或 limitations
* 低质量素材必须在 asset_gap_report 中体现

---

### 5.4 素材类型误判

风险说明：

系统或用户将素材类型标错。

示例：

* 产品图被标记成生活方式图
* 包装图被标记成产品使用图
* 竞品视频被当成自有素材

影响：

* 脚本依赖错误素材
* Shot 分类错误
* Prompt 引用错误

风险等级：

medium / high

处理方式：

* MVP 阶段允许用户手动选择 asset_type
* Vision 分析只作为辅助，不完全覆盖用户标注
* 冲突时记录 warning
* 后续允许用户修正素材类型

MVP 验证条件：

* Asset 必须保存用户原始 asset_type
* AssetAnalysis 必须保存系统分析结果
* 不得直接覆盖用户输入

---

## 6. TikTok 趋势风险

### 6.1 趋势抓取失败

风险说明：

TikTok 趋势数据可能因为接口、反爬、网络或第三方 API 不稳定而获取失败。

影响：

* 无法使用真实趋势数据
* 脚本平台感下降
* Pipeline 可能阻塞

风险等级：

medium

处理方式：

* MVP 不强依赖自动 Trend Fetch
* 支持用户手动输入趋势文本
* 支持 fallback trend templates
* 标记 trend_source = fallback

MVP 验证条件：

* 没有趋势数据时 Pipeline 仍可继续
* fallback 使用必须在结果中标记
* 不得因为 Trend Fetch 失败导致完整项目失败

---

### 6.2 趋势数据噪声高

风险说明：

抓取到的趋势视频可能与产品不相关，或只是泛娱乐内容。

影响：

* 趋势结构化偏离产品
* 脚本不适合投放
* 创意方向错误

风险等级：

medium / high

处理方式：

* Trend Structuring 必须结合产品品类
* 低相关趋势不应成为核心约束
* TrendInsight 需要 summary 和 confidence_score
* 后续可加入相关性评分

MVP 验证条件：

* TrendInsight 必须包含和产品相关的 hook_patterns 或 content_structures
* 明显无关趋势不得直接驱动 Script Generation

---

## 7. AI 输出风险

### 7.1 AI 输出非结构化

风险说明：

LLM 返回自然语言解释，而不是系统需要的结构化 JSON。

影响：

* 后续阶段无法消费
* Worker 任务失败
* Pipeline 中断

风险等级：

high

处理方式：

* 每个 AI 阶段定义 output_schema
* 解析失败时请求修复
* 修复失败后重新生成
* 最终 fallback 或 failed

MVP 验证条件：

* AI 输出必须经过 schema 校验
* JSON 解析失败不能写入最终业务表
* TaskRun 必须记录错误原因

---

### 7.2 AI 缺字段

风险说明：

LLM 输出中缺少必填字段。

示例：

Script 缺少 hook、CTA、estimated_duration。

影响：

* 前端展示异常
* 分镜生成失败
* 导出文件不完整

风险等级：

high

处理方式：

* 必填字段校验
* 缺字段自动修复
* 修复失败重新生成该项
* 不合格结果不进入下一阶段

MVP 验证条件：

* Script 必须包含 hook 和 CTA
* Shot 必须包含 visual、action、duration、shot_type
* ModelPrompt 必须包含 prompt、duration、aspect_ratio

---

### 7.3 AI 编造产品功能

风险说明：

AI 为了让广告更吸引人，编造用户没有提供的产品功能或效果。

影响：

* 广告失真
* 合规风险
* 用户信任风险

风险等级：

high

处理方式：

* Script Generation 输入中提供 claim_constraints
* Prompt 中禁止新增功能
* Script Quality Check 或规则检查检测新增声明
* risk_notes 标记可疑内容

MVP 验证条件：

* 脚本内容必须可追溯到 Product selling_points
* 未在产品信息中出现的功能不得作为核心卖点
* 高风险表达必须进入 risk_notes

---

### 7.4 AI 结果重复

风险说明：

生成的 5 个脚本角度差异不明显。

影响：

* 测试价值低
* 用户感知结果质量差
* 创意冗余

风险等级：

medium

处理方式：

* creative_angle 必须枚举且不同
* 重复角度重新生成
* 输出前做重复度检查

MVP 验证条件：

* 5 个 Script 的 creative_angle 不得完全相同
* title、hook、main_message 不得高度重复

---

### 7.5 Prompt 不适合视频模型

风险说明：

生成的 Prompt 过长、过泛、包含多个场景，视频模型无法稳定消费。

影响：

* 视频生成质量差
* 镜头不可控
* 模型输出不符合广告目标

风险等级：

medium / high

处理方式：

* 每个 Prompt 只对应一个 Shot
* Prompt 只描述单一画面和动作
* 避免复杂多场景描述
* 使用固定字段输出

MVP 验证条件：

* 一个 ModelPrompt 必须对应一个 shot_id
* Prompt 不得包含多个 shot 的内容
* duration 必须和 Shot duration 对齐

---

## 8. Pipeline 执行风险

### 8.1 Pipeline 阶段跳过

风险说明：

系统直接从前序阶段跳到后序阶段，缺少中间数据。

示例：

没有 AssetGapReport 就生成 Script。

影响：

* 脚本不受素材约束
* 后续无法追溯
* 数据不完整

风险等级：

high

处理方式：

* 每个阶段检查前置依赖
* 缺失依赖时任务失败或 needs_user_input
* Pipeline Orchestrator 统一推进状态

MVP 验证条件：

* Script Generation 前必须存在 Product、AssetAnalysis、AssetGapReport、TrendInsight 或 fallback TrendInsight
* Shot Breakdown 前必须存在 Script
* Prompt Generation 前必须存在 Shot

---

### 8.2 Pipeline 状态不可恢复

风险说明：

任务失败后，系统不知道执行到哪一步，也不知道如何继续。

影响：

* 用户项目卡死
* 无法重试
* 需要人工修复数据库

风险等级：

blocking

处理方式：

* 每个阶段创建 TaskRun
* TaskRun 记录 input_ref、output_ref、status、error_message
* Project 只记录整体状态和 current_step
* 不依赖内存保存中间状态

MVP 验证条件：

* 任意 Worker 失败后 TaskRun.status 必须变为 failed
* error_message 必须有值
* Project 必须能显示当前失败阶段

---

### 8.3 重复执行导致数据污染

风险说明：

用户重试某个阶段时，系统重复写入多份冲突数据。

影响：

* 前端展示重复结果
* 导出文件混乱
* 后续阶段读取错误版本

风险等级：

high

处理方式：

* 重试前明确是否覆盖旧结果
* 结果表支持 version 或 regenerated 标记
* MVP 可先删除当前阶段旧结果再重新生成
* 不影响前序阶段数据

MVP 验证条件：

* 重试 Script Generation 不应生成超过预期数量的 active scripts
* 重试 Prompt Generation 不应产生重复 active prompts

---

## 9. 数据风险

### 9.1 数据字段漂移

风险说明：

开发过程中字段名频繁变化，导致 API、Worker、导出文件不一致。

影响：

* 前后端联调失败
* Worker 查询失败
* 导出结果缺字段
* Codex 任务互相冲突

风险等级：

high

处理方式：

* 数据字段以 02_data_design.md 为准
* 后续修改必须显式记录
* Codex 不得自行重命名字段
* schemas 作为代码层边界

MVP 验证条件：

* Script、Shot、ModelPrompt 核心字段必须和数据设计一致
* 导出文件字段必须来自已定义 schema

---

### 9.2 原始数据丢失

风险说明：

只保存 AI 处理后的结果，没有保存原始输入或原始趋势数据。

影响：

* 无法调试
* 无法复盘
* 无法重新生成
* 无法解释结果来源

风险等级：

medium / high

处理方式：

* 保留用户原始输入
* 保留素材记录
* 保留 AI 输入摘要
* 保留 Trend fallback 标记
* 后续可保留 LLM raw output

MVP 验证条件：

* Product 原始描述必须保存
* Asset 原始文件路径必须保存
* TrendInsight 必须标记来源

---

### 9.3 JSON 大字段失控

风险说明：

将过多复杂数据塞进 JSON 字段，导致查询、调试和版本管理困难。

影响：

* 数据不可维护
* 后续拆表成本高
* 导出逻辑复杂

风险等级：

medium

处理方式：

* MVP 可以使用 JSON 简化开发
* 核心对象仍需独立表
* 大字段只用于 raw_payload、metadata、analysis_detail
* 关键字段必须结构化

MVP 验证条件：

* Project、Script、Shot、ModelPrompt 不应只存在一个大 JSON 字段
* 关键查询字段必须独立存储

---

## 10. 文件存储风险

### 10.1 文件路径写死

风险说明：

代码中写死 MacBook 本地路径或 Mac mini 绝对路径。

影响：

* 本地可运行，Docker 不可运行
* 迁移失败
* 导出失败
* 文件无法访问

风险等级：

blocking / high

处理方式：

* 所有路径基于 STORAGE_ROOT
* 使用 config 统一读取
* Docker 中通过 volume 挂载
* 不在数据库暴露本机绝对路径给前端

MVP 验证条件：

* 代码中不得出现 `/Users/...` 这类硬编码路径
* 上传和导出都必须基于 STORAGE_ROOT
* Docker 环境只需改环境变量即可迁移

---

### 10.2 文件丢失或不可读

风险说明：

数据库记录存在，但真实文件不存在或不可读。

影响：

* 素材分析失败
* 导出失败
* 下载失败

风险等级：

high

处理方式：

* 读取文件前检查 exists
* 不存在时记录 TaskRun.error_message
* 不继续调用 AI
* 提示用户重新上传

MVP 验证条件：

* 文件不存在时 Worker 不崩溃
* TaskRun 必须失败并记录错误
* API 下载不存在文件时返回标准错误

---

### 10.3 上传文件类型不安全

风险说明：

用户上传非图片/视频文件，或恶意文件。

影响：

* 存储污染
* 处理失败
* 安全风险

风险等级：

medium / high

处理方式：

* 限制 mime_type
* 限制文件大小
* 不执行上传文件内容
* 文件名做安全处理
* 存储时使用系统生成文件名

MVP 验证条件：

* 不支持的文件类型必须拒绝
* 上传文件名不能直接作为最终路径
* 文件大小超过限制必须返回错误

---

## 11. Worker 与队列风险

### 11.1 Worker 任务粒度过大

风险说明：

一个 Worker 任务执行完整 Pipeline。

影响：

* 失败难恢复
* 重试成本高
* 日志不清晰
* 状态不可控

风险等级：

high

处理方式：

* 一个任务只执行一个 Pipeline 阶段
* 阶段之间通过数据库传递结果
* Pipeline Orchestrator 触发下一阶段

MVP 验证条件：

* 不允许存在 run_full_pipeline 作为唯一执行入口
* 每个 TaskRun 只能对应一个 task_type

---

### 11.2 Worker 无错误边界

风险说明：

Worker 抛异常后没有捕获，导致状态不更新。

影响：

* 任务卡在 processing
* 用户看不到失败原因
* 需要人工处理

风险等级：

high

处理方式：

* Worker 顶层捕获异常
* 失败时更新 TaskRun
* 记录 error_message
* 根据策略更新 Project

MVP 验证条件：

* 任意异常都不能让 TaskRun 永远停在 processing
* failed 状态必须可查询

---

### 11.3 队列重复消费

风险说明：

同一个任务被重复执行。

影响：

* 生成重复数据
* 状态冲突
* 导出混乱

风险等级：

medium / high

处理方式：

* TaskRun status 防重
* 已 success 的任务不重复执行
* Worker 执行前检查状态
* 数据写入支持幂等

MVP 验证条件：

* status = success 的 TaskRun 不应再次执行
* 同一阶段重试必须显式创建或更新 TaskRun

---

## 12. API 风险

### 12.1 API 执行耗时任务

风险说明：

API 请求中直接执行 AI 生成或完整 Pipeline。

影响：

* 请求超时
* 用户体验差
* 服务阻塞
* 无法重试

风险等级：

high

处理方式：

* API 只创建任务并入队
* 耗时任务交给 Worker
* 前端通过状态轮询查询结果

MVP 验证条件：

* start pipeline API 不直接生成全部结果
* AI 调用不应出现在 API handler 中

---

### 12.2 API 返回内部路径或敏感信息

风险说明：

API 把服务器真实文件路径、API Key、错误堆栈返回给前端。

影响：

* 安全风险
* 部署信息泄漏
* 用户误操作

风险等级：

high

处理方式：

* 返回 file_id 或 download_url
* 不返回本地绝对路径
* 错误信息标准化
* API Key 只存在环境变量

MVP 验证条件：

* API response 不包含 STORAGE_ROOT 真实路径
* API response 不包含 AI_API_KEY
* 生产环境不返回完整异常堆栈

---

## 13. 部署风险

### 13.1 MacBook 能跑，Mac mini Docker 不能跑

风险说明：

开发阶段依赖本地路径、本地端口或本地环境，迁移 Docker 后失败。

影响：

* 部署延期
* 调试困难
* 需要重构配置

风险等级：

high

处理方式：

* 从一开始使用环境变量
* storage_root 可配置
* database_url 可配置
* queue_url 可配置
* 不写死 localhost
* 早期准备 docker-compose

MVP 验证条件：

* 本地和 Docker 使用同一套业务代码
* 迁移时只修改 env 和 compose 配置
* 不修改业务逻辑

---

### 13.2 Docker volume 未持久化

风险说明：

容器重启后数据库、上传文件或导出文件丢失。

影响：

* 项目数据丢失
* 用户文件丢失
* 导出包丢失

风险等级：

blocking / high

处理方式：

* database volume 持久化
* storage volume 持久化
* exports volume 持久化
* logs 可选持久化

MVP 验证条件：

* 容器重启后 Project 数据仍存在
* 上传文件仍存在
* 导出文件仍可下载

---

### 13.3 环境变量缺失

风险说明：

Mac mini 部署时缺少 AI_API_KEY、DATABASE_URL、STORAGE_ROOT 等配置。

影响：

* 服务启动失败
* AI 调用失败
* 文件保存失败

风险等级：

blocking

处理方式：

* 启动时检查必填环境变量
* 缺失时服务明确报错
* 不在运行中才暴露配置问题

MVP 验证条件：

* 缺少 AI_API_KEY 时 AI 任务不能静默失败
* 缺少 STORAGE_ROOT 时服务启动或文件任务必须报明确错误
* 缺少 DATABASE_URL 时服务不能进入假成功状态

---

## 14. 安全与权限风险

### 14.1 用户访问他人项目

风险说明：

用户通过 project_id 查询或下载别人的数据。

影响：

* 数据泄漏
* 素材泄漏
* 导出文件泄漏

风险等级：

high

处理方式：

* 所有 Project 查询校验 user_id
* 下载文件校验 project ownership
* Worker 内部使用 project_id 但 API 层必须鉴权

MVP 验证条件：

* API 查询 Project 时必须校验 owner
* 下载 ExportPackage 时必须校验 owner

---

### 14.2 上传内容风险

风险说明：

用户上传侵权、敏感或不适合广告生成的素材。

影响：

* 合规风险
* 平台风险
* 生成内容风险

风险等级：

medium / high

处理方式：

* MVP 阶段至少限制文件类型和大小
* 后续可增加内容安全审核
* 导出结果中不做平台合规保证

MVP 验证条件：

* 系统不执行用户上传文件
* 不接受危险文件类型
* 文件名必须安全处理

---

## 15. 成本风险

### 15.1 AI 调用成本失控

风险说明：

每个项目多阶段调用 LLM 和视觉模型，成本可能快速上升。

影响：

* 单项目成本不可控
* 用户重复生成导致费用增加
* Worker 重试导致额外成本

风险等级：

medium / high

处理方式：

* 限制最大重试次数
* 限制每个 Project 默认生成数量
* MVP 默认 5 个 Script
* 控制每个 Script 4-8 个 Shot
* 记录 AI 调用元数据

MVP 验证条件：

* Worker 最大重试次数为 3
* 不允许无限重新生成
* Script 数量默认固定为 5
* Shot 数量需要限制

---

### 15.2 大文件存储成本和磁盘占用

风险说明：

用户上传大量视频素材，Mac mini 本地磁盘可能被占满。

影响：

* 服务异常
* 导出失败
* 数据库或队列异常

风险等级：

medium / high

处理方式：

* 限制上传文件大小
* 限制单项目素材数量
* 后续增加清理策略
* 导出文件可设置保留周期

MVP 验证条件：

* 上传文件大小必须有限制
* 单项目素材数量必须有限制或至少可配置

---

## 16. 代码健壮性风险

### 16.1 输入未校验

风险说明：

API 或 Worker 接收到空值、非法枚举、非法 JSON 后直接处理。

影响：

* 程序崩溃
* 数据污染
* AI 输出异常
* 用户体验差

风险等级：

high

处理方式：

* API request schema 校验
* Worker 输入依赖校验
* 枚举值校验
* 缺失字段返回标准错误

Codex 约束：

每个涉及输入的 task 都必须包含 validation。

MVP 验证条件：

* 空 product_name 不可创建有效 Project
* 非法 shot_type 不可写入 Shot
* 非法 model 不可写入 ModelPrompt

---

### 16.2 错误处理不一致

风险说明：

不同模块使用不同错误格式，有些抛异常，有些返回 None，有些静默失败。

影响：

* 调试困难
* Worker 状态不一致
* 前端难以展示错误

风险等级：

medium / high

处理方式：

* API 使用统一错误响应
* Worker 使用 TaskRun.error_message
* AI 层使用统一 AIError
* repository 层不吞异常

Codex 约束：

新增函数必须明确失败返回方式。

MVP 验证条件：

* API 错误包含 error_code 和 message
* Worker 错误写入 TaskRun
* 不允许静默失败

---

### 16.3 函数职责过大

风险说明：

一个函数同时处理 API、数据库、AI 调用、状态更新和导出。

影响：

* 难测试
* 难重试
* Codex 容易误改
* 后续维护困难

风险等级：

high

处理方式：

* API 只调用 service
* service 不直接调用外部 AI
* Worker 执行阶段任务
* exporter 只负责导出

Codex 约束：

每个 task 只允许实现一个函数或一个逻辑单元。

MVP 验证条件：

* 不允许出现一个函数跑完整 Pipeline
* 不允许 API handler 中包含多阶段 AI 生成逻辑

---

### 16.4 缺少幂等处理

风险说明：

任务重试或重复调用导致重复数据。

影响：

* 数据污染
* 导出重复
* 用户结果混乱

风险等级：

medium / high

处理方式：

* 任务执行前检查 TaskRun 状态
* 对可重试阶段明确覆盖策略
* 导出文件生成前清理或版本化

Codex 约束：

涉及 Worker 的 task 必须检查 task_run_id 和状态。

MVP 验证条件：

* 同一 TaskRun 成功后不能再次写入重复结果
* 重试时必须明确删除、覆盖或生成新版本

---

## 17. Codex 执行风险

### 17.1 Task 粒度过大

风险说明：

给 Codex 的任务过大，比如“实现完整 Pipeline”。

影响：

* 跨文件修改
* 架构漂移
* 难以 review
* 出现隐藏 bug

风险等级：

high

处理方式：

* 每个 task 单文件
* 每个 task 单函数或单逻辑单元
* 每阶段最多 3-7 个 task
* 超出则拆 phase

验证条件：

* 每个 Codex task 都必须明确 file、function、goal
* 不允许一个 task 修改多个无关文件

---

### 17.2 Codex 自行扩展功能

风险说明：

Codex 为了“完善系统”，新增未定义功能或抽象。

影响：

* 代码变复杂
* 偏离 MVP
* 后续任务冲突
* 架构不可控

风险等级：

high

处理方式：

* Task constraints 明确禁止新增功能
* 禁止 refactor
* 禁止 architecture modification
* 输出必须按 task 验证

验证条件：

* Codex task 中必须包含 no new features
* Codex task 中必须包含 no architectural modification

---

### 17.3 Codex 读取上下文过多

风险说明：

每个任务都让 Codex 读取完整母版文档。

影响：

* token 成本高
* 上下文噪声大
* 容易自由发挥
* 执行不稳定

风险等级：

medium / high

处理方式：

* 母版文档只用于规划
* Codex 执行时使用阶段 context
* 每个 task 只读取当前文件和相关 context

验证条件：

* 每个 phase 有独立 context.md
* task 不引用全量设计文档
* task 只引用必要字段和约束

---

## 18. 前端体验风险

### 18.1 用户不知道 Pipeline 卡在哪里

风险说明：

异步任务执行较久，前端没有清晰状态展示。

影响：

* 用户以为系统卡死
* 用户重复点击
* 任务重复创建

风险等级：

medium

处理方式：

* 展示 Project status
* 展示 current_step
* 展示 TaskRun 列表
* 失败时展示 error_message

MVP 验证条件：

* 用户可以看到当前执行阶段
* 失败时能看到失败原因
* 不允许只有 loading 没有状态

---

### 18.2 素材缺口提示不清楚

风险说明：

系统只告诉用户“素材不足”，但不说明缺什么、影响什么。

影响：

* 用户无法补充
* 用户不理解结果质量
* AI 生成占比过高

风险等级：

medium

处理方式：

* AssetGapReport 输出 missing_assets
* Shot Asset Re-check 输出受影响 shot
* 给出具体补充建议

MVP 验证条件：

* 缺少素材时必须说明缺失类型
* 必须说明对真实感的影响
* 必须给出建议补充素材

---

## 19. 导出风险

### 19.1 导出文件不完整

风险说明：

导出包缺少 scripts、shots 或 prompts。

影响：

* 用户无法交付给视频模型
* 系统结果不可用

风险等级：

high

处理方式：

* Export Assembly 前检查依赖
* 每个文件单独生成
* 缺少核心数据时导出失败并提示
* 不重新执行 AI 生成

MVP 验证条件：

* export.zip 必须包含 scripts.md、shots.json、model_prompts.json 或对应模型文件
* 缺少 Script 时不能生成成功导出包
* 导出失败必须记录 error_message

---

### 19.2 导出内容和数据库不一致

风险说明：

导出的文件不是当前数据库中的最新结果。

影响：

* 用户复制错误内容
* Prompt 无法追溯
* 结果不可复盘

风险等级：

medium / high

处理方式：

* 导出时从数据库读取当前 active 数据
* 每个导出包记录 created_at
* ExportPackage 保存 included_files
* 后续可支持 version

MVP 验证条件：

* 导出文件中的 script_id、shot_id、prompt_id 必须能对应数据库记录
* ExportPackage 必须保存 included_files

---

## 20. MVP 必须处理的风险

MVP 阶段必须处理以下风险：

1. 产品信息不足
2. 缺少基础产品素材
3. AI 输出非结构化
4. AI 输出缺字段
5. Pipeline 状态不可恢复
6. Worker 异常后 TaskRun 不更新
7. 文件路径写死
8. 环境变量缺失
9. API 直接执行耗时任务
10. 导出文件不完整
11. Codex task 粒度过大
12. Codex 自行扩展功能

这些风险不能延后。

---

## 21. MVP 可以接受但必须标记的风险

MVP 阶段可以接受以下风险，但必须在结果中标记：

1. 没有真实 TikTok 趋势数据，使用 fallback
2. 缺少使用场景素材，AI 镜头占比升高
3. 素材质量一般
4. 脚本创意不够丰富
5. Prompt 未针对每个视频模型深度优化
6. 没有完整 Script Quality Check
7. 没有自动生成最终视频
8. 没有复杂权限系统

这些风险不阻塞 MVP，但需要向用户或开发者透明。

---

## 22. MVP 暂不处理的风险

MVP 阶段可以暂不处理：

1. 广告自动投放风险
2. 广告账户权限风险
3. A/B Test 数据回传风险
4. 多租户复杂权限风险
5. 云对象存储安全策略
6. Kubernetes 部署风险
7. 大规模并发队列调度风险
8. 多模型成本优化
9. 自动剪辑成片质量风险
10. 平台广告审核自动化风险

这些内容留到后续版本。

---

## 23. 风险到 Codex Task 的映射

后续生成 Codex Tasks 时，每个 task 都必须带上风险约束。

### 23.1 API 类 task

必须包含：

* 输入校验
* 不直接调用 AI
* 不执行耗时任务
* 错误响应标准化
* 不暴露内部路径

---

### 23.2 Worker 类 task

必须包含：

* 检查 task_run_id
* 更新 TaskRun 状态
* 捕获异常
* 写入 error_message
* 单阶段执行
* 不跨阶段生成

---

### 23.3 AI 类 task

必须包含：

* 使用指定 Prompt 模板
* 输出 schema 校验
* 解析失败处理
* 不编造产品功能
* 不返回自然语言解释

---

### 23.4 Storage 类 task

必须包含：

* 使用 STORAGE_ROOT
* 不写死路径
* 检查文件存在
* 安全文件名
* 不暴露真实路径

---

### 23.5 Export 类 task

必须包含：

* 只读取已有数据
* 不重新调用 AI
* 检查核心数据完整性
* 生成标准文件
* 失败时记录错误

---

## 24. 风险检查清单

每次进入开发前，需要检查：

* 是否明确 MVP 范围
* 是否明确当前 phase
* 是否有阶段 context
* 是否只让 Codex 读必要上下文
* 是否每个 task 单文件
* 是否每个 task 单逻辑单元
* 是否有 validation
* 是否禁止 refactor
* 是否禁止新增功能
* 是否禁止架构修改

---

## 25. 一句话总结

本系统最大的风险不是单个功能难实现，而是：

AI 输出不稳定、Pipeline 状态不可恢复、素材边界不清、文件路径不可迁移、Codex 自由发挥。

因此 MVP 阶段必须优先保证：

数据结构稳定，
Pipeline 可恢复，
AI 输出可校验，
Worker 可重试，
文件路径可部署，
Codex 任务足够小且边界清晰。
