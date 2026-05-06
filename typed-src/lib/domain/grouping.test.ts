import { describe, expect, it } from 'vitest';
import { groupTabs } from '@/lib/domain/grouping';
import { defaultSettings } from '@/lib/domain/settings';

describe('group aliases', () => {
  it('applies stored aliases to stable group ids', () => {
    const groups = groupTabs([
      {
        id: 1,
        url: 'https://github.com/openai/openai',
        title: 'Repo',
        windowId: 10,
        tabIndex: 0
      },
      {
        id: 2,
        url: 'https://mail.google.com/mail/u/0/#inbox',
        title: 'Inbox',
        windowId: 10,
        tabIndex: 1
      }
    ], defaultSettings, {
      'domain:github.com': 'Code Forge',
      landing: 'Daily Deck'
    });

    expect(groups.find((group) => group.id === 'domain:github.com')?.label).toBe('Code Forge');
    expect(groups.find((group) => group.id === 'landing')?.label).toBe('Daily Deck');
  });

  it('merges groups that share the same alias label', () => {
    const groups = groupTabs([
      {
        id: 1,
        url: 'https://github.com/openai/openai',
        title: 'Repo',
        windowId: 10,
        tabIndex: 0
      },
      {
        id: 2,
        url: 'https://learn.microsoft.com/en-us/azure/',
        title: 'Docs',
        windowId: 10,
        tabIndex: 1
      }
    ], defaultSettings, {
      'domain:github.com': 'Cloudlabs',
      'domain:learn.microsoft.com': 'Cloudlabs'
    });

    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe('alias:Cloudlabs');
    expect(groups[0]?.label).toBe('Cloudlabs');
    expect(groups[0]?.sourceGroupIds).toEqual([
      'domain:github.com',
      'domain:learn.microsoft.com'
    ]);
    expect(groups[0]?.tabs).toHaveLength(2);
  });
});
