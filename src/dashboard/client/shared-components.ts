/**
 * Shared components and utilities for dashboard
 */

// Type definitions
interface MarkdownPreview {
  show: boolean;
  title: string;
  content: string;
  rawContent: string;
  loading: boolean;
}

interface BaseAppState {
  theme: string;
  collapsedCompletedTasks: Record<string, boolean>;
  markdownPreview: MarkdownPreview;
  
  // Methods
  initTheme(): void;
  applyTheme(theme: string): void;
  cycleTheme(): void;
  formatDate(dateString: string): string;
  getStatusClass(status: string): string;
  getStatusLabel(status: string): string;
  copyCommand(command: string, event: Event): Promise<void>;
  renderMarkdown(content: string): string;
  formatAcceptanceCriteria(criteria: string): string;
  formatUserStory(story: string): string;
  showMarkdownPreview(file: string, title: string): Promise<void>;
  closeMarkdownPreview(): void;
  setupKeyboardHandlers(): void;
  setupCodeBlockCopyHandlers(): void;
  copyCodeBlock(event: Event): Promise<void>;
  getSpecStatus(session: any): string | null;
  getSpecStatusLabel(session: any): string;
}

// This will be populated after DOM loads
declare global {
  interface Window {
    DashboardShared: {
      BaseAppState: BaseAppState;
      formatDate: (dateString: string) => string;
      getStatusClass: (status: string) => string;
      getStatusLabel: (status: string) => string;
      copyCommand: (command: string, event: Event) => Promise<void>;
      renderMarkdown: (content: string) => string;
      StatusBadgeTemplate: (status: string) => string;
      ProgressBarTemplate: (completed: number, total: number) => string;
      SteeringWarningTemplate: (missingDocs: string[]) => string;
    };
  }
}

// The actual implementation will be loaded from shared-components.js
// This file provides TypeScript types for the JavaScript implementation
export {};