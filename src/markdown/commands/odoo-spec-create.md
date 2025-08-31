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

Use the @spec-task-executor agent to create a comprehensive Odoo feature specification following these steps:

```
Create an Odoo-specific feature specification with the following structure:

# Odoo Module Specification Framework

## 1. Module Context Analysis
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
Create in .claude/specs/[module-name]/:
- requirements.md: Business requirements with Odoo context
- design.md: Technical design with ERP patterns
- tasks.md: Implementation tasks with Odoo specifics
- module-scaffold/: Auto-generated module structure

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