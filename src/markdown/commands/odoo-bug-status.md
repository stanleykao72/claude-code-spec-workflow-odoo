# odoo-bug-status - Show Odoo Module Bug Status

Show current status of Odoo module bug fixes with ERP-aware context and module dependency tracking.

## Usage

```
/odoo-bug-status [module-name] [bug-name]
```

**Examples:**
```
/odoo-bug-status                                    # All module bugs status
/odoo-bug-status inventory_custom                   # Specific module bugs
/odoo-bug-status inventory_custom negative-stock    # Specific bug status
```

## What This Command Does

This command displays comprehensive status information for Odoo module bug fixes, including module context, business impact, and integration considerations.

## Instructions

Use the @odoo-spec-task-executor agent to show Odoo module bug status:

```

Display comprehensive Odoo module bug status with ERP context:

# 1. Parameter Processing
Determine scope based on provided parameters:

## No parameters: All modules bug status
- Scan all detected modules for .spec/bugs/ directories
- Show summary for each module's bugs
- Highlight critical bugs requiring attention
- Display overall project bug health metrics

## Module-name only: Module-specific bug status
- Show all bugs within the specified module
- Include module dependency impact
- Display module-specific bug categories
- Show business process impact summary

## Module + bug-name: Detailed specific bug status
- Show complete workflow status for specific bug
- Include technical implementation details
- Display testing and verification progress
- Show integration impact assessment

# 2. Module Bug Discovery
Scan module structure for bug tracking:

## Module Detection
- Use existing odoo-detect functionality to find all modules
- For each module, check for .spec/bugs/ directory
- Collect bug directories and their status files

## Bug Classification
- **Active Bugs**: In progress through workflow phases
- **Resolved Bugs**: Completed verification phase
- **Blocked Bugs**: Waiting for dependencies or approval
- **Critical Bugs**: High severity impacting core operations

# 3. Status Analysis Framework
For each bug found, analyze workflow progress:

## File Presence Check
- ✅ report.md: Bug report complete
- ✅ analysis.md: Root cause analysis complete
- ✅ fix.md: Implementation details complete
- ✅ verification.md: Testing and validation complete

## Content Completeness Check
- Analyze file content quality and completeness
- Check for placeholder text or incomplete sections
- Validate against Odoo-specific requirements
- Assess business impact documentation

## Integration Impact Analysis
- Check dependencies on other modules
- Assess core Odoo integration effects
- Evaluate third-party module compatibility
- Consider upgrade path implications

# 4. Comprehensive Output Formats

## All Modules Bug Status (no parameters)
```
📊 Odoo Project Bug Status

🎯 Overall Health: [Excellent/Good/Needs Attention/Critical]
   • Active Modules: X modules with bugs
   • Total Open Bugs: X (Critical: X, High: X, Medium: X, Low: X)
   • Resolved This Week: X bugs
   • Average Resolution Time: X days

⚡ Critical Bugs Requiring Attention:
   • inventory_custom/negative-stock: Analysis phase (2 days old)
   • sale_custom/discount-error: Blocking production (URGENT)
   • hr_custom/attendance-sync: Integration failure (1 week old)

📈 Module Bug Summary:
🏗️ inventory_custom (3 bugs):
   ├── negative-stock (Critical) - Analysis phase
   ├── low-stock-alert (Medium) - Fix phase
   └── batch-update-error (Low) - Complete

🏗️ sale_custom (2 bugs):
   ├── discount-error (Critical) - Report phase
   └── tax-calculation (High) - Verification phase

🏗️ hr_custom (1 bug):
   └── attendance-sync (High) - Analysis phase

💡 Recommendations:
   1. Priority: Complete discount-error analysis (blocking sales)
   2. Review: negative-stock analysis for approval
   3. Monitor: attendance-sync integration dependencies
```

## Module-Specific Bug Status
```
🏗️ MODULE: inventory_custom

📋 Module Info:
   • Path: custom_addons/inventory_custom
   • Version: 1.2.3 (Odoo 16.0)
   • Dependencies: stock, purchase, sale
   • Bug Count: 3 (Critical: 1, Medium: 1, Low: 1)

🐛 Active Bugs (2):
├── negative-stock (Critical)
│   ├── Phase: Analysis (Day 2)
│   ├── Progress: Report ✅ | Analysis 🔄 | Fix ⏳ | Verification ⏳
│   ├── Impact: Blocking inventory operations
│   ├── Assigned: [assignee if available]
│   └── Next: Complete root cause analysis

├── low-stock-alert (Medium)
│   ├── Phase: Fix Implementation (Day 1)
│   ├── Progress: Report ✅ | Analysis ✅ | Fix 🔄 | Verification ⏳
│   ├── Impact: Alert system not functioning
│   └── Next: Complete implementation and testing

✅ Resolved Bugs (1):
└── batch-update-error (Low)
    ├── Resolved: 3 days ago
    ├── Resolution Time: 5 days
    └── Impact: Minor batch processing issue

📊 Module Health Metrics:
   • Bug Resolution Rate: 67% (2/3 completed this month)
   • Average Resolution Time: 4.5 days
   • Critical Bug Response: Within 1 day
   • Business Impact Score: Medium

🚨 Integration Alerts:
   • negative-stock bug affects dependent modules: sale_custom, purchase_custom
   • Upgrade impact: 1 bug may affect Odoo 17.0 migration

📈 Next Actions:
   1. Urgent: Complete negative-stock analysis (critical business impact)
   2. Monitor: low-stock-alert implementation progress
   3. Plan: Integration testing for dependent modules
```

## Specific Bug Detailed Status
```
🐛 BUG: inventory_custom/negative-stock

📋 Bug Overview:
   • Status: Analysis Phase (Day 2 of 4)
   • Severity: Critical
   • Business Impact: Blocking inventory operations
   • Created: 2025-01-15 09:30
   • Last Updated: 2025-01-17 14:20

⚙️ Technical Context:
   • Module: inventory_custom (v1.2.3)
   • Affected Models: stock.move, stock.quant
   • Integration: stock, sale, purchase modules
   • Database Impact: Data integrity concerns

🔄 Workflow Progress:
   ✅ Report Phase (Complete)
      • File: report.md (2.1KB)
      • Quality: Comprehensive ✓
      • Business impact documented ✓
      • Reproduction steps verified ✓
      
   🔄 Analysis Phase (In Progress - 60% complete)
      • File: analysis.md (1.3KB - incomplete)
      • Root cause: Partially identified
      • Solution strategy: Under review
      • Integration impact: Being assessed
      
   ⏳ Fix Phase (Pending)
      • Estimated start: After analysis approval
      • Implementation approach: TBD
      • Testing strategy: TBD
      
   ⏳ Verification Phase (Pending)
      • Integration testing required
      • Performance validation needed
      • User acceptance testing planned

📊 Progress Tracking:
   • Report Quality: Excellent (100%)
   • Analysis Progress: 60% (needs completion)
   • Fix Planning: 0% (waiting for analysis)
   • Overall Completion: 40%

🚨 Critical Indicators:
   • Business Impact: HIGH - Inventory operations blocked
   • User Impact: 15 users affected daily
   • Data Risk: Medium - potential data inconsistency
   • Deadline Pressure: Production issue requiring urgent fix

🔗 Dependencies & Integration:
   • Blocking Modules: sale_custom (order processing)
   • Affected Workflows: Purchase → Inventory → Sales
   • Third-party Impact: WMS integration may be affected
   • Upgrade Consideration: Must be resolved before Odoo 17.0

💡 Immediate Actions Required:
   1. URGENT: Complete analysis.md (blocking fix phase)
   2. Review: Validate root cause identification
   3. Approve: Analysis before proceeding to implementation
   4. Plan: Integration testing strategy

⏰ Timeline:
   • Analysis Completion: Target today
   • Fix Implementation: 1-2 days after analysis approval
   • Verification: 1 day after fix
   • Total Estimated: 2-3 days remaining

🎯 Success Criteria:
   • Stock levels show correctly (no negative values)
   • Integration with sales/purchase intact
   • Performance impact minimal
   • User workflows restored
```

# 5. Odoo-Specific Status Metrics

## Business Impact Assessment
- **Process Disruption Level**: Critical/High/Medium/Low
- **Affected User Count**: Number of impacted users
- **Revenue Impact**: Estimated business cost
- **Workaround Availability**: Available/Partial/None

## Technical Health Indicators
- **Module Integration Status**: All modules affected
- **Database Consistency**: Data integrity assessment
- **Performance Impact**: System resource usage
- **Upgrade Compatibility**: Future version considerations

## Resolution Velocity
- **Average Resolution Time**: By severity level
- **Bug Discovery Rate**: New bugs per week/month
- **Fix Success Rate**: Percentage of fixes that stick
- **Regression Rate**: Bugs that reoccur

# 6. Smart Status Detection
Automatically determine status based on:
- **File Timestamps**: When last modified
- **Content Analysis**: Quality and completeness
- **Business Priority**: Impact-based urgency
- **Dependencies**: Blocking relationships

# 7. Actionable Recommendations
Provide specific next steps:
- **Immediate Actions**: What to do right now
- **Priority Ranking**: Order of importance
- **Resource Allocation**: Who should work on what
- **Risk Mitigation**: How to minimize impact
```

## Bug Fix Phases for Odoo Modules

- **Report**: ERP-aware bug description with business impact
- **Analysis**: Module-specific root cause with integration analysis
- **Fix**: Odoo-compatible implementation with dependency management
- **Verification**: Comprehensive testing including integration validation
- **Complete**: Full resolution with upgrade path consideration

## Module-Aware Status Tracking

This command provides enhanced tracking over generic `/bug-status` by including:

- **Module Context**: Understanding of inter-module relationships
- **Business Process Impact**: ERP workflow disruption assessment
- **Integration Health**: Dependencies and compatibility status
- **Upgrade Planning**: Version compatibility considerations
- **Multi-tenancy Status**: Company-specific bug impacts

## Integration with Odoo Development

- References module manifests and dependencies
- Considers Odoo version compatibility requirements
- Integrates with business process documentation
- Supports multi-environment tracking (dev/staging/production)
- Links to module lifecycle and upgrade planning

## Related Commands

- `/odoo-bug-create` - Create new Odoo module bug reports
- `/odoo-bug-analyze` - Analyze Odoo module bug root causes
- `/odoo-bug-fix` - Implement Odoo module bug fixes
- `/odoo-bug-verify` - Verify Odoo module bug fixes
- `/odoo-spec-status` - Check overall module specification status