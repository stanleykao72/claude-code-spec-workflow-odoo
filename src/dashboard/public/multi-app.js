// Multi-project dashboard app
PetiteVue.createApp({
  // State
  projects: [],
  selectedProject: null,
  selectedSpec: null,
  activeTasks: [],
  activeTab: 'active', // 'active' or 'projects'
  connected: false,
  ws: null,
  theme: 'system',
  username: 'User',
  markdownPreview: {
    show: false,
    title: '',
    content: '',
    loading: false
  },

  // Computed
  get activeSessionCount() {
    return this.projects.filter((p) => p.hasActiveSession).length;
  },

  // Methods
  async init() {
    console.log('Multi-project dashboard initializing...');
    this.initTheme();
    this.setupKeyboardHandlers();
    this.connectWebSocket();
  },

  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.markdownPreview.show) {
        this.closeMarkdownPreview();
      }
    });
  },

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      // Reconnect after 3 seconds
      setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'initial':
        this.projects = Array.isArray(message.data) ? this.normalizeProjects(message.data) : [];
        this.activeTasks = Array.isArray(message.activeTasks) ? message.activeTasks : [];
        this.username = message.username || 'User';

        console.log(
          `Received initial data: ${this.projects.length} projects, ${this.activeTasks.length} active tasks`
        );
        // Debug: Check if git info is present
        if (this.projects.length > 0) {
          console.log('First project git info:', {
            name: this.projects[0].name,
            gitBranch: this.projects[0].gitBranch,
            gitCommit: this.projects[0].gitCommit
          });
        }
        // Sort projects: active first, then by activity
        this.sortProjects();
        // Select first project (which will be the most relevant after sorting)
        if (!this.selectedProject && this.projects.length > 0 && this.activeTab === 'projects') {
          this.selectedProject = this.projects[0];
        }
        break;

      case 'active-tasks-update':
        this.activeTasks = message.activeTasks || [];
        break;

      case 'new-project':
        // Add new project
        this.projects.push(message.data);
        // Re-sort projects: active first, then by last activity
        this.sortProjects();
        console.log(`New project appeared: ${message.data.name}`);
        break;

      case 'remove-project':
        // Remove project
        this.projects = this.projects.filter((p) => p.path !== message.data.path);
        // If we were viewing the removed project, clear selection
        if (this.selectedProject?.path === message.data.path) {
          this.selectedProject = this.projects.length > 0 ? this.projects[0] : null;
        }
        break;

      case 'project-update':
        const event = message.data;
        const projectPath = message.projectPath;

        // Find the project
        const projectIndex = this.projects.findIndex((p) => p.path === projectPath);
        if (projectIndex === -1) return;

        const project = this.projects[projectIndex];

        // Update specs within the project
        if (event.type === 'removed') {
          project.specs = project.specs.filter((s) => s.name !== event.spec);
        } else {
          // Update or add the spec
          const specIndex = project.specs.findIndex((s) => s.name === event.spec);
          if (specIndex >= 0 && event.data) {
            project.specs[specIndex] = event.data;
          } else if (event.data) {
            project.specs.push(event.data);
          }
        }

        // Sort specs by last modified
        project.specs.sort((a, b) => {
          const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
          return dateB - dateA;
        });

        // Update last activity
        project.lastActivity = new Date();

        // Re-sort projects: active first, then by last activity
        this.sortProjects();
        break;

      case 'git-update':
        // Update git info for a project
        const gitProjectIndex = this.projects.findIndex((p) => p.path === message.projectPath);
        if (gitProjectIndex !== -1) {
          this.projects[gitProjectIndex].gitBranch = message.gitBranch;
          this.projects[gitProjectIndex].gitCommit = message.gitCommit;
          console.log(`Git info updated for ${this.projects[gitProjectIndex].name}: branch=${message.gitBranch}, commit=${message.gitCommit}`);
          
          // Also update active tasks if they're from this project
          this.activeTasks.forEach(task => {
            if (task.projectPath === message.projectPath) {
              task.gitBranch = message.gitBranch;
              task.gitCommit = message.gitCommit;
            }
          });
        }
        break;
    }
  },

  getStatusClass(status) {
    const classes = {
      'not-started': 'bg-gray-100 text-gray-800',
      requirements: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      tasks: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  },

  getStatusLabel(status) {
    const labels = {
      'not-started': 'Not Started',
      requirements: 'Requirements',
      design: 'Design',
      tasks: 'Tasks',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return labels[status] || status;
  },

  formatDate(date) {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    return d.toLocaleDateString();
  },

  // Stats helpers
  getSpecsInProgress(project) {
    if (!project || !project.specs) return 0;
    return project.specs.filter((s) => s.status === 'in-progress').length;
  },

  getSpecsCompleted(project) {
    if (!project || !project.specs) return 0;
    return project.specs.filter((s) => s.status === 'completed').length;
  },

  getTotalTasks(project) {
    if (!project || !project.specs) return 0;
    return project.specs.reduce((total, spec) => {
      return total + (spec.tasks?.total || 0);
    }, 0);
  },

  // Theme management (same as single project)
  initTheme() {
    const savedTheme = localStorage.getItem('theme-preference') || 'system';
    this.theme = savedTheme;
    this.applyTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.theme === 'system') {
        this.applyTheme();
      }
    });
  },

  cycleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.theme = themes[nextIndex];
    localStorage.setItem('theme-preference', this.theme);
    this.applyTheme();
  },

  applyTheme() {
    const root = document.documentElement;
    const isDarkMode =
      this.theme === 'dark' ||
      (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  sortProjects() {
    this.projects.sort((a, b) => {
      // First, sort by active status
      if (a.hasActiveSession && !b.hasActiveSession) return -1;
      if (!a.hasActiveSession && b.hasActiveSession) return 1;

      // Then by last activity within each group
      const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return dateB - dateA;
    });
  },

  switchTab(tab) {
    this.activeTab = tab;
    if (tab === 'active') {
      this.selectedProject = null;
    } else if (tab === 'projects') {
      // Ensure we have a selected project when switching to projects tab
      if (this.projects.length > 0 && !this.selectedProject) {
        this.selectedProject = this.projects[0];
      } else if (this.projects.length === 0) {
        this.selectedProject = null;
      }
    }
  },

  selectProjectFromTask(projectPath, specName) {
    const project = this.projects.find((p) => p.path === projectPath);
    if (project) {
      this.activeTab = 'projects';
      this.selectedProject = project;
      // If a spec name is provided, select that specific spec
      if (specName) {
        const spec = project.specs.find((s) => s.name === specName);
        if (spec) {
          this.selectedSpec = spec;
        }
      }
    }
  },

  // Helper methods for active task display
  getTaskNumber(activeTask) {
    // Extract numeric part from task ID (e.g., "2.1" -> 2.1, "5" -> 5)
    const taskId = activeTask.task.id;
    return typeof taskId === 'string' ? parseFloat(taskId) : taskId;
  },

  getSpecTaskCount(activeTask) {
    // Find the project and spec to get total task count
    const project = this.projects.find((p) => p.path === activeTask.projectPath);
    if (!project) return 0;

    const spec = project.specs.find((s) => s.name === activeTask.specName);
    return spec?.tasks?.total || 0;
  },

  getSpecProgress(activeTask) {
    // Find the project and spec to calculate progress
    const project = this.projects.find((p) => p.path === activeTask.projectPath);
    if (!project) return 0;

    const spec = project.specs.find((s) => s.name === activeTask.specName);
    if (!spec?.tasks) return 0;

    const completed = spec.tasks.completed || 0;
    const total = spec.tasks.total || 0;

    return total > 0 ? (completed / total) * 100 : 0;
  },

  getNextTask(activeTask) {
    // Find the project and spec to get next task
    const project = this.projects.find((p) => p.path === activeTask.projectPath);
    if (!project) return null;

    const spec = project.specs.find((s) => s.name === activeTask.specName);
    if (!spec?.tasks?.taskList) return null;

    const tasks = spec.tasks.taskList;
    const currentTaskId = activeTask.task.id;

    // Find the index of the current task
    const currentIndex = tasks.findIndex((task) => task.id === currentTaskId);
    if (currentIndex === -1 || currentIndex >= tasks.length - 1) return null;

    // Return the next task in the list
    return tasks[currentIndex + 1];
  },

  getSpecData(activeTask) {
    // Find the project and spec data for an active task
    const project = this.projects.find((p) => p.path === activeTask.projectPath);
    if (!project) return null;

    const spec = project.specs.find((s) => s.name === activeTask.specName);
    return spec || null;
  },

  // Requirements and Design expansion state management (combined)
  expandedDetails: {},
  
  // Completed tasks collapse state
  collapsedCompletedTasks: {},

  toggleDetailsExpanded(specName) {
    if (this.expandedDetails[specName]) {
      delete this.expandedDetails[specName];
    } else {
      this.expandedDetails[specName] = true;
    }
  },

  isDetailsExpanded(specName) {
    return !!this.expandedDetails[specName];
  },

  // Legacy methods for backward compatibility
  toggleRequirementsExpanded(specName) {
    this.toggleDetailsExpanded(specName);
  },

  isRequirementsExpanded(specName) {
    return this.isDetailsExpanded(specName);
  },

  toggleDesignExpanded(specName) {
    this.toggleDetailsExpanded(specName);
  },

  isDesignExpanded(specName) {
    return this.isDetailsExpanded(specName);
  },

  // Normalize project data to handle potential JSON serialization issues
  normalizeProjects(projects) {
    return projects.map((project) => {
      if (project.specs) {
        project.specs = project.specs.map((spec) => {
          // Initialize completed tasks as collapsed by default
          if (spec.tasks && this.getCompletedTaskCount(spec) > 0) {
            this.collapsedCompletedTasks[spec.name] = true;
          }
          // Ensure requirements content is properly handled
          if (spec.requirements && spec.requirements.content) {
            // If it's already an array of proper objects, keep it as is
            if (
              Array.isArray(spec.requirements.content) &&
              spec.requirements.content.length > 0 &&
              typeof spec.requirements.content[0] === 'object' &&
              spec.requirements.content[0].id &&
              spec.requirements.content[0].title
            ) {
              // Data is already in correct format
            }
            // If it's a string, try to parse it
            else if (typeof spec.requirements.content === 'string') {
              try {
                spec.requirements.content = JSON.parse(spec.requirements.content);
              } catch (e) {
                console.warn('Failed to parse requirements content:', e);
                // Keep as string if parsing fails
              }
            }
            // If it's an array but contains strings, try to parse each item
            else if (Array.isArray(spec.requirements.content)) {
              spec.requirements.content = spec.requirements.content.map((item, index) => {
                if (typeof item === 'string') {
                  try {
                    return JSON.parse(item);
                  } catch (e) {
                    console.warn(`Failed to parse requirement item ${index}:`, item, e);
                    return { id: String(index + 1), title: item, acceptanceCriteria: [] };
                  }
                }
                return item;
              });
            }
          }

          // Ensure design content is properly parsed
          if (spec.design && spec.design.codeReuseContent) {
            if (typeof spec.design.codeReuseContent === 'string') {
              try {
                spec.design.codeReuseContent = JSON.parse(spec.design.codeReuseContent);
              } catch (e) {
                console.warn('Failed to parse design content:', e);
              }
            }
          }

          return spec;
        });
      }
      return project;
    });
  },

  // Markdown preview
  async viewMarkdown(specName, docType) {
    if (!this.selectedProject) return;
    
    this.markdownPreview.loading = true;
    this.markdownPreview.show = true;
    this.markdownPreview.title = `${specName} - ${docType.charAt(0).toUpperCase() + docType.slice(1)}`;
    this.markdownPreview.content = '';

    try {
      // Multi-dashboard needs to specify the project path
      const response = await fetch(`/api/projects/${encodeURIComponent(this.selectedProject.path)}/specs/${specName}/${docType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      const data = await response.json();
      this.markdownPreview.content = data.content;
    } catch (error) {
      console.error('Error fetching markdown:', error);
      this.markdownPreview.content = '# Error loading document\n\nFailed to fetch the markdown content.';
    } finally {
      this.markdownPreview.loading = false;
    }
  },

  closeMarkdownPreview() {
    this.markdownPreview.show = false;
    this.markdownPreview.content = '';
  },

  renderMarkdown(content) {
    if (typeof marked !== 'undefined') {
      return marked.parse(content);
    }
    // Fallback if marked is not loaded
    return '<pre>' + this.escapeHtml(content) + '</pre>';
  },

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
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
      // Show only incomplete tasks when collapsed
      return spec.tasks.taskList.filter(task => !task.completed);
    }
    
    // Show all tasks when expanded
    return spec.tasks.taskList;
  },

  getCompletedTaskCount(spec) {
    if (!spec.tasks || !spec.tasks.taskList) return 0;
    return spec.tasks.taskList.filter(task => task.completed).length;
  },

  getCurrentTask(spec) {
    if (!spec.tasks || !spec.tasks.taskList || !spec.tasks.inProgress) return null;
    return spec.tasks.taskList.find(task => task.id === spec.tasks.inProgress);
  },

  copyTaskCommand(specName, taskId) {
    const command = `/spec-exec ${specName} ${taskId}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(command).then(() => {
        // Could add a toast notification here
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
    }
  },
}).mount('#app');
