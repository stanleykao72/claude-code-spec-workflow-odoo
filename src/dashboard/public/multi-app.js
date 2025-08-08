// Multi-project dashboard app using shared components
// Wait for DOM and shared components to load
function initApp() {
  // Check if shared components are loaded
  if (!window.DashboardShared || !window.DashboardShared.BaseAppState) {
    console.error('DashboardShared not loaded yet, retrying...');
    setTimeout(initApp, 100);
    return;
  }
  
  console.log('Initializing multi-dashboard app with DashboardShared:', window.DashboardShared);
  
PetiteVue.createApp({
  // Copy base state properties (not methods)
  theme: window.DashboardShared.BaseAppState.theme || 'system',
  collapsedCompletedTasks: {},
  markdownPreview: {
    show: false,
    title: '',
    content: '',
    rawContent: '',
    loading: false
  },
  
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
  expandedTasks: {},
  selectedTasks: {}, // Track selected task per spec
  expandedRequirementAccordions: {}, // Track expanded requirement accordions per spec
  pendingProjectRoute: null, // Store project route when projects haven't loaded yet
  showCompleted: localStorage.getItem('showCompleted') !== 'false', // Default to true, stored in localStorage
  tunnelStatus: null,
  _groupedProjectsCache: null, // Cache for grouped projects
  _projectColorCache: null, // Cache for project colors - will be initialized as Map in init()

  // Computed properties
  get activeSessionCount() {
    return this.projects.filter((p) => p.hasActiveSession).length;
  },

  // Get visible specs for a project (filtered by showCompleted)
  getVisibleSpecs(project) {
    if (!project || !project.specs) return [];
    if (this.showCompleted) {
      return project.specs;
    }
    return project.specs.filter(s => s.status !== 'completed');
  },

  // Get visible bugs for a project (filtered by showCompleted)
  getVisibleBugs(project) {
    if (!project || !project.bugs) return [];
    if (this.showCompleted) {
      return project.bugs;
    }
    return project.bugs.filter(b => b.status !== 'resolved');
  },

  // Generate unique color for each project (stable within session)
  getProjectColor(projectPath) {
    if (!projectPath) return { primary: 'indigo-600', light: 'indigo-100', ring: 'indigo-500' };
    
    // Initialize cache if needed
    if (!this._projectColorCache) {
      this._projectColorCache = new Map();
    }
    
    // Return cached color if exists
    if (this._projectColorCache.has(projectPath)) {
      return this._projectColorCache.get(projectPath);
    }
    
    // Define a carefully curated color palette with maximum visual distinction
    // Colors are ordered to maximize contrast between adjacent items
    const colors = [
      { primary: 'cyan-600', light: 'cyan-100', ring: 'cyan-500', dark: { primary: 'cyan-400', light: 'cyan-900' } },        // Cyan
      { primary: 'violet-600', light: 'violet-100', ring: 'violet-500', dark: { primary: 'violet-400', light: 'violet-900' } }, // Purple/Violet
      { primary: 'rose-600', light: 'rose-100', ring: 'rose-500', dark: { primary: 'rose-400', light: 'rose-900' } },          // Red/Rose
      { primary: 'amber-600', light: 'amber-100', ring: 'amber-500', dark: { primary: 'amber-400', light: 'amber-900' } },      // Yellow/Amber
      { primary: 'emerald-600', light: 'emerald-100', ring: 'emerald-500', dark: { primary: 'emerald-400', light: 'emerald-900' } }, // Green
      { primary: 'fuchsia-600', light: 'fuchsia-100', ring: 'fuchsia-500', dark: { primary: 'fuchsia-400', light: 'fuchsia-900' } }, // Pink/Fuchsia
      { primary: 'orange-600', light: 'orange-100', ring: 'orange-500', dark: { primary: 'orange-400', light: 'orange-900' } },     // Orange
      { primary: 'teal-600', light: 'teal-100', ring: 'teal-500', dark: { primary: 'teal-400', light: 'teal-900' } },             // Teal
      { primary: 'indigo-600', light: 'indigo-100', ring: 'indigo-500', dark: { primary: 'indigo-400', light: 'indigo-900' } },     // Indigo
      { primary: 'lime-600', light: 'lime-100', ring: 'lime-500', dark: { primary: 'lime-400', light: 'lime-900' } },             // Lime
      { primary: 'sky-600', light: 'sky-100', ring: 'sky-500', dark: { primary: 'sky-400', light: 'sky-900' } },                 // Sky Blue
      { primary: 'pink-600', light: 'pink-100', ring: 'pink-500', dark: { primary: 'pink-400', light: 'pink-900' } },             // Pink
      { primary: 'red-600', light: 'red-100', ring: 'red-500', dark: { primary: 'red-400', light: 'red-900' } },                   // Pure Red
      { primary: 'green-600', light: 'green-100', ring: 'green-500', dark: { primary: 'green-400', light: 'green-900' } },         // Pure Green
      { primary: 'blue-600', light: 'blue-100', ring: 'blue-500', dark: { primary: 'blue-400', light: 'blue-900' } },             // Pure Blue
    ];
    
    // Find all top-level projects (level 0) in the grouped list
    // Clone the result to avoid reactivity issues
    const groupedProjects = [...this.getGroupedProjects()];
    const topLevelProjects = [];
    for (let i = 0; i < groupedProjects.length; i++) {
      if (groupedProjects[i] && groupedProjects[i].level === 0) {
        topLevelProjects.push(groupedProjects[i]);
      }
    }
    
    // Find which top-level project this path belongs to
    let topLevelProject = null;
    let topLevelIndex = -1;
    
    for (let i = 0; i < topLevelProjects.length; i++) {
      const project = topLevelProjects[i];
      // Check if this projectPath is under this top-level project
      if (projectPath === project.path || projectPath.startsWith(project.path + '/')) {
        topLevelProject = project;
        topLevelIndex = i;
        break;
      }
    }
    
    // If not found, check if this IS a top-level project
    if (topLevelIndex === -1) {
      topLevelIndex = topLevelProjects.findIndex(p => p.path === projectPath);
      if (topLevelIndex >= 0) {
        topLevelProject = topLevelProjects[topLevelIndex];
      }
    }
    
    // Use the index to select a color, cycling through if needed
    const colorIndex = topLevelIndex >= 0 ? topLevelIndex % colors.length : 0;
    const color = colors[colorIndex];
    
    // Cache the color for this project and all its children
    if (topLevelProject) {
      // Cache color for the top-level project
      this._projectColorCache.set(topLevelProject.path, color);
      // Cache same color for all children
      for (let i = 0; i < groupedProjects.length; i++) {
        const p = groupedProjects[i];
        if (p && (p.path.startsWith(topLevelProject.path + '/') || p.path === topLevelProject.path)) {
          this._projectColorCache.set(p.path, color);
        }
      }
    } else {
      // Just cache for this specific path
      this._projectColorCache.set(projectPath, color);
    }
    
    return color;
  },

  // Get CSS classes for project color
  getProjectColorClasses(projectPath, type = 'text') {
    const color = this.getProjectColor(projectPath);
    if (!color) return '';
    
    const isDark = document.documentElement.classList.contains('dark');
    
    switch(type) {
      case 'text':
        return isDark && color.dark?.primary ? `text-${color.dark.primary}` : `text-${color.primary}`;
      case 'bg':
        return isDark && color.dark?.light ? `bg-${color.dark.light}` : `bg-${color.light}`;
      case 'bg-primary':
        return `bg-${color.primary}`;
      case 'border':
        return `border-${color.primary}`;
      case 'border-l':
        return `border-l-${color.primary}`;
      case 'border-r':
        return `border-r-${color.primary}`;
      case 'border-b':
        return `border-b-${color.primary}`;
      case 'text-primary':
        return `text-${color.primary}`;
      default:
        return '';
    }
  },

  // Get the parent project path for nested projects
  getParentProjectPath(projectPath, groupedProjects, currentIndex) {
    // For level 0 projects, they are their own parent
    const currentProject = groupedProjects[currentIndex];
    if (!currentProject || currentProject.level === 0) {
      return projectPath;
    }
    
    // Look backwards to find the parent (level 0) project
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (groupedProjects[i].level === 0) {
        return groupedProjects[i].path;
      }
    }
    
    // Fallback to current path
    return projectPath;
  },

  // Get dynamic styles for project tabs to handle Tailwind dynamic class limitations
  getProjectTabStyles(project, index) {
    const color = this.getProjectColor(project.path);
    const parentColor = project.level > 0 ? this.getProjectColor(this.getParentProjectPath(project.path, this.getGroupedProjects(), index)) : null;
    const isActive = this.activeTab === 'projects' && this.selectedProject?.path === project.path;
    const isDark = document.documentElement.classList.contains('dark');
    const groupedProjects = this.getGroupedProjects();
    
    let styles = {};
    
    // Define color mappings with RGB values
    const colorMap = {
      'cyan-600': 'rgb(8, 145, 178)',
      'cyan-400': 'rgb(34, 211, 238)',
      'cyan-100': 'rgb(207, 250, 254)',
      'violet-600': 'rgb(124, 58, 237)',
      'violet-400': 'rgb(167, 139, 250)',
      'violet-100': 'rgb(237, 233, 254)',
      'rose-600': 'rgb(225, 29, 72)',
      'rose-400': 'rgb(251, 113, 133)',
      'rose-100': 'rgb(255, 228, 230)',
      'amber-600': 'rgb(217, 119, 6)',
      'amber-400': 'rgb(251, 191, 36)',
      'amber-100': 'rgb(254, 243, 199)',
      'emerald-600': 'rgb(5, 150, 105)',
      'emerald-400': 'rgb(52, 211, 153)',
      'emerald-100': 'rgb(209, 250, 229)',
      'blue-600': 'rgb(37, 99, 235)',
      'blue-400': 'rgb(96, 165, 250)',
      'blue-100': 'rgb(219, 234, 254)',
      'orange-600': 'rgb(234, 88, 12)',
      'orange-400': 'rgb(251, 146, 60)',
      'orange-100': 'rgb(254, 215, 170)',
      'purple-600': 'rgb(147, 51, 234)',
      'purple-400': 'rgb(192, 132, 252)',
      'purple-100': 'rgb(243, 232, 255)',
      'pink-600': 'rgb(219, 39, 119)',
      'pink-400': 'rgb(244, 114, 182)',
      'pink-100': 'rgb(252, 231, 243)',
      'teal-600': 'rgb(13, 148, 136)',
      'teal-400': 'rgb(45, 212, 191)',
      'teal-100': 'rgb(204, 251, 241)',
      'indigo-600': 'rgb(79, 70, 229)',
      'indigo-400': 'rgb(129, 140, 248)',
      'indigo-100': 'rgb(224, 231, 255)'
    };
    
    // Active tab colors
    if (isActive) {
      const primaryColor = isDark && color.dark?.primary ? color.dark.primary : color.primary;
      styles.color = colorMap[primaryColor] || colorMap['cyan-600'];
      styles.borderBottomColor = colorMap[color.primary] || colorMap['cyan-600'];
    }
    
    // Background for parent projects with children
    if (project.level === 0 && index < groupedProjects.length - 1 && groupedProjects[index + 1].level > 0) {
      const lightColor = colorMap[color.light] || colorMap['cyan-100'];
      const rgbMatch = lightColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const opacity = isDark ? 0.1 : 0.3;
        styles.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
      }
      styles.borderLeftWidth = '2px';
      styles.borderLeftColor = colorMap[color.primary] || colorMap['cyan-600'];
    }
    
    // Background for child projects
    if (project.level > 0 && parentColor) {
      const lightColor = colorMap[parentColor.light] || colorMap['cyan-100'];
      const rgbMatch = lightColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const opacity = isDark ? 0.1 : 0.3;
        styles.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
      }
    }
    
    // Right border for last child
    if (project.level > 0 && (index === groupedProjects.length - 1 || groupedProjects[index + 1].level === 0) && parentColor) {
      styles.borderRightWidth = '2px';
      styles.borderRightColor = colorMap[parentColor.primary] || colorMap['cyan-600'];
    }
    
    return Object.entries(styles).map(([key, value]) => `${key}: ${value}`).join('; ');
  },

  // Get actual color value for project (for inline styles)
  getProjectColorValue(projectPath) {
    const color = this.getProjectColor(projectPath);
    const colorMap = {
      'cyan-600': 'rgb(8, 145, 178)',
      'violet-600': 'rgb(124, 58, 237)',
      'rose-600': 'rgb(225, 29, 72)',
      'amber-600': 'rgb(217, 119, 6)',
      'emerald-600': 'rgb(5, 150, 105)',
      'blue-600': 'rgb(37, 99, 235)',
      'orange-600': 'rgb(234, 88, 12)',
      'purple-600': 'rgb(147, 51, 234)',
      'pink-600': 'rgb(219, 39, 119)',
      'teal-600': 'rgb(13, 148, 136)',
      'indigo-600': 'rgb(79, 70, 229)'
    };
    return colorMap[color.primary] || 'rgb(8, 145, 178)';
  },

  // Get cached grouped projects to avoid excessive recalculation
  getCachedGroupedProjects() {
    // Invalidate cache if projects have changed
    if (!this._groupedProjectsCache || 
        this._groupedProjectsCache.projectsCount !== this.projects.length ||
        this._groupedProjectsCache.projectsHash !== JSON.stringify(this.projects.map(p => p.path))) {
      this._groupedProjectsCache = {
        projectsCount: this.projects.length,
        projectsHash: JSON.stringify(this.projects.map(p => p.path)),
        data: this._buildGroupedProjects()
      };
    }
    return this._groupedProjectsCache.data;
  },
  
  // Group projects by parent/child relationships for display
  getGroupedProjects() {
    return this.getCachedGroupedProjects();
  },
  
  // Internal method to build grouped projects
  _buildGroupedProjects() {
    // Return empty array if no projects
    if (!this.projects || this.projects.length === 0) {
      return [];
    }
    
    // Sort projects by path first to ensure parents come before children
    const sortedProjects = [...this.projects].sort((a, b) => a.path.localeCompare(b.path));
    
    // Create a map for quick lookup
    const projectMap = new Map();
    sortedProjects.forEach(p => projectMap.set(p.path, p));
    
    const grouped = [];
    const addedPaths = new Set();
    
    // Helper function to add a project and all its descendants
    const addProjectWithDescendants = (project, level = 0) => {
      if (addedPaths.has(project.path)) return;
      
      grouped.push({ ...project, level });
      addedPaths.add(project.path);
      
      // Find all descendants (not just direct children)
      const descendants = sortedProjects.filter(child => {
        if (addedPaths.has(child.path)) return false;
        // Check if it's a descendant
        return child.path.startsWith(project.path + '/');
      });
      
      // Sort descendants by path depth then by name
      descendants.sort((a, b) => {
        const depthA = a.path.split('/').length;
        const depthB = b.path.split('/').length;
        if (depthA !== depthB) return depthA - depthB; // Shallower paths first
        return a.name.localeCompare(b.name);
      });
      
      // Add each descendant with appropriate level based on path depth
      descendants.forEach(descendant => {
        const relativePath = descendant.path.substring(project.path.length + 1);
        const relativeDepth = relativePath.split('/').length;
        grouped.push({ ...descendant, level: level + relativeDepth });
        addedPaths.add(descendant.path);
      });
    };
    
    // Find and process all top-level projects (those without parents in our list)
    sortedProjects.forEach(project => {
      if (addedPaths.has(project.path)) return;
      
      // Check if this project has a parent in our list
      const pathParts = project.path.split('/');
      let hasParent = false;
      
      for (let i = pathParts.length - 1; i > 0; i--) {
        const potentialParentPath = pathParts.slice(0, i).join('/');
        if (projectMap.has(potentialParentPath)) {
          hasParent = true;
          break;
        }
      }
      
      if (!hasParent) {
        // This is a top-level project - add it with all its descendants
        addProjectWithDescendants(project, 0);
      }
    });
    
    console.log('Grouped projects:', grouped.map(p => `${' '.repeat(p.level * 2)}${p.name} (${p.path})`).join('\n'));
    return grouped;
  },
  
  // Helper method to get project at specific index from grouped projects
  getProjectAtIndex(index) {
    const projects = this.getCachedGroupedProjects();
    return projects && projects[index] ? projects[index] : null;
  },
  
  // Helper to check if next project is at level 0
  isNextProjectTopLevel(index) {
    const projects = this.getCachedGroupedProjects();
    const nextProject = projects && projects[index + 1] ? projects[index + 1] : null;
    return nextProject && nextProject.level === 0;
  },
  
  // Helper to check if previous project is nested
  isPreviousProjectNested(index) {
    if (index === 0) return false;
    const projects = this.getCachedGroupedProjects();
    const prevProject = projects && projects[index - 1] ? projects[index - 1] : null;
    return prevProject && prevProject.level > 0;
  },

  // Initialize the dashboard
  async init() {
    console.log('Multi-project dashboard initializing...');
    // Initialize the Map here to avoid petite-vue reactivity issues
    this._projectColorCache = new Map();
    this.initTheme();
    this.setupKeyboardHandlers();
    this.setupCodeBlockCopyHandlers();
    this.initializeRouting();
    this.connectWebSocket();
    this.fetchTunnelStatus();
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
        console.log('Initial message received:', message);
        console.log('message.data type:', typeof message.data, 'isArray:', Array.isArray(message.data));
        console.log('message.data:', message.data);
        console.log('message.activeSessions type:', typeof message.activeSessions, 'isArray:', Array.isArray(message.activeSessions));
        console.log('message.activeSessions:', message.activeSessions);
        
        // Ensure we have arrays
        const projectsData = Array.isArray(message.data) ? message.data : [];
        const sessionsData = Array.isArray(message.activeSessions) ? message.activeSessions : [];
        
        this.projects = this.normalizeProjects(projectsData);
        this.activeSessions = sessionsData;
        this.username = message.username || 'User';
        // Clear caches when projects change
        this._groupedProjectsCache = null;
        if (this._projectColorCache) {
          this._projectColorCache.clear();
        }

        console.log(
          `Received initial data: ${this.projects.length} projects, ${this.activeSessions.length} active sessions`
        );
        console.log('Projects after normalization:', this.projects);
        console.log('Active sessions:', this.activeSessions);
        
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
                // Re-sort specs after update
                this.sortSpecs(project.specs);
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
          }
          
          this.sortProjects();
        }
        break;

      case 'steering-update':
        // Handle steering document updates
        const steeringProjectPath = message.projectPath;
        const steeringProject = this.projects.find((p) => p.path === steeringProjectPath);
        if (steeringProject) {
          steeringProject.steering = message.data;
          console.log(`Steering documents updated for ${steeringProject.name}:`, message.data);
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
            // Re-sort bugs after update
            this.sortBugs(project.bugs);
          } else if (bugEvent.type === 'removed') {
            // Remove bug
            project.bugs = project.bugs.filter((b) => b.name !== bugEvent.bug);
          }
        }
        break;

      case 'tunnel:started':
        this.tunnelStatus = {
          active: true,
          info: message.data,
          viewers: 0
        };
        console.log('Tunnel started:', this.tunnelStatus);
        
        // Automatically copy tunnel URL to clipboard
        if (message.data && message.data.url) {
          this.copyCommand(message.data.url);
        }
        break;

      case 'tunnel:stopped':
        this.tunnelStatus = {
          active: false,
          info: null,
          viewers: 0
        };
        console.log('Tunnel stopped:', this.tunnelStatus);
        break;

      case 'tunnel:metrics:updated':
        if (this.tunnelStatus) {
          this.tunnelStatus.viewers = message.data.viewers || 0;
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
    if (!project || !project.specs) return 0;
    return project.specs.filter((s) => s.status !== 'completed').length;
  },

  getOpenBugsCount(project) {
    if (!project || !project.bugs) return 0;
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

  // Scroll to a specific requirement
  scrollToRequirement(specName, requirementId) {
    const element = document.getElementById(`${specName}-req-${requirementId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  // Tasks expand/collapse
  toggleTasksExpanded(specName) {
    if (this.expandedTasks[specName]) {
      delete this.expandedTasks[specName];
      // Clear task selection when collapsing
      delete this.selectedTasks[specName];
    } else {
      this.expandedTasks[specName] = true;
      // Auto-select first incomplete task when expanding
      const project = this.selectedProject;
      if (project && project.specs) {
        const spec = project.specs.find(s => s.name === specName);
        if (spec && spec.tasks && spec.tasks.taskList && spec.tasks.taskList.length > 0) {
          const firstIncomplete = this.findFirstIncompleteTask(spec.tasks.taskList);
          if (firstIncomplete) {
            this.selectedTasks[specName] = firstIncomplete.id;
          } else {
            // If no incomplete tasks, select the first task
            this.selectedTasks[specName] = spec.tasks.taskList[0].id;
          }
        }
      }
    }
  },

  isTasksExpanded(specName) {
    return !!this.expandedTasks[specName];
  },

  // Task selection for detail view
  selectTask(specName, taskId) {
    if (this.selectedTasks[specName] === taskId) {
      // Deselect if clicking the same task
      delete this.selectedTasks[specName];
    } else {
      this.selectedTasks[specName] = taskId;
    }
  },

  isTaskSelected(specName, taskId) {
    return this.selectedTasks[specName] === taskId;
  },

  // Get currently selected task ID for a spec
  selectedTaskId(specName) {
    return this.selectedTasks[specName];
  },

  // Get selected task object for a spec
  getSelectedTask(specName) {
    const taskId = this.selectedTasks[specName];
    if (!taskId) return null;
    
    // Find the project and spec
    const project = this.selectedProject;
    if (!project || !project.specs) return null;
    
    const spec = project.specs.find(s => s.name === specName);
    if (!spec || !spec.tasks || !spec.tasks.taskList) return null;
    
    return spec.tasks.taskList.find(task => task.id === taskId);
  },

  // Requirement accordion functionality (only one open at a time per spec)
  toggleRequirementAccordion(specName, requirementId) {
    const key = `${specName}-${requirementId}`;
    const isCurrentlyExpanded = this.expandedRequirementAccordions[key];
    
    // Close all requirements for this spec first
    Object.keys(this.expandedRequirementAccordions).forEach(k => {
      if (k.startsWith(specName + '-')) {
        delete this.expandedRequirementAccordions[k];
      }
    });
    
    // If it wasn't expanded before, expand it now (accordion behavior)
    if (!isCurrentlyExpanded) {
      this.expandedRequirementAccordions[key] = true;
    }
  },

  isRequirementExpanded(specName, requirementId) {
    const key = `${specName}-${requirementId}`;
    return !!this.expandedRequirementAccordions[key];
  },

  // Initialize selected task to first incomplete task
  initializeSelectedTask(spec) {
    if (!this.selectedTasks[spec.name] && spec.tasks && spec.tasks.taskList) {
      const firstIncomplete = this.findFirstIncompleteTask(spec.tasks.taskList);
      if (firstIncomplete) {
        this.selectedTasks[spec.name] = firstIncomplete.id;
      }
    }
  },

  findFirstIncompleteTask(tasks) {
    for (const task of tasks) {
      if (!task.completed) {
        return task;
      }
      if (task.subtasks) {
        const subtask = this.findFirstIncompleteTask(task.subtasks);
        if (subtask) return subtask;
      }
    }
    return null;
  },

  // Copy next task command
  copyNextTaskCommand(spec, event) {
    if (spec.tasks && spec.tasks.taskList) {
      const nextTask = this.findFirstIncompleteTask(spec.tasks.taskList);
      if (nextTask) {
        const command = `/spec-execute ${spec.name} ${nextTask.id}`;
        this.copyCommand(command, event);
      }
    }
  },

  // Copy orchestrate command
  copyOrchestrateCommand(spec, event) {
    const command = `/spec-orchestrate ${spec.name}`;
    this.copyCommand(command, event);
  },

  // Normalize project data
  normalizeProjects(projects) {
    return projects.map((project) => {
      if (project.specs) {
        project.specs = project.specs.map((spec) => {
          // Initialize selected task to first incomplete when tasks exist
          this.initializeSelectedTask(spec);
          
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
    // If projectPath is provided directly, use it
    if (projectPath) {
      return window.DashboardShared.BaseAppState.viewMarkdown.call(
        this, 
        specName, 
        docType, 
        projectPath
      );
    }
    
    // Otherwise use selectedProject
    if (!this.selectedProject) {
      console.error('No project selected for viewing markdown');
      // Don't show the modal if there's no project selected
      return;
    }
    return window.DashboardShared.BaseAppState.viewMarkdown.call(
      this, 
      specName, 
      docType, 
      this.selectedProject.path
    );
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
    
    // Handle base path - if we're at the dashboard root or common dashboard paths
    if (path === '/' || path === '/active' || path === '/dashboard' || path === '/dashboard/' || path.includes('/dashboard/public')) {
      this.activeTab = 'active';
      this.selectedProject = null;
      return;
    }
    
    // Check if this looks like a project route (only match /project/name pattern)
    const projectMatch = path.match(/^\/project\/(.+)$/);
    if (projectMatch) {
      const projectName = projectMatch[1];
      
      // Find project by name
      const project = this.projects.find(p => this.getProjectSlug(p) === projectName);
      if (project) {
        this.selectedProject = project;
        this.activeTab = 'projects';
      } else {
        // Project not found, check if we have projects loaded yet
        if (this.projects.length === 0 && projectName && !projectName.includes('.')) {
          // Projects not loaded yet and this looks like a project name, store for later
          this.pendingProjectRoute = projectName;
        } else {
          // Projects are loaded but project not found, or invalid route - go to active tab
          this.activeTab = 'active';
          this.selectedProject = null;
          this.updateURL();
        }
      }
    } else {
      // For any other path, default to active tab
      this.activeTab = 'active';
      this.selectedProject = null;
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
  },

  // Sort specs by status priority and last modified date
  sortSpecs(specs) {
    if (!specs || !Array.isArray(specs)) return;
    
    specs.sort((a, b) => {
      // Define status priority order (lower number = higher priority)
      const statusPriority = {
        'in-progress': 1,
        'tasks': 2,
        'design': 3,
        'requirements': 4,
        'not-started': 5,
        'completed': 6  // Completed specs always at bottom
      };
      
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;
      
      // Primary sort: by status priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort: by last modified date within same status group (newest first)
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return dateB - dateA;
    });
  },

  // Sort bugs by status priority and last modified date
  sortBugs(bugs) {
    if (!bugs || !Array.isArray(bugs)) return;
    
    bugs.sort((a, b) => {
      // Define bug status priority order (lower number = higher priority)
      const statusPriority = {
        'reported': 1,    // New bugs need immediate attention
        'analyzing': 2,   // Being investigated
        'fixing': 3,      // Being worked on
        'fixed': 4,       // Fixed but not verified
        'verifying': 5,   // Being tested
        'resolved': 6     // Completed bugs at bottom
      };
      
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;
      
      // Primary sort: by status priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort: by last modified date within same status group (newest first)
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return dateB - dateA;
    });
  },

  // Toggle showing/hiding completed items
  toggleShowCompleted() {
    this.showCompleted = !this.showCompleted;
    localStorage.setItem('showCompleted', this.showCompleted);
  },

  // Fetch tunnel status
  async fetchTunnelStatus() {
    try {
      const response = await fetch('/api/tunnel/status');
      if (response.ok) {
        this.tunnelStatus = await response.json();
        console.log('Tunnel status:', this.tunnelStatus);
      } else {
        // No tunnel or error - set inactive status
        this.tunnelStatus = { active: false };
      }
    } catch (error) {
      console.error('Error fetching tunnel status:', error);
      this.tunnelStatus = { active: false };
    }
  },

  // Start tunnel
  async startTunnel() {
    try {
      const response = await fetch('/api/tunnel/start', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        console.log('Tunnel started successfully:', data);
      } else {
        console.error('Failed to start tunnel:', response.status);
        alert('Failed to start tunnel. Check the console for details.');
      }
    } catch (error) {
      console.error('Error starting tunnel:', error);
      alert('Error starting tunnel. Check the console for details.');
    }
  },

  // Stop tunnel
  async stopTunnel() {
    try {
      const response = await fetch('/api/tunnel/stop', { method: 'POST' });
      if (response.ok) {
        this.tunnelStatus = { active: false };
        console.log('Tunnel stopped successfully');
      } else {
        console.error('Failed to stop tunnel:', response.status);
      }
    } catch (error) {
      console.error('Error stopping tunnel:', error);
    }
  },


  // Format tunnel expiry time
  formatTunnelExpiry(expiresAt) {
    if (!expiresAt) return '';
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMins % 60}m`;
    } else if (diffMins > 0) {
      return `in ${diffMins}m`;
    } else {
      return 'soon';
    }
  },

  // Add methods from shared components - bind them properly
  initTheme() { return window.DashboardShared.BaseAppState.initTheme.call(this); },
  applyTheme(theme) { return window.DashboardShared.BaseAppState.applyTheme.call(this, theme); },
  cycleTheme() { return window.DashboardShared.BaseAppState.cycleTheme.call(this); },
  formatUserStory(story) { return window.DashboardShared.BaseAppState.formatUserStory.call(this, story); },
  formatAcceptanceCriteria(criteria) { return window.DashboardShared.BaseAppState.formatAcceptanceCriteria.call(this, criteria); },
  showMarkdownPreview(file, title) { return window.DashboardShared.BaseAppState.showMarkdownPreview.call(this, file, title); },
  closeMarkdownPreview() { return window.DashboardShared.BaseAppState.closeMarkdownPreview.call(this); },
  setupKeyboardHandlers() { return window.DashboardShared.BaseAppState.setupKeyboardHandlers.call(this); },
  setupCodeBlockCopyHandlers() { return window.DashboardShared.BaseAppState.setupCodeBlockCopyHandlers.call(this); },
  copyCodeBlock(event) { return window.DashboardShared.BaseAppState.copyCodeBlock.call(this, event); },
  getSpecStatus(session) { return window.DashboardShared.BaseAppState.getSpecStatus.call(this, session); },
  getSpecStatusLabel(session) { return window.DashboardShared.BaseAppState.getSpecStatusLabel.call(this, session); },
  getTaskTooltip(task) { return window.DashboardShared.BaseAppState.getTaskTooltip.call(this, task); },
  hasBugDocument(bugName, docType) { return window.DashboardShared.BaseAppState.hasBugDocument.call(this, bugName, docType); },
  viewBugDocument(projectPath, bugName, docType) { return window.DashboardShared.BaseAppState.viewBugDocument.call(this, projectPath, bugName, docType); },
  copyTaskCommand(specName, taskId, event) { return window.DashboardShared.BaseAppState.copyTaskCommand.call(this, specName, taskId, event); },
  copyOrchestrationCommand(specName, taskId, event) { return window.DashboardShared.BaseAppState.copyOrchestrationCommand.call(this, specName, taskId, event); },
  getStatusClass(status) { return window.DashboardShared.getStatusClass(status); },
  getStatusLabel(status) { return window.DashboardShared.getStatusLabel(status); },
  copyCommand(command, event) { return window.DashboardShared.copyCommand(command, event); },
  renderMarkdown(content) { return window.DashboardShared.renderMarkdown(content); },
  formatDate(dateString) { return window.DashboardShared.formatDate(dateString); }
}).mount('#app');
} // End of initApp function

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}