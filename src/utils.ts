import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer } from 'net';

const execAsync = promisify(exec);

/**
 * Detects project type(s) based on files present in the project directory.
 * Supports multiple project types including Node.js, Python, Java, C#, Go, Rust, PHP, and Ruby.
 * 
 * @param projectPath - Path to the project directory to analyze
 * @returns Promise resolving to array of detected project type names
 * 
 * @example
 * ```typescript
 * const types = await detectProjectType('/path/to/project');
 * console.log(types); // ['Node.js', 'TypeScript']
 * ```
 */
export async function detectProjectType(projectPath: string): Promise<string[]> {
  const indicators = {
    'Node.js': ['package.json', 'node_modules'],
    Python: ['requirements.txt', 'setup.py', 'pyproject.toml', '__pycache__'],
    Java: ['pom.xml', 'build.gradle'],
    'C#': ['*.csproj', '*.sln'],
    Go: ['go.mod', 'go.sum'],
    Rust: ['Cargo.toml', 'Cargo.lock'],
    PHP: ['composer.json', 'vendor'],
    Ruby: ['Gemfile', 'Gemfile.lock'],
  };

  const detected: string[] = [];

  for (const [projectType, files] of Object.entries(indicators)) {
    for (const file of files) {
      try {
        if (file.includes('*')) {
          // Handle glob patterns - simplified check
          const dirContents = await fs.readdir(projectPath);
          const extension = file.replace('*', '');
          if (dirContents.some((f) => f.endsWith(extension))) {
            detected.push(projectType);
            break;
          }
        } else {
          await fs.access(join(projectPath, file));
          detected.push(projectType);
          break;
        }
      } catch {
        // File doesn't exist, continue
      }
    }
  }

  return detected;
}

/**
 * Validates that Claude Code CLI is installed and accessible.
 * 
 * @returns Promise resolving to true if Claude Code is available, false otherwise
 * 
 * @example
 * ```typescript
 * const isInstalled = await validateClaudeCode();
 * if (!isInstalled) {
 *   console.log('Please install Claude Code first');
 * }
 * ```
 */
export async function validateClaudeCode(): Promise<boolean> {
  try {
    await execAsync('claude --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a file exists at the given path.
 * 
 * @param filePath - Path to the file to check
 * @returns Promise resolving to true if file exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await fileExists('package.json');
 * if (exists) {
 *   console.log('Found package.json');
 * }
 * ```
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures a directory exists by creating it recursively if needed.
 * 
 * @param dirPath - Path to the directory to create
 * @throws Error if directory creation fails for reasons other than already existing
 * 
 * @example
 * ```typescript
 * await ensureDirectory('.claude/specs/my-feature');
 * // Directory structure is now guaranteed to exist
 * ```
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code !== 'EEXIST'
    ) {
      throw error;
    }
  }
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find an available port starting from a given port number
 */
export async function findAvailablePort(startPort: number = 3000, maxAttempts: number = 100): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find an available port after checking ${maxAttempts} ports starting from ${startPort}`);
}

/**
 * Get the best available port from a list of preferred ports, with fallback
 */
export async function getBestAvailablePort(preferredPorts: number[] = [3000, 3001, 3002, 8080, 8000, 4000]): Promise<number> {
  // First try the preferred ports
  for (const port of preferredPorts) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  // Fall back to finding any available port starting from 3000
  return findAvailablePort(3000);
}
