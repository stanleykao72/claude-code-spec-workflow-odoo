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

Use the @spec-task-executor agent to generate Odoo steering documents:

```
Generate comprehensive Odoo steering documents using odoo-product-template.md and create:

# 1. Business Rules Document (.claude/steering/business-rules.md)
- ERP workflow standards
- Multi-company data policies  
- User role definitions and permissions
- Business process integration rules
- Data validation and integrity requirements

# 2. Technical Stack Document (.claude/steering/technical-stack.md)
- Odoo development patterns (Model-View-Controller)
- Database design standards (PostgreSQL optimization)
- Security framework implementation
- API design guidelines (REST/JSON-RPC)
- Performance optimization standards

# 3. Module Standards Document (.claude/steering/module-standards.md)
- Module structure and naming conventions
- Model inheritance best practices (_inherit vs _inherits)
- View design patterns (form, tree, kanban)
- Security rule implementation
- Testing standards (pytest-odoo)
- Documentation requirements

These documents will be used by all subsequent /odoo-spec-create and /odoo-bug-fix commands to ensure consistency.
```

## Generated Documents

After running this command, you'll have:

- `.claude/steering/business-rules.md` - ERP business logic standards
- `.claude/steering/technical-stack.md` - Odoo technical guidelines  
- `.claude/steering/module-standards.md` - Custom module development rules

## Related Commands

- `/odoo-spec-create` - Create Odoo module specifications
- `/odoo-bug-fix` - Fix Odoo-specific issues
- `/spec-steering-setup` - General steering setup