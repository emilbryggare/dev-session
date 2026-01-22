import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDefaultBranchName, parseWorktreeOutput, filterSessionWorktrees } from './worktree.js';

describe('generateDefaultBranchName', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates branch name with date and session ID', () => {
    vi.setSystemTime(new Date('2024-03-15'));
    const result = generateDefaultBranchName('001');
    expect(result).toBe('session/2024-03-15/001');
  });

  it('includes session ID in branch name', () => {
    vi.setSystemTime(new Date('2024-01-01'));
    const result = generateDefaultBranchName('042');
    expect(result).toBe('session/2024-01-01/042');
  });
});

describe('parseWorktreeOutput', () => {
  it('parses single worktree', () => {
    const output = `worktree /home/user/project
HEAD abc123def456
branch refs/heads/main
`;
    const result = parseWorktreeOutput(output);
    expect(result).toEqual([
      { path: '/home/user/project', branch: 'main', commit: 'abc123def456' },
    ]);
  });

  it('parses multiple worktrees', () => {
    const output = `worktree /home/user/project
HEAD abc123
branch refs/heads/main

worktree /home/user/sessions/session-001
HEAD def456
branch refs/heads/session/2024-01-01/001
`;
    const result = parseWorktreeOutput(output);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ path: '/home/user/project', branch: 'main', commit: 'abc123' });
    expect(result[1]).toEqual({
      path: '/home/user/sessions/session-001',
      branch: 'session/2024-01-01/001',
      commit: 'def456',
    });
  });

  it('handles detached HEAD (no branch)', () => {
    const output = `worktree /home/user/project
HEAD abc123
detached
`;
    const result = parseWorktreeOutput(output);
    expect(result).toEqual([{ path: '/home/user/project', branch: '', commit: 'abc123' }]);
  });

  it('handles empty output', () => {
    const result = parseWorktreeOutput('');
    expect(result).toEqual([]);
  });
});

describe('filterSessionWorktrees', () => {
  it('filters worktrees matching session-XXX pattern', () => {
    const worktrees = [
      { path: '/home/user/project', branch: 'main', commit: 'abc' },
      { path: '/home/user/sessions/session-001', branch: 'session/2024-01-01/001', commit: 'def' },
      { path: '/home/user/sessions/session-042', branch: 'feature/test', commit: 'ghi' },
    ];

    const result = filterSessionWorktrees(worktrees);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      sessionId: '001',
      path: '/home/user/sessions/session-001',
      branch: 'session/2024-01-01/001',
    });
    expect(result[1]).toEqual({
      sessionId: '042',
      path: '/home/user/sessions/session-042',
      branch: 'feature/test',
    });
  });

  it('returns empty array when no sessions match', () => {
    const worktrees = [
      { path: '/home/user/project', branch: 'main', commit: 'abc' },
      { path: '/home/user/other-worktree', branch: 'feature', commit: 'def' },
    ];

    const result = filterSessionWorktrees(worktrees);
    expect(result).toEqual([]);
  });

  it('handles empty input', () => {
    const result = filterSessionWorktrees([]);
    expect(result).toEqual([]);
  });

  it('ignores paths with session in the middle', () => {
    const worktrees = [
      { path: '/home/user/session-001/subdir', branch: 'main', commit: 'abc' },
    ];

    const result = filterSessionWorktrees(worktrees);
    expect(result).toEqual([]);
  });
});
