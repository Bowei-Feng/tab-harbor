import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceSnapshotChangeSignature,
  buildWorkspaceSnapshotSignature,
  parseWorkspaceSnapshot
} from '@/lib/domain/workspace-snapshot';

describe('workspace snapshots', () => {
  it('normalizes valid snapshots and filters malformed nested items', () => {
    const snapshot = parseWorkspaceSnapshot({
      version: 1,
      exportedAt: '2026-04-19T08:30:00.000Z',
      name: 'Review session',
      note: 'Before cleanup',
      tags: ['client-a', ' review ', 12],
      source: 'manual',
      windows: [
        {
          tabs: [
            { url: 'https://github.com/openai', title: 'OpenAI' },
            { url: '', title: 'Broken tab' }
          ],
          activeTabIndex: 99,
          focused: true
        },
        { tabs: 'broken' }
      ],
      deferred: [
        {
          id: '1',
          url: 'https://figma.com/file/1',
          title: 'Design',
          createdAt: '2026-04-19T08:00:00.000Z',
          completed: false,
          dismissed: false
        },
        {
          id: '2',
          url: '',
          title: 'Broken',
          createdAt: 'bad-date'
        }
      ],
      recentClosed: [
        {
          id: 'recent-1',
          label: 'Docs',
          closedAt: '2026-04-18T22:00:00.000Z',
          tabs: [{ url: 'https://docs.microsoft.com', title: 'Docs' }]
        },
        {
          id: 'recent-2',
          label: 'Broken',
          closedAt: 'nope',
          tabs: []
        }
      ],
      settings: {
        hiddenDomains: ['GitHub.com', ''],
        customGroupRules: [{ groupKey: 'work', groupLabel: 'Work', hostname: 'Docs.Google.com' }],
        landingPageRules: [{ hostname: 'Calendar.Google.com' }],
        soundEnabled: false
      },
      groupOrder: [' domain:github.com ', '', 'domain:github.com'],
      pinnedGroupIds: ['domain:github.com', 'domain:github.com']
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.windows).toHaveLength(1);
    expect(snapshot?.windows[0]?.tabs).toEqual([{ url: 'https://github.com/openai', title: 'OpenAI' }]);
    expect(snapshot?.windows[0]?.activeTabIndex).toBe(0);
    expect(snapshot?.deferred).toHaveLength(1);
    expect(snapshot?.recentClosed).toHaveLength(1);
    expect(snapshot?.settings.hiddenDomains).toEqual(['github.com']);
    expect(snapshot?.groupOrder).toEqual(['domain:github.com']);
    expect(snapshot?.pinnedGroupIds).toEqual(['domain:github.com']);
  });

  it('rejects invalid top-level snapshots', () => {
    expect(parseWorkspaceSnapshot({ version: 2 })).toBeNull();
    expect(parseWorkspaceSnapshot({ version: 1, exportedAt: 'bad-date' })).toBeNull();
  });

  it('builds stable signatures for dedupe checks', () => {
    const snapshot = parseWorkspaceSnapshot({
      version: 1,
      exportedAt: '2026-04-19T08:30:00.000Z',
      name: 'Snapshot',
      note: '',
      tags: [],
      source: 'auto',
      windows: [{ tabs: [{ url: 'https://github.com', title: 'GitHub' }], activeTabIndex: 0, focused: true }],
      deferred: [],
      recentClosed: [],
      settings: {
        hiddenDomains: [],
        customGroupRules: [],
        landingPageRules: [],
        soundEnabled: true,
        confettiEnabled: true
      },
      groupOrder: ['domain:github.com'],
      pinnedGroupIds: ['domain:github.com']
    });

    expect(snapshot).not.toBeNull();
    expect(buildWorkspaceSnapshotSignature(snapshot!)).toContain('"focused":true');
    expect(buildWorkspaceSnapshotSignature(snapshot!)).toContain('"https://github.com"');
  });

  it('ignores active tab jitter when building auto snapshot change signatures', () => {
    const left = parseWorkspaceSnapshot({
      version: 1,
      exportedAt: '2026-04-19T08:30:00.000Z',
      name: 'Snapshot A',
      note: '',
      tags: [],
      source: 'auto',
      windows: [{ tabs: [{ url: 'https://github.com', title: 'GitHub' }], activeTabIndex: 0, focused: true }],
      deferred: [],
      recentClosed: [],
      settings: {
        hiddenDomains: [],
        customGroupRules: [],
        landingPageRules: [],
        soundEnabled: true,
        confettiEnabled: true,
        language: 'zh-CN'
      },
      groupOrder: ['domain:github.com'],
      pinnedGroupIds: ['domain:github.com']
    });

    const right = parseWorkspaceSnapshot({
      version: 1,
      exportedAt: '2026-04-19T08:31:00.000Z',
      name: 'Snapshot B',
      note: '',
      tags: [],
      source: 'auto',
      windows: [{ tabs: [{ url: 'https://github.com', title: 'GitHub' }], activeTabIndex: 4, focused: false }],
      deferred: [],
      recentClosed: [],
      settings: {
        hiddenDomains: [],
        customGroupRules: [],
        landingPageRules: [],
        soundEnabled: true,
        confettiEnabled: true,
        language: 'zh-CN'
      },
      groupOrder: ['domain:github.com'],
      pinnedGroupIds: ['domain:github.com']
    });

    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(buildWorkspaceSnapshotChangeSignature(left!)).toEqual(buildWorkspaceSnapshotChangeSignature(right!));
  });
});
