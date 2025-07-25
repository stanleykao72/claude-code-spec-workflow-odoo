/**
 * Shared components and utilities for Claude Code Spec Workflow dashboards
 * This file contains reusable UI components and utility functions used by both
 * the single-project and multi-project dashboards.
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a date string for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
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
 * Get CSS classes for status badges
 */
function getStatusClass(status) {
  const classes = {
    'not-started': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    requirements: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    design: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    tasks: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'in-progress': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return classes[status] || classes['not-started'];
}

/**
 * Get display label for status
 */
function getStatusLabel(status) {
  const labels = {
    'not-started': 'Not Started',
    requirements: 'Requirements',
    design: 'Design',
    tasks: 'Tasks',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };
  return labels[status] || status;
}

/**
 * Copy a command to clipboard
 */
function copyCommand(command) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(command).then(() => {
      console.log('Command copied to clipboard:', command);
    }).catch(err => {
      console.error('Failed to copy command:', err);
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = command;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    console.log('Command copied to clipboard (fallback):', command);
  }
}

/**
 * Render markdown content using marked library
 */
function renderMarkdown(content) {
  if (!content) return '';
  if (typeof marked === 'undefined') {
    console.error('Marked library not loaded');
    return content;
  }
  return marked.parse(content);
}

/**
 * Initialize theme handling
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  this.theme = savedTheme;
  applyTheme.call(this);
}

/**
 * Apply the current theme
 */
function applyTheme() {
  const root = document.documentElement;
  
  if (this.theme === 'dark' || 
      (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Cycle through theme options
 */
function cycleTheme() {
  const themes = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(this.theme);
  this.theme = themes[(currentIndex + 1) % themes.length];
  localStorage.setItem('theme', this.theme);
  applyTheme.call(this);
}

// ============================================================================
// Shared State Management
// ============================================================================

/**
 * Base state object with common properties and methods
 */
const BaseAppState = {
  // Common state
  theme: 'system',
  collapsedCompletedTasks: {},
  markdownPreview: {
    show: false,
    title: '',
    content: '',
    loading: false
  },
  
  // Theme methods
  initTheme,
  applyTheme,
  cycleTheme,
  
  // Utility methods
  formatDate,
  getStatusClass,
  getStatusLabel,
  copyCommand,
  renderMarkdown,
  
  // Task management methods
  getCompletedTaskCount(spec) {
    if (!spec.tasks || !spec.tasks.taskList) return 0;
    return spec.tasks.taskList.filter(task => task.completed).length;
  },
  
  toggleCompletedTasks(specName) {
    if (this.collapsedCompletedTasks[specName]) {
      delete this.collapsedCompletedTasks[specName];
    } else {
      this.collapsedCompletedTasks[specName] = true;
    }
  },
  
  areCompletedTasksCollapsed(specName) {
    return !!this.collapsedCompletedTasks[specName];
  },
  
  getVisibleTasks(spec) {
    if (!spec.tasks || !spec.tasks.taskList) return [];
    
    if (this.areCompletedTasksCollapsed(spec.name)) {
      return spec.tasks.taskList.filter(task => !task.completed);
    }
    
    return spec.tasks.taskList;
  },
  
  copyTaskCommand(specName, taskId) {
    const command = `/spec-exec ${specName} ${taskId}`;
    this.copyCommand(command);
  },
  
  // Markdown preview methods
  async viewMarkdown(specName, docType, projectPath = null) {
    this.markdownPreview.show = true;
    this.markdownPreview.loading = true;
    this.markdownPreview.title = `${specName} - ${docType}.md`;
    
    try {
      let url = `/api/specs/${specName}/${docType}`;
      if (projectPath) {
        url = `/api/projects${projectPath}/specs/${specName}/${docType}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${docType} content`);
      }
      
      const content = await response.text();
      this.markdownPreview.content = content;
    } catch (error) {
      console.error(`Error fetching ${docType} content:`, error);
      this.markdownPreview.content = `*Error loading ${docType} content*`;
    } finally {
      this.markdownPreview.loading = false;
    }
  },
  
  closeMarkdownPreview() {
    this.markdownPreview.show = false;
    this.markdownPreview.title = '';
    this.markdownPreview.content = '';
  },
  
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.markdownPreview.show) {
        this.closeMarkdownPreview();
      }
    });
  }
};

// ============================================================================
// Component Templates
// ============================================================================

/**
 * Generate HTML for a status badge
 */
function StatusBadgeTemplate(status) {
  return `
    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(status)}">
      ${getStatusLabel(status)}
    </span>
  `;
}

/**
 * Generate HTML for a progress bar
 */
function ProgressBarTemplate(completed, total) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return `
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
           style="width: ${percentage}%"></div>
    </div>
  `;
}

/**
 * Generate HTML for steering warning banner
 */
function SteeringWarningTemplate(steeringStatus) {
  if (!steeringStatus || (steeringStatus.exists && steeringStatus.hasProduct && steeringStatus.hasTech && steeringStatus.hasStructure)) {
    return '';
  }
  
  const missingDocs = [];
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
              Run <button @click.stop="copyCommand('/spec-steering-setup')" 
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

// Export for use in dashboards
window.DashboardShared = {
  BaseAppState,
  StatusBadgeTemplate,
  ProgressBarTemplate,
  SteeringWarningTemplate,
  // Direct function exports for backward compatibility
  formatDate,
  getStatusClass,
  getStatusLabel,
  copyCommand,
  renderMarkdown
};