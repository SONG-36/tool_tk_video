## 1. 文档目标

本文档用于定义 AI 短视频广告生成系统的整体系统架构。

本文档重点回答：

* 系统由哪些模块组成
* 后端如何组织
* AI Pipeline 如何执行
* Worker 如何异步处理任务
* 数据库如何存储核心数据
* 文件素材如何存储
* 本地 MacBook 如何开发
* Mac mini 如何通过 Docker 部署
* 哪些架构边界不能让 Codex 随意修改

---

## 2. 架构目标

本系统的架构目标是：

以最小可执行闭环为优先，先在本地 MacBook 跑通完整业务链路，再部署到 Mac mini 的 Docker 环境中长期运行。

系统第一阶段不追求复杂微服务架构，而是采用：

单后端服务
+
异步 Worker
+
数据库
+
文件存储
+
任务队列
+
AI Provider 调用层

---

## 3. 推荐开发路径

### 3.1 第一阶段：MacBook 本地开发

目标是快速跑通 MVP 闭环。

包括：

* 创建 Project
* 输入产品信息
* 上传或模拟素材
* 生成 AssetAnalysis
* 生成 AssetGapReport
* 生成 TrendInsight
* 生成 5 个 Script
* 拆分 Shot
* 生成 ModelPrompt
* 导出本地文件

这一阶段优先解决业务逻辑，不优先解决复杂部署。

---

### 3.2 第二阶段：Mac mini Docker 部署

目标是让后端系统在 Mac mini 上稳定运行。

包括：

* 后端服务 Docker 化
* Worker Docker 化
* 数据库容器化或本机持久化
* 队列服务容器化
* 文件目录挂载
* 日志持久化
* 局域网访问
* 环境变量管理

---

### 3.3 第三阶段：外部访问与稳定化

后续可扩展：

* 域名访问
* HTTPS
* 反向代理
* 用户认证
* 远程访问控制
* 云端备份
* 多用户并发

MVP 阶段不强制实现。

---

## 4. 总体系统架构

系统由以下模块组成：

Frontend
↓
Backend API
↓
Pipeline Orchestrator
↓
Task Queue
↓
Worker
↓
AI Provider Layer
↓
Database / File Storage
↓
Export Package

---

## 5. 架构分层

## 5.1 Frontend 前端层

### 作用

前端负责用户交互。

主要功能包括：

* 创建广告项目
* 填写产品信息
* 上传素材
* 查看 Pipeline 进度
* 查看脚本结果
* 查看分镜结果
* 查看 Prompt 结果
* 查看素材缺口报告
* 下载导出文件

### MVP 前端要求

MVP 阶段前端不需要复杂。

只需要支持：

* 表单输入
* 文件上传
* 项目状态展示
* 结果列表展示
* 导出下载

---

## 5.2 Backend API 后端接口层

### 作用

Backend API 负责处理前端请求。

主要职责：

* Project 创建
* Product 信息保存
* Asset 上传登记
* Pipeline 启动
* 状态查询
* 结果查询
* 文件导出
* 下载链接返回

Backend API 不直接执行耗时 AI 任务。

耗时任务必须交给 Worker。

---

## 5.3 Pipeline Orchestrator 流程编排层

### 作用

Pipeline Orchestrator 负责决定下一步执行什么任务。

它不负责具体 AI 生成内容，而是负责：

* 创建 TaskRun
* 推送任务到 Queue
* 更新 Project current_step
* 判断任务是否完成
* 判断是否进入下一阶段
* 判断是否需要用户补充信息
* 判断是否失败

---

## 5.4 Task Queue 任务队列层

### 作用

Task Queue 用于承接异步任务。

适合进入队列的任务包括：

* Asset Understanding
* Asset Gap Detection
* Trend Structuring
* Script Generation
* Shot Breakdown
* Shot Classification
* Shot Asset Re-check
* Model Prompt Generation
* Export Assembly

---

## 5.5 Worker 后台任务层

### 作用

Worker 负责执行具体耗时任务。

Worker 的职责包括：

* 从队列中取任务
* 读取数据库输入
* 调用 AI Provider
* 校验 AI 输出
* 写入数据库
* 更新 TaskRun 状态
* 失败时记录错误
* 成功后触发下一阶段

Worker 不直接处理 HTTP 请求。

---

## 5.6 AI Provider Layer AI 调用层

### 作用

AI Provider Layer 是系统和外部 AI 模型之间的隔离层。

它负责：

* LLM 调用
* Vision 模型调用
* Prompt 模板管理
* 输出格式校验
* 重试
* 错误标准化
* 模型切换

业务代码不应该直接调用具体模型 API。

所有 AI 调用都应该通过 AI Provider Layer。

---

## 5.7 Database 数据库层

### 作用

数据库负责保存结构化业务数据。

包括：

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

---

## 5.8 File Storage 文件存储层

### 作用

文件存储负责保存非结构化文件。

包括：

* 用户上传的图片
* 用户上传的视频
* 素材分析 JSON
* 导出 JSON
* scripts.md
* export.zip

MVP 阶段建议使用本地文件系统。

后续可扩展为对象存储。

---

## 6. MVP 推荐技术形态

MVP 建议采用：

* 一个 Backend API 服务
* 一个 Worker 服务
* 一个数据库
* 一个队列服务
* 一个本地文件存储目录
* 一个 AI Provider 抽象层

不建议 MVP 阶段使用复杂微服务。

原因：

* 当前核心风险在业务链路和 AI 输出质量
* 微服务会增加部署复杂度
* 本地 Mac mini 运行更适合轻量架构
* Codex 执行时更容易保持边界清晰

---

## 7. 本地开发架构

MacBook 本地开发时，系统可以这样运行：

Frontend
→ localhost Backend API
→ Local Queue
→ Local Worker
→ Local Database
→ Local File Storage

本地开发目标：

* 快速调试 API
* 快速调试 Pipeline
* 快速查看数据库结果
* 快速查看导出文件
* 快速修改 Prompt 模板

本地开发阶段不要求高可用。

---

## 8. Mac mini Docker 部署架构

Mac mini 部署时，建议使用 Docker Compose 管理服务。

服务组成：

* frontend
* backend-api
* worker
* database
* queue
* file-volume

部署关系：

Frontend Container
↓
Backend API Container
↓
Queue Container
↓
Worker Container
↓
Database Container
↓
Mounted File Storage Volume

文件目录通过 volume 挂载到 Mac mini 本地磁盘。

---

## 9. 服务划分

### 9.1 frontend

职责：

* 用户界面
* 表单输入
* 文件上传
* 状态展示
* 结果展示
* 下载导出文件

不负责：

* AI 生成
* Pipeline 编排
* 数据库直接访问
* 文件直接写入

---

### 9.2 backend-api

职责：

* 暴露 HTTP API
* 参数校验
* 读写数据库
* 创建 TaskRun
* 推送任务
* 返回项目状态
* 返回结果数据
* 返回下载链接

不负责：

* 直接执行长耗时 AI 任务
* 直接生成所有脚本
* 直接跑完整 Pipeline

---

### 9.3 worker

职责：

* 执行异步任务
* 调用 AI Provider
* 写入 AI 结果
* 更新 TaskRun
* 推进 Pipeline
* 生成导出文件

不负责：

* 接收用户 HTTP 请求
* 管理前端状态
* 处理登录页面

---

### 9.4 database

职责：

* 保存结构化数据
* 支持 Pipeline 恢复
* 支持状态查询
* 支持结果查询

---

### 9.5 queue

职责：

* 保存待执行任务
* 解耦 API 和 Worker
* 支持任务重试
* 支持异步执行

---

### 9.6 file-storage

职责：

* 保存上传素材
* 保存导出文件
* 保存大体积 JSON 文件
* 保存中间文件

---

## 10. 后端模块设计

后端内部建议划分为以下模块：

api
services
pipeline
workers
ai
repositories
schemas
storage
exporters
config
utils

---

## 11. api 模块

### 作用

api 模块负责 HTTP 接口。

主要包含：

* project api
* product api
* asset api
* pipeline api
* script api
* shot api
* prompt api
* export api

api 层只做：

* 请求参数校验
* 调用 service
* 返回 response

api 层不写复杂业务逻辑。

---

## 12. services 模块

### 作用

services 模块负责业务操作。

例如：

* 创建项目
* 保存产品信息
* 登记素材
* 查询项目状态
* 查询结果
* 触发 Pipeline

services 可以调用：

* repositories
* pipeline orchestrator
* storage service

services 不直接调用外部 AI。

---

## 13. pipeline 模块

### 作用

pipeline 模块负责流程编排。

核心能力：

* 判断当前 Project 处于哪个阶段
* 创建下一阶段 TaskRun
* 推送任务到 Queue
* 根据任务结果更新 Project 状态
* 支持单阶段重试

pipeline 模块不直接生成内容。

---

## 14. workers 模块

### 作用

workers 模块负责定义任务执行函数。

每个 Worker task 对应一个 Pipeline 阶段。

推荐任务：

* run_asset_understanding
* run_asset_gap_detection
* run_trend_structuring
* run_script_generation
* run_shot_breakdown
* run_shot_classification
* run_shot_asset_recheck
* run_model_prompt_generation
* run_export_assembly

每个任务必须：

* 读取 Project 数据
* 读取上一阶段输出
* 执行当前阶段逻辑
* 写入当前阶段输出
* 更新 TaskRun 状态

---

## 15. ai 模块

### 作用

ai 模块封装所有 AI 调用。

建议包含：

* llm_client
* vision_client
* prompt_template_loader
* output_validator
* ai_error_mapper

AI 模块负责：

* 读取 Prompt 模板
* 拼接输入
* 调用模型
* 解析输出
* 校验 schema
* 返回结构化结果

其他模块不能直接调用外部 AI API。

---

## 16. repositories 模块

### 作用

repositories 模块负责数据库读写。

每个核心数据对象可以有一个 repository。

例如：

* project_repository
* product_repository
* asset_repository
* script_repository
* shot_repository
* model_prompt_repository
* task_run_repository

repository 只做数据库操作，不写 AI 逻辑。

---

## 17. schemas 模块

### 作用

schemas 模块定义系统中的数据结构。

包括：

* API request schema
* API response schema
* AI output schema
* Export file schema
* Enum 定义

schemas 是 Codex 执行时的重要边界。

不要让 Codex 随意改字段名。

---

## 18. storage 模块

### 作用

storage 模块负责文件操作。

包括：

* 保存上传文件
* 读取素材文件
* 生成文件路径
* 保存导出文件
* 返回下载路径

storage 模块必须支持路径配置，不能写死 MacBook 或 Mac mini 的绝对路径。

---

## 19. exporters 模块

### 作用

exporters 模块负责生成最终交付文件。

包括：

* brief.json
* scripts.md
* shots.json
* kling_prompts.json
* seedance_prompts.json
* jimeng_prompts.json
* asset_gap_report.json
* export.zip

exporters 只负责组装已有数据，不负责重新生成 AI 内容。

---

## 20. config 模块

### 作用

config 模块负责读取环境变量和系统配置。

包括：

* database_url
* queue_url
* storage_root
* ai_api_key
* ai_model_name
* max_retry_count
* environment
* log_level

所有部署差异都应该通过配置解决。

代码里不能写死本地路径、API Key 或服务器地址。

---

## 21. 数据库架构

MVP 阶段建议保留以下核心表：

* users
* projects
* products
* assets
* asset_analyses
* asset_gap_reports
* trend_insights
* scripts
* shots
* model_prompts
* export_packages
* task_runs

MVP 可暂缓：

* sku
* trend_fetches
* trend_raw_items
* shot_asset_checks

暂缓表的数据可先合并到已有表的 JSON 字段中。

---

## 22. 文件存储架构

### 22.1 存储原则

文件必须按 project_id 分组。

不能所有文件混在一个目录。

---

### 22.2 推荐目录结构

storage_root
└── projects
└── {project_id}
├── assets
│   ├── original
│   └── thumbnails
├── analysis
├── prompts
├── exports
└── logs

---

### 22.3 文件路径要求

文件路径必须满足：

* 可配置
* 可迁移
* 可被 Docker volume 挂载
* 不依赖 MacBook 用户名
* 不依赖固定绝对路径

---

## 23. 队列架构

### 23.1 队列作用

队列用于解耦 API 和 Worker。

用户发起 Pipeline 后，API 只创建任务并返回。

Worker 在后台执行任务。

---

### 23.2 队列任务格式

每个队列任务至少包含：

* task_run_id
* project_id
* task_type
* payload

---

### 23.3 队列执行原则

队列中的每个任务只执行一个阶段。

不能一个任务执行完整 Pipeline。

错误示例：

run_full_pipeline

正确示例：

run_script_generation
run_shot_breakdown
run_model_prompt_generation

---

## 24. Pipeline 编排架构

### 24.1 推荐阶段

MVP 阶段 Pipeline 顺序：

Project Brief Normalization
↓
Asset Understanding
↓
Asset Gap Detection
↓
Trend Structuring
↓
Script Generation
↓
Shot Breakdown
↓
Shot Classification
↓
Shot Asset Re-check
↓
Model Prompt Generation
↓
Export Assembly

---

### 24.2 每阶段职责

每个阶段只处理自己的输入和输出。

阶段之间通过数据库传递数据。

不要通过内存对象传完整 Pipeline 数据。

原因：

* 方便失败恢复
* 方便单阶段重试
* 方便查看中间结果
* 方便后续部署为多 Worker

---

## 25. API 设计总览

MVP API 包括：

### Project API

* create project
* get project detail
* get project status
* list projects

### Product API

* save product info
* get product info

### Asset API

* upload asset
* list assets
* get asset analysis

### Pipeline API

* start pipeline
* retry pipeline step
* get task runs

### Script API

* list scripts
* get script detail

### Shot API

* list shots by script

### Prompt API

* list prompts by script
* list prompts by model

### Export API

* create export
* get export status
* download export package

---

## 26. API 边界原则

API 层必须遵守：

* 不直接调用 AI
* 不直接执行耗时任务
* 不直接写复杂 Pipeline 逻辑
* 不返回未校验的 AI 原始输出
* 不暴露本地真实文件路径
* 不把 API Key 返回给前端

---

## 27. Worker 边界原则

Worker 必须遵守：

* 一个任务只执行一个 Pipeline 阶段
* 每个任务必须有 task_run_id
* 每个任务必须更新 TaskRun 状态
* 每个任务失败必须记录 error_message
* 每个任务成功必须写入结构化输出
* Worker 不直接处理前端请求
* Worker 不修改无关模块

---

## 28. AI 调用架构

### 28.1 AI 调用入口

所有 AI 调用都必须从 ai 模块进入。

例如：

* normalize_project_brief
* analyze_asset
* detect_asset_gap
* structure_trends
* generate_scripts
* break_down_shots
* classify_shots
* generate_model_prompts

---

### 28.2 Prompt 模板存储

Prompt 模板建议存放在：

prompts
├── project_brief_normalization.md
├── asset_gap_detection.md
├── trend_structuring.md
├── script_generation.md
├── shot_breakdown.md
├── shot_classification.md
└── model_prompt_generation.md

---

### 28.3 AI 输出校验

每个 AI 输出必须经过：

* JSON 格式校验
* 必填字段校验
* 枚举值校验
* 数量校验
* 业务规则校验

校验失败后：

* 第一次尝试修复
* 第二次重新生成
* 第三次 fallback 或 failed

---

## 29. 环境配置设计

### 29.1 本地 MacBook 环境

需要配置：

* DATABASE_URL
* QUEUE_URL
* STORAGE_ROOT
* AI_API_KEY
* AI_MODEL_NAME
* ENVIRONMENT=local
* LOG_LEVEL=debug

---

### 29.2 Mac mini Docker 环境

需要配置：

* DATABASE_URL
* QUEUE_URL
* STORAGE_ROOT=/app/storage
* AI_API_KEY
* AI_MODEL_NAME
* ENVIRONMENT=production_local
* LOG_LEVEL=info

---

### 29.3 配置原则

所有环境差异都通过环境变量解决。

禁止：

* 写死 API Key
* 写死绝对路径
* 写死 localhost 地址
* 写死 MacBook 用户目录
* 写死 Mac mini 内网 IP

---

## 30. Docker 部署设计

### 30.1 Docker Compose 服务

建议 Docker Compose 包含：

* frontend
* backend-api
* worker
* database
* queue

---

### 30.2 Volume 挂载

至少需要挂载：

* database data
* uploaded assets
* export files
* logs

---

### 30.3 部署原则

Mac mini 部署时：

* backend-api 和 worker 使用同一份代码镜像
* backend-api 启动 HTTP 服务
* worker 启动任务消费者
* database 持久化数据
* storage volume 持久化文件
* queue 负责任务分发

---

## 31. 日志设计

系统需要记录三类日志：

### 31.1 API 日志

记录：

* 请求路径
* 请求时间
* project_id
* user_id
* response status
* error message

---

### 31.2 Worker 日志

记录：

* task_run_id
* project_id
* task_type
* start time
* end time
* status
* retry count
* error message

---

### 31.3 AI 调用日志

记录：

* prompt template version
* model name
* input summary
* output validation result
* error message
* token cost metadata

注意：

不建议在日志中保存完整敏感输入或 API Key。

---

## 32. 错误处理架构

### 32.1 API 错误

API 错误返回标准格式：

* error_code
* message
* details
* request_id

---

### 32.2 Worker 错误

Worker 错误必须写入：

* TaskRun.status
* TaskRun.error_message
* TaskRun.retry_count

---

### 32.3 Project 错误

如果某个阶段失败，Project 状态更新为：

failed

如果需要用户补充信息，Project 状态更新为：

needs_user_input

---

## 33. 重试架构

### 33.1 可重试任务

可重试任务包括：

* asset_understanding
* asset_gap_detection
* trend_structuring
* script_generation
* shot_breakdown
* model_prompt_generation
* export_assembly

---

### 33.2 不自动重试情况

以下情况不应自动重试：

* API Key 缺失
* 用户产品信息不足
* 文件不存在
* 数据库连接失败持续存在
* 输出 schema 多次失败
* 素材严重缺失导致 blocking

---

### 33.3 重试次数

默认最多重试：

3 次

超过后：

* TaskRun = failed
* Project = failed 或 needs_user_input

---

## 34. 安全边界

MVP 阶段至少需要保证：

* API Key 只存在环境变量
* 前端不能看到 API Key
* 文件下载不能暴露服务器真实路径
* 用户只能访问自己的 Project
* 上传文件需要限制类型和大小
* AI 输出不能直接当代码执行
* 导出文件只能来自系统生成目录

---

## 35. 权限边界

MVP 阶段可先做简单用户归属校验。

基本规则：

* User 只能访问自己的 Project
* Project 下的数据必须校验 user_id
* 下载文件必须校验 project ownership
* Worker 内部任务通过 project_id 读取数据

---

## 36. 部署迁移策略

### 36.1 MacBook 到 Mac mini 的迁移原则

从 MacBook 迁移到 Mac mini 时，不应该改业务代码。

只应该修改：

* 环境变量
* Docker 配置
* volume 路径
* 服务启动方式

---

### 36.2 必须提前避免的问题

必须避免：

* 本地绝对路径写死
* SQLite 文件路径写死
* 上传目录写死
* 导出目录写死
* API 地址写死
* Worker 和 API 强耦合
* Pipeline 依赖内存状态

---

## 37. Codex 架构约束

后续 Codex 执行时必须遵守：

* 不允许重新设计系统架构
* 不允许把 Worker 逻辑写进 API
* 不允许直接在业务代码中调用外部 AI API
* 不允许跨模块大规模重构
* 不允许一次 task 修改多个无关文件
* 不允许新增未定义功能
* 不允许修改数据字段名，除非 task 明确要求
* 不允许绕过 TaskRun 状态机制
* 不允许写死部署路径和 API Key

---

## 38. MVP 最小架构闭环

MVP 最小架构闭环如下：

Frontend 提交 Project
↓
Backend API 保存 Project / Product
↓
Backend API 创建 TaskRun
↓
Queue 接收任务
↓
Worker 执行 Pipeline 阶段
↓
Worker 调用 AI Provider
↓
AI Provider 返回结构化结果
↓
Worker 写入 Database
↓
Pipeline Orchestrator 推进下一阶段
↓
Export Assembly 生成文件
↓
Frontend 下载结果

---

## 39. 不在 MVP 架构范围内

MVP 阶段暂不实现：

* 多租户复杂权限
* 广告账户接入
* 自动投放
* 自动视频生成
* 自动剪辑
* 云对象存储
* Kubernetes
* 多区域部署
* 高并发队列扩容
* 多 Worker 动态调度
* 复杂监控系统
* 费用结算系统

---

## 40. 一句话总结

系统架构的核心是：

先在 MacBook 本地跑通 AI Pipeline 最小闭环，
再将 Backend API、Worker、Database、Queue 和 File Storage 通过 Docker 部署到 Mac mini。

架构上保持单后端服务 + 异步 Worker + 队列 + 数据库 + 本地文件存储的简单结构。

所有 AI 调用必须通过 AI Provider Layer，所有长任务必须通过 Worker 执行，所有部署差异必须通过环境变量和 Docker 配置解决。
