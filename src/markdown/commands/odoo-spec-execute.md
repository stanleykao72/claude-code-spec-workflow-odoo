# odoo-spec-execute - Execute Odoo Module Specification Tasks

Execute specific tasks within Odoo module specifications, providing module-aware context and execution.

## Usage

```
/odoo-spec-execute <task-id> <spec-name> [module-name]
```

**Parameters:**
- `task-id`: Task number to execute (e.g., 1, 2, 3)
- `spec-name`: Name of the specification (feature, bug fix, or test)
- `module-name` (optional): Specific module name if spec name is ambiguous

**Examples:**
```
/odoo-spec-execute 1 inventory-tracking
/odoo-spec-execute 2 inventory-tracking inventory_custom
/odoo-spec-execute 3 stock-enhancement warehouse_mgmt
```

## What This Command Does

This command executes specific tasks within Odoo module specifications, providing full module context including dependencies, inheritance chains, and Odoo-specific development patterns.

## Instructions

Use the @odoo-spec-task-executor agent to execute Odoo module specification tasks:

```

Execute Odoo module specification task with complete module context:

# 1. Module and Specification Discovery
- Locate the specification within the module's .spec/ directory structure
- Determine spec type (features/, bugs/, testing/)
- Validate task ID exists in tasks.md file
- Load module configuration and metadata

# 2. Comprehensive Context Loading
Load complete development context for the task:

## Module Context (.odoo-dev/config.json)
- Module technical name and path
- Odoo version compatibility
- Module dependencies and relationships
- Development environment settings

## Steering Documents (.odoo-dev/steering/)
- business-rules.md: ERP business logic and workflow standards
- technical-stack.md: Odoo technical guidelines and patterns
- module-standards.md: Custom module development standards

## Specification Context ([module-path]/.spec/)
- For Features: request.md + requirements.md + design.md + tasks.md
- For Bugs: report.md + analysis.md + fix.md + verification.md
- For Tests: testing-plan.md + test-cases.md + test-implementation.md

## Task-Specific Context
- Extract specific task details from tasks.md
- Load task dependencies and prerequisites
- Identify task-specific requirements and acceptance criteria

# 3. Odoo Development Context
Provide Odoo-specific development context:

## Module Architecture Analysis
- Existing model inheritance chains
- View hierarchy and customizations
- Security rules and access controls
- Data files and demo data

## Integration Points
- Dependencies on other modules
- Integration with Odoo core modules
- Third-party module interactions
- Database schema impact

## Development Patterns
- Follow Odoo coding conventions (PEP 8, Odoo guidelines)
- Apply appropriate inheritance patterns (_inherit vs _inherits)
- Use Odoo ORM best practices
- Implement proper security and access controls

# 4. Task Execution with Module Awareness
Execute the task with full module context:

## Code Implementation
- Follow module's existing code structure and patterns
- Implement using appropriate Odoo frameworks (models, views, controllers)
- Ensure compatibility with module's Odoo version
- Apply module-specific naming conventions

## File Management
- Create/modify files within the module directory
- Follow module's directory structure conventions
- Update __init__.py and __manifest__.py as needed
- Maintain proper file organization

## Quality Assurance
- Follow module's coding standards
- Implement appropriate error handling
- Add necessary logging and debugging
- Include security considerations

## Testing Integration
- Create or update relevant tests
- Follow pytest-odoo conventions if applicable
- Ensure tests fit module's testing strategy
- Validate against module's quality standards

# 5. Task Completion and Documentation
## Progress Updates
- Mark task as completed in tasks.md
- Update implementation status and notes
- Document any issues or decisions made
- Note any dependencies or follow-up tasks

## Next Steps Guidance
- Identify next task in the specification
- Highlight any blockers or dependencies
- Suggest testing or verification steps
- Recommend integration testing if applicable

# 6. Module Integration Validation
Before marking complete, validate:
- Module loads without errors
- No conflicts with existing functionality
- Proper integration with dependent modules
- Follows module's upgrade path compatibility

# 7. Output Format
Provide comprehensive execution report:

```
🚀 TASK EXECUTION: [module-name]/[spec-name] - Task [task-id]

📋 Task Details:
   • Task: [task description from tasks.md]
   • Module: [module-name] (Odoo [version])
   • Specification: [spec-name] ([spec-type])
   • Dependencies: [list of dependent tasks/modules]

⚙️ Execution Summary:
   ✅ Files Modified:
      • [list of modified files with brief description]
   ✅ New Files Created:
      • [list of new files with purpose]
   ✅ Database Changes:
      • [any schema changes or data updates]

🔗 Integration Status:
   • Module Dependencies: [status]
   • Core Odoo Integration: [status]
   • Security Implementation: [status]
   • Test Coverage: [status]

📊 Progress Update:
   • Current Task: ✅ Completed
   • Next Task: [next task number and description]
   • Overall Progress: [X/Y] tasks complete

🎯 Next Recommended Actions:
   1. [Specific next command to run]
   2. [Testing or verification steps]
   3. [Integration or deployment considerations]

💡 Notes:
   • [Any important implementation notes]
   • [Decisions made during implementation]
   • [Known limitations or future considerations]
```
```

## Module-Aware Task Execution

This command provides superior context compared to generic `/spec-execute` by including:

- **Module Dependencies**: Understanding of related modules and their interactions
- **Odoo Version Context**: Version-specific API usage and compatibility
- **Inheritance Awareness**: Proper use of Odoo's inheritance mechanisms
- **Security Integration**: Automatic application of module security patterns
- **Testing Framework**: Integration with pytest-odoo and module testing standards

## Error Handling and Recovery

- **Missing Files**: Automatically creates required module structure files
- **Dependency Issues**: Identifies and suggests resolution for module dependencies
- **Version Conflicts**: Warns about Odoo version compatibility issues
- **Integration Problems**: Detects conflicts with existing module functionality

## Integration with Odoo Development Workflow

- Works seamlessly with Odoo development environments
- Supports local, Docker, and Odoo.sh deployment scenarios
- Integrates with module upgrade and migration processes
- Maintains compatibility with Odoo module lifecycle

## Related Commands

- `/odoo-spec-list` - List all module specifications
- `/odoo-spec-status` - Check specification status
- `/odoo-feature-create` - Create new feature specifications
- `/odoo-bug-fix` - Create bug fix workflows
- `/spec-execute` - Generic specification execution (use this for module-specific work)