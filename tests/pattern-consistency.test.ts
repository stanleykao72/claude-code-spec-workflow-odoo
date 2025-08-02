/**
 * Pattern Consistency Tests
 * 
 * Automated tests to ensure all commands and agents follow consistent patterns:
 * 1. Agent calls must have using-agents checks
 * 2. File references must use helper scripts (get-content, get-tasks)
 * 3. Template references must use get-content scripts
 * 4. Cross-platform examples should be provided
 */

import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

describe('Pattern Consistency', () => {
  const commandsDir = path.join(__dirname, '..', 'src', 'markdown', 'commands');
  const agentsDir = path.join(__dirname, '..', 'src', 'markdown', 'agents');

  const getMarkdownFiles = (dir: string): string[] => {
    try {
      return readdirSync(dir)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(dir, file));
    } catch {
      return [];
    }
  };

  const readFileContent = (filePath: string): { content: string; lines: string[] } => {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    return { content, lines };
  };

  describe('Agent Call Patterns', () => {
    const commandFiles = getMarkdownFiles(commandsDir);
    const agentFiles = getMarkdownFiles(agentsDir);

    // Pattern to detect agent calls
    const agentCallPattern = /Use the `?([^`\s]+)`? agent/gi;
    const usingAgentsCheckPattern = /npx @pimzino\/claude-code-spec-workflow@latest using-agents/gi;

    const testAgentCallPatterns = (files: string[], fileType: string) => {
      files.forEach(filePath => {
        it(`${path.basename(filePath)} (${fileType}) should have using-agents checks before agent calls`, () => {
          const { content, lines } = readFileContent(filePath);
          const agentCalls: { line: number; agent: string; context: string }[] = [];
          
          // Find all agent calls
          lines.forEach((line, index) => {
            const matches = [...line.matchAll(agentCallPattern)];
            matches.forEach(match => {
              if (match[1]) {
                agentCalls.push({
                  line: index + 1,
                  agent: match[1],
                  context: line.trim()
                });
              }
            });
          });

          // For each agent call, check if there's a using-agents check before it
          agentCalls.forEach(call => {
            // Look for using-agents check in the 20 lines before the agent call
            const contextStart = Math.max(0, call.line - 20);
            const contextEnd = call.line;
            const contextLines = lines.slice(contextStart, contextEnd);
            const contextText = contextLines.join('\n');

            const hasUsingAgentsCheck = usingAgentsCheckPattern.test(contextText);
            const hasConditionalLanguage = /first check if agents|if this returns.*true/gi.test(contextText);

            // Allow exceptions for agents that are obviously conditional or documentation
            const isDocumentationContext = /\*\*Agent-Based|## Agent Dependencies|### Agent/gi.test(contextText);
            const isExceptionCase = isDocumentationContext;

            if (!isExceptionCase) {
              if (!hasUsingAgentsCheck) {
                throw new Error(
                  `Agent call "${call.agent}" at line ${call.line} in ${path.basename(filePath)} should have a using-agents check within 20 lines before it.\n` +
                  `Context: ${call.context}\n` +
                  `Consider adding: "First check if agents are available: npx @pimzino/claude-code-spec-workflow@latest using-agents"`
                );
              }

              if (!hasConditionalLanguage) {
                throw new Error(
                  `Agent call "${call.agent}" at line ${call.line} in ${path.basename(filePath)} should have conditional language like "First check if agents" or "If this returns true".\n` +
                  `Context: ${call.context}`
                );
              }
            }
          });
        });
      });
    };

    testAgentCallPatterns(commandFiles, 'command');
    testAgentCallPatterns(agentFiles, 'agent');
  });

  describe('File Reference Patterns', () => {
    const commandFiles = getMarkdownFiles(commandsDir);
    const agentFiles = getMarkdownFiles(agentsDir);

    // Patterns to detect hardcoded file references
    const hardcodedPathPatterns = [
      /\.claude\/specs\/[^`\s)]+\.md/gi,
      /\.claude\/templates\/[^`\s)]+\.md/gi,
      /\.claude\/steering\/[^`\s)]+\.md/gi,
      /\.claude\/bugs\/[^`\s)]+\.md/gi
    ];

    const getContentPattern = () => /npx @pimzino\/claude-code-spec-workflow@latest get-content/gi;

    const testFileReferencePatterns = (files: string[], fileType: string) => {
      files.forEach(filePath => {
        it(`${path.basename(filePath)} (${fileType}) should use get-content script for file references`, () => {
          const { content, lines } = readFileContent(filePath);
          const violations: { line: number; match: string; context: string }[] = [];

          lines.forEach((line, index) => {
            hardcodedPathPatterns.forEach(pattern => {
              const matches = [...line.matchAll(pattern)];
              matches.forEach(match => {
                // Allow exceptions for documentation or templates themselves
                const isDocumentationReference = /\*\*Template to Follow|Read and follow|Follow exact structure/gi.test(line);
                const isInCodeBlock = /```/.test(line);
                const isInGetContentLine = /get-content/gi.test(line);
                
                if (!isDocumentationReference && !isInCodeBlock && !isInGetContentLine) {
                  violations.push({
                    line: index + 1,
                    match: match[0],
                    context: line.trim()
                  });
                }
              });
            });
          });

          violations.forEach(violation => {
            // Check if there's a get-content usage nearby (within 10 lines)
            const contextStart = Math.max(0, violation.line - 10);
            const contextEnd = Math.min(lines.length, violation.line + 10);
            const contextLines = lines.slice(contextStart, contextEnd);
            const contextText = contextLines.join('\n');

            const hasGetContentNearby = getContentPattern().test(contextText);

            if (!hasGetContentNearby) {
              throw new Error(
                `Hardcoded file reference "${violation.match}" at line ${violation.line} in ${path.basename(filePath)} should use get-content script instead.\n` +
                `Context: ${violation.context}\n` +
                `Consider using: npx @pimzino/claude-code-spec-workflow@latest get-content "path/to/file"`
              );
            }
          });
        });
      });
    };

    testFileReferencePatterns(commandFiles, 'command');
    testFileReferencePatterns(agentFiles, 'agent');
  });

  describe('Cross-Platform Examples', () => {
    const commandFiles = getMarkdownFiles(commandsDir);
    const agentFiles = getMarkdownFiles(agentsDir);

    const windowsPathPattern = /npx.*get-content.*"C:\\/gi;
    const unixPathPattern = /npx.*get-content.*"\/.*\//gi;

    const testCrossPlatformExamples = (files: string[], fileType: string) => {
      files.forEach(filePath => {
        it(`${path.basename(filePath)} (${fileType}) should have both Windows and Unix path examples when using get-content`, () => {
          const { content } = readFileContent(filePath);
          
          const hasGetContent = /npx.*get-content/gi.test(content);
          
          if (hasGetContent) {
            const hasWindowsExample = windowsPathPattern.test(content);
            const hasUnixExample = unixPathPattern.test(content);

            if (!hasWindowsExample) {
              throw new Error(
                `${path.basename(filePath)} uses get-content but is missing Windows path examples (C:\\path\\to\\project)`
              );
            }

            if (!hasUnixExample) {
              throw new Error(
                `${path.basename(filePath)} uses get-content but is missing Unix path examples (/path/to/project)`
              );
            }
          }
        });
      });
    };

    testCrossPlatformExamples(commandFiles, 'command');
    testCrossPlatformExamples(agentFiles, 'agent');
  });

  describe('Template Reference Patterns', () => {
    const commandFiles = getMarkdownFiles(commandsDir);
    const agentFiles = getMarkdownFiles(agentsDir);

    const templateReferencePattern = /\.claude\/templates\/[^`\s)]+\.md/gi;
    const templateLoadingPattern = () => /get-content.*templates/gi;

    const testTemplatePatterns = (files: string[], fileType: string) => {
      files.forEach(filePath => {
        it(`${path.basename(filePath)} (${fileType}) should use get-content for template references`, () => {
          const { content, lines } = readFileContent(filePath);
          const templateReferences: { line: number; template: string; context: string }[] = [];

          lines.forEach((line, index) => {
            const matches = [...line.matchAll(templateReferencePattern)];
            matches.forEach(match => {
              // Skip if it's already in a get-content command
              if (!line.includes('get-content')) {
                templateReferences.push({
                  line: index + 1,
                  template: match[0],
                  context: line.trim()
                });
              }
            });
          });

          templateReferences.forEach(ref => {
            // Check if there's template loading nearby
            const contextStart = Math.max(0, ref.line - 10);
            const contextEnd = Math.min(lines.length, ref.line + 10);
            const contextLines = lines.slice(contextStart, contextEnd);
            const contextText = contextLines.join('\n');

            const hasTemplateLoading = templateLoadingPattern().test(contextText);

            if (!hasTemplateLoading) {
              throw new Error(
                `Template reference "${ref.template}" at line ${ref.line} in ${path.basename(filePath)} should be loaded using get-content script.\n` +
                `Context: ${ref.context}\n` +
                `Consider adding proper template loading with get-content script.`
              );
            }
          });
        });
      });
    };

    testTemplatePatterns(commandFiles, 'command');
    testTemplatePatterns(agentFiles, 'agent');
  });
});