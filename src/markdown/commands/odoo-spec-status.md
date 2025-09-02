# odoo-spec-status - Show Detailed Odoo Module Specification Status

Show detailed status of Odoo module specifications, including features, bugs, and tests.

## Usage

```
/odoo-spec-status [module-name] [spec-type] [spec-name]
```

**Parameters:**
- `module-name` (optional): Specific module to check
- `spec-type` (optional): Type of spec (features, bugs, testing)
- `spec-name` (optional): Specific specification name

**Examples:**
```
/odoo-spec-status                                    # All modules status
/odoo-spec-status inventory_custom                   # Specific module status
/odoo-spec-status inventory_custom features          # Module features only
/odoo-spec-status inventory_custom features stock-enhancement  # Specific feature
```

## What This Command Does

This command provides detailed status information for Odoo module specifications, showing progress, completion status, and next recommended actions.

## Instructions

Use the @odoo-spec-task-executor agent to show Odoo specification status:

```

Display detailed Odoo specification status with module-aware analysis:

# 1. Parameter Processing
Determine scope based on provided parameters:

## No parameters: Project-wide status
- Show summary for all modules
- Highlight modules with active development
- Display overall project health metrics

## Module-name only: Module-specific status
- Show all specifications within the specified module
- Include module metadata and dependencies
- Display module development progress

## Module + spec-type: Type-specific status
- Show only features, bugs, or testing specifications
- Include type-specific metrics and recommendations

## Full specification: Detailed spec status
- Show complete workflow status for specific specification
- Include task-level progress and next actions

# 2. Status Analysis Framework
For each specification found, analyze:

## File Presence Check
- ✅ All required files exist
- ⚠️ Some files missing
- ❌ Critical files missing

## Content Completeness Check
- Analyze file content quality and completeness
- Check for placeholder text or incomplete sections
- Validate against Odoo-specific requirements

## Timestamp Analysis
- Show last modification dates
- Identify stale or outdated specifications
- Highlight recent activity

# 3. Detailed Output Format

## Project-Wide Status (no parameters)
```
📊 Odoo Project Development Status

🎯 Overall Health: [Excellent/Good/Needs Attention]
   • Active Modules: X/Y
   • In-Progress Features: X
   • Open Bug Fixes: X
   • Test Coverage: X%

⚡ Recent Activity (Last 7 days):
   • inventory_custom/features/stock-tracking (Updated 2 days ago)
   • sale_custom/bugs/discount-calculation (Created 1 day ago)
   • hr_custom/testing/attendance-tests (Completed 3 days ago)

🚨 Needs Attention:
   • warehouse_custom: No recent activity (14 days)
   • pos_custom: 3 incomplete features
   • account_custom: 2 unverified bug fixes

📈 Next Recommended Actions:
   1. Complete stock-tracking feature (Task 3/5)
   2. Verify discount-calculation bug fix
   3. Review warehouse_custom module status
```

## Module-Specific Status
```
🏗️ MODULE: inventory_custom (custom_addons/inventory_custom)

📋 Module Info:
   • Odoo Version: 16.0
   • Status: Active Development
   • Dependencies: stock, purchase, sale
   • Last Activity: 2 days ago

🚀 Features (3):
├── stock-tracking (In Progress)
│   ├── Phase: Implementation (3/5 tasks complete)
│   ├── Files: ✅ request.md ✅ requirements.md ✅ design.md ✅ tasks.md
│   ├── Last Updated: 2025-01-15 14:30
│   └── Next: Execute task 4 - "Implement barcode scanning"
│
├── batch-operations (Planning)
│   ├── Phase: Requirements
│   ├── Files: ✅ request.md ⚠️ requirements.md (incomplete)
│   ├── Last Updated: 2025-01-12 09:15
│   └── Next: Complete requirements analysis
│
└── inventory-reports (Complete)
    ├── Phase: Deployed
    ├── Files: ✅ All files complete
    ├── Last Updated: 2025-01-08 16:45
    └── Status: Production ready

🐛 Bug Fixes (2):
├── negative-stock-issue (Fixed)
│   ├── Status: Verified in production
│   ├── Files: ✅ All workflow files complete
│   └── Resolved: 2025-01-10 11:20
│
└── slow-inventory-count (In Progress)
    ├── Status: Analysis phase
    ├── Files: ✅ report.md ✅ analysis.md ⚠️ fix.md (pending)
    └── Next: Implement performance optimization

🧪 Testing (1):
└── inventory-module-tests (In Progress)
    ├── Coverage: 72% (Target: 85%)
    ├── Files: ✅ testing-plan.md ✅ test-cases.md ⚠️ test-implementation.md
    ├── Last Updated: 2025-01-13 10:30
    └── Next: Complete unit test implementation
```

## Specific Specification Status
```
🚀 FEATURE: inventory_custom/stock-tracking

📋 Specification Status:
   • Phase: Implementation
   • Progress: Requirements ✅ | Design ✅ | Tasks ✅ | Implementation 3/5
   • Health: Good (on track)
   • Last Activity: 2025-01-15 14:30

📄 Files Analysis:
   ✅ request.md (Complete, 1.2KB)
   ✅ requirements.md (Complete, 3.4KB)
   ✅ design.md (Complete, 5.1KB)
   ✅ tasks.md (Complete, 2.8KB)

📊 Task Progress:
   ✅ Task 1: Database schema design (Completed 2025-01-10)
   ✅ Task 2: Model implementation (Completed 2025-01-12)
   ✅ Task 3: Basic views creation (Completed 2025-01-14)
   🔄 Task 4: Implement barcode scanning (In Progress)
   ⏳ Task 5: Integration testing (Pending)

🎯 Next Actions:
   1. Complete barcode scanning implementation
   2. Execute task 5 for integration testing
   3. Perform user acceptance testing

⚡ Recommended Command:
   /spec-execute 4 stock-tracking
```

# 4. Odoo-Specific Analysis
Include Odoo development context:

## Module Health Indicators
- Module dependencies status
- Odoo version compatibility
- Code quality metrics
- Test coverage trends

## Development Velocity
- Average time per task completion
- Feature delivery rate
- Bug fix resolution time
- Module complexity assessment

## Integration Impact
- Cross-module dependencies
- Upgrade path considerations
- Third-party module interactions
- Database schema impact analysis

# 5. Actionable Recommendations
Provide specific, actionable next steps:
- Exact commands to run for next actions
- Priority ranking of pending tasks
- Resource allocation suggestions
- Risk mitigation strategies
```

## Smart Status Detection

The command intelligently determines:
- **Workflow phase** based on file presence and content
- **Health status** based on activity patterns and completeness
- **Priority level** based on business impact and deadlines
- **Development velocity** based on historical progress

## Integration with Odoo Workflow

- References Odoo module dependencies
- Considers Odoo version compatibility
- Integrates with module lifecycle management
- Supports multi-environment development tracking

## Related Commands

- `/odoo-spec-list` - Overview of all module specifications
- `/spec-execute` - Execute specific specification tasks
- `/odoo-feature-create` - Create new feature specifications
- `/odoo-bug-fix` - Create new bug fix workflows