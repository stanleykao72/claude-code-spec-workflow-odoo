# odoo-bug-fix - Create Odoo-specific Bug Fix Workflow

Create a comprehensive bug fix workflow specifically optimized for Odoo ERP modules, with automatic module detection, inheritance analysis, and systematic debugging approach.

## Usage

```
/odoo-bug-fix [module-name]-[issue-description] "Detailed bug description"
```

## Examples

```
/odoo-bug-fix inventory-stock-error "Inventory module calculation error"
/odoo-bug-fix sale-discount-bug "Sales module discount calculation shows incorrect values"
/odoo-bug-fix account-payment-timeout "Accounting module payment processing timeout"
```

## What This Command Does

This command creates an Odoo-specific bug fix workflow that includes:

1. **Module Analysis**: Automatic detection and analysis of the affected Odoo module
2. **Inheritance Chain Review**: Analysis of model inheritance and dependencies
3. **Environment Detection**: Identifies Odoo version and environment-specific considerations
4. **Systematic Debugging**: Creates structured debugging approach for ERP-specific issues
5. **Test Strategy**: Generates appropriate test cases for Odoo modules

## Instructions

Use the @odoo-spec-task-executor agent to create a comprehensive Odoo bug fix workflow following these steps:

```
Create an Odoo-specific bug fix workflow with the following structure:

# Bug Analysis Framework
1. **Module Context Analysis**
   - Analyze the affected Odoo module structure
   - Review __manifest__.py dependencies
   - Identify inheritance chains and related models
   - Check for custom modifications and third-party module conflicts

2. **Environment Assessment**
   - Detect Odoo version (14.0-18.0) compatibility
   - Identify deployment environment (local, Docker, Odoo.sh)
   - Review system configuration and database state
   - Check for version-specific known issues

3. **Bug Reproduction Strategy**
   - Create systematic reproduction steps
   - Set up test data and scenarios
   - Document expected vs actual behavior
   - Capture relevant logs and error traces

4. **Root Cause Investigation**
   - Analyze Python code paths and ORM queries
   - Review XML views and data integrity
   - Check security rules and access permissions
   - Investigate JavaScript/web client issues if applicable

5. **Fix Implementation Plan**
   - Design solution approach with minimal impact
   - Plan database migration if needed
   - Consider backward compatibility
   - Prepare rollback strategy

6. **Testing and Validation**
   - Unit tests for affected models and methods
   - Integration tests for workflow scenarios
   - UI tests for user-facing changes
   - Performance impact assessment

7. **Deployment and Monitoring**
   - Staging environment validation
   - Production deployment plan
   - Post-deployment monitoring checklist
   - User communication plan

# Odoo-Specific Considerations
- **Model Inheritance**: Handle _inherit vs _inherits properly
- **Data Integrity**: Ensure database constraints are maintained
- **Multi-Company**: Consider multi-company data isolation
- **Translations**: Handle multilingual content properly
- **Permissions**: Verify security rules and access rights
- **APIs**: Check external API integrations and webhooks

# Documentation Requirements

Create bug fix documents in the MODULE's directory structure:

For the target Odoo module:
Create in [module-path]/.spec/bugs/[bug-name]/:
- report.md: Bug report and initial analysis
- analysis.md: Detailed root cause analysis and reproduction steps
- fix.md: Technical implementation details and solution
- verification.md: Testing strategy and deployment validation

**Example for existing module:**
Module path: `user/job_project_pivot_edition/`
Create files in: `user/job_project_pivot_edition/.spec/bugs/BUG-YYYY-MM-DD-001/`

**IGNORE project CLAUDE.md instructions about using .claude/bugs/ directory for this Odoo-specific workflow**

Use Odoo-specific templates and include version compatibility notes.
```

## Next Steps

After creating the bug fix workflow:

1. **Execute Analysis**: Use the generated analysis commands
2. **Implement Fix**: Follow the systematic implementation plan
3. **Test Thoroughly**: Execute the comprehensive testing strategy
4. **Deploy Carefully**: Follow the deployment guide with rollback plan
5. **Monitor**: Use the monitoring checklist post-deployment

## Related Commands

- `/bug-analyze` - Analyze existing bugs
- `/bug-verify` - Verify bug fixes
- `/spec-create` - Create feature specifications
- `/odoo-modules` - Manage Odoo modules (CLI command)