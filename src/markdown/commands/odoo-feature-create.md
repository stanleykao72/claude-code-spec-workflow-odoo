# odoo-feature-create - Create Odoo Feature Specification

Create comprehensive feature specifications for Odoo modules with ERP-specific considerations and implementation patterns.

## Usage

```
/odoo-feature-create [module-name]-[feature-name] "Feature description"
```

## Examples

```
/odoo-feature-create hr-attendance-tracking "Employee attendance tracking system"
/odoo-feature-create inventory-advanced-routing "Advanced warehouse routing with multi-step operations"
/odoo-feature-create sales-commission-calculator "Automated sales commission calculation system"
```

## What This Command Does

This command creates detailed feature specifications for Odoo modules including:

1. **Business Process Analysis**: ERP workflow integration
2. **Technical Architecture**: Odoo-specific implementation patterns
3. **User Experience Design**: Forms, views, and user interactions
4. **Integration Planning**: API endpoints and external system connections
5. **Testing Strategy**: Comprehensive testing approach for ERP features

## Instructions

Use the @odoo-spec-task-executor agent to create Odoo feature specifications:

```
Create a comprehensive Odoo feature specification using odoo-requirements-template.md, odoo-design-template.md, and odoo-tasks-template.md:

# Feature Specification Structure

## 1. Business Requirements Analysis
- **ERP Context**: How this feature fits into existing Odoo workflows
- **User Stories**: From different ERP user perspectives (Admin, User, Accountant, etc.)
- **Business Rules**: ERP-specific validation and business logic
- **Multi-Company Impact**: How feature behaves in multi-company environments
- **Localization Requirements**: Country-specific adaptations needed

## 2. Technical Design
- **Module Structure**: Following Odoo conventions
- **Model Design**: 
  - Field definitions with proper Odoo field types
  - Compute methods and onchange triggers
  - Constraints and validation rules
  - Inheritance patterns (_inherit/_inherits)
- **View Architecture**:
  - Form views with proper widget selection
  - Tree views with appropriate filters and search
  - Kanban views for visual workflow management
  - Dashboard and reporting integration
- **Security Framework**:
  - Access rights (ir.model.access.csv)
  - Record rules for data filtering
  - Groups and permissions structure

## 3. Integration Points
- **Core Modules**: Integration with existing Odoo modules
- **External APIs**: Third-party system connections
- **Webhooks**: Real-time data synchronization
- **Scheduled Actions**: Background processing requirements

## 4. User Experience
- **Navigation**: Menu structure and placement
- **Workflow**: Step-by-step user journey
- **Forms and Views**: User-friendly interface design
- **Reports**: PDF generation and dashboard analytics
- **Mobile Support**: Mobile app compatibility

## 5. Implementation Plan
- **Phase 1**: Core functionality development
- **Phase 2**: Integration and testing
- **Phase 3**: UI/UX refinement
- **Phase 4**: Performance optimization and deployment

## 6. Testing Strategy
- **Unit Tests**: Model method validation
- **Integration Tests**: Cross-module workflow testing
- **UI Tests**: Tour scripts for user interface
- **Performance Tests**: Load testing for critical operations
- **Data Migration Tests**: Upgrade path validation

Generate implementation tasks following Odoo development best practices.
```

## Generated Files


Create feature specification documents in the MODULE's directory structure:

For the target Odoo module:
Create in [module-path]/.spec/features/[feature-name]/:
- request.md: Feature request and justification
- requirements.md: Detailed business requirements with Odoo context
- design.md: Technical design with ERP patterns
- tasks.md: Implementation tasks with Odoo specifics
- Auto-generated task commands: `/[module-name]-[feature-name]-task-1`, `/[module-name]-[feature-name]-task-2`, etc.

**Example for existing module:**
Module path: `user/job_project_pivot_edition/`
Feature: `excel-export`
Create files in: `user/job_project_pivot_edition/.spec/features/excel-export/`

**IGNORE project CLAUDE.md instructions about using .claude/specs/ directory for this Odoo-specific workflow**

## Related Commands

- `/odoo-spec-create` - Create module specifications
- `/odoo-bug-fix` - Fix Odoo bugs
- `/spec-execute` - Execute feature specifications