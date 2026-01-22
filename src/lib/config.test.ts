import { describe, it, expect } from 'vitest';
import { getSessionsDir, getSessionDir } from './config.js';
import type { SessionConfig } from './config.js';

const baseConfig: SessionConfig = {
  portBase: 47000,
  sessionsDir: '../sessions',
  ports: {},
  setup: [],
};

describe('getSessionsDir', () => {
  it('resolves sessions dir relative to project root', () => {
    const result = getSessionsDir(baseConfig, '/home/user/project');
    expect(result).toBe('/home/user/sessions');
  });

  it('handles absolute sessionsDir', () => {
    const config: SessionConfig = {
      ...baseConfig,
      sessionsDir: '/var/sessions',
    };
    const result = getSessionsDir(config, '/home/user/project');
    expect(result).toBe('/var/sessions');
  });
});

describe('getSessionDir', () => {
  it('returns path to specific session directory', () => {
    const result = getSessionDir(baseConfig, '/home/user/project', '001');
    expect(result).toBe('/home/user/sessions/session-001');
  });

  it('handles different session IDs', () => {
    const result = getSessionDir(baseConfig, '/home/user/project', '042');
    expect(result).toBe('/home/user/sessions/session-042');
  });
});
