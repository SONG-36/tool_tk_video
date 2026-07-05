## 执行前提

默认技术栈：

* Backend：TypeScript
* API Framework：Fastify
* ORM：Prisma
* Database：PostgreSQL
* Queue：BullMQ + Redis
* Storage：Local File System
* Deployment：Docker Compose
* Frontend：MVP 可暂缓，优先后端闭环

Codex 执行原则：

* 每个 task 只允许修改一个文件
* 每个 task 只实现一个函数或一个逻辑单元
* 不允许跨模块重构
* 不允许新增未定义功能
* 不允许调整架构
* 不允许自行修改数据字段名
* 不允许把 Worker 逻辑写进 API
* 不允许直接在 API 层调用 AI
* 不允许写死本地路径
* 不允许暴露 API Key 或服务器真实路径

---
## TASK_00_00:

file:
scripts/create-mvp-structure.ts

function:
createMvpDirectoryStructure

goal:
创建 MVP 项目的完整目录结构和必要的占位文件，确保后续 Codex tasks 都有明确落点。

input:
MVP 架构目录要求

output:
创建以下目录结构：
docs/
  context/

prompts/

scripts/

tests/

src/
  ai/
  api/
  config/
  db/
  exporters/
  pipeline/
  queue/
  repositories/
  schemas/
  services/
  storage/
  utils/
  workers/

同时创建必要占位文件：
docs/context/.gitkeep
prompts/.gitkeep
tests/.gitkeep

src/ai/.gitkeep
src/api/.gitkeep
src/config/.gitkeep
src/db/.gitkeep
src/exporters/.gitkeep
src/pipeline/.gitkeep
src/queue/.gitkeep
src/repositories/.gitkeep
src/schemas/.gitkeep
src/services/.gitkeep
src/storage/.gitkeep
src/utils/.gitkeep
src/workers/.gitkeep

constraints:

no cross-module changes
no refactor
no new features
no architectural modification
only create directory structure
do not implement business logic
do not install dependencies
do not modify package.json

validation:

expected behavior: 执行脚本后，MVP 所需目录全部存在
test condition: 不生成业务代码，不创建未定义目录，不修改已有业务文件

# Phase 0：Execution Context 文件

## TASK_00_01

file:
docs/context/mvp_context.md

function:
MVP scope context

goal:
创建 Codex 执行用 MVP 范围上下文文件。

input:
06_mvp_scope.md 的 MVP 范围内容

output:
包含 MVP 必做、暂缓、不做、默认值、验收标准的短上下文文件

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件只包含 Codex 执行所需 MVP 范围
* test condition: 不复制完整母版文档，只保留必要执行上下文

---

## TASK_00_02

file:
docs/context/data_context.md

function:
data model context

goal:
创建 Codex 执行用数据模型上下文文件。

input:
02_data_design.md 和 06_mvp_scope.md 中的 MVP 数据对象

output:
包含 MVP 表、核心字段、枚举、数据关系的短上下文文件

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件覆盖 Project、Product、Asset、Script、Shot、ModelPrompt、TaskRun 等核心对象
* test condition: 不包含暂缓表的完整设计，只说明暂缓策略

---

## TASK_00_03

file:
docs/context/pipeline_context.md

function:
pipeline execution context

goal:
创建 Codex 执行用 AI Pipeline 上下文文件。

input:
03_ai_pipeline.md 和 06_mvp_scope.md 中的 MVP Pipeline 阶段

output:
包含 MVP Pipeline 阶段顺序、输入输出、Worker 边界的短上下文文件

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件明确 Pipeline 阶段顺序
* test condition: 不包含 P3 自动 Trend Fetch、P6 Script Quality Check、P12 Pipeline Summary 的实现要求

---

## TASK_00_04

file:
docs/context/deployment_context.md

function:
deployment context

goal:
创建 Codex 执行用部署上下文文件。

input:
04_system_architecture.md 和 06_mvp_scope.md 中的部署要求

output:
包含 MacBook 本地开发、Mac mini Docker 部署、环境变量、存储路径要求的短上下文文件

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件明确 STORAGE_ROOT、DATABASE_URL、QUEUE_URL、AI_API_KEY 等配置要求
* test condition: 文件中不得出现 MacBook 或 Mac mini 的固定绝对路径

---

# Phase 1：Backend Foundation

## TASK_01_01

file:
package.json

function:
backend package definition

goal:
创建或更新后端项目依赖与脚本。

input:
TypeScript、Fastify、Prisma、BullMQ、Redis、PostgreSQL、本地开发需求

output:
包含 dev、build、start、worker、prisma 相关 scripts 的 package.json

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 后端具备基础启动、构建、worker 启动、prisma 命令
* test condition: package.json 不包含前端依赖，不加入未定义的大型框架

---

## TASK_01_02

file:
tsconfig.json

function:
typescript compiler config

goal:
创建 TypeScript 编译配置。

input:
Node.js 后端运行环境

output:
可用于后端 API 和 Worker 的 tsconfig.json

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: TypeScript 能编译 src 目录
* test condition: 不引入与当前后端无关的配置

---

## TASK_01_03

file:
src/config/env.ts

function:
loadEnv

goal:
实现环境变量读取与必填配置校验。

input:
DATABASE_URL、QUEUE_URL、STORAGE_ROOT、AI_API_KEY、AI_MODEL_NAME、ENVIRONMENT、LOG_LEVEL、MAX_RETRY_COUNT、UPLOAD_MAX_SIZE_MB、EXPORT_ROOT

output:
导出统一 env 配置对象

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少 DATABASE_URL、STORAGE_ROOT、AI_API_KEY 时抛出明确错误
* test condition: 不允许静默使用空字符串或硬编码默认敏感配置

---

## TASK_01_04

file:
src/utils/errors.ts

function:
createAppError

goal:
实现统一应用错误对象。

input:
error_code、message、details

output:
标准化 AppError 类型和 createAppError 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API 和 Worker 可以复用统一错误格式
* test condition: 不包含 HTTP route、数据库或 AI 调用逻辑

---

## TASK_01_05

file:
src/app.ts

function:
buildApp

goal:
创建 Fastify app 初始化函数。

input:
无

output:
返回已注册基础 health route 的 Fastify 实例

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: GET /health 返回 ok
* test condition: 不注册业务 route，不连接数据库，不调用 AI

---

## TASK_01_06

file:
src/server.ts

function:
startServer

goal:
实现后端 HTTP 服务启动入口。

input:
env 配置、buildApp

output:
启动 Fastify server

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 服务可以根据环境变量端口启动
* test condition: 启动失败时输出错误并退出，不吞异常

---

# Phase 2：Schema 与 Enum

## TASK_02_01

file:
prisma/schema.prisma

function:
mvp database schema

goal:
定义 MVP 数据库模型。

input:
MVP 数据对象：User、Project、Product、Asset、AssetAnalysis、AssetGapReport、TrendInsight、Script、Shot、ModelPrompt、ExportPackage、TaskRun

output:
完整 Prisma schema

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: schema 包含 MVP 必需表和关系
* test condition: 不加入 SKU、TrendFetch、TrendRawItem、ShotAssetCheck 独立表

---

## TASK_02_02

file:
src/schemas/enums.ts

function:
system enums

goal:
定义系统核心枚举。

input:
ProjectStatus、TaskStatus、TaskType、AssetType、ShotType、RiskLevel、VideoModel

output:
统一枚举导出文件

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 枚举值与 MVP Scope 保持一致
* test condition: 不增加未定义枚举值

---

## TASK_02_03

file:
src/schemas/api.ts

function:
api shared schemas

goal:
定义 API 通用 request 和 response 类型。

input:
标准 API response、error response、pagination 可选字段

output:
API 通用类型定义

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API response 不暴露内部路径和敏感字段
* test condition: 不包含业务实体完整实现

---

## TASK_02_04

file:
src/db/client.ts

function:
getPrismaClient

goal:
创建 Prisma client 单例入口。

input:
DATABASE_URL

output:
可复用 Prisma client

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: repository 层可通过该文件访问 Prisma
* test condition: 不在该文件实现任何业务查询函数

---

# Phase 3：Repository 基础层

## TASK_03_01

file:
src/repositories/projectRepository.ts

function:
project repository methods

goal:
实现 Project 基础数据库操作。

input:
project create、findById、findByUserId、updateStatus、updateCurrentStep

output:
Project repository 函数集合

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: repository 只负责 Project 数据读写
* test condition: 不包含 API、Worker、AI、Pipeline 逻辑

---

## TASK_03_02

file:
src/repositories/productRepository.ts

function:
product repository methods

goal:
实现 Product 基础数据库操作。

input:
project_id、product fields

output:
Product create、upsert、findByProjectId 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Product 数据可以按 project_id 保存和读取
* test condition: 不处理脚本生成，不调用 AI

---

## TASK_03_03

file:
src/repositories/assetRepository.ts

function:
asset repository methods

goal:
实现 Asset 基础数据库操作。

input:
project_id、asset metadata、file_url、asset_type

output:
Asset create、listByProjectId、findById、updateStatus 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Asset 可以按 project_id 查询
* test condition: 不做文件写入，不做素材分析

---

## TASK_03_04

file:
src/repositories/taskRunRepository.ts

function:
task run repository methods

goal:
实现 TaskRun 基础数据库操作。

input:
project_id、task_type、status、input_ref、output_ref、error_message、retry_count

output:
TaskRun create、findById、listByProjectId、markProcessing、markSuccess、markFailed、incrementRetry 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Worker 可以更新任务状态
* test condition: 不执行 Worker 逻辑，不推送队列

---

## TASK_03_05

file:
src/repositories/scriptRepository.ts

function:
script repository methods

goal:
实现 Script 数据库操作。

input:
project_id、script fields

output:
createManyForProject、listByProjectId、findById、deleteByProjectId 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 一个 Project 可保存 5 个 Script
* test condition: 不生成脚本内容，不调用 AI

---

## TASK_03_06

file:
src/repositories/shotRepository.ts

function:
shot repository methods

goal:
实现 Shot 数据库操作。

input:
project_id、script_id、shot fields

output:
createManyForScript、listByScriptId、listByProjectId、deleteByProjectId、updateClassification 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Shot 可以按 script_id 和 project_id 查询
* test condition: 不执行 shot 分类逻辑

---

## TASK_03_07

file:
src/repositories/modelPromptRepository.ts

function:
model prompt repository methods

goal:
实现 ModelPrompt 数据库操作。

input:
project_id、script_id、shot_id、model prompt fields

output:
createMany、listByProjectId、listByScriptId、listByModel、deleteByProjectId 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 每个 Shot 可以保存多个模型 Prompt
* test condition: 不生成 Prompt 内容

---

# Phase 4：Storage 与 Asset 处理

## TASK_04_01

file:
src/storage/storagePaths.ts

function:
buildProjectStoragePath

goal:
实现项目级文件路径生成函数。

input:
STORAGE_ROOT、project_id、file category

output:
返回 project assets、analysis、prompts、exports、logs 目录路径

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 所有路径基于 STORAGE_ROOT
* test condition: 文件中不得出现 /Users 或固定服务器路径

---

## TASK_04_02

file:
src/storage/fileName.ts

function:
createSafeFileName

goal:
实现安全文件名生成函数。

input:
original_file_name、mime_type

output:
安全的系统生成文件名

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 不直接使用用户原始文件名作为存储路径
* test condition: 文件名中不包含路径穿越字符

---

## TASK_04_03

file:
src/storage/fileStorage.ts

function:
saveUploadedFile

goal:
实现上传文件保存逻辑。

input:
project_id、file buffer、original_file_name、mime_type

output:
保存文件并返回相对 file_url 和 metadata

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件保存到 STORAGE_ROOT/projects/{project_id}/assets/original
* test condition: 不返回真实绝对路径给调用方

---

## TASK_04_04

file:
src/services/assetService.ts

function:
registerAsset

goal:
实现素材登记服务。

input:
project_id、uploaded_by、asset_type、file metadata、file_url

output:
创建 Asset 记录

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Asset 记录包含 asset_type、file_url、mime_type、status
* test condition: 不执行 AI 分析，不创建 TaskRun

---

## TASK_04_05

file:
src/api/assetRoutes.ts

function:
registerAssetRoutes

goal:
实现 Asset 上传和查询 API routes。

input:
Fastify app、assetService、assetRepository

output:
upload asset、list assets API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API 支持上传素材和查询项目素材列表
* test condition: API 不调用 AI，不启动完整 Pipeline，不暴露真实文件路径

---

# Phase 5：Project 与 Product API

## TASK_05_01

file:
src/services/projectService.ts

function:
createProject

goal:
实现 Project 创建服务。

input:
user_id、project name、target_platform、target_market、target_language、objective

output:
创建 Project，初始 status = draft，current_step = project_created

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少项目名称或目标市场时返回明确错误
* test condition: 不创建 Product，不启动 Pipeline

---

## TASK_05_02

file:
src/services/productService.ts

function:
saveProduct

goal:
实现 Product 保存服务。

input:
project_id、product_name、category、description、selling_points、target_audience、usage_scenarios、price、currency、product_url、sku_code

output:
创建或更新 Product

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少 product_name 或 selling_points 时返回明确错误
* test condition: 不调用 AI，不创建 Script

---

## TASK_05_03

file:
src/api/projectRoutes.ts

function:
registerProjectRoutes

goal:
实现 Project 相关 API routes。

input:
projectService、projectRepository

output:
create project、get project detail、get project status、list projects API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API 可创建和查询 Project
* test condition: 不启动 Pipeline，不调用 Worker，不调用 AI

---

## TASK_05_04

file:
src/api/productRoutes.ts

function:
registerProductRoutes

goal:
实现 Product 相关 API routes。

input:
productService、productRepository

output:
save product、get product API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API 可保存和读取 Product
* test condition: 不生成脚本，不读取素材，不调用 AI

---

## TASK_05_05

file:
src/app.ts

function:
registerCoreRoutes

goal:
在 app 初始化中注册 Project、Product、Asset routes。

input:
projectRoutes、productRoutes、assetRoutes

output:
Fastify app 包含 MVP 基础 API route

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: /health、Project API、Product API、Asset API 可访问
* test condition: 不修改 route 内部业务逻辑

---

# Phase 6：Queue 与 Pipeline Orchestrator

## TASK_06_01

file:
src/queue/queueClient.ts

function:
getQueueClient

goal:
实现 BullMQ 队列客户端创建函数。

input:
QUEUE_URL

output:
统一 queue client 和 enqueueTask 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API 和 Worker 可以使用统一队列入口
* test condition: 不执行任何具体 Worker task

---

## TASK_06_02

file:
src/pipeline/pipelineSteps.ts

function:
getNextPipelineStep

goal:
定义 MVP Pipeline 阶段顺序和下一阶段判断函数。

input:
current task_type

output:
next task_type 或 completed

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 阶段顺序符合 MVP Scope
* test condition: 不包含自动 Trend Fetch、Script Quality Check、Pipeline Summary

---

## TASK_06_03

file:
src/pipeline/orchestrator.ts

function:
enqueuePipelineStep

goal:
实现创建 TaskRun 并推送队列的编排函数。

input:
project_id、task_type、payload

output:
创建 TaskRun，推送队列任务

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 每个 Pipeline 阶段都有 TaskRun
* test condition: 不直接执行 Worker 函数，不调用 AI

---

## TASK_06_04

file:
src/services/pipelineService.ts

function:
startPipeline

goal:
实现启动 Pipeline 服务。

input:
project_id、user_id

output:
校验 Project、Product、Asset 后创建第一个 TaskRun

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少 Product 或 Asset 时进入 needs_user_input
* test condition: 不直接执行 AI，不直接生成 Script

---

## TASK_06_05

file:
src/api/pipelineRoutes.ts

function:
registerPipelineRoutes

goal:
实现 Pipeline API routes。

input:
pipelineService、taskRunRepository

output:
start pipeline、list task runs、retry task run API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: API 只创建任务、查询任务、触发重试
* test condition: API handler 中不得出现 AI 调用

---

## TASK_06_06

file:
src/app.ts

function:
registerPipelineRoutesIntoApp

goal:
在 app 初始化中注册 Pipeline routes。

input:
pipelineRoutes

output:
Fastify app 包含 Pipeline API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Pipeline API 可访问
* test condition: 不修改其他 route 业务逻辑

---

# Phase 7：AI Provider 基础层

## TASK_07_01

file:
src/ai/promptTemplateLoader.ts

function:
loadPromptTemplate

goal:
实现 Prompt 模板读取函数。

input:
template_name

output:
返回 prompts 目录下对应模板内容

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少模板时返回明确错误
* test condition: 不调用 LLM，不解析 JSON

---

## TASK_07_02

file:
src/ai/llmClient.ts

function:
callLLM

goal:
实现统一 LLM 调用入口。

input:
system_prompt、user_prompt、model、temperature

output:
返回 LLM 原始文本输出

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 使用 AI_API_KEY 和 AI_MODEL_NAME
* test condition: 不在该文件实现业务 prompt，不写死 API Key

---

## TASK_07_03

file:
src/ai/jsonOutputParser.ts

function:
parseJsonOutput

goal:
实现 AI JSON 输出解析函数。

input:
raw LLM output

output:
合法 JSON object 或解析错误

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 能处理包裹在 markdown code block 中的 JSON
* test condition: 解析失败时不返回假成功对象

---

## TASK_07_04

file:
src/ai/outputValidator.ts

function:
validateRequiredFields

goal:
实现 AI 输出必填字段校验函数。

input:
parsed JSON、required field list、enum constraints

output:
validation result

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺字段或非法枚举时返回失败结果
* test condition: 不自动补字段，不调用 LLM

---

## TASK_07_05

file:
src/ai/aiGeneration.ts

function:
generateStructuredOutput

goal:
实现统一结构化 AI 生成函数。

input:
template_name、input_payload、required_fields、enum_constraints

output:
校验后的结构化 JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 调用模板、LLM、JSON 解析、输出校验
* test condition: 不包含任何具体业务阶段逻辑

---

# Phase 8：Prompt 模板文件

## TASK_08_01

file:
prompts/project_brief_normalization.md

function:
project brief normalization prompt

goal:
创建 Project Brief 标准化 Prompt 模板。

input:
Product 和 Project 用户输入

output:
标准化 Project Brief JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板要求不得编造产品功能
* test condition: 模板明确 JSON 输出字段

---

## TASK_08_02

file:
prompts/asset_understanding.md

function:
asset understanding prompt

goal:
创建素材理解 Prompt 模板。

input:
Asset metadata、用户标注 asset_type、可选视觉描述

output:
AssetAnalysis JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板输出 possible_usage、limitations、quality_score
* test condition: 模板不要求生成视频内容

---

## TASK_08_03

file:
prompts/asset_gap_detection.md

function:
asset gap detection prompt

goal:
创建素材缺口检测 Prompt 模板。

input:
Project Brief、AssetAnalysis 列表

output:
AssetGapReport JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板输出 missing_assets、available_assets、risk_level、recommendations
* test condition: 模板不得要求真实生成缺失素材

---

## TASK_08_04

file:
prompts/trend_structuring.md

function:
trend structuring prompt

goal:
创建趋势结构化 Prompt 模板。

input:
用户输入趋势文本、参考链接描述、fallback flag、Product Brief

output:
TrendInsight JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板输出 hook_patterns、content_structures、pacing_patterns、ad_formulas
* test condition: 模板支持无趋势数据时使用 fallback

---

## TASK_08_05

file:
prompts/script_generation.md

function:
script generation prompt

goal:
创建 5 个广告脚本生成 Prompt 模板。

input:
Project Brief、AssetGapReport、TrendInsight

output:
5 个 Script JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板要求生成 5 个不同 creative_angle
* test condition: 模板明确禁止编造产品功能和强依赖缺失素材

---

## TASK_08_06

file:
prompts/shot_breakdown.md

function:
shot breakdown prompt

goal:
创建脚本分镜拆解 Prompt 模板。

input:
Script、Project Brief、AssetGapReport

output:
每个 Script 的 4-8 个 Shot JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板要求每个 Shot 单一镜头
* test condition: 模板输出包含 duration、visual、action、shot_type、purpose

---

## TASK_08_07

file:
prompts/model_prompt_generation.md

function:
model prompt generation prompt

goal:
创建视频模型 Prompt 生成模板。

input:
Shot、Product、AssetGapReport、target model

output:
ModelPrompt JSON

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 模板要求一个 Prompt 只对应一个 Shot
* test condition: 模板输出包含 prompt、negative_prompt、duration、aspect_ratio、model

---

# Phase 9：AI 输出 Repository

## TASK_09_01

file:
src/repositories/assetAnalysisRepository.ts

function:
asset analysis repository methods

goal:
实现 AssetAnalysis 数据库操作。

input:
asset_id、project_id、analysis fields

output:
create、listByProjectId、findByAssetId、deleteByProjectId 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 素材分析结果可按项目查询
* test condition: 不执行 AI 分析

---

## TASK_09_02

file:
src/repositories/assetGapReportRepository.ts

function:
asset gap report repository methods

goal:
实现 AssetGapReport 数据库操作。

input:
project_id、stage、missing_assets、available_assets、risk_level、recommendations

output:
create、findLatestByProjectId、deleteByProjectId 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 可以读取项目最新素材缺口报告
* test condition: 不执行素材缺口判断

---

## TASK_09_03

file:
src/repositories/trendInsightRepository.ts

function:
trend insight repository methods

goal:
实现 TrendInsight 数据库操作。

input:
project_id、trend insight fields

output:
create、findLatestByProjectId、deleteByProjectId 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 可以保存 fallback 或用户输入趋势结构
* test condition: 不抓取 TikTok，不调用外部趋势 API

---

## TASK_09_04

file:
src/repositories/exportPackageRepository.ts

function:
export package repository methods

goal:
实现 ExportPackage 数据库操作。

input:
project_id、status、file_url、included_files、error_message

output:
create、findByProjectId、markSuccess、markFailed 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 导出包状态可追踪
* test condition: 不生成 zip 文件

---

# Phase 10：Worker Runner 基础

## TASK_10_01

file:
src/workers/taskRunner.ts

function:
runTaskWithStatus

goal:
实现 Worker 任务状态包装器。

input:
task_run_id、handler function

output:
统一更新 TaskRun processing、success、failed 状态

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 任意异常都会写入 TaskRun.error_message
* test condition: TaskRun 不会永久停留在 processing

---

## TASK_10_02

file:
src/workers/workerRegistry.ts

function:
getWorkerHandler

goal:
实现 task_type 到 Worker handler 的映射。

input:
task_type

output:
对应 Worker handler 函数

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 未知 task_type 返回明确错误
* test condition: 不执行具体 handler

---

## TASK_10_03

file:
src/workers/index.ts

function:
startWorker

goal:
实现 Worker 进程入口。

input:
QUEUE_URL、workerRegistry

output:
启动 BullMQ Worker 消费队列任务

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Worker 从队列读取 task_run_id、project_id、task_type
* test condition: Worker 不接收 HTTP 请求

---

# Phase 11：Pipeline Worker A

## TASK_11_01

file:
src/workers/assetUnderstandingWorker.ts

function:
runAssetUnderstanding

goal:
实现素材理解 Worker 阶段。

input:
task_run_id、project_id、Asset 列表、Product

output:
AssetAnalysis 记录

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 每个 Asset 生成一条 AssetAnalysis
* test condition: 文件缺失时 TaskRun failed，并写入 error_message

---

## TASK_11_02

file:
src/workers/assetGapDetectionWorker.ts

function:
runAssetGapDetection

goal:
实现素材缺口检测 Worker 阶段。

input:
task_run_id、project_id、Product、AssetAnalysis 列表

output:
AssetGapReport 记录

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 输出 missing_assets、available_assets、risk_level、recommendations
* test condition: 缺少基础产品素材时 risk_level = blocking 或 Project needs_user_input

---

## TASK_11_03

file:
src/workers/trendStructuringWorker.ts

function:
runTrendStructuring

goal:
实现趋势结构化 Worker 阶段。

input:
task_run_id、project_id、Product、用户趋势文本或 fallback

output:
TrendInsight 记录

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 无趋势输入时生成 fallback TrendInsight
* test condition: 不调用 TikTok 抓取接口

---

## TASK_11_04

file:
src/workers/scriptGenerationWorker.ts

function:
runScriptGeneration

goal:
实现广告脚本生成 Worker 阶段。

input:
task_run_id、project_id、Product、AssetGapReport、TrendInsight

output:
5 条 Script 记录

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 生成 5 个不同 creative_angle 的 Script
* test condition: 缺少 hook 或 CTA 的 Script 不写入数据库

---

## TASK_11_05

file:
src/workers/shotBreakdownWorker.ts

function:
runShotBreakdown

goal:
实现脚本分镜拆解 Worker 阶段。

input:
task_run_id、project_id、Script 列表、AssetGapReport

output:
每个 Script 生成 4-8 个 Shot

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 每个 Shot 包含 visual、action、duration、shot_type、purpose
* test condition: 非法 shot_type 不写入数据库

---

## TASK_11_06

file:
src/workers/shotClassificationWorker.ts

function:
runShotClassification

goal:
实现 Shot 类型分类和素材风险字段更新。

input:
task_run_id、project_id、Shot 列表、AssetAnalysis、AssetGapReport

output:
更新 Shot 的 shot_type、asset_dependency、missing_asset_types、ai_fallback_possible、realism_risk、recommendation

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少 hand_demo_video 时相关 Shot 标记 realism_risk
* test condition: 不创建独立 ShotAssetCheck 表

---

# Phase 12：Prompt 与 Export Worker

## TASK_12_01

file:
src/workers/modelPromptGenerationWorker.ts

function:
runModelPromptGeneration

goal:
实现视频模型 Prompt 生成 Worker 阶段。

input:
task_run_id、project_id、Shot 列表、Product、AssetGapReport、target models

output:
ModelPrompt 记录

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 每个 Shot 至少生成一个 ModelPrompt
* test condition: Prompt duration 必须和 Shot duration 对齐

---

## TASK_12_02

file:
src/exporters/exportDataBuilder.ts

function:
buildExportData

goal:
实现导出数据组装函数。

input:
Project、Product、AssetGapReport、TrendInsight、Script、Shot、ModelPrompt

output:
brief、scripts、shots、model_prompts、asset_gap_report 的结构化数据对象

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 所有导出数据来自数据库已有结果
* test condition: 不调用 AI，不重新生成 Script、Shot、Prompt

---

## TASK_12_03

file:
src/exporters/exportFileWriter.ts

function:
writeExportFiles

goal:
实现导出文件写入函数。

input:
project_id、export data、STORAGE_ROOT

output:
brief.json、scripts.md、shots.json、model_prompts.json、asset_gap_report.json

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件写入 project exports 目录
* test condition: 不写死绝对路径，不暴露真实路径

---

## TASK_12_04

file:
src/exporters/zipExporter.ts

function:
createExportZip

goal:
实现 export.zip 打包函数。

input:
project_id、export files path

output:
export.zip 文件路径和 included_files

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: zip 包包含 MVP 必需导出文件
* test condition: 缺少 scripts.md 或 shots.json 时返回失败

---

## TASK_12_05

file:
src/workers/exportAssemblyWorker.ts

function:
runExportAssembly

goal:
实现导出组装 Worker 阶段。

input:
task_run_id、project_id

output:
ExportPackage 记录和 export.zip

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 导出成功后 Project status = completed
* test condition: 导出失败时 TaskRun failed，并写入 error_message

---

# Phase 13：Result API

## TASK_13_01

file:
src/api/scriptRoutes.ts

function:
registerScriptRoutes

goal:
实现 Script 查询 API。

input:
project_id、script_id

output:
list scripts、get script detail API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 可查询 Project 下生成的 5 个 Script
* test condition: API 不生成或修改 Script

---

## TASK_13_02

file:
src/api/shotRoutes.ts

function:
registerShotRoutes

goal:
实现 Shot 查询 API。

input:
project_id、script_id

output:
list shots by project、list shots by script API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 可按 Script 查询 Shot list
* test condition: API 不执行 Shot Breakdown 或 Classification

---

## TASK_13_03

file:
src/api/promptRoutes.ts

function:
registerPromptRoutes

goal:
实现 ModelPrompt 查询 API。

input:
project_id、script_id、model

output:
list prompts by project、script、model API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 可查询不同模型的 Prompt
* test condition: API 不调用模型生成 Prompt

---

## TASK_13_04

file:
src/api/exportRoutes.ts

function:
registerExportRoutes

goal:
实现 ExportPackage 查询和下载 API。

input:
project_id、export_package_id

output:
create export、get export status、download export.zip API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 下载 API 不暴露服务器真实路径
* test condition: 缺少 export.zip 时返回标准错误

---

## TASK_13_05

file:
src/app.ts

function:
registerResultRoutesIntoApp

goal:
在 app 初始化中注册 Script、Shot、Prompt、Export routes。

input:
scriptRoutes、shotRoutes、promptRoutes、exportRoutes

output:
Fastify app 包含结果查询和导出 API

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 所有结果 API 可访问
* test condition: 不修改 route 内部业务逻辑

---

# Phase 14：Pipeline Step 推进

## TASK_14_01

file:
src/pipeline/advancePipeline.ts

function:
advanceAfterTaskSuccess

goal:
实现 Worker 成功后推进下一阶段的函数。

input:
project_id、completed_task_type

output:
如果有下一阶段则创建 TaskRun 并入队；否则设置 completed

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 每个成功阶段只推进一个下一阶段
* test condition: 不执行下一阶段 handler

---

## TASK_14_02

file:
src/workers/taskRunner.ts

function:
runTaskWithStatusAndAdvance

goal:
在 Worker 状态包装器中接入成功后的 Pipeline 推进。

input:
task_run_id、handler function、advanceAfterTaskSuccess

output:
任务成功后自动入队下一阶段

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: handler 成功后推进下一 TaskRun
* test condition: handler 失败时不得推进下一阶段

---

## TASK_14_03

file:
src/pipeline/retryTask.ts

function:
retryFailedTask

goal:
实现失败 TaskRun 重试逻辑。

input:
task_run_id、project_id

output:
retry_count 增加，任务重新入队

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: retry_count 超过 MAX_RETRY_COUNT 时拒绝重试
* test condition: status = success 的 TaskRun 不允许重试

---

## TASK_14_04

file:
src/services/pipelineService.ts

function:
retryPipelineTask

goal:
在 Pipeline service 中接入失败任务重试。

input:
user_id、project_id、task_run_id

output:
调用 retryFailedTask 并返回 TaskRun 状态

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 只允许重试当前用户 Project 下的 TaskRun
* test condition: 不直接执行 Worker handler

---

# Phase 15：Docker 与本地部署

## TASK_15_01

file:
.env.example

function:
environment example

goal:
创建环境变量示例文件。

input:
MVP 必需环境变量

output:
.env.example

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 文件包含 DATABASE_URL、QUEUE_URL、STORAGE_ROOT、AI_API_KEY、AI_MODEL_NAME 等
* test condition: 不包含真实 API Key

---

## TASK_15_02

file:
Dockerfile

function:
backend docker image

goal:
创建后端 Dockerfile。

input:
Node.js backend build and start requirements

output:
可用于 backend-api 和 worker 的 Docker image

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 同一镜像可启动 API 或 Worker
* test condition: 不在镜像中写死环境变量

---

## TASK_15_03

file:
docker-compose.yml

function:
local production docker compose

goal:
创建 Mac mini Docker Compose 部署文件。

input:
backend-api、worker、postgres、redis、storage volume

output:
docker-compose.yml

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: backend-api、worker、database、queue 可以通过 compose 启动
* test condition: database 和 storage 使用持久化 volume

---

## TASK_15_04

file:
scripts/check-env.ts

function:
checkRequiredEnv

goal:
创建环境变量检查脚本。

input:
env 配置

output:
缺少必填环境变量时返回明确错误

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 缺少 DATABASE_URL、STORAGE_ROOT、AI_API_KEY 时失败
* test condition: 不连接数据库，不调用 AI

---

## TASK_15_05

file:
README.md

function:
local and docker run guide

goal:
创建本地开发与 Mac mini Docker 部署说明。

input:
package scripts、env、docker-compose、storage volume

output:
README 运行步骤

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: README 包含 MacBook 本地启动和 Mac mini Docker 启动流程
* test condition: 不加入未实现功能说明

---

# Phase 16：MVP 验收任务

## TASK_16_01

file:
tests/pipelineSmoke.test.ts

function:
pipeline smoke test

goal:
实现 Pipeline 最小闭环测试。

input:
mock Project、Product、Asset、fallback TrendInsight

output:
验证 Pipeline 能生成 Script、Shot、ModelPrompt、ExportPackage

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 测试覆盖 MVP 最小闭环
* test condition: 不调用真实外部 AI，可使用 mock AI output

---

## TASK_16_02

file:
tests/workerFailure.test.ts

function:
worker failure test

goal:
实现 Worker 失败状态测试。

input:
mock failed worker handler、TaskRun

output:
验证 TaskRun.status = failed 且 error_message 有值

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: Worker 异常不会让任务卡在 processing
* test condition: 不依赖真实队列服务

---

## TASK_16_03

file:
tests/storagePath.test.ts

function:
storage path test

goal:
实现文件路径安全测试。

input:
STORAGE_ROOT、project_id、unsafe filename

output:
验证路径基于 STORAGE_ROOT 且文件名安全

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: 不产生 /Users 等硬编码路径
* test condition: 不实际上传大文件

---

## TASK_16_04

file:
tests/exportPackage.test.ts

function:
export package test

goal:
实现导出包完整性测试。

input:
mock Project、Script、Shot、ModelPrompt、AssetGapReport

output:
验证导出文件包含 MVP 必需文件

constraints:

* no cross-module changes
* no refactor
* no new features
* no architectural modification

validation:

* expected behavior: export.zip 包含 brief.json、scripts.md、shots.json、model_prompts.json、asset_gap_report.json
* test condition: 缺少核心数据时导出失败

---

# Phase 17：第一轮开发顺序

执行顺序：

1. Phase 0：Execution Context 文件
2. Phase 1：Backend Foundation
3. Phase 2：Schema 与 Enum
4. Phase 3：Repository 基础层
5. Phase 4：Storage 与 Asset 处理
6. Phase 5：Project 与 Product API
7. Phase 6：Queue 与 Pipeline Orchestrator
8. Phase 7：AI Provider 基础层
9. Phase 8：Prompt 模板文件
10. Phase 9：AI 输出 Repository
11. Phase 10：Worker Runner 基础
12. Phase 11：Pipeline Worker A
13. Phase 12：Prompt 与 Export Worker
14. Phase 13：Result API
15. Phase 14：Pipeline Step 推进
16. Phase 15：Docker 与本地部署
17. Phase 16：MVP 验收任务

---

# Phase 18：Codex 执行边界

Codex 每次执行 task 前，只读取：

* 当前 task 指令
* 当前 phase context
* 当前目标文件
* 当前文件直接依赖的类型定义

Codex 不读取：

* 全量业务流程文档
* 全量数据设计文档
* 全量系统架构文档
* 全量风险清单
* 无关模块代码
* 暂缓功能设计

---

# Phase 19：明确不进入第一轮 Codex 的任务

以下任务不进入第一轮 Codex：

* 自动 TikTok 趋势抓取
* 视频模型真实生成视频
* 自动剪辑
* 自动投放
* A/B Test
* 用户在线编辑脚本
* Shot 拖拽编辑器
* Prompt 编辑器
* 多团队权限
* 云对象存储
* Kubernetes 部署
* 广告账户接入
* 成本统计看板
* 多模型路由
* Prompt A/B Test
* 素材版本管理

---

# Phase 20：一句话总结

07 Codex Execution Plan 的核心是：

不让 Codex 读全量大文档，
不让 Codex 自己设计系统，
不让 Codex 一次做大任务。

正确方式是：

母版文档
↓
MVP Scope
↓
Phase Context
↓
单文件 Task
↓
单函数或单逻辑单元实现
↓
明确 validation
↓
按顺序执行
