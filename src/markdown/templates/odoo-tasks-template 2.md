# Odoo 模組實施計畫 - {{MODULE_NAME}}

## 任務概覽
基於 Odoo {{ODOO_VERSION}} 框架的模組開發，遵循 MVC 架構和 Odoo 最佳實務。

## Steering Documents 合規性
- **模組標準：** 遵循 module-standards.md 中的結構規範
- **技術堆疊：** 符合 technical-stack.md 的技術選擇
- **商業規則：** 實現 business-rules.md 定義的業務邏輯

## 原子任務需求 (Odoo 特化)
**每個任務必須符合以下 Odoo 開發最佳實務：**
- **檔案範圍：** 每次最多修改 1-2 個相關的 Python/XML 檔案
- **時間限制：** 15-30 分鐘內可完成的 Odoo 開發任務
- **單一目的：** 一個可測試的 Odoo 功能或元件
- **明確檔案：** 指定確切的 Python 模型、XML 視圖或配置檔案
- **Odoo 相容：** 符合 Odoo 編碼標準和框架慣例

## Odoo 任務格式指引
- 使用核取方塊格式：`- [ ] 任務編號. 任務描述`
- **指定檔案：** 明確列出要建立/修改的 .py 和 .xml 檔案
- **包含實作細節：** 以子項目列出 Odoo 特定的實作步驟
- **參照需求：** 使用 `_需求: X.Y, Z.A_` 格式
- **利用現有程式碼：** 使用 `_利用: 模組/檔案路徑_` 格式
- **專注程式開發：** 避免部署、用戶測試等非開發任務
- **避免廣泛術語：** 任務標題中避免使用「系統」、「整合」、「完整」等詞

## Odoo 優秀與不良任務範例

❌ **不良範例 (太廣泛)**:
- "實作完整的銷售管理系統" (影響多個檔案，多重目的)
- "新增用戶管理功能" (範圍模糊，未指定檔案)
- "建構完整的儀表板" (太大，多個元件)

✅ **優秀範例 (原子化)**:
- "在 models/sale_order.py 中建立 SaleOrder 模型，包含基本欄位和狀態"
- "在 views/sale_order_views.xml 中新增銷售訂單表單視圖"
- "在 security/ir.model.access.csv 中設定 SaleOrder 模型的存取權限"

## 實施任務

### Phase 1: 模組基礎架構

- [ ] 1. 建立模組基礎結構和 manifest 檔案
  - 檔案: `{{MODULE_NAME}}/__manifest__.py`, `{{MODULE_NAME}}/__init__.py`
  - 建立模組目錄結構 (models/, views/, security/, data/, static/)
  - 定義模組 manifest 包含名稱、版本、依賴、資料檔案
  - 設定模組初始化檔案導入所有子模組
  - 目的: 建立 Odoo 模組的基礎架構
  - _需求: 1.1_

- [ ] 2. 建立主要資料模型 {{MODULE_NAME}}_main.py
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_main.py`
  - 定義主要模型類別繼承 models.Model 和 mail.thread
  - 新增基礎欄位 (name, description, state, partner_id, company_id)
  - 實作狀態管理選項 (draft, confirmed, done, cancelled)
  - 新增計算欄位 total_amount 和相關的 @api.depends 方法
  - 目的: 建立模組的核心資料模型
  - _利用: odoo/models.py, mail/thread.py_
  - _需求: 2.1, 2.2_

- [ ] 3. 建立明細資料模型 {{MODULE_NAME}}_line.py  
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_line.py`
  - 定義明細模型與主模型的 Many2one 關聯
  - 新增產品關聯、數量、單價、小計欄位
  - 實作 @api.depends 計算小計的方法
  - 新增 @api.constrains 驗證數量必須大於零
  - 目的: 建立一對多關聯的明細資料模型
  - _利用: product/product.py_
  - _需求: 2.3_

- [ ] 4. 設定模型存取權限
  - 檔案: `{{MODULE_NAME}}/security/ir.model.access.csv`
  - 為主模型和明細模型建立存取權限記錄
  - 設定一般用戶 (group_user) 的讀寫權限
  - 設定管理員 (group_system) 的完整權限
  - 遵循 company_id 的多公司安全規則
  - 目的: 確保資料安全和權限控制
  - _需求: 3.1_

- [ ] 5. 建立記錄層級安全規則
  - 檔案: `{{MODULE_NAME}}/security/{{MODULE_NAME}}_security.xml`
  - 建立 ir.rule 記錄限制用戶只能存取自己公司的資料
  - 設定域篩選器 [('company_id', 'in', company_ids)]
  - 確保多公司環境下的資料隔離
  - 目的: 實作多公司記錄層級安全
  - _需求: 3.2_

### Phase 2: 用戶介面開發

- [ ] 6. 建立主要表單視圖 (Form View)
  - 檔案: `{{MODULE_NAME}}/views/{{MODULE_NAME}}_views.xml`
  - 建立 ir.ui.view 記錄定義表單視圖架構
  - 新增 header 區域包含狀態按鈕和 statusbar
  - 建立 sheet 包含基本欄位的群組布局
  - 新增 notebook 頁籤包含明細行的 one2many 欄位
  - 整合 chatter (message_follower_ids, message_ids) 
  - 目的: 建立用戶資料輸入和查看的主要介面
  - _需求: 4.1_

- [ ] 7. 建立列表視圖 (Tree View)
  - 檔案: `{{MODULE_NAME}}/views/{{MODULE_NAME}}_views.xml` (續前一任務)
  - 新增 ir.ui.view 記錄定義樹狀列表視圖
  - 顯示關鍵欄位: name, partner_id, total_amount, state, create_date
  - 設定欄位寬度和對齊方式最佳化
  - 加入可選擇和排序功能
  - 目的: 提供記錄的總覽列表介面
  - _需求: 4.2_

- [ ] 8. 建立搜尋視圖 (Search View)
  - 檔案: `{{MODULE_NAME}}/views/{{MODULE_NAME}}_views.xml` (續前一任務)
  - 定義搜尋視圖包含常用搜尋欄位
  - 新增按狀態、合作夥伴、日期的篩選器
  - 建立按狀態和建立日期的群組分類
  - 加入全文搜尋功能涵蓋 name 和 description
  - 目的: 提供強大的資料搜尋和篩選功能
  - _需求: 4.3_

- [ ] 9. 建立主選單和動作
  - 檔案: `{{MODULE_NAME}}/views/{{MODULE_NAME}}_menus.xml`
  - 建立 ir.actions.act_window 動作定義
  - 連結到主模型和相關的視圖 (form, tree, search)
  - 建立主選單項目和子選單結構
  - 設定選單圖示和順序
  - 目的: 提供 Odoo 選單系統的導航入口
  - _需求: 4.4_

### Phase 3: 商業邏輯實作

- [ ] 10. 實作狀態轉換方法
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_main.py` (續任務 2)
  - 新增 action_confirm() 方法處理草稿到確認狀態轉換
  - 新增 action_done() 方法處理確認到完成狀態轉換  
  - 新增 action_cancel() 方法處理取消邏輯
  - 加入狀態驗證和錯誤處理 UserError
  - 目的: 實作模組的核心業務流程控制
  - _需求: 5.1_

- [ ] 11. 實作總金額計算邏輯
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_main.py` (續任務 10)
  - 完善 _compute_total_amount 方法使用 @api.depends
  - 計算所有明細行小計的總和
  - 處理空明細行的情況避免錯誤
  - 確保計算欄位正確更新和儲存
  - 目的: 提供準確的金額計算和統計
  - _利用: line_ids.mapped('subtotal')_
  - _需求: 5.2_

- [ ] 12. 實作明細行小計計算
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_line.py` (續任務 3)
  - 完善 _compute_subtotal 方法計算 quantity * unit_price
  - 使用 @api.depends('quantity', 'unit_price') 裝飾器
  - 處理負數和零值情況
  - 確保小計變更時主記錄總金額自動更新
  - 目的: 提供動態的金額計算功能
  - _需求: 5.3_

### Phase 4: 進階功能

- [ ] 13. 新增序號自動生成功能
  - 檔案: `{{MODULE_NAME}}/data/{{MODULE_NAME}}_data.xml`, `{{MODULE_NAME}}/models/{{MODULE_NAME}}_main.py`
  - 在 data.xml 中建立 ir.sequence 記錄定義序號格式
  - 在模型的 create 方法中實作自動序號生成
  - 設定序號前綴、位數和重置週期
  - 確保序號唯一性和連續性
  - 目的: 提供自動編號功能便於記錄識別
  - _需求: 6.1_

- [ ] 14. 實作資料驗證約束
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_main.py`, `{{MODULE_NAME}}/models/{{MODULE_NAME}}_line.py`
  - 在主模型新增 @api.constrains 驗證 name 不可重複
  - 在明細模型新增數量和單價必須大於零的驗證
  - 新增刪除限制只有草稿和取消狀態可以刪除
  - 加入適當的 ValidationError 和 UserError 訊息
  - 目的: 確保資料完整性和業務規則
  - _需求: 6.2_

- [ ] 15. 新增報表模板
  - 檔案: `{{MODULE_NAME}}/report/{{MODULE_NAME}}_report.xml`
  - 建立 ir.actions.report 動作定義 PDF 報表
  - 設計 QWeb 模板顯示主記錄和明細資訊
  - 包含公司標頭、記錄詳情、明細表格、總計
  - 加入適當的 CSS 樣式設定
  - 目的: 提供專業的列印和 PDF 輸出功能
  - _需求: 7.1_

### Phase 5: 測試和最佳化

- [ ] 16. 建立單元測試
  - 檔案: `{{MODULE_NAME}}/tests/__init__.py`, `{{MODULE_NAME}}/tests/test_{{MODULE_NAME}}.py`
  - 建立 TransactionCase 測試類別
  - 測試模型建立、狀態轉換、計算欄位功能
  - 測試資料驗證約束和錯誤處理
  - 確保測試覆蓋率達到主要功能
  - 目的: 確保程式碼品質和功能正確性
  - _利用: odoo.tests.TransactionCase_
  - _需求: 8.1_

- [ ] 17. 新增示範資料
  - 檔案: `{{MODULE_NAME}}/demo/{{MODULE_NAME}}_demo.xml`
  - 建立示範的主記錄和明細資料
  - 包含不同狀態的範例記錄
  - 關聯到系統預設的合作夥伴和產品
  - 提供新用戶學習和測試的資料
  - 目的: 提供模組功能展示和測試資料
  - _需求: 8.2_

- [ ] 18. 最佳化效能和新增索引
  - 檔案: `{{MODULE_NAME}}/models/{{MODULE_NAME}}_main.py`, `{{MODULE_NAME}}/models/{{MODULE_NAME}}_line.py`
  - 在常用查詢欄位新增資料庫索引 (_sql_constraints)
  - 最佳化 search 和 read 方法的效能
  - 使用 _order 設定合理的預設排序
  - 確保大量資料時的查詢效能
  - 目的: 提升模組在大量資料下的執行效能
  - _需求: 9.1_

## 版本相容性考量

### Odoo {{ODOO_VERSION}} 特定功能
- 使用新的 ORM API (@api.model, @api.depends, @api.constrains)
- 利用改進的 mail.thread 整合功能
- 採用最新的 QWeb 報表引擎
- 遵循 {{ODOO_VERSION}} 的安全框架升級

### 向後相容性
- 避免使用即將被棄用的 API
- 保持與前一個 LTS 版本的相容性
- 提供適當的升級和遷移指令

## 部署檢查清單

### 生產部署前確認
- [ ] 所有測試通過
- [ ] 權限設定正確
- [ ] 示範資料僅在開發環境載入
- [ ] 效能指標符合預期
- [ ] 安全掃描無高風險問題

### 更新和維護
- [ ] 備份策略建立
- [ ] 監控指標定義
- [ ] 文件更新完成
- [ ] 用戶培訓材料準備