# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2025-07-20

### Fixed
- **ESM Compatibility Issue**: Fixed `ERR_REQUIRE_ESM` error when running `npx @pimzino/claude-code-spec-workflow`
  - Downgraded `chalk` from `^5.3.0` to `^4.1.2` (last CommonJS-compatible version)
  - Downgraded `inquirer` from `^9.2.12` to `^8.2.6` (last CommonJS-compatible version)
  - Downgraded `ora` from `^7.0.1` to `^5.4.1` (last CommonJS-compatible version)
  - Updated `@types/inquirer` to match inquirer version `^8.2.10`
  - This resolves the common installation error users were experiencing

### Added
- **Restart Notification**: Added prominent notifications in command generation scripts to inform users they need to restart Claude Code for new task commands to be visible
  - Updated both Windows (`generate-commands.bat`) and Unix (`generate-commands.sh`) scripts
  - Added restart instructions to workflow documentation and agent guidance
  - Ensures users know to restart Claude Code after task command generation

## [1.2.1] - 2025-07-19

### Fixed
- **Windows Script Parsing**: Fixed task parsing logic in Windows batch script
  - Replaced complex regex patterns with arithmetic validation for task IDs
  - Fixed parsing of hierarchical task numbering (1, 2.1, 2.2, etc.)
  - Removed Unicode emoji characters for clean, professional output
  - Ensured proper task detection using simplified string matching

## [1.2.0] - 2025-07-19

### Added
- **Platform-Specific Command Generation**: Replaced JavaScript-based script with platform-specific alternatives
  - Added `generate-commands.bat` for Windows systems with native batch scripting
  - Added `generate-commands.sh` for macOS and Linux systems with bash scripting
  - Added `generate-commands-launcher.sh` for automatic OS detection and script selection
  - Added comprehensive script documentation in `.claude/scripts/README.md`

### Changed
- **Cross-Platform Compatibility**: Eliminated Node.js dependency for command generation
  - Agents now use `./.claude/scripts/generate-commands-launcher.sh {spec-name}` instead of `node .claude/scripts/generate-commands.js {spec-name}`
  - Automatic OS detection ensures the correct script runs on each platform (Windows/macOS/Linux)
  - Maintains all existing functionality: task parsing, hierarchical numbering, command file generation
  - Updated all workflow documentation and command references

### Improved
- **Conflict Prevention**: Platform-specific scripts avoid potential JavaScript conflicts
  - No more Node.js version compatibility issues or runtime conflicts
  - Reduced dependency on external runtime environments
  - Better integration with native shell environments
  - Faster execution using native platform commands

### Deprecated
- **JavaScript Command Generation**: The `generate-commands.js` script is no longer created
  - Legacy function `getCommandGenerationScript()` now returns migration instructions
  - All documentation updated to reference new platform-specific approach
  - Clear deprecation warnings guide users to new system

### Fixed
- **Windows Script Parsing**: Fixed task parsing logic in Windows batch script
  - Replaced complex regex patterns with arithmetic validation for task IDs
  - Fixed parsing of hierarchical task numbering (1, 2.1, 2.2, etc.)
  - Removed Unicode emoji characters for clean, professional output
  - Ensured proper task detection using simplified string matching

### Technical Details
- **Setup Process**: Modified `createScripts()` to generate four files (Windows, Unix, launcher, documentation)
- **File Permissions**: Automatically sets execute permissions for shell scripts on Unix-like systems
- **Error Handling**: Graceful OS detection with clear error messages for unsupported platforms
- **Test Coverage**: Updated test suite to verify all platform-specific scripts are created correctly
- **Backward Compatibility**: Smooth transition with comprehensive migration documentation
- **Windows Compatibility**: Improved batch script reliability with simplified validation logic

## [1.1.2] - 2025-07-19

### Fixed
- **Workflow Sequence Clarity**: Clarified exact workflow sequence to prevent script execution at wrong times
  - Updated `/spec-create` to explicitly state "DO NOT run scripts during requirements phase"
  - Updated `/spec-tasks` to clearly indicate script should ONLY run after tasks approval
  - Added prominent workflow sequence documentation: Requirements → Design → Tasks → Generate Commands
  - Added explicit warnings against editing the command generation script

### Improved
- **Agent Instruction Clarity**: Eliminated confusion about when to run the command generation script
  - Removed premature script execution instructions from requirements phase
  - Added clear "DO NOT" statements to prevent early script execution
  - Specified exact timing: "ONLY after tasks are approved"
  - Added warnings against script modification attempts

### Documentation
- **Workflow Sequence**: Added clear step-by-step workflow sequence in CLAUDE.md
- **Script Usage Rules**: Added dedicated section explaining proper script usage
- **Timing Clarity**: Made it crystal clear that scripts run ONLY after tasks approval
- **Anti-Editing Warnings**: Added explicit instructions not to modify the generation script

### Technical Details
- Updated `src/commands.ts` with corrected workflow sequence for both `/spec-create` and `/spec-tasks`
- Enhanced `src/claude-md.ts` with prominent workflow sequence and script usage rules
- Removed confusing early script execution instructions from requirements phase
- Added multiple reinforcement points about proper script timing and usage

## [1.1.1] - 2025-07-19

### Fixed
- **Command Generation Instructions**: Made script execution mandatory and explicit in workflow commands
  - Updated `/spec-create` command with prominent "MUST EXECUTE" instructions for script execution
  - Updated `/spec-tasks` command with explicit "ACTION REQUIRED" language for script execution
  - Added clear warnings at the top of command instructions about script execution requirement
  - Enhanced CLAUDE.md documentation with explicit timing for when to run the script

### Improved
- **Agent Compliance**: Agents now receive clear, mandatory instructions to execute the command generation script
  - Changed passive language ("Run the script") to active mandatory language ("MUST EXECUTE")
  - Added prominent placement of script execution instructions at the top of commands
  - Specified exact timing: "immediately after requirements approval" and "immediately after tasks approval"
  - Multiple reinforcement points ensure agents understand the requirement

### Technical Details
- Updated `src/commands.ts` with explicit script execution instructions in `/spec-create` and `/spec-tasks`
- Enhanced `src/claude-md.ts` with clear workflow steps including mandatory script execution
- Added "REQUIRED after approval" sections with action-oriented language
- Maintained backward compatibility while improving agent instruction clarity

## [1.1.0] - 2025-07-19

### Added
- **Auto-Generated Task Commands**: Individual commands are now automatically created for each task in a spec
  - Commands like `/user-auth-task-1`, `/user-auth-task-2.1` are generated automatically
  - Each command calls `/spec-execute {task-id} {spec-name}` with proper parameters
  - Commands are organized in spec-specific folders: `.claude/commands/{spec-name}/`
- **Command Generation Script**: New script at `.claude/scripts/generate-commands.js`
  - Parses `tasks.md` files and creates individual task commands
  - Supports hierarchical task numbering (1, 2, 2.1, 2.2, etc.)
  - Called automatically during `/spec-create` and `/spec-tasks` workflows
- **Enhanced Directory Structure**: Added `.claude/scripts/` directory for automation scripts
- **Improved Workflow Commands**: Updated `/spec-create` and `/spec-tasks` to generate task commands

### Changed
- **Command Organization**: Commands are now organized with main workflow commands at root level and spec-specific commands in subfolders
- **CLI Output**: Added mention of auto-generated task commands in setup success message
- **Documentation**: Updated README.md, CLAUDE.md, and CLI help to explain new command structure
- **Directory Structure**: Extended setup to create `.claude/scripts/` directory

### Enhanced
- **User Experience**: Easier task execution with shorter, more intuitive command names
- **Auto-Completion**: Claude Code can now suggest spec-specific commands
- **Organization**: Better command organization with clear separation between main workflow and task-specific commands
- **Backward Compatibility**: All existing commands continue to work unchanged

### Technical Details
- Added `src/scripts.ts` with command generation functionality
- Updated `src/setup.ts` to create scripts directory and files
- Enhanced `src/commands.ts` with instructions for command generation
- Updated `src/claude-md.ts` with new command documentation
- Added comprehensive tests for new functionality
- All 18 tests pass including new script creation tests

## [1.0.4] - 2025-07-19

### Changed
- Removed all "Kiro" references from codebase and replaced with "spec-driven" terminology
- Updated package description to use "spec-driven workflow" instead of "Kiro-style"
- Removed "kiro" keyword from package.json keywords array
- Updated source code comments and documentation to use consistent "spec-driven" language

### Technical Details
- Updated TypeScript source files: `src/commands.ts`, `src/claude-md.ts`
- Updated documentation: `README.md`, `CHANGELOG.md`
- Updated configuration: `package.json`, `.npmignore`
- Rebuilt all compiled JavaScript files in `dist/` directory
- Preserved Kiro acknowledgment in README.md as requested
- All tests continue to pass (17/17)
- Maintained full backward compatibility and functionality

## [1.0.3] - 2025-07-18

### Fixed
- Removed problematic self-dependency that was causing npm installation failures
- Fixed "ENOENT: no such file or directory" error when running `npx @pimzino/claude-code-spec-workflow`
- Eliminated circular dependency on `pimzino-claude-code-spec-workflow-1.0.1.tgz` file

### Technical Details
- Removed erroneous self-reference from package.json dependencies
- Removed leftover tarball file from project root directory
- Added `*.tgz` to .gitignore to prevent future tarball commits
- Package now installs cleanly without looking for non-existent tarball files
- Resolves npm cache corruption warnings during installation

## [1.0.2] - 2025-07-18

### Fixed
- Improved current CLAUDE.md handling to avoid overwriting existing content

## [1.0.1] - 2025-07-18

### Fixed
- Fixed NPX execution issue by adding package name as binary entry
- NPX command `npx @pimzino/claude-code-spec-workflow` now works correctly
- Added `claude-code-spec-workflow` binary alongside existing `claude-spec-setup`

### Technical Details
- Updated package.json bin configuration to include both binary names
- Ensures compatibility with NPX's expected binary naming convention

## [1.0.0] - 2025-07-18

### Added
- Initial release of Claude Code Spec Workflow
- Automated spec-driven workflow for Claude Code
- Complete Requirements → Design → Tasks → Implementation process
- 7 slash commands for workflow automation:
  - `/spec-create` - Create new feature specifications
  - `/spec-requirements` - Generate requirements documents
  - `/spec-design` - Create technical design documents
  - `/spec-tasks` - Generate implementation task lists
  - `/spec-execute` - Execute specific tasks
  - `/spec-status` - Show workflow status
  - `/spec-list` - List all specifications
- Interactive CLI setup with progress indicators
- Project type auto-detection (Node.js, Python, Java, etc.)
- Claude Code installation validation
- Comprehensive document templates
- EARS format requirements generation
- Mermaid diagram support in design documents
- Test-driven development focus
- Requirement traceability throughout workflow
- Professional TypeScript implementation
- Complete test suite with 17 tests
- Zero-configuration setup
- Smart file management (preserves existing CLAUDE.md)
- Cross-platform support (Windows, macOS, Linux)

### Features
- **Zero Configuration**: Works out of the box with any project
- **Interactive Setup**: Beautiful CLI with ora spinners and inquirer prompts
- **Smart File Management**: Preserves existing content while adding workflow
- **Professional Quality**: TypeScript, comprehensive error handling, npm best practices
- **Comprehensive Documentation**: Auto-generated CLAUDE.md with complete workflow instructions

### Technical Details
- Node.js 16.0.0+ requirement
- TypeScript implementation targeting ES2020
- Jest testing framework with ts-jest
- ESLint and Prettier for code quality
- Commander.js for CLI framework
- Inquirer for interactive prompts
- Ora for elegant terminal spinners
- Chalk for terminal styling

### Package Structure
```
.claude/
├── commands/           # 7 slash commands for spec workflow
├── templates/          # Document templates
├── specs/             # Generated spec files
└── spec-config.json   # Configuration
```

### Installation Options
- NPX (recommended): `npx @pimzino/claude-code-spec-workflow`
- Global: `npm install -g @pimzino/claude-code-spec-workflow`
- Local: `npm install --save-dev @pimzino/claude-code-spec-workflow`

### Documentation
- Comprehensive README with examples
- Built-in test command
- Troubleshooting guide
- CI/CD integration examples
- Professional MIT license
