// Initialize petite-vue app using shared components
PetiteVue.createApp({
  // Extend the base state from shared components
  ...window.DashboardShared.BaseAppState,
  
  // Single dashboard specific state
  specs: [],
  bugs: [],
  selectedSpec: null,
  selectedBug: null,
  connected: false,
  ws: null,
  projectName: 'Project',
  branch: null,
  githubUrl: null,
  steeringStatus: null,
  tunnelStatus: null,

  // Computed properties
  get specsInProgress() {
    return this.specs.filter((s) => s.status === 'in-progress').length;
  },

  get specsCompleted() {
    return this.specs.filter((s) => s.status === 'completed').length;
  },

  get totalTasks() {
    return this.specs.reduce((total, spec) => {
      return total + (spec.tasks?.total || 0);
    }, 0);
  },

  get bugsReported() {
    return this.bugs.filter((b) => b.status === 'reported').length;
  },

  get bugsResolved() {
    return this.bugs.filter((b) => b.status === 'resolved').length;
  },

  get bugsInProgress() {
    return this.bugs.filter((b) => ['analyzing', 'fixing', 'verifying'].includes(b.status)).length;
  },

  // Initialize the dashboard
  async init() {
    console.log('Dashboard initializing...');
    this.initTheme();
    this.setupKeyboardHandlers();
    this.setupCodeBlockCopyHandlers();
    await this.fetchProjectInfo();
    await this.fetchSpecs();
    await this.fetchBugs();
    await this.fetchTunnelStatus();
    this.connectWebSocket();
  },

  // Fetch project info
  async fetchProjectInfo() {
    try {
      const response = await fetch('/api/project-info');
      const data = await response.json();
      
      this.projectName = data.name || 'Project';
      this.branch = data.branch || null;
      this.githubUrl = data.githubUrl || null;
      this.steeringStatus = data.steeringStatus || null;
      
      console.log('Project info:', data);
    } catch (error) {
      console.error('Error fetching project info:', error);
    }
  },

  // Fetch specs from API
  async fetchSpecs() {
    try {
      console.log('Fetching specs from API...');
      const response = await fetch('/api/specs');
      this.specs = await response.json();
      console.log('Fetched specs:', this.specs);
      
      // Initialize completed tasks as collapsed by default
      this.specs.forEach(spec => {
        if (spec.tasks && this.getCompletedTaskCount(spec) > 0) {
          this.collapsedCompletedTasks[spec.name] = true;
        }
      });
    } catch (error) {
      console.error('Error fetching specs:', error);
    }
  },

  // Fetch bugs from API
  async fetchBugs() {
    try {
      console.log('Fetching bugs from API...');
      const response = await fetch('/api/bugs');
      this.bugs = await response.json();
      console.log('Fetched bugs:', this.bugs);
    } catch (error) {
      console.error('Error fetching bugs:', error);
    }
  },

  // Connect to WebSocket for real-time updates
  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);
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
      // Attempt to reconnect after 2 seconds
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
        // Handle initial data with specs, bugs, and tunnel status
        if (message.data.specs) {
          this.specs = message.data.specs;
        }
        if (message.data.bugs) {
          this.bugs = message.data.bugs;
        }
        if (message.data.tunnelStatus) {
          this.tunnelStatus = message.data.tunnelStatus;
        }
        console.log('Initial data loaded:', { 
          specs: this.specs.length, 
          bugs: this.bugs.length,
          tunnelActive: this.tunnelStatus?.active || false
        });
        break;
      case 'spec-update':
        this.updateSpec(message.data);
        break;
      case 'update':
        this.updateSpec(message.data);
        break;
      case 'bug-update':
        this.updateBug(message.data);
        break;
      case 'project-info-update':
        this.projectName = message.data.name || this.projectName;
        this.branch = message.data.branch || this.branch;
        this.githubUrl = message.data.githubUrl || this.githubUrl;
        this.steeringStatus = message.data.steeringStatus || this.steeringStatus;
        break;
      case 'steering-update':
        this.steeringStatus = message.data;
        console.log('Steering status updated:', this.steeringStatus);
        break;
      case 'tunnel:started':
        this.tunnelStatus = {
          active: true,
          info: message.data,
          viewers: 0
        };
        console.log('Tunnel started:', this.tunnelStatus);
        break;
      case 'tunnel:stopped':
        this.tunnelStatus = {
          active: false,
          info: null,
          viewers: 0
        };
        console.log('Tunnel stopped');
        break;
      case 'tunnel:metrics:updated':
        if (this.tunnelStatus && this.tunnelStatus.active) {
          this.tunnelStatus.viewers = message.data.activeViewers || 0;
          console.log('Tunnel metrics updated:', message.data);
        }
        break;
      case 'tunnel:visitor:new':
        console.log('New tunnel visitor:', message.data);
        // Could show a notification here if desired
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  },

  // Update a single spec
  updateSpec(updatedSpec) {
    const index = this.specs.findIndex((s) => s.name === updatedSpec.name);
    if (index >= 0) {
      this.specs[index] = updatedSpec;
    } else {
      this.specs.push(updatedSpec);
    }
    // Re-sort specs after update
    this.sortSpecs();
  },

  // Update a single bug
  updateBug(bugUpdate) {
    if (bugUpdate.data) {
      const index = this.bugs.findIndex((b) => b.name === bugUpdate.data.name);
      if (index >= 0) {
        this.bugs[index] = bugUpdate.data;
      } else {
        this.bugs.push(bugUpdate.data);
      }
      // Re-sort bugs after update
      this.sortBugs();
    } else if (bugUpdate.type === 'removed') {
      this.bugs = this.bugs.filter((b) => b.name !== bugUpdate.bug);
    }
  },

  // Refresh data manually
  refresh() {
    console.log('Refreshing data...');
    this.fetchSpecs();
    this.fetchBugs();
  },

  // Get current task for a spec
  getCurrentTask(spec) {
    if (!spec.tasks || !spec.tasks.taskList || !spec.tasks.inProgress) return null;
    return spec.tasks.taskList.find(task => task.id === spec.tasks.inProgress);
  },

  // Override viewMarkdown to not include projectPath
  async viewMarkdown(specName, docType) {
    // Call the base method without projectPath for single dashboard
    return window.DashboardShared.BaseAppState.viewMarkdown.call(this, specName, docType, null);
  },

  // View bug markdown
  async viewBugMarkdown(bugName, docType) {
    this.markdownPreview.show = true;
    this.markdownPreview.loading = true;
    this.markdownPreview.title = `${bugName} - ${docType}.md`;
    
    try {
      const response = await fetch(`/api/bugs/${bugName}/${docType}`);
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

  // Format tunnel expiry date
  formatTunnelExpiry(expiresAt) {
    if (!expiresAt) return '';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMinutes = Math.floor((expiry - now) / (1000 * 60));
    
    if (diffMinutes < 0) return 'expired';
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `in ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays}d`;
  },

  // Sort specs by status priority and last modified date
  sortSpecs() {
    this.specs.sort((a, b) => {
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
  sortBugs() {
    this.bugs.sort((a, b) => {
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
  }
}).mount('#app');