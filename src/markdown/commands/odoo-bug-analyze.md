# odoo-bug-analyze - Analyze Odoo Module Bug Root Cause

Investigate and analyze the root cause of a reported Odoo module bug with ERP-specific context.

## Usage

```
/odoo-bug-analyze [module-bug-name]
```

## What This Command Does

This command performs deep analysis of Odoo module bugs, considering ERP-specific patterns, module dependencies, and Odoo framework constraints to identify root causes and plan effective solutions.

## Instructions

Use the @odoo-spec-task-executor agent to analyze Odoo module bugs:

```

Perform comprehensive Odoo module bug analysis with ERP-specific context:

# 1. Prerequisites and Context Loading
Load complete Odoo development context:

## Odoo Project Context
- Load .odoo-dev/config.json for project configuration
- Load .odoo-dev/steering/ documents:
  * business-rules.md: ERP business logic and workflow standards
  * technical-stack.md: Odoo technical guidelines and patterns
  * module-standards.md: Custom module development standards

## Module Context
- Identify target module from bug name
- Load module manifest (__manifest__.py) and dependencies
- Understand module's role in the ERP ecosystem
- Check module's Odoo version compatibility

## Bug Report Context
- Load existing bug report from [module-path]/.spec/bugs/[bug-name]/report.md
- Understand reported symptoms and reproduction steps
- Review user impact and business process affected

# 2. Odoo-Specific Investigation Process

## Module Architecture Analysis
Investigate with Odoo ERP context:
- **Model Inheritance Chains**: Check _inherit and _inherits relationships
- **View Hierarchy**: Analyze view inheritance and customizations
- **Security Rules**: Review record rules and access control
- **Data Flow**: Trace data through Odoo ORM and business logic
- **Integration Points**: Check API calls, web controllers, and external integrations

## ERP Pattern Analysis
- **Business Logic Validation**: Check compute methods, constraints, and onchange
- **Workflow Integration**: Analyze state transitions and approval processes
- **Multi-company Impact**: Consider multi-tenancy and data isolation
- **Localization Effects**: Check currency, language, and regional settings
- **Performance Implications**: Analyze database queries and bulk operations

## Odoo Framework Considerations
- **ORM Usage**: Check for proper use of Odoo ORM methods
- **Transaction Handling**: Analyze commit/rollback patterns
- **Caching Issues**: Check for cache invalidation problems
- **Module Load Order**: Verify dependency loading sequence
- **API Compatibility**: Check for deprecated method usage

# 3. Root Cause Investigation

## Technical Root Cause Analysis
Focus on Odoo-specific failure patterns:
- **Inheritance Conflicts**: Multiple modules modifying same functionality
- **Database Schema Issues**: Field conflicts, constraint violations
- **Security Rule Conflicts**: Overlapping or contradicting access rules
- **View Rendering Problems**: Template inheritance and XML conflicts
- **Business Logic Errors**: Incorrect compute methods or domain filters

## Integration Impact Analysis
- **Dependent Module Effects**: How does this bug affect other modules?
- **Core Odoo Integration**: Does this conflict with standard Odoo behavior?
- **Third-party Module Compatibility**: Conflicts with community/enterprise modules
- **Upgrade Path Impact**: Will this affect future Odoo version upgrades?

## Business Process Impact
- **Workflow Disruption**: Which business processes are affected?
- **Data Integrity**: Is there risk of data corruption or loss?
- **User Experience**: How does this affect end-user operations?
- **Reporting Impact**: Does this affect business intelligence or reporting?

# 4. Solution Strategy Planning

## Fix Approach Design
Plan Odoo-appropriate solutions:
- **Inheritance Strategy**: Use proper _inherit patterns to avoid conflicts
- **Override vs Extension**: Determine whether to override or extend functionality
- **Migration Considerations**: Plan for future Odoo version compatibility
- **Testing Strategy**: Plan pytest-odoo integration and coverage

## Risk Assessment
- **Module Stability**: Impact on existing module functionality
- **Data Migration**: Need for data updates or corrections
- **Performance Impact**: Query performance and resource usage
- **Deployment Considerations**: Production deployment strategy

# 5. Create Analysis Document
Create comprehensive analysis in [module-path]/.spec/bugs/[bug-name]/analysis.md:

```
# Odoo Module Bug Analysis: [bug-name]

## Bug Summary
- **Module**: [module-name]
- **Odoo Version**: [version]
- **Severity**: [critical/high/medium/low]
- **Business Impact**: [description]

## Technical Investigation

### Module Architecture
- **Affected Models**: [list of models]
- **Inheritance Chain**: [inheritance relationships]
- **Dependencies**: [module dependencies]
- **Security Context**: [access rules involved]

### Root Cause Analysis
**Primary Cause**: [detailed explanation]
**Contributing Factors**: 
- [factor 1]
- [factor 2]

### Code Analysis
**Problem Location**: [file:line references]
**Problematic Code**: 
```python
[relevant code snippets]
```

**Why It Fails**: [technical explanation]

### Business Logic Impact
- **Affected Workflows**: [business processes]
- **Data Integrity**: [data impact assessment]
- **User Experience**: [UX impact]

## Solution Strategy

### Recommended Fix
**Approach**: [fix strategy]
**Implementation**: [technical approach]
**Files to Modify**: [list of files]

### Alternative Solutions
1. **Option 1**: [alternative approach]
2. **Option 2**: [another alternative]

### Risk Mitigation
- **Testing Required**: [testing strategy]
- **Rollback Plan**: [if fix fails]
- **Performance Considerations**: [performance impact]

### Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Integration Considerations
- **Dependent Modules**: [impact on other modules]
- **Upgrade Compatibility**: [future version considerations]
- **Third-party Compatibility**: [community module impacts]

## Next Steps
1. Review and approve this analysis
2. Implement the recommended fix
3. Execute comprehensive testing
4. Deploy with monitoring
```

# 6. Approval Process
Present the complete analysis document:
- Show Odoo-specific root cause identification
- Demonstrate understanding of ERP impact
- Present well-reasoned solution strategy
- Highlight integration and upgrade considerations
- Ask: "Does this Odoo module bug analysis look correct? If so, we can proceed to implement the fix."
- Incorporate feedback and revisions
- Continue until explicit approval
- **CRITICAL**: Do not proceed without explicit approval

# 7. Odoo-Specific Analysis Guidelines

## Model Analysis
- Check for proper use of Odoo model patterns
- Verify field definitions and relationships
- Review computed field implementations
- Analyze record rule interactions

## View Analysis  
- Check view inheritance hierarchy
- Verify template inheritance patterns
- Review JavaScript/CSS integration
- Analyze widget and field usage

## Security Analysis
- Review access control lists (ACL)
- Check record rule implementations
- Verify group permissions
- Analyze security implications

## Performance Analysis
- Check database query efficiency
- Analyze ORM usage patterns
- Review bulk operation implementations
- Consider caching strategies
```

## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval, proceed to `/odoo-bug-fix`.

## Integration with Odoo Development Workflow

This command provides superior analysis compared to generic `/bug-analyze` by including:

- **Module Dependency Analysis** - Understanding of inter-module relationships
- **ERP Business Context** - Consideration of business process impact
- **Odoo Framework Expertise** - Knowledge of ORM patterns and constraints
- **Version Compatibility** - Planning for Odoo upgrade paths
- **Multi-tenancy Awareness** - Consideration of multi-company implications

## Related Commands

- `/odoo-bug-create` - Create new Odoo module bug reports
- `/odoo-bug-fix` - Implement Odoo module bug fixes
- `/odoo-bug-verify` - Verify Odoo module bug fixes
- `/odoo-bug-status` - Check Odoo module bug status