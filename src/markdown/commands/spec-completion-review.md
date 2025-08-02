# Spec Completion Review Command

Perform comprehensive end-to-end review when all tasks in a spec are complete.

## Usage
```
/spec-completion-review {feature-name}
```

## Phase Overview
**Your Role**: Comprehensive feature validation and final approval

This command is used when all tasks in a specification are marked complete. Your goal is to ensure the entire feature is production-ready and meets all requirements before final approval.

## Instructions

**Agent-Based Review (Recommended)**: First check if agents are enabled:

```bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
```

If this returns `true`, use the `spec-completion-reviewer` agent for comprehensive validation:

```
Use the spec-completion-reviewer agent to perform final review of the {feature-name} specification.

The agent should:
1. Load all specification documents from .claude/specs/{feature-name}/
2. Load steering documents from .claude/steering/ (if available)
3. Perform comprehensive end-to-end validation
4. Analyze git history for the entire feature implementation
5. Validate requirements fulfillment and design compliance
6. Assess production readiness and provide final approval

Context files for review (load using get-content script):
- .claude/specs/{feature-name}/requirements.md
- .claude/specs/{feature-name}/design.md
- .claude/specs/{feature-name}/tasks.md
- All git commits related to the feature
- Steering documents for context
```

**Manual Review (Fallback)**: If agents are not enabled, follow this process:

1. **Load Complete Context**
   - Read all specification documents from `.claude/specs/{feature-name}/`
   - Review all completed tasks in tasks.md
   - Load steering documents for project context

2. **Requirements Validation**
   - Verify ALL user stories are fully implemented
   - Check every acceptance criterion is satisfied
   - Confirm edge cases and error scenarios are handled

3. **Design Implementation Verification**
   - Ensure implementation follows specified architecture
   - Validate all designed components work together
   - Check API contracts match specifications

4. **Code Quality Assessment**
   - Review overall code quality and consistency
   - Verify proper error handling throughout
   - Check performance and security considerations

5. **Integration Validation**
   - Test complete feature workflows end-to-end
   - Verify integration with existing systems
   - Ensure no breaking changes introduced

6. **Git History Review**
   - Analyze all commits for the feature
   - Verify clean commit history
   - Check for proper commit messages

## Approval Criteria
- All requirements fully satisfied
- Design properly implemented
- Code quality meets standards
- Integration working correctly
- Tests passing and adequate coverage
- Documentation complete
- Ready for production deployment

## Final Outcomes
- **APPROVED**: Feature ready for production
- **NEEDS_FIXES**: Minor issues to address
- **MAJOR_ISSUES**: Significant problems requiring rework

## Next Steps
After completion review:
- Address any identified issues
- Prepare for production deployment
- Update documentation if needed
- Consider creating PR/merge request

## Post-Completion Analysis (if agents enabled)

After approval, consider running these additional agents:

### Documentation Generation
First check if agents are available:
```bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
```

If this returns `true`, use the `spec-documentation-generator` agent:

```
Use the spec-documentation-generator agent to generate documentation for the completed {feature-name} specification.

The agent should:
1. Analyze implemented code and APIs
2. Generate API documentation with examples
3. Create user guides and feature documentation
4. Generate changelog entries from git history
5. Suggest README updates for the new feature

This ensures comprehensive documentation for the completed feature.
```

### Performance Analysis
First check if agents are available:
```bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
```

If this returns `true`, use the `spec-performance-analyzer` agent:

```
Use the spec-performance-analyzer agent to analyze performance implications of the {feature-name} implementation.

The agent should:
1. Analyze algorithmic complexity
2. Identify potential bottlenecks
3. Suggest optimization opportunities
4. Check for common performance anti-patterns
5. Recommend performance testing strategies

This helps ensure the feature performs well at scale.
```

### Breaking Change Detection
First check if agents are available:
```bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
```

If this returns `true`, use the `spec-breaking-change-detector` agent:

```
Use the spec-breaking-change-detector agent to detect any breaking changes in the {feature-name} implementation.

The agent should:
1. Analyze API changes and modifications
2. Detect behavioral changes
3. Assess impact on consumers
4. Suggest compatibility strategies
5. Recommend migration paths if needed

This ensures backward compatibility is maintained.
```

### Steering Document Updates
First check if agents are available:
```bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
```

If this returns `true`, use the `steering-document-updater` agent:

```
Use the steering-document-updater agent to analyze if steering documents need updates based on the {feature-name} implementation.

The agent should:
1. Analyze new patterns introduced
2. Check for technology stack changes
3. Identify new conventions established
4. Suggest updates to product.md, tech.md, or structure.md
5. Highlight deprecated patterns to document

This keeps project documentation aligned with implementation reality.
```