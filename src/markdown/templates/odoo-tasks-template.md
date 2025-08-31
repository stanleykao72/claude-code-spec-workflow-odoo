# Odoo Module Implementation Plan - {{MODULE_NAME}}

## Task Overview
Module development based on Odoo {{ODOO_VERSION}} framework, following MVC architecture and Odoo best practices.

## Steering Documents Compliance
- **Module Standards:** Follows structure specifications in module-standards.md
- **Technology Stack:** Complies with technical choices in technical-stack.md
- **Business Rules:** Implements business logic defined in business-rules.md

## Atomic Task Requirements (Odoo Specialized)
**Each task must comply with the following Odoo development best practices:**
- **File Scope:** Modify at most 1-2 related Python/XML files per task
- **Time Limit:** Odoo development tasks completable within 15-30 minutes
- **Single Purpose:** One testable Odoo feature or component
- **Explicit Files:** Specify exact Python models, XML views, or configuration files
- **Odoo Compatible:** Follows Odoo coding standards and framework conventions

## Odoo Task Format Guidelines
- Use checkbox format: `- [ ] Task Number. Task Description`
- **Specify Files:** Clearly list .py and .xml files to create/modify
- **Include Implementation Details:** List Odoo-specific implementation steps as sub-items
- **Reference Requirements:** Use `_Requirements: X.Y, Z.A_` format
- **Leverage Existing Code:** Use `_Leverage: module/file_path_` format
- **Focus on Development:** Avoid deployment, user testing, and non-development tasks
- **Avoid Broad Terms:** Avoid using "system", "integration", "complete" in task titles

## Odoo Good vs Bad Task Examples

❌ **Bad Examples (Too Broad)**:
- "Implement complete sales management system" (affects multiple files, multiple purposes)
- "Add user management functionality" (vague scope, no file specification)
- "Build complete dashboard" (too large, multiple components)

✅ **Good Examples (Atomic)**:
- "Create SaleOrder model in models/sale_order.py with basic fields and status"
- "Add sales order form view in views/sale_order_views.xml"
- "Configure SaleOrder model access permissions in security/ir.model.access.csv"

## Implementation Tasks

### Phase 1: Module Foundation

- [ ] 1. Create module base structure and manifest file
  - Files: `{{MODULE_NAME}}/__manifest__.py`, `{{MODULE_NAME}}/__init__.py`
  - Create module directory structure (models/, views/, security/, data/, static/)
  - Define module manifest with name, version, dependencies, data files
  - Set up module initialization file to import all sub-modules
  - Purpose: Establish basic Odoo module architecture
  - _Requirements: 1.1_

- [ ] 2. Create main data model main_model.py
  - Files: `{{MODULE_NAME}}/models/main_model.py`
  - Define main model class inheriting models.Model and mail.thread
  - Add basic fields (name, description, state, partner_id, company_id)
  - Implement state management options (draft, confirmed, done, cancelled)
  - Add computed field total_amount with corresponding @api.depends method
  - Purpose: Create module's core data model (using descriptive filename)
  - _Leverage: odoo/models.py, mail/thread.py_
  - _Requirements: 2.1, 2.2_

- [ ] 3. Create detail data model line_model.py  
  - Files: `{{MODULE_NAME}}/models/line_model.py`
  - Define detail model with Many2one relationship to main model
  - Add product relationship, quantity, unit_price, subtotal fields
  - Implement @api.depends method to calculate subtotal
  - Add @api.constrains validation for quantity greater than zero
  - Purpose: Create one-to-many related detail data model (using descriptive filename)
  - _Leverage: product/product.py_
  - _Requirements: 2.3_

- [ ] 4. Configure model access permissions
  - Files: `{{MODULE_NAME}}/security/ir.model.access.csv`
  - Create access permission records for main and detail models
  - Set read/write permissions for regular users (group_user)
  - Set full permissions for administrators (group_system)
  - Follow company_id multi-company security rules
  - Purpose: Ensure data security and permission control
  - _Requirements: 3.1_

- [ ] 5. Create record-level security rules
  - Files: `{{MODULE_NAME}}/security/security_rules.xml`
  - Create ir.rule records to limit users to their own company data
  - Set domain filter [('company_id', 'in', company_ids)]
  - Ensure data isolation in multi-company environments
  - Purpose: Implement multi-company record-level security
  - _Requirements: 3.2_

### Phase 2: User Interface Development

- [ ] 6. Create main form view (Form View)
  - Files: `{{MODULE_NAME}}/views/main_model_views.xml`
  - Create ir.ui.view record defining form view architecture
  - Add header section with state buttons and statusbar
  - Create sheet with grouped layout of basic fields
  - Add notebook tabs containing one2many field for detail lines
  - Integrate chatter (message_follower_ids, message_ids)
  - Purpose: Create main interface for user data entry and viewing
  - _Requirements: 4.1_

- [ ] 7. Create list view (Tree View)
  - Files: `{{MODULE_NAME}}/views/main_model_views.xml` (continue from previous task)
  - Add ir.ui.view record defining tree list view
  - Display key fields: name, partner_id, total_amount, state, create_date
  - Set optimized field widths and alignment
  - Add selection and sorting capabilities
  - Purpose: Provide record overview list interface
  - _Requirements: 4.2_

- [ ] 8. Create search view (Search View)
  - Files: `{{MODULE_NAME}}/views/main_model_views.xml` (continue from previous task)
  - Define search view with common search fields
  - Add filters by state, partner, date
  - Create grouping by state and creation date
  - Add full-text search covering name and description
  - Purpose: Provide powerful data search and filtering capabilities
  - _Requirements: 4.3_

- [ ] 9. Create main menu and actions
  - Files: `{{MODULE_NAME}}/views/menus.xml`
  - Create ir.actions.act_window action definition
  - Link to main model and related views (form, tree, search)
  - Create main menu item and sub-menu structure
  - Set menu icon and sequence
  - Purpose: Provide navigation entry point in Odoo menu system
  - _Requirements: 4.4_

### Phase 3: Business Logic Implementation

- [ ] 10. Implement state transition methods
  - Files: `{{MODULE_NAME}}/models/main_model.py` (continue from task 2)
  - Add action_confirm() method for draft to confirmed state transition
  - Add action_done() method for confirmed to done state transition  
  - Add action_cancel() method for cancellation logic
  - Include state validation and UserError error handling
  - Purpose: Implement module's core business process control
  - _Requirements: 5.1_

- [ ] 11. Implement total amount calculation logic
  - Files: `{{MODULE_NAME}}/models/main_model.py` (continue from task 10)
  - Complete _compute_total_amount method using @api.depends
  - Calculate sum of all detail line subtotals
  - Handle empty detail lines to avoid errors
  - Ensure computed fields update and store correctly
  - Purpose: Provide accurate amount calculation and statistics
  - _Leverage: line_ids.mapped('subtotal')_
  - _Requirements: 5.2_

- [ ] 12. Implement detail line subtotal calculation
  - Files: `{{MODULE_NAME}}/models/line_model.py` (continue from task 3)
  - Complete _compute_subtotal method calculating quantity * unit_price
  - Use @api.depends('quantity', 'unit_price') decorator
  - Handle negative and zero values
  - Ensure main record total amount updates when subtotal changes
  - Purpose: Provide dynamic amount calculation functionality
  - _Requirements: 5.3_

### Phase 4: Advanced Features

- [ ] 13. Add automatic sequence number generation
  - Files: `{{MODULE_NAME}}/data/base_data.xml`, `{{MODULE_NAME}}/models/main_model.py`
  - Create ir.sequence record in data.xml defining sequence format
  - Implement automatic sequence generation in model's create method
  - Set sequence prefix, digits, and reset period
  - Ensure sequence uniqueness and continuity
  - Purpose: Provide automatic numbering for record identification
  - _Requirements: 6.1_

- [ ] 14. Implement data validation constraints
  - Files: `{{MODULE_NAME}}/models/main_model.py`, `{{MODULE_NAME}}/models/line_model.py`
  - Add @api.constrains validation in main model for unique name
  - Add quantity and unit_price must be greater than zero validation in detail model
  - Add deletion restriction for only draft and cancelled states
  - Include appropriate ValidationError and UserError messages
  - Purpose: Ensure data integrity and business rules
  - _Requirements: 6.2_

- [ ] 15. Add report template
  - Files: `{{MODULE_NAME}}/report/report_templates.xml`
  - Create ir.actions.report action defining PDF report
  - Design QWeb template displaying main record and detail information
  - Include company header, record details, detail table, totals
  - Add appropriate CSS styling
  - Purpose: Provide professional printing and PDF output functionality
  - _Requirements: 7.1_

### Phase 5: Testing and Optimization

- [ ] 16. Create unit tests
  - Files: `{{MODULE_NAME}}/tests/__init__.py`, `{{MODULE_NAME}}/tests/test_models.py`
  - Create TransactionCase test class
  - Test model creation, state transitions, computed field functionality
  - Test data validation constraints and error handling
  - Ensure test coverage reaches main functionality
  - Purpose: Ensure code quality and functional correctness
  - _Leverage: odoo.tests.TransactionCase_
  - _Requirements: 8.1_

- [ ] 17. Add demo data
  - Files: `{{MODULE_NAME}}/demo/demo_data.xml`
  - Create demo main records and detail data
  - Include example records with different states
  - Link to system default partners and products
  - Provide learning and testing data for new users
  - Purpose: Provide module functionality demonstration and test data
  - _Requirements: 8.2_

- [ ] 18. Optimize performance and add indexes
  - Files: `{{MODULE_NAME}}/models/main_model.py`, `{{MODULE_NAME}}/models/line_model.py`
  - Add database indexes on frequently queried fields (_sql_constraints)
  - Optimize search and read method performance
  - Use _order to set reasonable default sorting
  - Ensure query performance with large amounts of data
  - Purpose: Improve module execution performance under large datasets
  - _Requirements: 9.1_

## Version Compatibility Considerations

### Odoo {{ODOO_VERSION}} Specific Features
- Use new ORM API (@api.model, @api.depends, @api.constrains)
- Leverage improved mail.thread integration features
- Adopt latest QWeb report engine
- Follow {{ODOO_VERSION}} security framework upgrades

### Backward Compatibility
- Avoid using soon-to-be-deprecated APIs
- Maintain compatibility with previous LTS version
- Provide appropriate upgrade and migration instructions

## Deployment Checklist

### Pre-Production Deployment Verification
- [ ] All tests passing
- [ ] Permissions configured correctly
- [ ] Demo data loads only in development environment
- [ ] Performance metrics meet expectations
- [ ] Security scan shows no high-risk issues

### Updates and Maintenance
- [ ] Backup strategy established
- [ ] Monitoring metrics defined
- [ ] Documentation updates completed
- [ ] User training materials prepared

---

**Last Updated:** {{CURRENT_DATE}}  
**Document Version:** 1.0  
**Approval Status:** [Pending/Approved]