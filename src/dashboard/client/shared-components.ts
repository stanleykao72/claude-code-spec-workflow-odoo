/**
 * Shared components and utilities for TypeScript dashboard frontend
 * Enhanced TypeScript implementation with type safety
 */

import type { 
  StatusType, 
  SteeringStatus
} from '../shared/dashboard.types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a date string for display with relative time formatting
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Status class mapping for consistent badge styling
 */
type StatusClassMap = Record<StatusType, string>;

const STATUS_CLASSES: StatusClassMap = {
  'not-started': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'requirements': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'design': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'tasks': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'in-progress': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

/**
 * Get CSS classes for status badges with type safety
 */
export function getStatusClass(status: StatusType): string {
  return STATUS_CLASSES[status] || STATUS_CLASSES['not-started'];
}

/**
 * Status label mapping for display text
 */
type StatusLabelMap = Record<StatusType, string>;

const STATUS_LABELS: StatusLabelMap = {
  'not-started': 'Not Started',
  'requirements': 'Requirements ✅',
  'design': 'Design ✅',
  'tasks': 'Tasks ✅', 
  'in-progress': 'In Progress',
  'completed': 'Completed ✅',
};

/**
 * Get display label for status with approval emojis
 */
export function getStatusLabel(status: StatusType): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Copy a command to clipboard with visual feedback and type safety
 */
export async function copyCommand(command: string, event?: globalThis.Event): Promise<void> {
  console.log('copyCommand called with:', command, 'length:', command?.length);
  
  // Find the button that was clicked
  const button = event?.currentTarget as globalThis.HTMLButtonElement || 
                event?.target && (event.target as globalThis.Element).closest('button') || 
                globalThis.document.activeElement as globalThis.HTMLButtonElement;
  
  const copyToClipboard = async (): Promise<void> => {
    if (globalThis.navigator.clipboard) {
      await globalThis.navigator.clipboard.writeText(command);
    } else {
      // Fallback for older browsers
      const textArea = globalThis.document.createElement('textarea');
      textArea.value = command;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      globalThis.document.body.appendChild(textArea);
      textArea.select();
      
      return new Promise<void>((resolve, reject) => {
        try {
          const success = globalThis.document.execCommand('copy');
          globalThis.document.body.removeChild(textArea);
          if (success) {
            resolve();
          } else {
            reject(new Error('Copy command failed'));
          }
        } catch (err) {
          globalThis.document.body.removeChild(textArea);
          reject(err);
        }
      });
    }
  };

  try {
    await copyToClipboard();
    // Success feedback
    if (button) {
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i> Copied!';
      button.classList.add('text-green-600', 'dark:text-green-400');
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('text-green-600', 'dark:text-green-400');
      }, 2000);
    }
    console.log('Command copied to clipboard:', command);
  } catch (err) {
    // Error feedback
    if (button) {
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-times"></i> Failed';
      button.classList.add('text-red-600', 'dark:text-red-400');
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('text-red-600', 'dark:text-red-400');
      }, 2000);
    }
    console.error('Failed to copy command:', err);
  }
}

/**
 * Marked library interface for markdown rendering
 */
interface MarkedRenderer {
  // eslint-disable-next-line no-unused-vars
  code: (_codeContent: string | { text?: string; raw?: string }, _lang?: string) => string;
}

interface MarkedLib {
  // eslint-disable-next-line no-unused-vars
  parse: (_markdownContent: string, _opts?: { renderer?: MarkedRenderer }) => string;
  Renderer: new () => MarkedRenderer;
}

declare global {
  const marked: MarkedLib;
}

/**
 * Render markdown content using marked library with enhanced code blocks
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  
  // Check if marked library is available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markedLib = (globalThis as any).marked as MarkedLib | undefined;
  if (!markedLib) {
    console.error('Marked library not loaded');
    return content;
  }
  
  // Preprocess the content to preserve task numbers
  // Convert "- [ ] 1. Task" to "- [ ] **1.** Task" to make the number stand out
  const preprocessedContent = content.replace(
    /^(\s*)-\s*\[([ x])\]\s*(\d+(?:\.\d+)*)\.(\s*)(.*?)$/gm,
    (_, indent, check, taskNum, space, taskText) => {
      const emoji = check === 'x' ? ' ✅' : '';
      return `${indent}- [${check}] **${taskNum}.** ${taskText}${emoji}`;
    }
  );
  
  // Create a custom renderer for code blocks
  const renderer = new markedLib.Renderer();
  
  // Override the code block rendering
  renderer.code = function(codeInput: string | { text?: string; raw?: string }, language?: string): string {
    // Handle different input formats
    let codeStr = '';
    if (typeof codeInput === 'string') {
      codeStr = codeInput;
    } else if (codeInput && typeof codeInput === 'object') {
      codeStr = codeInput.text || codeInput.raw || String(codeInput);
    } else {
      codeStr = String(codeInput || '');
    }
    
    // Escape the code for HTML display
    const escapedCode = codeStr.replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });
    
    // Base64 encode the original code for data attribute
    const encodedCode = globalThis.btoa(unescape(encodeURIComponent(codeStr)));
    
    // Generate HTML with copy button
    const langClass = language ? ` language-${language}` : '';
    return `<div class="code-block-wrapper relative group">
      <pre data-code-content="${encodedCode}"><code class="hljs${langClass}">${escapedCode}</code></pre>
      <button class="code-copy-btn" title="Copy code">
        <i class="fas fa-copy"></i>
        <span>Copy</span>
      </button>
    </div>`;
  };
  
  // Use the custom renderer with preprocessed content
  return markedLib.parse(preprocessedContent, { renderer });
}

/**
 * EARS keywords for acceptance criteria highlighting
 */
type EarsKeyword = 'GIVEN' | 'WHEN' | 'THEN' | 'IF' | 'SHALL' | 'SHALL NOT';

const EARS_KEYWORDS: readonly EarsKeyword[] = ['GIVEN', 'WHEN', 'THEN', 'IF', 'SHALL NOT', 'SHALL'] as const;

/**
 * Format acceptance criteria with EARS keywords using syntax highlighting
 */
export function formatAcceptanceCriteria(criteria: string): string {
  let formattedCriteria = criteria;
  
  // First, handle new format with **KEYWORD**
  // Replace **KEYWORD** with styled spans
  formattedCriteria = formattedCriteria.replace(/\*\*(GIVEN|WHEN|THEN)\*\*/g, 
    '<span class="ears-keyword font-semibold">$1</span>'
  );
  
  // Then handle old format EARS keywords (without markdown bold)
  // Process SHALL NOT before SHALL to avoid partial matches
  EARS_KEYWORDS.forEach(keyword => {
    // Only match if not already inside a span tag
    const regex = new RegExp(`(?<!<span[^>]*>)\\b(${keyword.replace(' ', '\\s+')})\\b(?![^<]*</span>)`, 'g');
    formattedCriteria = formattedCriteria.replace(regex, 
      `<span class="ears-keyword">$1</span>`
    );
  });
  
  // Also handle other markdown bold formatting for better display
  formattedCriteria = formattedCriteria.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  return formattedCriteria;
}

/**
 * User story keywords for highlighting
 */
type UserStoryKeyword = 'As a' | 'I want' | 'So that' | 'WHEN' | 'IF' | 'THEN' | 'SHALL';

const USER_STORY_KEYWORDS: readonly UserStoryKeyword[] = ['As a', 'I want', 'So that', 'WHEN', 'IF', 'THEN', 'SHALL'] as const;

/**
 * Format user story with keyword highlighting
 */
export function formatUserStory(story: string): string {
  if (!story) return '';
  let formatted = story;
  
  // Highlight user story keywords
  USER_STORY_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword.replace(' ', '\\s+')})\\b`, 'g');
    formatted = formatted.replace(regex, '<span class="ears-keyword">$1</span>');
  });
  
  // Handle any bold text
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  return formatted;
}

// ============================================================================
// Component Templates
// ============================================================================

/**
 * Generate HTML for a status badge with type safety
 */
export function StatusBadgeTemplate(status: StatusType): string {
  return `
    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(status)}">
      ${getStatusLabel(status)}
    </span>
  `;
}

/**
 * Generate HTML for a progress bar
 */
export function ProgressBarTemplate(completed: number, total: number): string {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return `
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
           style="width: ${percentage}%" aria-label="Progress: ${percentage}%"></div>
    </div>
  `;
}

/**
 * Generate HTML for steering warning banner with type safety
 */
export function SteeringWarningTemplate(steeringStatus: SteeringStatus | null): string {
  if (!steeringStatus || (steeringStatus.exists && steeringStatus.hasProduct && steeringStatus.hasTech && steeringStatus.hasStructure)) {
    return '';
  }
  
  const missingDocs: string[] = [];
  if (!steeringStatus.hasProduct) missingDocs.push('Product vision and goals (product.md)');
  if (!steeringStatus.hasTech) missingDocs.push('Technology stack and architecture (tech.md)');
  if (!steeringStatus.hasStructure) missingDocs.push('Project structure and patterns (structure.md)');
  
  return `
    <div class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-triangle text-yellow-400"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Steering Documents Incomplete
          </h3>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              Run <button @click.stop="copyCommand('/spec-steering-setup', $event)" 
                         class="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-800 px-1.5 py-0.5 rounded text-xs font-mono hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors">
                <i class="fas fa-copy"></i>/spec-steering-setup
              </button> to create missing steering documents:
            </p>
            <ul class="list-disc list-inside mt-1">
              ${missingDocs.map(doc => `<li>${doc}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// Exported Interface and Types
// ============================================================================

/**
 * Shared dashboard utilities interface for global access
 */
export interface DashboardShared {
  formatDate: typeof formatDate;
  getStatusClass: typeof getStatusClass;
  getStatusLabel: typeof getStatusLabel;
  copyCommand: typeof copyCommand;
  renderMarkdown: typeof renderMarkdown;
  formatAcceptanceCriteria: typeof formatAcceptanceCriteria;
  formatUserStory: typeof formatUserStory;
  StatusBadgeTemplate: typeof StatusBadgeTemplate;
  ProgressBarTemplate: typeof ProgressBarTemplate;
  SteeringWarningTemplate: typeof SteeringWarningTemplate;
}

// Export all utilities for use in other modules
export const dashboardShared: DashboardShared = {
  formatDate,
  getStatusClass,
  getStatusLabel,
  copyCommand,
  renderMarkdown,
  formatAcceptanceCriteria,
  formatUserStory,
  StatusBadgeTemplate,
  ProgressBarTemplate,
  SteeringWarningTemplate
};

// Global window interface for browser access
declare global {
  interface Window {
    DashboardShared: DashboardShared;
  }
}

// Make available globally if in browser environment
if (typeof globalThis.window !== 'undefined') {
  globalThis.window.DashboardShared = dashboardShared;
}