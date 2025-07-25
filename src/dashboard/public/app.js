// Initialize petite-vue app using shared components
PetiteVue.createApp({
  // Extend the base state from shared components
  ...window.DashboardShared.BaseAppState,
  
  // Single dashboard specific state
  specs: [],
  selectedSpec: null,
  connected: false,
  ws: null,
  projectName: 'Project',
  branch: null,
  githubUrl: null,
  steeringStatus: null,

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

  // Initialize the dashboard
  async init() {
    console.log('Dashboard initializing...');
    this.initTheme();
    this.setupKeyboardHandlers();
    await this.fetchProjectInfo();
    await this.fetchSpecs();
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
      case 'spec-update':
        this.updateSpec(message.data);
        break;
      case 'project-info-update':
        this.projectName = message.data.name || this.projectName;
        this.branch = message.data.branch || this.branch;
        this.githubUrl = message.data.githubUrl || this.githubUrl;
        this.steeringStatus = message.data.steeringStatus || this.steeringStatus;
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
  },

  // Refresh data manually
  refresh() {
    console.log('Refreshing data...');
    this.fetchSpecs();
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
  }
}).mount('#app');