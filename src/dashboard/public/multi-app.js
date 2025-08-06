// Multi-project dashboard app using shared components
PetiteVue.createApp({
  // Extend the base state from shared components
  ...window.DashboardShared.BaseAppState,
  
  // Multi dashboard specific state
  projects: [],
  selectedProject: null,
  selectedSpec: null,
  activeSessions: [],
  activeTab: 'active', // 'active' or 'projects'
  connected: false,
  ws: null,
  username: 'User',
  expandedRequirements: {},
  expandedDesigns: {},
  pendingProjectRoute: null, // Store project route when projects haven't loaded yet

  // Computed properties
  get activeSessionCount() {
    return this.projects.filter((p) => p.hasActiveSession).length;
  },

  // Initialize the dashboard
  async init() {
    console.log('Multi-project dashboard initializing...');
    this.initTheme();
    this.setupKeyboardHandlers();
    this.setupCodeBlockCopyHandlers();
    this.initializeRouting();
    this.connectWebSocket();
  },

  // Connect to WebSocket for real-time updates
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
      console.log('WebSocket message:', message);
      this.handleWebSocketMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      setTimeout(() => this.connectWebSocket(), 2000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },

  // Handle incoming WebSocket messages
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'initial':
        this.projects = Array.isArray(message.data) ? this.normalizeProjects(message.data) : [];
        this.activeSessions = Array.isArray(message.activeSessions) ? message.activeSessions : [];
        this.username = message.username || 'User';

        console.log(
          `Received initial data: ${this.projects.length} projects, ${this.activeSessions.length} active sessions`
        );
        
        // Sort projects: active first, then by activity
        this.sortProjects();
        
        // Handle pending route if we were waiting for projects to load
        if (this.pendingProjectRoute && this.projects.length > 0) {
          const project = this.projects.find(p => this.getProjectSlug(p) === this.pendingProjectRoute);
          if (project) {
            this.selectedProject = project;
            this.activeTab = 'projects';
            this.updateURL();
          } else {
            // Project still not found, redirect to active
            this.activeTab = 'active';
            this.selectedProject = null;
            this.updateURL();
          }
          this.pendingProjectRoute = null;
        }
        // Select first project if none selected and we're on projects tab
        else if (!this.selectedProject && this.projects.length > 0 && this.activeTab === 'projects') {
          this.selectedProject = this.projects[0];
          this.updateURL();
        }
        break;

      case 'new-project':
        // Add new project
        const newProject = this.normalizeProjects([message.data])[0];
        if (!this.projects.find((p) => p.path === newProject.path)) {
          this.projects.push(newProject);
          this.sortProjects();
        }
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

        // Find and update the project
        const projectIndex = this.projects.findIndex((p) => p.path === projectPath);
        if (projectIndex >= 0) {
          const project = this.projects[projectIndex];
          
          switch (event.type) {
            case 'spec-update':
              if (project.specs) {
                const specIndex = project.specs.findIndex((s) => s.name === event.data.name);
                if (specIndex >= 0) {
                  project.specs[specIndex] = event.data;
                } else {
                  project.specs.push(event.data);
                }
              }
              break;
              
            case 'status-update':
              project.hasActiveSession = event.data.hasActiveSession;
              project.lastActivity = event.data.lastActivity;
              project.isClaudeActive = event.data.isClaudeActive;
              break;
              
            case 'git-update':
              project.gitBranch = event.data.branch;
              project.gitCommit = event.data.commit;
              break;
              
            case 'steering-update':
              project.steering = event.data;
              break;
          }
          
          this.sortProjects();
        }
        break;

      case 'active-sessions-update':
        this.activeSessions = Array.isArray(message.data) ? message.data : [];
        console.log(`Active sessions updated: ${this.activeSessions.length} sessions`, this.activeSessions);
        break;

      case 'bug-update':
        const bugEvent = message.data;
        const bugProjectPath = message.projectPath;
        
        // Find the project
        const bugProjectIndex = this.projects.findIndex((p) => p.path === bugProjectPath);
        if (bugProjectIndex >= 0) {
          const project = this.projects[bugProjectIndex];
          
          if (!project.bugs) {
            project.bugs = [];
          }
          
          if (bugEvent.data) {
            // Add or update bug
            const bugIndex = project.bugs.findIndex((b) => b.name === bugEvent.data.name);
            if (bugIndex >= 0) {
              project.bugs[bugIndex] = bugEvent.data;
            } else {
              project.bugs.push(bugEvent.data);
            }
          } else if (bugEvent.type === 'removed') {
            // Remove bug
            project.bugs = project.bugs.filter((b) => b.name !== bugEvent.bug);
          }
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  },

  // Switch between tabs
  switchTab(tab) {
    this.activeTab = tab;
    this.updateURL();
  },

  // Select a project and update URL
  selectProject(project) {
    this.selectedProject = project;
    this.activeTab = 'projects';
    this.updateURL();
  },

  // Select a project from active session
  selectProjectFromSession(session) {
    const project = this.projects.find((p) => p.path === session.projectPath);
    if (project) {
      this.selectedProject = project;
      this.activeTab = 'projects';
      
      // Handle based on session type
      if (session.type === 'spec' && project.specs) {
        // Find and expand the spec
        const spec = project.specs.find((s) => s.name === session.specName);
        if (spec) {
          this.selectedSpec = spec;
        }
      } else if (session.type === 'bug') {
        // Scroll to bug section if needed
        setTimeout(() => {
          const bugElement = document.getElementById(`bug-${session.bugName}`);
          if (bugElement) {
            bugElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  },

  // Legacy method name for backward compatibility (used in HTML template)
  selectProjectFromTask(projectPath, itemName, sessionType = 'spec') {
    // Find the session or create a minimal one for navigation
    const project = this.projects.find((p) => p.path === projectPath);
    if (!project) return;

    // Create a session-like object for navigation
    let session;
    if (sessionType === 'bug' || (project.bugs && project.bugs.find(b => b.name === itemName))) {
      session = {
        type: 'bug',
        projectPath: projectPath,
        bugName: itemName
      };
    } else {
      session = {
        type: 'spec',
        projectPath: projectPath,
        specName: itemName
      };
    }

    this.selectProjectFromSession(session);
  },

  // Project-specific methods
  getSpecsInProgress(project) {
    if (!project.specs) return 0;
    return project.specs.filter((s) => s.status === 'in-progress').length;
  },

  getSpecsCompleted(project) {
    if (!project.specs) return 0;
    return project.specs.filter((s) => s.status === 'completed').length;
  },

  getTotalTasks(project) {
    if (!project.specs) return 0;
    return project.specs.reduce((total, spec) => {
      return total + (spec.tasks?.total || 0);
    }, 0);
  },

  getOpenSpecsCount(project) {
    if (!project.specs) return 0;
    return project.specs.filter((s) => s.status !== 'completed').length;
  },

  getOpenBugsCount(project) {
    if (!project.bugs) return 0;
    return project.bugs.filter((b) => b.status !== 'resolved').length;
  },

  getBugsInProgress(project) {
    if (!project.bugs) return 0;
    return project.bugs.filter((b) => ['analyzing', 'fixing', 'verifying'].includes(b.status)).length;
  },

  getBugsResolved(project) {
    if (!project.bugs) return 0;
    return project.bugs.filter((b) => b.status === 'resolved').length;
  },

  // Sort projects: active sessions first, then by last activity
  sortProjects() {
    this.projects.sort((a, b) => {
      // Active sessions come first
      if (a.hasActiveSession && !b.hasActiveSession) return -1;
      if (!a.hasActiveSession && b.hasActiveSession) return 1;
      
      // Then sort by last activity
      const dateA = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
      const dateB = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
      return dateB - dateA;
    });
  },

  // Active session helpers
  getTaskNumber(activeSession) {
    if (activeSession.type !== 'spec') return 1;
    
    const spec = this.projects
      .find((p) => p.path === activeSession.projectPath)
      ?.specs?.find((s) => s.name === activeSession.specName);
    
    if (!spec?.tasks?.taskList) return 1;
    
    const taskIndex = spec.tasks.taskList.findIndex((t) => t.id === activeSession.task.id);
    return taskIndex >= 0 ? taskIndex + 1 : 1;
  },

  getSpecTaskCount(activeSession) {
    if (activeSession.type !== 'spec') return 0;
    
    const spec = this.projects
      .find((p) => p.path === activeSession.projectPath)
      ?.specs?.find((s) => s.name === activeSession.specName);
    
    return spec?.tasks?.total || 0;
  },

  getSpecProgress(activeSession) {
    if (activeSession.type !== 'spec') return 0;
    
    const spec = this.projects
      .find((p) => p.path === activeSession.projectPath)
      ?.specs?.find((s) => s.name === activeSession.specName);
    
    if (!spec?.tasks) return 0;
    return (spec.tasks.completed / spec.tasks.total) * 100;
  },

  getNextTask(activeSession) {
    if (activeSession.type !== 'spec') return null;
    
    const spec = this.projects
      .find((p) => p.path === activeSession.projectPath)
      ?.specs?.find((s) => s.name === activeSession.specName);
    
    if (!spec?.tasks?.taskList) return null;
    
    const currentIndex = spec.tasks.taskList.findIndex((t) => t.id === activeSession.task.id);
    if (currentIndex >= 0 && currentIndex < spec.tasks.taskList.length - 1) {
      const nextTask = spec.tasks.taskList[currentIndex + 1];
      if (!nextTask.completed) return nextTask;
    }
    
    return spec.tasks.taskList.find((t) => !t.completed && t.id !== activeSession.task.id);
  },

  // Requirements expand/collapse
  toggleRequirementsExpanded(specName) {
    if (this.expandedRequirements[specName]) {
      delete this.expandedRequirements[specName];
    } else {
      this.expandedRequirements[specName] = true;
    }
  },

  isRequirementsExpanded(specName) {
    return !!this.expandedRequirements[specName];
  },

  // Design expand/collapse
  toggleDesignExpanded(specName) {
    if (this.expandedDesigns[specName]) {
      delete this.expandedDesigns[specName];
    } else {
      this.expandedDesigns[specName] = true;
    }
  },

  isDesignExpanded(specName) {
    return !!this.expandedDesigns[specName];
  },

  // Normalize project data
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
            // Parse requirements if needed
            if (typeof spec.requirements.content === 'string') {
              try {
                spec.requirements.content = JSON.parse(spec.requirements.content);
              } catch (e) {
                console.warn('Failed to parse requirements content:', e);
              }
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

  // Override viewMarkdown to include projectPath
  async viewMarkdown(specName, docType, projectPath = null) {
    console.log('Multi-app viewMarkdown - before call, this.markdownPreview:', this.markdownPreview);
    // If projectPath is provided directly, use it
    if (projectPath) {
      const result = await window.DashboardShared.BaseAppState.viewMarkdown.call(
        this, 
        specName, 
        docType, 
        projectPath
      );
      console.log('Multi-app viewMarkdown - after call, this.markdownPreview:', this.markdownPreview);
      return result;
    }
    
    // Otherwise use selectedProject
    if (!this.selectedProject) {
      console.error('No project selected or provided for viewing markdown');
      // Set error content directly
      this.markdownPreview.show = true;
      this.markdownPreview.loading = false;
      this.markdownPreview.title = `${specName} - ${docType}.md`;
      this.markdownPreview.content = `# Error: No project selected\n\nPlease select a project first.`;
      this.markdownPreview.rawContent = '';
      return;
    }
    const result = await window.DashboardShared.BaseAppState.viewMarkdown.call(
      this, 
      specName, 
      docType, 
      this.selectedProject.path
    );
    console.log('Multi-app viewMarkdown - after selectedProject call, this.markdownPreview:', this.markdownPreview);
    return result;
  },

  // View bug markdown
  async viewBugMarkdown(projectPath, bugName, docType) {
    this.markdownPreview.show = true;
    this.markdownPreview.loading = true;
    this.markdownPreview.title = `${bugName} - ${docType}.md`;
    
    try {
      const encodedPath = encodeURIComponent(projectPath);
      const response = await fetch(`/api/projects/${encodedPath}/bugs/${bugName}/${docType}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', response.status, errorText);
        throw new Error(`Failed to fetch ${docType} content: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Setting bug markdown preview content, data:', data);
      this.markdownPreview.content = data.content;
      this.markdownPreview.rawContent = data.content;  // Store raw markdown
      console.log('markdownPreview.rawContent is now:', this.markdownPreview.rawContent?.substring(0, 100));
    } catch (error) {
      console.error(`Error fetching ${docType} content:`, error);
      this.markdownPreview.content = `# Error loading ${docType} content\n\n${error.message}`;
      this.markdownPreview.rawContent = '';
    } finally {
      this.markdownPreview.loading = false;
    }
  },

  // Get current task for a spec
  getCurrentTask(spec) {
    if (!spec.tasks || !spec.tasks.taskList || !spec.tasks.inProgress) return null;
    return spec.tasks.taskList.find(task => task.id === spec.tasks.inProgress);
  },

  // Scroll to a specific requirement
  scrollToRequirement(specName, requirementId) {
    const element = document.getElementById(`${specName}-req-${requirementId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // URL Routing Methods
  initializeRouting() {
    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Set initial route based on URL
    this.handleRouteChange();
  },

  handleRouteChange() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '/active') {
      this.activeTab = 'active';
      this.selectedProject = null;
    } else {
      // Extract project name from path (e.g., /my-project -> my-project)
      const projectName = path.substring(1); // Remove leading slash
      
      // Find project by name
      const project = this.projects.find(p => this.getProjectSlug(p) === projectName);
      if (project) {
        this.selectedProject = project;
        this.activeTab = 'projects';
      } else {
        // Project not found, check if we have projects loaded yet
        if (this.projects.length === 0) {
          // Projects not loaded yet, store the desired project name for later
          this.pendingProjectRoute = projectName;
        } else {
          // Projects are loaded but project not found, redirect to active
          this.activeTab = 'active';
          this.selectedProject = null;
          this.updateURL();
        }
      }
    }
  },

  updateURL() {
    let newPath = '/active';
    
    if (this.activeTab === 'projects' && this.selectedProject) {
      newPath = '/' + this.getProjectSlug(this.selectedProject);
    }

    // Only update if path has changed to avoid infinite loops
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  },

  getProjectSlug(project) {
    // Convert project name to URL-friendly slug
    return project.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
  },

  // Override selectProjectFromSession to update URL
  selectProjectFromSession(session) {
    const project = this.projects.find((p) => p.path === session.projectPath);
    if (project) {
      this.selectedProject = project;
      this.activeTab = 'projects';
      this.updateURL();
      
      // Handle based on session type
      if (session.type === 'spec' && project.specs) {
        // Find and expand the spec
        const spec = project.specs.find((s) => s.name === session.specName);
        if (spec) {
          this.selectedSpec = spec;
        }
      } else if (session.type === 'bug') {
        // Scroll to bug section if needed
        setTimeout(() => {
          const bugElement = document.getElementById(`bug-${session.bugName}`);
          if (bugElement) {
            bugElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }
}).mount('#app');