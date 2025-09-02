# odoo-spec-list - List All Odoo Module Specifications

List all specifications across all Odoo modules in the project, including features, bugs, and module tests.

## Usage

```
/odoo-spec-list
```

## What This Command Does

This command scans all detected Odoo modules and lists their specifications, providing a comprehensive overview of development work across the entire Odoo project.

## Instructions

Use the @odoo-spec-task-executor agent to list Odoo module specifications:

```

Scan and list all Odoo module specifications across the entire project:

# 1. Module Discovery
- Detect all Odoo modules in the project using odoo-detect functionality
- Look for modules in standard paths (custom_addons/, addons/, modules/)
- Include both auto-detected and manually configured modules

# 2. Specification Scanning
For each discovered module, scan the .spec/ directory structure:

## Features (.spec/features/[feature-name]/)
- request.md: Feature request and justification
- requirements.md: Business requirements
- design.md: Technical design
- tasks.md: Implementation tasks

## Bug Fixes (.spec/bugs/[bug-name]/)
- report.md: Bug report and analysis
- analysis.md: Root cause analysis
- fix.md: Implementation details
- verification.md: Testing strategy

## Module Tests (.spec/testing/)
- testing-plan.md: Testing strategy
- test-cases.md: Test specifications
- test-implementation.md: Test code
- performance-tests.md: Performance benchmarks
- ci-cd-integration.md: CI/CD guides

# 3. Output Format
Display comprehensive module-wise specification overview:

```
📋 Odoo Project Specifications Overview

📊 Project Summary:
   • Total Modules: X
   • Total Features: X
   • Total Bug Fixes: X 
   • Total Tests: X

🏗️ MODULE: [module-name] (Path: [module-path])
├── 🚀 Features (X):
│   ├── feature-1 (Complete) - Last updated: YYYY-MM-DD
│   │   └── Phase: Implementation (7/8 tasks)
│   ├── feature-2 (In Progress) - Last updated: YYYY-MM-DD
│   │   └── Phase: Design
│   └── feature-3 (Planning) - Last updated: YYYY-MM-DD
│       └── Phase: Requirements
│
├── 🐛 Bug Fixes (X):
│   ├── bug-1 (Fixed) - Last updated: YYYY-MM-DD
│   │   └── Status: Verified
│   └── bug-2 (In Progress) - Last updated: YYYY-MM-DD
│       └── Status: Analysis
│
└── 🧪 Tests (X):
    ├── unit-tests (Complete) - Last updated: YYYY-MM-DD
    │   └── Coverage: 85%
    └── integration-tests (In Progress) - Last updated: YYYY-MM-DD
        └── Coverage: 60%

[Repeat for each module...]
```

# 4. Completion Status Detection
For each specification, determine status based on file presence and content:
- **Planning**: Only request/report files exist
- **In Progress**: Requirements/analysis files exist
- **Complete**: All workflow files exist and marked complete
- **Needs Attention**: Files exist but outdated or incomplete

# 5. Summary Statistics
- Show project-wide statistics
- Highlight modules needing attention
- Suggest next actions for incomplete specifications
- Display most recent activity across all modules

# 6. Module Path References
- Show relative paths to each module for easy navigation
- Include module technical names and display names
- Reference .odoo-dev/config.json for module metadata
```

## Module-Aware Specification Management

This command provides insights into:
- **Cross-module dependencies** - Features that span multiple modules
- **Module development status** - Which modules are actively being developed
- **Resource allocation** - Where development effort is concentrated
- **Quality metrics** - Test coverage and bug fix ratios per module

## Integration with Odoo Development

- Works with multi-module Odoo projects
- Supports both custom and third-party modules
- Integrates with Odoo version detection
- Provides module dependency awareness

## Related Commands

- `/odoo-spec-status` - Detailed status of specific module or specification
- `/odoo-feature-create` - Create new feature specification
- `/odoo-bug-fix` - Create new bug fix workflow
- `/spec-execute` - Execute specification tasks