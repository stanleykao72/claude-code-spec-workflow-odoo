# odoo-steering - Generate Odoo-Specific Steering Documents

Generate comprehensive steering documents specifically for Odoo ERP projects, including business rules, technical standards, and module development guidelines.

## Usage

```
/odoo-steering
```

## What This Command Does

This command generates Odoo-specific steering documents that provide:

1. **Business Rules Document**: ERP-specific business logic and workflows
2. **Technical Stack Document**: Odoo development standards and patterns  
3. **Module Standards Document**: Guidelines for custom module development

## Instructions

Use the @odoo-spec-task-executor agent to generate Odoo steering documents:

```

Generate comprehensive Odoo steering documents using odoo-product-template.md and create in project-level configuration directory:

# Generated Files Structure:
Create in .odoo-dev/steering/:
- business-rules.md: ERP business logic standards and workflow rules
- technical-stack.md: Odoo technical guidelines and development patterns
- module-standards.md: Custom module development standards and best practices

# 1. Business Rules Document (.odoo-dev/steering/business-rules.md)
- ERP workflow standards and business process integration
- Multi-company data policies and isolation rules
- User role definitions and permission matrices
- Data validation and integrity requirements
- Localization and compliance standards

# 2. Technical Stack Document (.odoo-dev/steering/technical-stack.md)
- Odoo development patterns (Model-View-Controller architecture)
- Database design standards (PostgreSQL optimization)
- Security framework implementation guidelines
- API design guidelines (REST/JSON-RPC best practices)
- Performance optimization and scalability standards

# 3. Module Standards Document (.odoo-dev/steering/module-standards.md)
- Module structure and naming conventions
- Model inheritance best practices (_inherit vs _inherits)
- View design patterns (form, tree, kanban, search)
- Security rule implementation standards
- Testing standards (pytest-odoo integration)
- Documentation and version control requirements

These steering documents will be used by all subsequent /odoo-spec-create, /odoo-bug-fix, and /odoo-feature-create commands to ensure project-wide consistency.
```

## Generated Documents

After running this command, you'll have project-level steering documents:

- `.odoo-dev/steering/business-rules.md` - ERP business logic standards
- `.odoo-dev/steering/technical-stack.md` - Odoo technical development guidelines  
- `.odoo-dev/steering/module-standards.md` - Custom module development rules and conventions

**Note:** These are project-level steering documents that apply to all modules in the project, which is why they are stored in `.odoo-dev/steering/` rather than individual module `.spec/` directories.

## Related Commands

- `/odoo-spec-create` - Create Odoo module specifications
- `/odoo-bug-fix` - Fix Odoo-specific issues
- `/spec-steering-setup` - General steering setup