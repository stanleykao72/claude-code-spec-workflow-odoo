# Claude Code 規格工作流程 - Odoo ERP 版本

> **🎉 ODOO ERP 客製化版本：** 這是原始 Claude Code Spec Workflow 的增強版本，專門針對 Odoo ERP 客製化開發進行調整。包含所有原始功能，並新增全面的 Odoo 專用工具和工作流程。
> 
> **📚 [原始專案由 Pimzino 開發 →](https://github.com/Pimzino/claude-code-spec-workflow)**
> 
> **🚀 [查看新的 MCP 版本 →](https://github.com/Pimzino/spec-workflow-mcp)**

[![npm version](https://badge.fury.io/js/@stanleykao72%2Fclaude-code-spec-workflow-odoo.svg?cacheSeconds=300)](https://badge.fury.io/js/@stanleykao72%2Fclaude-code-spec-workflow-odoo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**支援 Odoo ERP 客製化開發的 Claude Code 自動化工作流程。**

透過結構化工作流程轉換您的開發：**需求 → 設計 → 任務 → 實作** 用於新功能，以及精簡的 **報告 → 分析 → 修復 → 驗證** 用於錯誤修復。

## ☕ 支持這個專案

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 📦 安裝

1. 全域安裝 Odoo 版工作流程
```bash
npm i -g @stanleykao72/claude-code-spec-workflow-odoo
```
2. 在專案目錄中執行設置命令
```bash
claude-code-spec-workflow
```
3. 對於 Odoo 專案，執行專用設置
```bash
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup
```
**就這樣，您已經準備好了！**

---

## ✨ 您將獲得什麼

- **📁 完整 .claude/ 結構** - 所有檔案和目錄
- **📝 10 個斜線命令** - 5 個規格工作流程 + 5 個錯誤修復工作流程
- **🎯 智能任務執行** - 自動化實作
- **🤖 4 個專業代理** - 增強自動化
- **📊 即時控制台** - 視覺化監控進度
- **🔧 自動生成命令** - 每個任務一個命令
- **📋 文件範本** - 專業規格文件
- **⚙️ 專案指導** - 持久性內容和標準
- **⚡ 智能優化** - 智能內容共享和快取

---

## 🔄 工作流程概述

### 📊 **規格工作流程**（新功能）

**一個命令完成完整自動化：**

```bash
/spec-create 功能名稱 "描述"
```

**執行內容：**
1. **需求** → 使用者故事 + 驗收標準
2. **設計** → 技術架構 + 圖表
3. **任務** → 原子化、代理友善的分解
4. **命令** → 自動生成任務命令（可選）

**執行任務：**
```bash
# 手動控制
/spec-execute 1 功能名稱
/功能名稱-task-1        # 自動生成
```

### 🐛 **錯誤修復工作流程**（快速修復）

```bash
/bug-create 問題名稱 "描述"  # 記錄錯誤
/bug-analyze                # 找出根本原因
/bug-fix                   # 實作解決方案
/bug-verify                # 確認解決
```

### 🎯 **指導設置**（專案內容）

```bash
/spec-steering-setup  # 建立 product.md、tech.md、structure.md
```

---

## 🛠️ 命令參考

<details>
<summary><strong>📊 規格工作流程命令</strong></summary>

| 命令 | 用途 |
|------|------|
| `/spec-steering-setup` | 建立專案內容文件 |
| `/spec-create <名稱>` | 完整規格工作流程 |
| `/spec-execute <任務-id>` | 手動任務執行 |
| `/<名稱>-task-<id>` | 自動生成任務命令 |
| `/spec-status` | 顯示進度 |
| `/spec-list` | 列出所有規格 |

</details>

<details>
<summary><strong>🐛 錯誤修復命令</strong></summary>

| 命令 | 用途 |
|------|------|
| `/bug-create <名稱>` | 使用結構化格式記錄錯誤 |
| `/bug-analyze` | 調查根本原因 |
| `/bug-fix` | 實作目標解決方案 |
| `/bug-verify` | 驗證解決方案 |
| `/bug-status` | 顯示錯誤修復進度 |

</details>

---

## 🎯 主要功能

### 🤖 **智能任務執行**
- **精簡的** 任務實作
- **上下文感知** 執行，具有完整規格內容
- **基於代理** 的實作，使用 spec-task-executor

### 🧠 **專業代理**（可選）
4 個 AI 代理用於增強自動化：

**核心工作流程：** `spec-task-executor`、`spec-requirements-validator`、`spec-design-validator`、`spec-task-validator`

> **注意：** 代理是可選的 - 所有功能都有內建回退機制。

### ⚡ **完整內容優化**（新功能！）
- **通用內容共享** - 指導、規格和範本文件優化
- **60-80% Token 減少** - 消除所有文件類型的冗餘文件擷取
- **三重優化命令** - `get-steering-context`、`get-spec-context` 和 `get-template-context`
- **智能文件處理** - 錯誤文件使用直接讀取（無冗餘），範本使用批量載入（高冗餘）
- **改進性能** - 跨所有工作流程的快取內容更快執行代理
- **自動回退** - 當優化不可用時，使用個別 `get-content` 維持可靠性
- **基於會話的快取** - 智能檔案變更檢測和快取無效化

### 📊 **即時控制台**
```bash
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard
```
- 即時進度追蹤
- WebSocket 更新
- Git 整合
- 使用 Tailwind CSS 的現代 UI

---

## 🔧 Odoo 專用功能

### **Odoo ERP 開發支援**
- **專案偵測** - 自動偵測 Odoo 模組和版本
- **模組管理** - 建立、驗證和管理客製化模組
- **版本相容性** - 支援 Odoo 14.0-18.0
- **測試整合** - pytest-odoo 框架支援
- **模型分析** - 繼承鏈分析和驗證
- **多環境支援** - 本地、Docker、遠端和 Odoo.sh

### **🐛 Odoo 模組錯誤回報流程**

#### **1. 建立錯誤報告**
```bash
/odoo-bug-fix [模組名稱]-[問題描述] "詳細描述"
```
**範例：**
```bash
/odoo-bug-fix inventory-stock-error "庫存模組計算錯誤"
```

#### **2. 完整錯誤修復工作流程**
```bash
# 步驟 1：記錄錯誤（包含模組資訊）
/odoo-bug-fix inventory-calculation-bug "庫存計算在特定條件下出現負數"

# 步驟 2：分析根本原因
/bug-analyze

# 步驟 3：實作解決方案
/bug-fix

# 步驟 4：驗證修復
/bug-verify
```

#### **3. 或使用一般錯誤工作流程**
```bash
# 建立錯誤報告（指定模組）
/bug-create [模組名稱]-bug-name "在 [模組名稱] 模組中發現的問題描述"

# 範例
/bug-create sale-order-bug "銷售訂單模組在處理折扣時計算錯誤"
```

#### **4. Odoo 專用錯誤資訊**
當您使用 `/odoo-bug-fix` 時，系統會自動：
- ✅ 偵測相關 Odoo 模組結構
- ✅ 分析模組相依性
- ✅ 檢查 Odoo 版本相容性
- ✅ 提供模組特定的測試建議

**建議的命名慣例：**
- `[模組名稱]-[錯誤類型]-[簡短描述]`
- 範例：`inventory-calculation-negative`、`sale-discount-error`、`account-payment-timeout`

### **Odoo 專用命令**
```bash
# 專用 Odoo 設置
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup

# 命令語法
/odoo-spec-create 模組名稱 "模組描述"
/odoo-module-test 模組名稱 "模組測試描述"
/odoo-bug-fix 模組-問題名稱 "特定 Odoo 模組的錯誤描述"
/odoo-feature-create 模組-功能名稱 "Odoo 模組功能描述"

# 使用範例
/odoo-spec-create inventory-enhancement "客製化庫存管理功能"
/odoo-module-test inventory_custom "執行客製化庫存模組測試"
/odoo-bug-fix sale-discount-error "銷售模組折扣計算錯誤"
/odoo-feature-create hr-attendance-tracking "員工出勤追蹤系統"

# 更多範例
/odoo-spec-create pos-loyalty-program "POS 忠誠度計畫整合"
/odoo-bug-fix account-payment-timeout "會計模組付款處理逾時"
/odoo-module-test website_custom "測試客製化網站模組功能"
```

---

### 🔗 控制台通道（新功能！）

透過臨時 HTTPS URL 安全地與外部利害關係人分享您的控制台：

```bash
# 啟動帶通道的控制台
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel

# 使用密碼保護
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel --tunnel-password mySecret123

# 選擇特定提供者
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel --tunnel-provider cloudflare
```

**通道功能：**
- **🔒 安全 HTTPS URL** - 與管理者、客戶或遠端團隊成員分享控制台
- **👁️ 唯讀存取** - 外部檢視者無法修改任何專案資料
- **🔑 可選密碼** - 使用密碼驗證保護存取
- **🌐 多個提供者** - Cloudflare 和 ngrok 之間自動回退
- **📊 使用分析** - 追蹤誰存取了您的控制台和何時存取
- **⏰ 自動過期** - 當您停止控制台時通道關閉
- **🚀 零配置** - 開箱即用，內建提供者

## 📊 命令列選項

### 設置命令
```bash
# 在當前目錄設置
npx @stanleykao72/claude-code-spec-workflow-odoo

# 在特定目錄設置
npx @stanleykao72/claude-code-spec-workflow-odoo --project /path/to/project

# 強制覆蓋現有檔案
npx @stanleykao72/claude-code-spec-workflow-odoo --force

# 跳過確認提示
npx @stanleykao72/claude-code-spec-workflow-odoo --yes

# 測試設置
npx @stanleykao72/claude-code-spec-workflow-odoo test
```

### 控制台命令
```bash
# 基本控制台
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard

# 帶通道的控制台（外部分享）
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel

# 完整通道配置
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard \
  --tunnel \
  --tunnel-password mySecret123 \
  --tunnel-provider cloudflare \
  --port 3000 \
  --open
```

## 🎯 指導文件（新功能！）

指導文件提供持久性專案內容，指導所有規格開發：

### **產品文件**（`product.md`）
- 產品願景和目的
- 目標使用者及其需求
- 主要功能和目標
- 成功指標

### **技術文件**（`tech.md`）
- 技術堆疊和框架
- 開發工具和實務
- 技術限制和需求
- 第三方整合

### **結構文件**（`structure.md`）
- 檔案組織模式
- 命名慣例
- 匯入模式
- 程式碼組織原則

執行 `/spec-steering-setup` 來建立這些文件。Claude 會分析您的專案並幫助您定義這些標準。

## 🎨 功能

### ✅ **零配置**
- 任何專案開箱即用
- 自動偵測專案類型（Node.js、Python、Java 等）
- 驗證 Claude Code 安裝

### ✅ **互動式設置**
- 美觀的 CLI 與進度指示器
- 安全的確認提示
- 有用的錯誤訊息和指導

### ✅ **智能檔案管理**
- 每個命令檔案中的完整工作流程指示
- 建立全面的目錄結構
- 包含所有必要的範本和配置

### ✅ **專業品質**
- **完整 TypeScript 實作** 具嚴格類型檢查
- **前端轉換為 TypeScript** 用於增強控制台開發
- **95%+ 類型覆蓋率** 無隱含 any 類型
- **現代建置管線** 使用 esbuild 打包和來源映射
- 全面錯誤處理
- 遵循 npm 最佳實務

### ✅ **指導文件整合**
- 跨所有規格的持久專案內容
- 自動與專案標準對齊
- 一致的程式碼生成
- 減少重複解釋的需要

### ✅ **TypeScript 控制台前端**
- **類型安全前端程式碼** 具全面介面
- **即時 WebSocket 通訊** 具類型訊息處理
- **Petite-vue 整合** 具自訂類型定義
- **建置管線** 支援開發和生產包
- **嚴格 null 檢查** 和現代 TypeScript 模式
- **JSDoc 文件** 用於所有匯出函數

## 🏗️ 設置後的專案結構

```
your-project/
├── .claude/
│   ├── commands/           # 14 個斜線命令 + 自動生成
│   ├── steering/          # product.md, tech.md, structure.md
│   ├── templates/         # 文件範本
│   ├── specs/            # 生成的規格
│   ├── bugs/             # 錯誤修復工作流程
│   └── agents/           # AI 代理（預設啟用）
```

## 🧪 測試

套件包含內建測試命令：

```bash
# 在臨時目錄中測試設置
npx @stanleykao72/claude-code-spec-workflow-odoo test
```

## 📋 需求

- **Node.js** 16.0.0 或更高版本
- **Claude Code** 已安裝並配置
- 任何專案目錄

## 🔧 疑難排解

### 常見問題

**❓ NPX 後找不到命令**
```bash
# 請確認您使用正確的套件名稱
npx @stanleykao72/claude-code-spec-workflow-odoo
```

**❓ 設置因權限錯誤失敗**
```bash
# 嘗試使用不同的目錄權限
npx @stanleykao72/claude-code-spec-workflow-odoo --project ~/my-project
```

**❓ 未偵測到 Claude Code**
```bash
# 首先安裝 Claude Code
npm install -g @anthropic-ai/claude-code
```

### 除錯資訊

```bash
# 顯示詳細輸出
DEBUG=* npx @stanleykao72/claude-code-spec-workflow-odoo

# 檢查套件版本
npx @stanleykao72/claude-code-spec-workflow-odoo --version
```

## 🌟 範例

### 基本使用
```bash
cd my-awesome-project
npx @stanleykao72/claude-code-spec-workflow-odoo
claude
# 輸入：/spec-create user-dashboard "使用者個人資料管理"
```

### 進階使用
```bash
# 設置多個專案
for dir in project1 project2 project3; do
  npx @stanleykao72/claude-code-spec-workflow-odoo --project $dir --yes
done

# Odoo 專用專案設置
cd odoo-custom-modules
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup
claude
# 輸入：/odoo-spec-create inventory-management "客製化庫存工作流程"
```

## 🚀 安裝與設置

### **安裝**
```bash
# 全域安裝（建議）
npm install -g @stanleykao72/claude-code-spec-workflow-odoo

# 驗證安裝
claude-code-spec-workflow --version
```

### **設置選項**
```bash
# 基本設置
claude-code-spec-workflow

# Odoo 專用設置
claude-code-spec-workflow odoo-setup

# 進階選項
claude-code-spec-workflow --project /path --force --yes
```

**設置期間您選擇：**
- ✅ **啟用代理？** 增強自動化 vs 簡單設置
- ✅ **專案分析** 自動偵測框架和模式

---

## 📚 範例
**建議：使用 Claude Opus 4 生成規格文件 '/spec-create'，然後使用 Claude Sonnet 4 進行實作，即 '/spec-execute' 或 '/{spec-name}-task-<id>'。**
<details>
<summary><strong>基本工作流程範例</strong></summary>

```bash
# 1. 全域安裝（一次性）
npm install -g @stanleykao72/claude-code-spec-workflow-odoo

# 2. 設置專案（一次性）
cd my-project
claude-code-spec-workflow

# 3. 建立指導文件（建議）
claude
/spec-steering-setup

# 4. 建立功能規格
/spec-create user-authentication "安全登入系統"

# 5. 執行任務
/spec-execute 1 user-authentication

# 6. 監控進度
/spec-status user-authentication
```

</details>

<details>
<summary><strong>錯誤修復範例</strong></summary>

```bash
/bug-create login-timeout "使用者登出太快"
/bug-analyze
/bug-fix
/bug-verify
```

</details>

---

## ⚡ 內容優化命令

套件包含跨所有文件類型高效文件載入的優化命令：

### **get-steering-context**
一次載入所有指導文件用於內容分享：
```bash
claude-code-spec-workflow get-steering-context
```
**輸出**：格式化 markdown，包含所有指導文件（product.md、tech.md、structure.md）

### **get-spec-context**
一次載入所有規格文件用於內容分享：
```bash
claude-code-spec-workflow get-spec-context feature-name
```
**輸出**：格式化 markdown，包含所有規格文件（requirements.md、design.md、tasks.md）

### **get-template-context**
依類別載入範本用於內容分享：
```bash
# 載入所有範本
claude-code-spec-workflow get-template-context

# 載入特定範本類別
claude-code-spec-workflow get-template-context spec    # 規格範本
claude-code-spec-workflow get-template-context bug     # 錯誤範本
claude-code-spec-workflow get-template-context steering # 指導範本
```
**輸出**：格式化 markdown，包含請求的範本

### **智能文件處理**
- **高冗餘文件**（指導、規格、範本）：使用優化批量載入
- **低冗餘文件**（錯誤報告）：使用直接檔案讀取以簡化
- **選擇性委派**：主代理載入完整內容，但只將相關部分傳遞給子代理
- **個別檔案**：在邊緣情況下繼續使用 `get-content`

### **好處**
- **60-80% Token 減少** 相較於個別檔案載入
- **更快執行** 跨所有工作流程的快取內容
- **自動回退** 在需要時使用個別 `get-content`
- **基於會話的快取** 具智能檔案變更檢測

---

## 🛟 疑難排解

<details>
<summary><strong>常見問題</strong></summary>

**❓ "找不到命令"**
```bash
# 首先全域安裝
npm install -g @stanleykao72/claude-code-spec-workflow-odoo

# 然後使用命令
claude-code-spec-workflow
```

**❓ "未偵測到 Claude Code"**
```bash
npm install -g @anthropic-ai/claude-code
```

**❓ "權限錯誤"**
```bash
claude-code-spec-workflow --project ~/my-project
```

</details>

---

## 📋 需求

- **Node.js** 16.0.0+
- **Claude Code** 已安裝
- 任何專案目錄

---

## 🔗 連結

- **[完整文件](https://github.com/stanleykao72/claude-code-spec-workflow-odoo#readme)**
- **[原始專案](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Claude Code 文件](https://docs.anthropic.com/claude-code)**
- **[回報問題](https://github.com/stanleykao72/claude-code-spec-workflow-odoo/issues)**

---

## 📄 授權與致謝

**MIT 授權** - [LICENSE](LICENSE)

**由 [Pimzino](https://github.com/pimzino) 用 ❤️ 製作**

**特別感謝：**
- @pimzino - 初始設置
- @boundless-oss - 指導文件
- @mquinnv - 控制台功能

**技術支援：** [Claude Code](https://docs.anthropic.com/claude-code) • [Mermaid](https://mermaid.js.org/) • [TypeScript](https://www.typescriptlang.org/)