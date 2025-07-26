const DEBUG = process.env.CLAUDE_SPEC_DEBUG === 'true';

export const debug = (...args: unknown[]) => {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

export const error = console.error;