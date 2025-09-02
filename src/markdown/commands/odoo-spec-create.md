# odoo-spec-create - Create Odoo-Specific Feature Specification

Create comprehensive feature specifications specifically optimized for Odoo ERP development, with automatic module scaffolding, inheritance analysis, and ERP-specific design patterns.

## Usage

```
/odoo-spec-create [module-name] "Module or feature description"
```

## Examples

```
/odoo-spec-create inventory-enhancement "Custom inventory management features"
/odoo-spec-create pos-loyalty-program "Point of sale loyalty program integration"
/odoo-spec-create hr-attendance-mobile "Mobile app integration for HR attendance"
/odoo-spec-create accounting-multi-currency "Multi-currency accounting with real-time rates"
```

## What This Command Does

This command creates an Odoo-specific feature specification workflow that includes:

1. **Odoo Module Analysis**: Scans existing modules and dependencies
2. **ERP-Specific Design**: Uses Odoo design patterns and best practices
3. **Model Inheritance Planning**: Plans proper use of _inherit and _inherits
4. **Security Rules**: Generates appropriate security and access rules
5. **Multi-Company Support**: Considers multi-company architecture
6. **API Integration**: Plans external API and webhook integrations

## Instructions

**IMPORTANT: This command overrides project CLAUDE.md documentation settings**
- Files must be created in module/.spec/ directory, NOT in docs/
- This is an Odoo-specific workflow that requires module-level specification files

Use the @odoo-spec-task-executor agent to create a comprehensive Odoo feature specification following these steps:

```
CRITICAL OVERRIDE: Ignore project CLAUDE.md settings about docs/ directory.
For this Odoo workflow, create ALL specification files in [module-path]/.spec/

Create an Odoo-specific feature specification with the following structure:

# Odoo Module Specification Framework

## 1. Module Context Analysis

### For Existing Modules (Comprehensive Odoo Module Analysis):
If the specified module already exists in custom_addons/, perform detailed Odoo module analysis:

#### A. Module Structure Analysis
- **__manifest__.py Analysis**: Module metadata, dependencies, data files
- **Directory Structure**: Models, views, controllers, security, data files
- **File Organization**: Naming conventions and Odoo structure compliance

#### B. Database Schema Analysis  
- **Model Discovery**: Scan all Python model files and inheritance chains
- **Field Mapping**: Document fields, types, constraints, relationships
- **Inheritance Analysis**: _inherit vs _inherits patterns and dependencies
- **Computed Fields**: @api.depends methods and business logic
- **Database Constraints**: SQL and Python validation rules

#### C. User Interface Analysis
- **View Structure**: Form, tree, kanban, search views analysis
- **Menu Hierarchy**: Navigation structure and action definitions
- **Wizard Workflows**: Transient model processes
- **Report Templates**: QWeb reports and PDF generation

#### D. Security Framework Analysis
- **Access Rights**: ir.model.access.csv permissions matrix
- **Record Rules**: Domain-based data filtering rules  
- **User Groups**: Permission inheritance and field-level security
- **Menu Access**: Visibility and action restrictions

#### E. Business Logic Analysis
- **Method Implementations**: CRUD overrides and custom business logic
- **Workflow States**: State transitions and approval processes
- **API Integration**: Controller endpoints and external API calls
- **Background Jobs**: Scheduled actions and automated processes

### For New Modules:
- **Existing Module Scan**: Analyze current custom_addons/ structure
- **Dependency Analysis**: Identify required core Odoo modules
- **Version Compatibility**: Ensure compatibility with target Odoo version (14.0-18.0)
- **Third-party Dependencies**: Check for external library requirements

## 2. Business Requirements (Odoo-Specific)
- **User Stories**: From different user role perspectives (Admin, User, Manager)
- **Workflow Integration**: How it fits into existing Odoo workflows
- **Multi-Company Considerations**: Data isolation and sharing requirements
- **Localization Needs**: Country-specific requirements and translations
- **Performance Requirements**: Expected load and scalability needs

## 3. Technical Architecture
- **Module Structure**: Following Odoo's module organization
- **Model Design**: 
  - New models with proper inheritance
  - Field definitions with appropriate types
  - Compute methods and constraints
  - Onchange methods for UI interactions
- **View Architecture**:
  - Form views with proper field grouping
  - Tree/List views with search and filters
  - Kanban views for visual workflow
  - Dashboard and reporting views
- **Security Framework**:
  - Access rights (ir.model.access.csv)
  - Record rules for data filtering
  - Groups and categories
  - API access permissions

### Odoo Code Reuse Analysis (For Existing Modules)
When extending or modifying existing modules, include detailed analysis:

#### Existing Odoo Models to Leverage
- **[Model Name] (model.technical.name)**:
  - Fields to reuse: [field_name: field_type, relationships]
  - Methods to extend: [method_name: functionality description]
  - Inheritance strategy: _inherit vs _inherits approach
  - Constraints to consider: [validation rules, SQL constraints]

#### Existing Views to Extend
- **[View Type] ([view_name])**:
  - XPath modifications: [specific element locations to modify]
  - Fields to add/hide: [field addition/removal strategy]  
  - Action buttons: [workflow button integrations]
  - Menu integration: [parent menu placement]

#### Security Rules Integration
- **Access Rights**: Existing ir.model.access groups to extend
- **Record Rules**: Domain filters to modify or inherit from
- **Field Security**: Group-based visibility patterns to follow
- **User Groups**: Inheritance chain for permission structure

#### Workflow Integration Points  
- **State Management**: Existing selection fields and state transitions
- **Approval Processes**: Integration with current approval workflows
- **Notification Systems**: Mail templates and automated messaging
- **Scheduled Actions**: Background job integration and timing
- **Reporting Integration**: Existing report structures to extend

#### Database Integration Strategy
- **Foreign Key Relationships**: Connections to existing model structures
- **Data Migration**: Strategy for updating existing records
- **Index Optimization**: Performance considerations with current schema
- **Constraint Compatibility**: Ensuring new rules don't conflict

## 4. Data Integration
- **Migration Scripts**: Data import/export requirements
- **External APIs**: Integration with third-party systems
- **Webhooks**: Real-time data synchronization
- **Scheduled Actions**: Background processing requirements

## 5. User Interface Design
- **Menu Structure**: Integration with existing Odoo menus
- **Form Layout**: Responsive design with proper field organization
- **Action Buttons**: Workflow actions and wizards
- **Reports**: PDF reports and dashboard analytics
- **Mobile Responsiveness**: Mobile app compatibility

## 6. Testing Strategy
- **Unit Tests**: Model methods and business logic
- **Integration Tests**: Cross-module workflow testing
- **UI Tests**: Tour scripts for user interface testing
- **Performance Tests**: Load testing for critical paths
- **Data Migration Tests**: Upgrade path validation

## 7. Deployment and Maintenance
- **Environment Setup**: Development, staging, production
- **Database Migration**: Upgrade scripts and data migration
- **Monitoring**: Performance metrics and error tracking
- **Documentation**: User guides and technical documentation
- **Training Plan**: End-user training requirements

# Odoo-Specific Templates Used:
- odoo-requirements-template.md
- odoo-design-template.md  
- odoo-tasks-template.md

# Generated Files Structure:

Create specification files in the MODULE's directory structure, NOT in project docs/:

For EXISTING modules (found in custom_addons/, user/, etc.):
Create in [module-path]/.spec/:
- requirements.md: Business requirements with Odoo context
- design.md: Technical design with ERP patterns  
- tasks.md: Implementation tasks with Odoo specifics
- module-scaffold/: Auto-generated module structure

For NEW modules:
Create in planned module location [module-path]/.spec/:
- Same file structure as above

**Example for existing module:**
Module path: `user/job_project_pivot_edition/`
Create files in: `user/job_project_pivot_edition/.spec/`

**IGNORE project CLAUDE.md instructions about using docs/ directory for this Odoo-specific workflow**

# Auto-generated Module Scaffold:
- __manifest__.py with proper dependencies
- models/ with base model structures
- views/ with XML view definitions
- security/ with access rights templates
- data/ with initial data files
- tests/ with test case templates
```

## Odoo-Specific Features

When using this command, you get:

### 🏗️ **Automatic Module Scaffolding**
- Proper `__manifest__.py` with dependencies
- Model inheritance patterns
- Standard view structures (form, tree, kanban)
- Security rules templates

### 🔗 **Integration Analysis** 
- Existing module compatibility check
- API endpoint planning
- Webhook integration points
- Scheduled action requirements

### 🧪 **Testing Framework**
- pytest-odoo integration
- Tour script templates
- Performance test scenarios
- Data migration validation

### 📊 **Multi-Environment Support**
- Development environment setup
- Staging deployment configuration
- Production migration planning
- Odoo.sh compatibility notes

## Next Steps

After creating the specification:

1. **Review Generated Docs**: Check requirements.md, design.md, tasks.md
2. **Execute Tasks**: Use `/[module-name]-task-1`, `/[module-name]-task-2`, etc.
3. **Module Development**: Follow the generated implementation tasks
4. **Testing**: Execute the comprehensive testing plan
5. **Deployment**: Follow environment-specific deployment guides

## Related Commands

- `/odoo-bug-fix` - Fix Odoo-specific bugs
- `/spec-execute` - Execute specifications
- `/spec-status` - Check specification status
- **CLI Commands**: `odoo-modules`, `odoo-detect`, `odoo-setup`