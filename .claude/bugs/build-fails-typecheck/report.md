# Bug Report: Build Fails TypeScript Type Checking

## Bug Summary
The project build fails during TypeScript type checking with 73 errors in `src/dashboard/parser.ts`. All errors are related to strict null checking - objects and variables that are possibly undefined or null are not being properly handled.

## Severity
**High** - Build-blocking issue that prevents successful compilation and deployment

## Reproduction Steps
1. Clone the repository and install dependencies with `npm install` or `pnpm install`
2. Run `npm run typecheck` or `pnpm run typecheck`
3. Observe TypeScript compilation errors in the terminal output
4. The typecheck:frontend script fails with 73 errors

## Expected Behavior
- The typecheck command should pass without errors
- All TypeScript code should properly handle nullable types
- The build process should complete successfully
- Type safety should be maintained throughout the codebase

## Actual Behavior
- Running `npm run typecheck` results in 73 TypeScript errors
- All errors are in `src/dashboard/parser.ts`
- Error types include:
  - `TS2532: Object is possibly 'undefined'` (most common)
  - `TS18048: '<variable>' is possibly 'undefined'`
  - `TS2322: Type 'string | undefined' is not assignable to type 'string'`
  - `TS2345: Argument of type 'Task | null' is not assignable to parameter of type 'Task'`
  - `TS2412: Type 'string | undefined' is not assignable with 'exactOptionalPropertyTypes: true'`

## Impact
- **Build Failure**: Cannot build the project for production deployment
- **CI/CD Pipeline**: Automated builds and deployments will fail
- **Developer Experience**: Developers cannot verify type safety of their changes
- **Code Quality**: TypeScript's type safety benefits are not being enforced

## Technical Details

### Error Distribution
- Lines 271-275: Multiple `Object is possibly 'undefined'` errors
- Lines 312-313: Object undefined errors
- Line 342: Type assignment error with undefined
- Lines 579-624: Multiple undefined checks in task parsing logic
- Lines 748-887: Extensive undefined checks in line parsing
- Lines 938-1342: Various undefined checks in category and structure parsing

### Sample Errors
```
src/dashboard/parser.ts(271,27): error TS2532: Object is possibly 'undefined'.
src/dashboard/parser.ts(342,11): error TS2412: Type 'string | undefined' is not assignable to type 'string'
src/dashboard/parser.ts(598,32): error TS2345: Argument of type 'Task | null' is not assignable to parameter of type 'Task'.
src/dashboard/parser.ts(579,23): error TS18048: 'indent' is possibly 'undefined'.
```

### Root Cause Areas
1. **Array access without bounds checking** - Accessing array elements without verifying the index exists
2. **Missing null/undefined guards** - Not checking if objects exist before accessing properties
3. **Type assertions needed** - TypeScript cannot infer that certain values are defined after conditional checks
4. **Strict configuration** - The frontend tsconfig has strict null checks enabled

## Environment
- Project: claude-code-spec-workflow-2
- TypeScript version: 5.7.2 (from package.json)
- Node version: >=16.0.0 required
- Scripts affected: `typecheck`, `typecheck:frontend`, `build:dashboard`
- File: `src/dashboard/parser.ts`

## Additional Context
- The backend typecheck (`typecheck:backend`) passes successfully
- Only the frontend typecheck (`typecheck:frontend`) fails
- The frontend uses a separate tsconfig at `src/dashboard/client/tsconfig.json`
- This likely has stricter settings than the root tsconfig
- The errors suggest the code was written without strict null checking initially enabled

## Proposed Solution
1. **Add proper null/undefined checks** throughout parser.ts
2. **Use optional chaining** (`?.`) where appropriate
3. **Add type guards** to narrow types after conditional checks
4. **Use non-null assertions** (`!`) only where values are guaranteed to exist
5. **Consider nullish coalescing** (`??`) for default values
6. **Review tsconfig settings** to ensure consistency between frontend and backend

## Priority
This is a **critical** bug as it blocks the build process and prevents deployment.

---
*Bug reported: 2025-08-13*