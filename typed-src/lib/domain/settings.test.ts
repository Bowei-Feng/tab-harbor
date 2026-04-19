import { describe, expect, it } from 'vitest';
import { normalizeAppSettings, parseCustomGroupRules, parseLandingPageRules } from '@/lib/domain/settings';

describe('settings validation', () => {
  it('parses valid custom group rules and landing rules', () => {
    const custom = parseCustomGroupRules([
      {
        groupKey: 'design',
        groupLabel: 'Design',
        hostnameEndsWith: '.figma.com',
        pathPrefix: '/file'
      }
    ]);
    const landing = parseLandingPageRules([
      {
        hostname: 'calendar.google.com',
        pathExact: ['/calendar/u/0/r']
      }
    ]);

    expect(custom.errors).toEqual([]);
    expect(custom.value).toEqual([
      {
        groupKey: 'design',
        groupLabel: 'Design',
        hostnameEndsWith: '.figma.com',
        pathPrefix: '/file'
      }
    ]);
    expect(landing.errors).toEqual([]);
    expect(landing.value[0]?.hostname).toBe('calendar.google.com');
  });

  it('returns explicit validation errors for malformed rules', () => {
    const custom = parseCustomGroupRules([
      {
        groupKey: '',
        hostname: ''
      }
    ]);
    const landing = parseLandingPageRules([
      {
        hostnameEndsWith: '',
        pathExact: 'not-an-array'
      }
    ]);

    expect(custom.errors).toContain('customGroupRules[0].groupKey must be a non-empty string.');
    expect(custom.errors).toContain('customGroupRules[0].groupLabel must be a non-empty string.');
    expect(custom.errors).toContain('customGroupRules[0] must include "hostname" or "hostnameEndsWith".');
    expect(landing.errors).toContain('landingPageRules[0] must include "hostname" or "hostnameEndsWith".');
    expect(landing.errors).toContain('landingPageRules[0].pathExact must be an array of paths.');
  });

  it('normalizes persisted settings safely', () => {
    const settings = normalizeAppSettings({
      hiddenDomains: ['GitHub.com', '', 'GITHUB.com', 'Docs.Google.com'],
      landingPageRules: [{ hostname: 'Calendar.Google.com' }],
      customGroupRules: [{ groupKey: 'work', groupLabel: 'Work', hostname: 'Docs.Google.com' }],
      soundEnabled: false,
      language: 'zh-CN'
    });

    expect(settings.hiddenDomains).toEqual(['github.com', 'docs.google.com']);
    expect(settings.landingPageRules[0]?.hostname).toBe('calendar.google.com');
    expect(settings.customGroupRules[0]?.hostname).toBe('docs.google.com');
    expect(settings.soundEnabled).toBe(false);
    expect(settings.confettiEnabled).toBe(true);
    expect(settings.language).toBe('zh-CN');
  });
});
