# odoo-bug-verify - Verify Odoo Module Bug Fix

Verify and validate that an Odoo module bug fix is working correctly with comprehensive ERP integration testing.

## Usage

```
/odoo-bug-verify [module-bug-name]
```

**Examples:**
```
/odoo-bug-verify inventory-negative-stock
/odoo-bug-verify sale-discount-calculation  
/odoo-bug-verify hr-attendance-timeout
```

## What This Command Does

This command performs comprehensive verification of Odoo module bug fixes, including module integration testing, business process validation, and ERP-specific regression testing.

## Instructions

Use the @odoo-spec-task-executor agent to verify Odoo module bug fixes:

```

Perform comprehensive Odoo module bug fix verification with ERP integration testing:

# 1. Prerequisites and Context Loading
Load complete verification context:

## Bug Context
- Load existing bug documentation from [module-path]/.spec/bugs/[bug-name]/
  * report.md: Original bug report and symptoms
  * analysis.md: Root cause analysis and solution plan
  * fix.md: Implementation details and changes made

## Module Context  
- Load target module configuration and dependencies
- Load module manifest (__manifest__.py) for version compatibility
- Understand module's integration points and dependencies

## Odoo Project Context
- Load .odoo-dev/steering/ documents for standards compliance
- Load module development standards and testing guidelines
- Understand business process integration requirements

# 2. Odoo-Specific Verification Framework

## Module Integration Verification
Comprehensive ERP integration testing:

### Model Integration Testing
- **Database Consistency**: Verify schema changes are applied correctly
- **ORM Functionality**: Test model methods and computed fields
- **Inheritance Chains**: Validate _inherit and _inherits relationships work correctly
- **Constraint Validation**: Check database constraints and Python constraints
- **Record Rules**: Verify security rules function correctly

### View Integration Testing
- **Template Rendering**: Confirm views render without errors
- **JavaScript Integration**: Test client-side functionality
- **Widget Behavior**: Validate custom widgets and form elements
- **Access Control**: Verify view-level security restrictions

### Business Logic Verification
- **Workflow Integration**: Test state transitions and approvals
- **Compute Methods**: Validate field calculations and dependencies
- **Onchange Methods**: Test real-time field updates
- **Action Methods**: Verify button actions and server actions

## ERP Process Integration Testing

### Multi-Module Integration
Test interaction with dependent modules:
- **Data Flow**: Verify data flows correctly between modules
- **API Integration**: Test internal API calls and web controllers
- **Event Handling**: Validate signal/event handling between modules
- **Transaction Integrity**: Ensure transaction boundaries are respected

### Business Process Validation
Test end-to-end business processes:
- **User Workflows**: Test complete user interaction scenarios  
- **Automated Processes**: Validate scheduled actions and cron jobs
- **Reporting Integration**: Verify report generation and data accuracy
- **External Integration**: Test third-party system integration

### Multi-Tenancy Testing
Odoo-specific multi-company validation:
- **Company Isolation**: Verify data isolation between companies
- **Security Context**: Test company-specific access rules
- **Localization**: Validate currency and language handling
- **Configuration**: Test company-specific settings

# 3. Regression Testing Strategy

## Module Regression Testing
Prevent regression in existing functionality:
- **Existing Features**: Test all module features still work
- **Performance Impact**: Measure performance before/after fix
- **Memory Usage**: Check for memory leaks or excessive usage
- **Database Impact**: Validate query performance and indexing

## Integration Regression Testing
Ensure other modules still function:
- **Dependent Modules**: Test modules that depend on this module
- **Core Integration**: Verify core Odoo functionality unaffected
- **Third-party Modules**: Test community/enterprise module compatibility

# 4. Test Execution and Documentation

## Test Case Execution
Execute comprehensive test scenarios:

### Automated Testing
- **Unit Tests**: Run pytest-odoo unit tests for the module
- **Integration Tests**: Execute inter-module integration tests
- **Performance Tests**: Run load testing scenarios
- **Regression Tests**: Execute existing test suites

### Manual Testing
- **User Acceptance**: Test from end-user perspective
- **Edge Cases**: Test boundary conditions and error scenarios
- **Browser Testing**: Test in different browsers if web-related
- **Mobile Testing**: Test responsive design if applicable

## Verification Documentation
Create comprehensive verification report in [module-path]/.spec/bugs/[bug-name]/verification.md:

```
# Odoo Module Bug Verification: [bug-name]

## Verification Overview
- **Bug**: [bug-name]
- **Module**: [module-name]
- **Fix Version**: [version]
- **Verification Date**: [date]
- **Verifier**: [name]
- **Status**: [Verified/Failed/Partial]

## Test Environment
- **Odoo Version**: [version]
- **Environment**: [Local/Staging/Production-like]
- **Database**: [database details]
- **Test Data**: [test data description]

## Fix Validation

### Original Issue Verification
**Original Symptoms**: [list original symptoms]
**Resolution Status**: 
- ✅ Symptom 1: [resolved/verified]
- ✅ Symptom 2: [resolved/verified]
- ✅ Symptom 3: [resolved/verified]

**Root Cause Resolution**: [confirm root cause addressed]

### Implementation Verification
**Code Changes Review**:
- Files modified: [list of modified files]
- Code quality: [assessment]
- Standards compliance: [Odoo coding standards check]
- Security implications: [security review]

## Comprehensive Testing Results

### Module Integration Tests
**Model Testing**:
- ✅ Database schema: [validation results]
- ✅ Model methods: [test results] 
- ✅ Inheritance chains: [validation results]
- ✅ Constraints: [test results]

**View Testing**:
- ✅ Form views: [rendering test results]
- ✅ List views: [functionality test results]
- ✅ Search views: [filter test results]
- ✅ Action views: [button test results]

### Business Process Tests
**End-to-End Workflows**:
1. **Workflow 1**: [test scenario and results]
2. **Workflow 2**: [test scenario and results]
3. **Workflow 3**: [test scenario and results]

**Integration Points**:
- ✅ Module A Integration: [test results]
- ✅ Module B Integration: [test results]
- ✅ Core Odoo Integration: [test results]

### Performance Validation
**Performance Metrics**:
- Response time: [before vs after]
- Database queries: [query count and efficiency]
- Memory usage: [memory impact assessment]
- Concurrent users: [load testing results]

### Multi-Company Testing
**Multi-Tenancy Validation**:
- ✅ Company isolation: [test results]
- ✅ Access rules: [security test results]
- ✅ Data consistency: [data integrity results]

## Regression Testing Results

### Existing Functionality
**Module Features**:
- ✅ Feature 1: [still working correctly]
- ✅ Feature 2: [still working correctly]
- ✅ Feature 3: [still working correctly]

**Dependent Modules**:
- ✅ Dependent Module 1: [test results]
- ✅ Dependent Module 2: [test results]

### User Experience Validation
**User Testing Results**:
- User role 1: [testing feedback]
- User role 2: [testing feedback]
- Overall UX impact: [assessment]

## Edge Case Testing
**Boundary Conditions**:
- Maximum values: [test results]
- Minimum values: [test results]
- Empty/null data: [test results]
- Invalid inputs: [error handling results]

**Error Scenarios**:
- Network failures: [error handling]
- Database failures: [recovery testing]
- Integration failures: [fallback behavior]

## Deployment Verification
**Production Readiness**:
- ✅ Migration scripts: [tested successfully]
- ✅ Data integrity: [validated]
- ✅ Rollback plan: [prepared and tested]
- ✅ Monitoring setup: [configured]

## Final Assessment

### Verification Status
**Overall Result**: [PASS/FAIL/CONDITIONAL PASS]

**Pass Criteria Met**:
- ✅ Original issue resolved completely
- ✅ No new bugs introduced
- ✅ Performance acceptable
- ✅ Integration intact
- ✅ User acceptance achieved

### Risk Assessment
**Remaining Risks**: [list any remaining concerns]
**Mitigation Strategies**: [how risks are addressed]
**Monitoring Plan**: [post-deployment monitoring]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2] 
3. [Recommendation 3]

### Sign-off
**Technical Verification**: [Approved/Conditional/Rejected]
**Business Verification**: [Approved/Conditional/Rejected]
**Ready for Deployment**: [Yes/No/With Conditions]

**Next Steps**:
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

# 5. Odoo-Specific Verification Criteria

## Technical Criteria
- **Code Quality**: Follows Odoo coding standards
- **Security**: No security vulnerabilities introduced
- **Performance**: No significant performance degradation
- **Compatibility**: Works with target Odoo version
- **Integration**: All module dependencies function correctly

## Business Criteria
- **Process Integrity**: Business workflows remain intact
- **Data Accuracy**: No data corruption or loss
- **User Experience**: Acceptable to end users
- **Compliance**: Meets regulatory requirements (if applicable)
- **Scalability**: Handles expected load and growth

## Deployment Criteria
- **Rollback Capability**: Can be safely reverted if needed
- **Migration Safety**: Database migrations are reversible
- **Documentation**: Adequate documentation for operators
- **Monitoring**: Sufficient monitoring and alerting in place

# 6. Verification Decision Matrix

## PASS Conditions
All of the following must be true:
- ✅ Original bug symptoms completely resolved
- ✅ No new bugs or regressions introduced
- ✅ Performance impact within acceptable limits
- ✅ All integration tests pass
- ✅ Business process validation successful
- ✅ User acceptance criteria met

## CONDITIONAL PASS
Fix works but has minor issues:
- ⚠️ Minor performance impact (document and monitor)
- ⚠️ Minor UX changes (document and train users)
- ⚠️ Additional monitoring required

## FAIL Conditions
Any of the following conditions:
- ❌ Original bug symptoms persist
- ❌ New critical bugs introduced
- ❌ Significant performance degradation
- ❌ Integration failures with other modules
- ❌ User acceptance rejected
- ❌ Security vulnerabilities introduced

# 7. Post-Verification Actions

## For PASS Status
1. Mark bug as resolved in tracking system
2. Update module documentation
3. Deploy to production with monitoring
4. Archive verification artifacts
5. Update team knowledge base

## For CONDITIONAL PASS  
1. Document conditions and monitoring requirements
2. Create follow-up tasks for minor issues
3. Deploy with enhanced monitoring
4. Schedule follow-up review

## For FAIL Status
1. Return to analysis or fix phase
2. Document specific failure reasons
3. Update bug status and priority
4. Plan remediation approach
```

## Critical Verification Rules

- **Comprehensive Testing**: Test all affected functionality, not just the bug
- **Integration Focus**: Always test module interactions and dependencies
- **Business Process Validation**: Confirm end-to-end workflows function correctly
- **Performance Monitoring**: Measure and validate performance impact
- **User Acceptance**: Include actual user testing when possible

## Integration with Odoo Development Workflow

This command provides enhanced verification over generic `/bug-verify` by including:

- **Module Dependency Testing** - Comprehensive inter-module validation
- **ERP Process Validation** - Business workflow integrity testing
- **Multi-tenancy Testing** - Company isolation and security verification
- **Odoo Framework Testing** - ORM, views, and framework integration
- **Upgrade Compatibility** - Future version migration considerations

## Related Commands

- `/odoo-bug-create` - Create new Odoo module bug reports
- `/odoo-bug-analyze` - Analyze Odoo module bug root causes  
- `/odoo-bug-fix` - Implement Odoo module bug fixes
- `/odoo-bug-status` - Check Odoo module bug status

## Next Phase

After successful verification, the bug is marked as resolved and the workflow is complete. Failed verification returns to the appropriate previous phase for remediation.