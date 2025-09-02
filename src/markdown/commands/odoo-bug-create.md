# odoo-bug-create - Initialize Odoo Module Bug Fix Workflow

Initialize a new bug fix workflow specifically for Odoo module issues, with ERP-aware tracking and resolution process.

## Usage

```
/odoo-bug-create <module-bug-name> [description]
```

**Examples:**
```
/odoo-bug-create inventory-negative-stock "Inventory shows negative stock values"
/odoo-bug-create sale-discount-calculation "Sales discount not calculating correctly"
/odoo-bug-create hr-attendance-timeout "Employee attendance module login timeout"
```

## What This Command Does

This command initializes the streamlined Odoo module bug fix workflow, designed for addressing module-specific issues with full ERP context and module dependency awareness.

## Instructions

Use the @odoo-spec-task-executor agent to create Odoo module bug reports:

```

Initialize comprehensive Odoo module bug fix workflow with ERP context:

# 1. Workflow Overview
This is the **Odoo-specific bug fix workflow** - optimized for ERP module issues:

**Bug Fix Phases:**
1. **Report Phase** (This command) - Document the Odoo module bug
2. **Analysis Phase** (`/odoo-bug-analyze`) - Investigate with ERP context
3. **Fix Phase** (`/odoo-bug-fix`) - Implement module-aware solution
4. **Verification Phase** (`/odoo-bug-verify`) - Verify with integration testing

# 2. Module Detection and Context
Determine target module and load context:

## Module Identification
- Parse bug name to identify target module (e.g., "inventory-negative-stock" → "inventory_custom")
- Locate module path and validate existence
- Load module manifest (__manifest__.py) for dependencies

## Context Loading (Load Once - Hierarchical Context Loading)
Load complete Odoo context at the beginning:

```bash
# Load Odoo steering documents
claude-code-spec-workflow-odoo get-content ".odoo-dev/steering/business-rules.md"
claude-code-spec-workflow-odoo get-content ".odoo-dev/steering/technical-stack.md"
claude-code-spec-workflow-odoo get-content ".odoo-dev/steering/module-standards.md"

# Load Odoo bug templates
claude-code-spec-workflow-odoo get-template-context odoo
```

# 3. Create Module Bug Directory Structure
Create organized bug tracking structure in target module:

**Directory Structure:**
```
[module-path]/.spec/bugs/[bug-name]/
├── report.md          # Initial bug report
├── analysis.md        # Root cause analysis (created by /odoo-bug-analyze)
├── fix.md            # Implementation details (created by /odoo-bug-fix)
└── verification.md   # Testing and validation (created by /odoo-bug-verify)
```

# 4. Gather Odoo-Specific Bug Information
Collect comprehensive ERP-aware bug details:

## Basic Information
- Bug name and description
- Affected module and version
- Odoo version and environment
- Business process impact

## Reproduction Context
- **User Role**: Which user types experience this?
- **Business Scenario**: In which business process does this occur?
- **Data Context**: What data conditions trigger this?
- **Multi-company Impact**: Does this affect multiple companies?
- **Localization**: Does this vary by country/language/currency?

## Technical Context
- **Module Dependencies**: Which related modules are involved?
- **Integration Points**: External systems affected?
- **Database Impact**: Any database-level symptoms?
- **Performance Impact**: Does this affect system performance?

# 5. Generate Comprehensive Odoo Bug Report
Create detailed bug report in [module-path]/.spec/bugs/[bug-name]/report.md:

```
# Odoo Module Bug Report: [bug-name]

## Bug Overview
- **Module**: [module-name]
- **Severity**: [Critical/High/Medium/Low]
- **Status**: Open
- **Created**: [date]
- **Reporter**: [user]

## Environment Information
- **Odoo Version**: [version] (e.g., 16.0, 17.0)
- **Environment**: [Local/Docker/Production/Staging]
- **Database**: PostgreSQL [version]
- **Operating System**: [OS details]

## Module Context
- **Module Path**: [module-path]
- **Module Version**: [from manifest]
- **Dependencies**: [dependent modules]
- **Custom/Standard**: [custom/community/enterprise]

## Bug Description
**Summary**: [clear, concise description]

**Business Impact**: 
- Which business process is affected?
- What is the impact on users?
- Is this blocking critical operations?

**Technical Symptoms**:
- What exactly is happening?
- What should be happening instead?
- Are there error messages or logs?

## Reproduction Steps
**Prerequisites**:
- [Required data setup]
- [User permissions needed]
- [Specific configuration]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [what should happen]
**Actual Behavior**: [what actually happens]

## ERP Context Analysis
**Affected Business Processes**:
- [Process 1]: [impact description]
- [Process 2]: [impact description]

**Multi-company Considerations**:
- Does this affect all companies or specific ones?
- Are there company-specific settings involved?

**Integration Impact**:
- [External system 1]: [impact]
- [Core Odoo module]: [impact]
- [Other custom modules]: [impact]

## Technical Details
**Error Messages/Logs**:
```
[Paste relevant error messages or log entries]
```

**Database Queries** (if relevant):
```sql
[Relevant SQL queries or database state]
```

**Model/Field Information**:
- **Affected Models**: [model names]
- **Affected Fields**: [field names and types]
- **Relationships**: [related models and relationships]

## User Impact Assessment
**Affected User Roles**:
- [Role 1]: [impact description]
- [Role 2]: [impact description]

**Workaround Available**: [Yes/No]
**Workaround Description**: [if available]

**Business Continuity**:
- Can business operations continue?
- Is manual intervention required?
- Are there alternative processes?

## Additional Information
**Related Issues**: [link to related bugs or features]
**Recent Changes**: [any recent code changes that might be related]
**Frequency**: [how often does this occur?]

## Attachments
- [Screenshots]
- [Log files]
- [Configuration exports]
- [Data samples]
```

# 6. Odoo-Specific Validation
Validate bug report completeness:
- **Module Context**: Verify module identification and dependencies
- **Business Impact**: Ensure business process impact is clear
- **Technical Details**: Confirm sufficient technical information
- **Reproduction**: Validate reproduction steps are complete
- **ERP Integration**: Check for integration and multi-tenancy considerations

# 7. User Approval Process
Present the completed bug report:
- Show comprehensive module and ERP context
- Highlight business process impact
- Demonstrate technical understanding
- Ask: "Is this Odoo module bug report accurate and complete? If so, we can move on to the analysis phase."
- Incorporate feedback and revisions
- Continue until explicit approval
- **CRITICAL**: Do not proceed without explicit approval

# 8. Module-Aware Bug Tracking
After approval:
- Save report to module's .spec/bugs/[bug-name]/ directory
- Update module's bug tracking if available
- Reference in module documentation
- Note in module changelog/history
```

## Key Differences from General Bug Workflow

- **Module-Aware**: Targets specific Odoo modules with full context
- **ERP-Focused**: Considers business process and integration impact
- **Version-Conscious**: Accounts for Odoo version compatibility
- **Multi-tenancy**: Considers multi-company implications
- **Integration-Aware**: Evaluates impact on module dependencies

## Odoo-Specific Rules

- Always identify target module from bug name
- Consider multi-company data isolation
- Evaluate impact on dependent modules
- Check Odoo version compatibility implications
- Document business process disruption
- Consider localization and currency effects

## Error Handling

**Module Not Found**: Guide user to correct module identification
**Complex Integration Issues**: Suggest breaking into multiple bugs
**Version Compatibility**: Flag for upgrade planning considerations
**Multi-module Impact**: Consider creating related bugs for affected modules

## Integration with Odoo Development

This command integrates with:
- Module dependency management
- Odoo version compatibility tracking
- Business process documentation
- Integration testing frameworks
- Module lifecycle management

## Related Commands

- `/odoo-bug-analyze` - Analyze Odoo module bug root causes
- `/odoo-bug-fix` - Implement Odoo module bug fixes
- `/odoo-bug-verify` - Verify Odoo module bug fixes
- `/odoo-bug-status` - Check Odoo module bug status

## Next Steps

After bug report approval, proceed to `/odoo-bug-analyze` phase.