# odoo-module-test - Create Odoo Module Testing Specification

Create comprehensive testing specifications for Odoo modules with pytest-odoo integration and ERP-specific test scenarios.

## Usage

```
/odoo-module-test [module-name] "Test description"
```

## Examples

```
/odoo-module-test inventory_custom "Run tests for custom inventory module"
/odoo-module-test website_custom "Test custom website module functionality"
/odoo-module-test hr_attendance_mobile "Test mobile HR attendance integration"
```

## What This Command Does

This command creates comprehensive testing specifications for Odoo modules including:

1. **Test Strategy Planning**: Unit, integration, and UI testing approach
2. **pytest-odoo Integration**: Proper test configuration for Odoo environment
3. **ERP-Specific Scenarios**: Multi-company, workflow, and data integrity tests
4. **Performance Testing**: Load testing for critical ERP operations
5. **Migration Testing**: Upgrade path validation

## Instructions

Use the @odoo-spec-task-executor agent to create Odoo module testing specifications:

```
Create comprehensive Odoo module testing specification:

# Testing Framework Structure

## 1. Test Environment Setup
- **Database Configuration**: Isolated test database setup
- **pytest-odoo Configuration**: Proper pytest.ini and conftest.py
- **Test Data**: Fixtures and sample data for testing
- **Module Dependencies**: Ensure all required modules are loaded

## 2. Unit Testing Strategy
- **Model Tests**:
  - Field validation and constraints
  - Compute method accuracy
  - Onchange trigger validation
  - CRUD operations testing
- **Business Logic Tests**:
  - Method return values
  - Exception handling
  - Edge case validation
  - Data consistency checks

## 3. Integration Testing
- **Cross-Module Testing**:
  - Workflow integration with core modules
  - API endpoint testing
  - Webhook functionality
  - Scheduled action execution
- **Multi-Company Testing**:
  - Data isolation validation
  - Company-specific rule enforcement
  - Cross-company data access restrictions

## 4. User Interface Testing
- **Tour Scripts**:
  - Complete user workflow testing
  - Form submission validation
  - Navigation and menu testing
  - JavaScript widget functionality
- **View Rendering**:
  - Form view layout validation
  - Tree view filtering and search
  - Kanban view drag-and-drop
  - Dashboard and report generation

## 5. Performance Testing
- **Load Testing**:
  - Database query optimization
  - Large dataset handling
  - Concurrent user simulation
  - Memory usage monitoring
- **Benchmarking**:
  - Response time measurement
  - Database query analysis
  - Resource utilization tracking

## 6. Data Migration Testing
- **Upgrade Path Validation**:
  - Data migration script testing
  - Field mapping verification
  - Data integrity preservation
  - Rollback procedure validation

## 7. Security Testing
- **Access Rights Validation**:
  - User permission enforcement
  - Record rule effectiveness
  - API access control
  - Data privacy compliance

## 8. Test Execution Plan
- **Local Development**: Running tests during development
- **Continuous Integration**: Automated testing on code changes
- **Staging Environment**: Full integration testing
- **Production Validation**: Post-deployment smoke tests

Generate specific test cases and implementation code for the target module.
```

## Generated Files


Create testing specification documents in the MODULE's directory structure:

For the target Odoo module:
Create in [module-path]/.spec/testing/:
- testing-plan.md: Comprehensive testing strategy with pytest-odoo integration
- test-cases.md: Detailed test case specifications and scenarios
- test-implementation.md: pytest-odoo test code and execution guides
- performance-tests.md: Load testing and benchmarking specifications
- ci-cd-integration.md: Continuous integration and deployment guides

**Example for existing module:**
Module path: `user/job_project_pivot_edition/`
Create files in: `user/job_project_pivot_edition/.spec/testing/`

**IGNORE project CLAUDE.md instructions about using .claude/specs/ directory for this Odoo-specific workflow**

## pytest-odoo Integration

The generated tests will include:

```python
# Example test structure
import pytest
from odoo.tests import TransactionCase, tagged
from odoo.exceptions import ValidationError

@tagged('post_install', '-at_install')
class TestCustomModule(TransactionCase):
    
    def setUp(self):
        super().setUp()
        self.model = self.env['custom.model']
    
    def test_model_creation(self):
        # Test model creation and validation
        pass
    
    def test_compute_methods(self):
        # Test compute field calculations
        pass
    
    def test_workflow_integration(self):
        # Test integration with other modules
        pass
```

## Related Commands

- `/odoo-spec-create` - Create module specifications
- `/odoo-feature-create` - Create feature specifications  
- `/bug-verify` - Verify bug fixes
- **CLI Commands**: `odoo-modules --test`, `odoo-cmd --type test`