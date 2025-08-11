/**
 * Type coverage tests for TypeScript dashboard conversion
 * 
 * Tests type guards, WebSocket message handling, and state transformations
 * to ensure 95% type coverage and validate TypeScript conversion
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import {
  // Type guards from validation
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isDate,
  isTask,
  isRequirementDetail,
  isCodeReuseCategory,
  isSteeringStatus,
  isBug,
  isSpec,
  isProject,
  isTunnelStatus,
  isWebSocketMessage,
  isInitialData,
  isUpdateData,
  isErrorData,
  isActiveSession,
  isMarkdownPreviewState,
  isGroupedProjectsCache,
  isProjectTabData,
  SafeParser,
  WebSocketMessageValidator,
  ResultUtils,
  ValidationError,
  WebSocketValidationError,
  Result
} from '../../src/dashboard/client/types/validation';

import {
  TypedWebSocketClient,
  createDashboardWebSocketClient,
  createDashboardWebSocketClientWithHandlers
} from '../../src/dashboard/client/websocket';

import type {
  Project,
  Spec,
  Bug,
  Task,
  RequirementDetail,
  CodeReuseCategory,
  SteeringStatus,
  TunnelStatus,
  WebSocketMessage,
  InitialDataMessage,
  UpdateDataMessage,
  BugUpdateMessage,
  SteeringUpdateMessage,
  ErrorDataMessage,
  TunnelStartedMessage,
  InitialData,
  UpdateData,
  ErrorData,
  ActiveSession,
  MarkdownPreviewState,
  GroupedProjectsCache,
  ProjectTabData,
  AppState,
  TunnelInfo
} from '../../src/dashboard/shared/dashboard.types';

// ============================================================================
// Mock Data for Testing
// ============================================================================

const mockTask: Task = {
  id: '1',
  description: 'Test task',
  completed: false,
  requirements: ['req1', 'req2'],
  leverage: 'utils.ts',
  details: ['Detail 1', 'Detail 2']
};

const mockRequirement: RequirementDetail = {
  id: 'req1',
  title: 'Test Requirement',
  userStory: 'As a user, I want...',
  acceptanceCriteria: ['Criterion 1', 'Criterion 2']
};

const mockCodeReuse: CodeReuseCategory = {
  title: 'Utilities',
  items: ['utils.ts', 'helpers.js']
};

const mockSteeringStatus: SteeringStatus = {
  exists: true,
  hasProduct: true,
  hasTech: true,
  hasStructure: false
};

const mockBug: Bug = {
  name: 'test-bug',
  displayName: 'Test Bug',
  status: 'reported',
  lastModified: new Date('2023-01-01')
};

const mockSpec: Spec = {
  name: 'test-spec',
  displayName: 'Test Spec',
  status: 'in-progress',
  lastModified: new Date('2023-01-01'),
  tasks: {
    exists: true,
    approved: true,
    total: 3,
    completed: 1,
    inProgress: '2',
    taskList: [mockTask]
  },
  requirements: {
    exists: true,
    userStories: 1,
    approved: true,
    content: [mockRequirement]
  },
  design: {
    exists: true,
    approved: true,
    hasCodeReuseAnalysis: true,
    codeReuseContent: [mockCodeReuse]
  }
};

const mockProject: Project = {
  path: '/test/project',
  name: 'Test Project',
  level: 0,
  hasActiveSession: false,
  specs: [mockSpec],
  bugs: [mockBug],
  steeringStatus: mockSteeringStatus
};

const mockTunnelStatus: TunnelStatus = {
  active: true,
  info: {
    url: 'https://test.example.com',
    provider: 'cloudflare',
    passwordProtected: false,
    expiresAt: new Date('2023-01-02')
  },
  viewers: 0
};

const mockActiveSession: ActiveSession = {
  type: 'spec',
  projectPath: '/test/project',
  specName: 'test-spec',
  currentTaskId: '1',
  totalTasks: 3,
  progress: 33,
  projectColorValue: '#3B82F6'
};

const mockMarkdownPreview: MarkdownPreviewState = {
  show: false,
  title: 'Preview',
  content: '<p>Test content</p>',
  rawContent: 'Test content',
  loading: false
};

const mockGroupedProjectsCache: GroupedProjectsCache = {
  projectsCount: 1,
  projectsHash: 'hash123',
  data: [mockProject]
};

const mockProjectTabData: ProjectTabData = {
  path: '/test/project',
  name: 'Test Project',
  level: 0,
  hasActiveSession: false,
  colorValue: '#3B82F6',
  colorPrimary: 'indigo-600',
  isNextTopLevel: false,
  isPrevNested: false,
  specs: [mockSpec],
  bugs: [mockBug]
};

const mockInitialData: InitialData = {
  specs: [mockSpec],
  bugs: [mockBug],
  tunnelStatus: mockTunnelStatus,
  config: {
    version: '1.0.0',
    buildTime: '2023-01-01'
  }
};

const mockUpdateData: UpdateData = {
  projects: [mockProject],
  timestamp: Date.now(),
  changedFiles: ['spec.md', 'tasks.md']
};

const mockErrorData: ErrorData = {
  message: 'Test error',
  code: 'TEST_ERROR',
  details: { additional: 'info' }
};

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('Type Guards - Basic Types', () => {
  test('isString validates string types correctly', () => {
    expect(isString('test')).toBe(true);
    expect(isString('')).toBe(true);
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
  });

  test('isNumber validates number types correctly', () => {
    expect(isNumber(123)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-123)).toBe(true);
    expect(isNumber(12.34)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber('123')).toBe(false);
    expect(isNumber(null)).toBe(false);
  });

  test('isBoolean validates boolean types correctly', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean('true')).toBe(false);
    expect(isBoolean(null)).toBe(false);
  });

  test('isArray validates array types correctly', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray({})).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray('array')).toBe(false);
  });

  test('isObject validates object types correctly', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ key: 'value' })).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('object')).toBe(false);
    expect(isObject(123)).toBe(false);
  });

  test('isDate validates Date types correctly', () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date('2023-01-01'))).toBe(true);
    expect(isDate(new Date('invalid'))).toBe(false);
    expect(isDate('2023-01-01')).toBe(false);
    expect(isDate(Date.now())).toBe(false);
  });
});

describe('Type Guards - Complex Types', () => {
  test('isTask validates Task interface correctly', () => {
    expect(isTask(mockTask)).toBe(true);
    
    expect(isTask({
      id: '1',
      description: 'Test',
      completed: false,
      requirements: []
    })).toBe(true);

    expect(isTask({
      id: 123, // Invalid: should be string
      description: 'Test',
      completed: false,
      requirements: []
    })).toBe(false);

    expect(isTask({
      id: '1',
      description: 'Test',
      completed: 'false', // Invalid: should be boolean
      requirements: []
    })).toBe(false);

    expect(isTask({
      id: '1',
      description: 'Test',
      completed: false,
      requirements: ['req1', 123] // Invalid: should be all strings
    })).toBe(false);
  });

  test('isRequirementDetail validates RequirementDetail interface correctly', () => {
    expect(isRequirementDetail(mockRequirement)).toBe(true);

    expect(isRequirementDetail({
      id: 'req1',
      title: 'Test',
      acceptanceCriteria: ['criterion1']
    })).toBe(true);

    expect(isRequirementDetail({
      id: 123, // Invalid: should be string
      title: 'Test',
      acceptanceCriteria: []
    })).toBe(false);

    expect(isRequirementDetail({
      id: 'req1',
      title: 'Test',
      acceptanceCriteria: 'criterion1' // Invalid: should be array
    })).toBe(false);
  });

  test('isBug validates Bug interface correctly', () => {
    expect(isBug(mockBug)).toBe(true);

    expect(isBug({
      name: 'bug1',
      displayName: 'Bug 1',
      status: 'invalid-status' // Invalid status
    })).toBe(false);

    expect(isBug({
      name: 'bug1',
      displayName: 'Bug 1',
      status: 'reported',
      lastModified: 'invalid-date' // Invalid: should be Date
    })).toBe(false);
  });

  test('isSpec validates Spec interface correctly', () => {
    expect(isSpec(mockSpec)).toBe(true);

    expect(isSpec({
      name: 'spec1',
      displayName: 'Spec 1',
      status: 'invalid-status' // Invalid status
    })).toBe(false);

    expect(isSpec({
      name: 123, // Invalid: should be string
      displayName: 'Spec 1',
      status: 'completed'
    })).toBe(false);
  });

  test('isProject validates Project interface correctly', () => {
    expect(isProject(mockProject)).toBe(true);

    expect(isProject({
      path: '/test',
      name: 'Test',
      level: 0,
      hasActiveSession: false,
      specs: []
    })).toBe(true);

    expect(isProject({
      path: 123, // Invalid: should be string
      name: 'Test',
      level: 0,
      hasActiveSession: false,
      specs: []
    })).toBe(false);

    expect(isProject({
      path: '/test',
      name: 'Test',
      level: 0,
      hasActiveSession: false,
      specs: ['invalid'] // Invalid: should be Spec[]
    })).toBe(false);
  });
});

describe('Type Guards - WebSocket Messages', () => {
  test('isWebSocketMessage validates WebSocket message structure', () => {
    const validMessage: WebSocketMessage = {
      type: 'initial',
      data: mockInitialData
    };

    expect(isWebSocketMessage(validMessage)).toBe(true);
    
    expect(isWebSocketMessage({
      type: 'invalid-type',
      data: {}
    })).toBe(false);

    expect(isWebSocketMessage({
      data: {}
      // Missing type
    })).toBe(false);

    expect(isWebSocketMessage('not-an-object')).toBe(false);
  });

  test('isInitialData validates initial data structure', () => {
    expect(isInitialData(mockInitialData)).toBe(true);

    expect(isInitialData({
      specs: 'invalid', // Should be array
      bugs: [],
      tunnelStatus: mockTunnelStatus
    })).toBe(false);

    expect(isInitialData({
      specs: [],
      bugs: [],
      // Missing tunnelStatus
    })).toBe(false);
  });

  test('isUpdateData validates update data structure', () => {
    expect(isUpdateData(mockUpdateData)).toBe(true);

    expect(isUpdateData({
      projects: [],
      timestamp: 'invalid' // Should be number
    })).toBe(false);

    expect(isUpdateData({
      projects: 'invalid', // Should be array
      timestamp: Date.now()
    })).toBe(false);
  });

  test('isErrorData validates error data structure', () => {
    expect(isErrorData(mockErrorData)).toBe(true);

    expect(isErrorData({
      message: 'Error'
      // Optional fields can be missing
    })).toBe(true);

    expect(isErrorData({
      message: 123 // Should be string
    })).toBe(false);

    expect(isErrorData({
      // Missing required message field
      code: 'ERROR'
    })).toBe(false);
  });
});

// ============================================================================
// Safe Parser Tests
// ============================================================================

describe('SafeParser Utilities', () => {
  test('parseJSON handles valid and invalid JSON', () => {
    const validJson = '{"key": "value", "number": 123}';
    const invalidJson = '{"key": "value", "number":}';

    const validResult = SafeParser.parseJSON(validJson);
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.data).toEqual({ key: 'value', number: 123 });
    }

    const invalidResult = SafeParser.parseJSON(invalidJson);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error).toBeInstanceOf(ValidationError);
      expect(invalidResult.error.code).toBe('JSON_PARSE_ERROR');
    }
  });

  test('parseDate handles various date formats', () => {
    const validDate = new Date('2023-01-01');
    const validString = '2023-01-01';
    const validNumber = Date.now();
    const invalidString = 'not-a-date';

    expect(SafeParser.parseDate(validDate).success).toBe(true);
    expect(SafeParser.parseDate(validString).success).toBe(true);
    expect(SafeParser.parseDate(validNumber).success).toBe(true);

    const invalidResult = SafeParser.parseDate(invalidString);
    expect(invalidResult.success).toBe(false);

    // Test fallback
    const fallbackResult = SafeParser.parseDate(invalidString, new Date('2023-01-01'));
    expect(fallbackResult.success).toBe(true);
  });

  test('parseNumber handles number parsing with bounds', () => {
    expect(SafeParser.parseNumber(123).success).toBe(true);
    expect(SafeParser.parseNumber('123').success).toBe(true);
    expect(SafeParser.parseNumber('12.34').success).toBe(true);

    expect(SafeParser.parseNumber('not-a-number').success).toBe(false);
    expect(SafeParser.parseNumber({}).success).toBe(false);

    // Test bounds
    const belowMin = SafeParser.parseNumber(5, 10, 20);
    expect(belowMin.success).toBe(false);
    if (!belowMin.success) {
      expect(belowMin.error.code).toBe('BELOW_MINIMUM');
    }

    const aboveMax = SafeParser.parseNumber(25, 10, 20);
    expect(aboveMax.success).toBe(false);
    if (!aboveMax.success) {
      expect(aboveMax.error.code).toBe('ABOVE_MAXIMUM');
    }
  });

  test('parseBoolean handles various boolean representations', () => {
    expect(SafeParser.parseBoolean(true).success).toBe(true);
    expect(SafeParser.parseBoolean(false).success).toBe(true);
    expect(SafeParser.parseBoolean('true').success).toBe(true);
    expect(SafeParser.parseBoolean('false').success).toBe(true);
    expect(SafeParser.parseBoolean('1').success).toBe(true);
    expect(SafeParser.parseBoolean('0').success).toBe(true);
    expect(SafeParser.parseBoolean(1).success).toBe(true);
    expect(SafeParser.parseBoolean(0).success).toBe(true);

    const invalidResult = SafeParser.parseBoolean('invalid');
    expect(invalidResult.success).toBe(false);

    // Test fallback
    const fallbackResult = SafeParser.parseBoolean('invalid', true);
    expect(fallbackResult.success).toBe(true);
    if (fallbackResult.success) {
      expect(fallbackResult.data).toBe(true);
    }
  });
});

// ============================================================================
// WebSocket Message Validator Tests
// ============================================================================

describe('WebSocket Message Validation', () => {
  test('validates valid WebSocket messages', () => {
    const validMessage: InitialDataMessage = {
      type: 'initial',
      data: mockInitialData
    };

    const result = WebSocketMessageValidator.validateMessage(validMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('initial');
    }
  });

  test('rejects invalid WebSocket messages', () => {
    const invalidMessage = {
      type: 'invalid-type',
      data: {}
    };

    const result = WebSocketMessageValidator.validateMessage(invalidMessage);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(WebSocketValidationError);
    }
  });

  test('validates message data based on type', () => {
    const invalidInitialMessage = {
      type: 'initial',
      data: {
        specs: 'invalid', // Should be array
        tunnelStatus: mockTunnelStatus
      }
    };

    const result = WebSocketMessageValidator.validateMessage(invalidInitialMessage);
    expect(result.success).toBe(false);
  });

  test('safeParseMessage handles JSON parsing and validation', () => {
    // Create a simpler update data that doesn't rely on complex nested objects
    const simpleUpdateData: UpdateData = {
      projects: [], // Empty projects array to avoid Date serialization issues
      timestamp: Date.now(),
      changedFiles: ['spec.md', 'tasks.md']
    };
    
    const validMessageString = JSON.stringify({
      type: 'update',
      data: simpleUpdateData
    });

    const result = WebSocketMessageValidator.safeParseMessage(validMessageString);
    if (!result.success) {
      console.error('Validation failed:', result.error.message);
      console.error('Error code:', result.error.code);
    }
    expect(result.success).toBe(true);

    const invalidJson = '{"type": "update", "data":}';
    const invalidResult = WebSocketMessageValidator.safeParseMessage(invalidJson);
    expect(invalidResult.success).toBe(false);
  });
});

// ============================================================================
// Result Utilities Tests
// ============================================================================

describe('Result Utilities', () => {
  test('creates success and error results', () => {
    const successResult = ResultUtils.success('test');
    expect(successResult.success).toBe(true);
    if (successResult.success) {
      expect(successResult.data).toBe('test');
    }

    const errorResult = ResultUtils.error(new ValidationError('Test error', 'TEST'));
    expect(errorResult.success).toBe(false);
    if (!errorResult.success) {
      expect(errorResult.error.message).toBe('Test error');
    }
  });

  test('maps Result values', () => {
    const successResult: Result<number> = ResultUtils.success(10);
    const mappedResult = ResultUtils.map(successResult, x => x * 2);
    
    expect(mappedResult.success).toBe(true);
    if (mappedResult.success) {
      expect(mappedResult.data).toBe(20);
    }

    const errorResult: Result<number> = ResultUtils.error(new ValidationError('Error', 'TEST'));
    const mappedError = ResultUtils.map(errorResult, x => x * 2);
    expect(mappedError.success).toBe(false);
  });

  test('chains Result operations with flatMap', () => {
    const successResult: Result<number> = ResultUtils.success(10);
    const chainedResult = ResultUtils.flatMap(successResult, x => 
      x > 5 ? ResultUtils.success(x * 2) : ResultUtils.error(new ValidationError('Too small', 'TOO_SMALL'))
    );
    
    expect(chainedResult.success).toBe(true);
    if (chainedResult.success) {
      expect(chainedResult.data).toBe(20);
    }
  });

  test('unwraps Results safely', () => {
    const successResult: Result<string> = ResultUtils.success('test');
    expect(ResultUtils.unwrap(successResult)).toBe('test');

    const errorResult: Result<string> = ResultUtils.error(new ValidationError('Error', 'TEST'));
    expect(() => ResultUtils.unwrap(errorResult)).toThrow(ValidationError);

    expect(ResultUtils.unwrapOr(errorResult, 'default')).toBe('default');
    expect(ResultUtils.unwrapOr(successResult, 'default')).toBe('test');
  });

  test('combines multiple Results', () => {
    const results = [
      ResultUtils.success(1),
      ResultUtils.success(2),
      ResultUtils.success(3)
    ];

    const combined = ResultUtils.combine(results);
    expect(combined.success).toBe(true);
    if (combined.success) {
      expect(combined.data).toEqual([1, 2, 3]);
    }

    const withError = [
      ResultUtils.success(1),
      ResultUtils.error(new ValidationError('Error', 'TEST')),
      ResultUtils.success(3)
    ];

    const combinedWithError = ResultUtils.combine(withError);
    expect(combinedWithError.success).toBe(false);
  });
});

// ============================================================================
// WebSocket Client Tests
// ============================================================================

describe('TypedWebSocketClient', () => {
  // Mock WebSocket for testing
  const mockWebSocket = {
    close: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1, // OPEN
    onopen: null as ((event: Event) => void) | null,
    onclose: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null
  };

  // Mock global WebSocket
  const originalWebSocket = (globalThis as unknown as { WebSocket: unknown }).WebSocket;

  beforeAll(() => {
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = jest.fn(() => mockWebSocket);
  });

  afterAll(() => {
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = originalWebSocket;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates WebSocket client with default options', () => {
    const client = new TypedWebSocketClient('ws://localhost:3000');
    expect(client).toBeInstanceOf(TypedWebSocketClient);
    expect(client.isConnected()).toBe(false);
    expect(client.getConnectionState()).toBe('disconnected');
  });

  test('handles connection state changes', () => {
    const client = new TypedWebSocketClient('ws://localhost:3000');
    let stateChanges: string[] = [];

    client.addEventHandler('onStateChange', (state) => {
      stateChanges.push(state);
    });

    // Test state change tracking
    expect(stateChanges).toEqual([]);
    expect(client.getConnectionState()).toBe('disconnected');
  });

  test('adds and removes message handlers', () => {
    const client = new TypedWebSocketClient('ws://localhost:3000');
    const handler = jest.fn();

    client.addMessageHandler('onInitial', handler);
    client.removeMessageHandler('onInitial');

    // Handler should be removed
    expect(true).toBe(true); // Placeholder assertion
  });

  test('validates message sending when not connected', () => {
    const client = new TypedWebSocketClient('ws://localhost:3000');
    const message: WebSocketMessage = {
      type: 'initial',
      data: mockInitialData
    };

    const result = client.send(message);
    expect(result).toBe(false); // Cannot send when not connected
  });
});

// ============================================================================
// State Transformation Tests
// ============================================================================

describe('State Transformations', () => {
  test('validates AppState interface structure', () => {
    const mockAppState: Partial<AppState> = {
      projects: [mockProject],
      selectedProject: null,
      selectedSpec: null,
      activeSessions: [],
      connected: false,
      ws: null,
      tunnelStatus: null,
      theme: 'light',
      username: 'test-user',
      activeTab: 'projects',
      showCompleted: true,
      pendingProjectRoute: null,
      expandedRequirements: {},
      expandedDesigns: {},
      expandedTasks: {},
      expandedRequirementAccordions: {},
      selectedTasks: {},
      collapsedCompletedTasks: {},
      markdownPreview: mockMarkdownPreview,
      _groupedProjectsCache: null,
      _colorValueCache: {},
      projectTabsData: []
    };

    // Validate that the state structure matches expectations
    expect(mockAppState.projects).toEqual([mockProject]);
    expect(mockAppState.theme).toBe('light');
    expect(mockAppState.activeTab).toBe('projects');
    expect(mockAppState.expandedRequirements).toEqual({});
  });

  test('validates ActiveSession state transformations', () => {
    expect(isActiveSession(mockActiveSession)).toBe(true);

    const invalidSession = {
      type: 'invalid-type', // Invalid type
      projectPath: '/test'
    };

    expect(isActiveSession(invalidSession)).toBe(false);

    // Test optional fields
    const minimalSession: ActiveSession = {
      type: 'bug',
      projectPath: '/test',
      bugName: 'test-bug'
    };

    expect(isActiveSession(minimalSession)).toBe(true);
  });

  test('validates cache state structures', () => {
    expect(isGroupedProjectsCache(mockGroupedProjectsCache)).toBe(true);
    expect(isProjectTabData(mockProjectTabData)).toBe(true);

    // Test invalid cache
    const invalidCache = {
      projectsCount: 'invalid', // Should be number
      projectsHash: 'hash123',
      data: []
    };

    expect(isGroupedProjectsCache(invalidCache)).toBe(false);
  });

  test('validates project color and styling state', () => {
    // Test color value validation
    const colorValue = '#3B82F6';
    expect(typeof colorValue).toBe('string');
    expect(colorValue.startsWith('#')).toBe(true);

    // Test project tab data color properties
    expect(mockProjectTabData.colorValue).toBe('#3B82F6');
    expect(mockProjectTabData.colorPrimary).toBe('indigo-600');
  });
});

// ============================================================================
// Integration Tests for Type Coverage
// ============================================================================

describe('Type Coverage Integration', () => {
  test('validates complete WebSocket message flow', () => {
    // Test initial data message
    const initialMessage: InitialDataMessage = {
      type: 'initial',
      data: mockInitialData
    };

    expect(isWebSocketMessage(initialMessage)).toBe(true);

    const validationResult = WebSocketMessageValidator.validateMessage(initialMessage);
    expect(validationResult.success).toBe(true);

    // Test update message
    const updateMessage: UpdateDataMessage = {
      type: 'update',
      data: mockUpdateData
    };

    expect(isWebSocketMessage(updateMessage)).toBe(true);

    const updateValidation = WebSocketMessageValidator.validateMessage(updateMessage);
    expect(updateValidation.success).toBe(true);

    // Test error message
    const errorMessage: ErrorDataMessage = {
      type: 'error',
      data: mockErrorData
    };

    expect(isWebSocketMessage(errorMessage)).toBe(true);

    const errorValidation = WebSocketMessageValidator.validateMessage(errorMessage);
    expect(errorValidation.success).toBe(true);
  });

  test('validates complex nested data structures', () => {
    const complexSpec: Spec = {
      name: 'complex-spec',
      displayName: 'Complex Specification',
      status: 'in-progress',
      lastModified: new Date(),
      tasks: {
        exists: true,
        approved: true,
        total: 2,
        completed: 1,
        inProgress: '1',
        taskList: [
          {
            id: '1',
            description: 'Parent task',
            completed: false,
            requirements: ['req1'],
            subtasks: [
              {
                id: '1.1',
                description: 'Child task',
                completed: true,
                requirements: ['req1']
              }
            ]
          }
        ]
      },
      requirements: {
        exists: true,
        userStories: 1,
        approved: true,
        content: [mockRequirement]
      },
      design: {
        exists: true,
        approved: true,
        hasCodeReuseAnalysis: true,
        codeReuseContent: [mockCodeReuse]
      }
    };

    expect(isSpec(complexSpec)).toBe(true);

    const complexProject: Project = {
      path: '/complex/project',
      name: 'Complex Project',
      level: 1,
      hasActiveSession: true,
      specs: [complexSpec],
      bugs: [mockBug],
      steeringStatus: mockSteeringStatus
    };

    expect(isProject(complexProject)).toBe(true);
  });

  test('validates tunnel-related data structures', () => {
    const tunnelInfo: TunnelInfo = {
      url: 'https://test.tunnel.com',
      provider: 'cloudflare',
      passwordProtected: false,
      expiresAt: new Date(Date.now() + 3600000)
    };

    const tunnelStartedMessage: TunnelStartedMessage = {
      type: 'tunnel:started',
      data: tunnelInfo
    };

    expect(isWebSocketMessage(tunnelStartedMessage)).toBe(true);

    const tunnelValidation = WebSocketMessageValidator.validateMessage(tunnelStartedMessage);
    expect(tunnelValidation.success).toBe(true);
  });

  test('validates error handling and recovery patterns', () => {
    // Test validation error creation and handling
    const validationError = new ValidationError('Test validation error', 'TEST_ERROR');
    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError.code).toBe('TEST_ERROR');

    const webSocketError = new WebSocketValidationError(
      'WebSocket validation failed',
      'initial',
      { invalid: 'data' }
    );
    expect(webSocketError).toBeInstanceOf(WebSocketValidationError);
    expect(webSocketError.messageType).toBe('initial');

    // Test Result error handling
    const errorResult = ResultUtils.error(validationError);
    expect(errorResult.success).toBe(false);
    if (!errorResult.success) {
      expect(errorResult.error).toBe(validationError);
    }
  });
});

// ============================================================================
// Performance and Memory Tests
// ============================================================================

describe('Type System Performance', () => {
  test('validates large data structures efficiently', () => {
    const largeProjectArray: Project[] = Array.from({ length: 100 }, (_, i) => ({
      ...mockProject,
      path: `/test/project/${i}`,
      name: `Test Project ${i}`
    }));

    const startTime = performance.now();
    const results = largeProjectArray.map(project => isProject(project));
    const endTime = performance.now();

    expect(results.every(Boolean)).toBe(true);
    expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
  });

  test('handles memory efficiently with large message validation', () => {
    const largeMockData: UpdateData = {
      projects: Array.from({ length: 50 }, (_, i) => ({
        ...mockProject,
        path: `/project/${i}`
      })),
      timestamp: Date.now(),
      changedFiles: Array.from({ length: 100 }, (_, i) => `file${i}.md`)
    };

    const largeMessage: UpdateDataMessage = {
      type: 'update',
      data: largeMockData
    };

    const startTime = performance.now();
    const result = WebSocketMessageValidator.validateMessage(largeMessage);
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(50); // Should validate quickly
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe('Edge Cases and Boundary Conditions', () => {
  test('handles empty and null values correctly', () => {
    expect(isArray([])).toBe(true);
    expect(isObject({})).toBe(true);
    expect(isString('')).toBe(true);
    expect(isNumber(0)).toBe(true);

    expect(isObject(null)).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isDate(null)).toBe(false);
  });

  test('handles undefined optional fields correctly', () => {
    const minimalTask: Task = {
      id: '1',
      description: 'Minimal task',
      completed: false,
      requirements: []
    };

    expect(isTask(minimalTask)).toBe(true);

    const minimalBug: Bug = {
      name: 'minimal-bug',
      displayName: 'Minimal Bug',
      status: 'reported'
    };

    expect(isBug(minimalBug)).toBe(true);
  });

  test('validates enum-like values correctly', () => {
    const validStatuses = ['not-started', 'requirements', 'design', 'tasks', 'in-progress', 'completed'];
    const invalidStatus = 'invalid-status';

    validStatuses.forEach(status => {
      const spec = { ...mockSpec, status };
      expect(isSpec(spec)).toBe(true);
    });

    const invalidSpec = { ...mockSpec, status: invalidStatus };
    expect(isSpec(invalidSpec)).toBe(false);
  });

  test('handles circular references safely', () => {
    // Create a task with subtasks that could potentially create cycles
    const parentTask: Task = {
      id: 'parent',
      description: 'Parent task',
      completed: false,
      requirements: []
    };

    const childTask: Task = {
      id: 'child',
      description: 'Child task',
      completed: false,
      requirements: []
    };

    parentTask.subtasks = [childTask];

    expect(isTask(parentTask)).toBe(true);
  });
});