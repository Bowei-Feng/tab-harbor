export interface LandingPageRule {
  hostname?: string;
  hostnameEndsWith?: string;
  pathExact?: string[];
  pathPrefix?: string;
}

export type AppLocale = 'en' | 'zh-CN';

export interface CustomGroupRule {
  groupKey: string;
  groupLabel: string;
  hostname?: string;
  hostnameEndsWith?: string;
  pathPrefix?: string;
}

export interface AppSettings {
  landingPageRules: LandingPageRule[];
  customGroupRules: CustomGroupRule[];
  hiddenDomains: string[];
  soundEnabled: boolean;
  confettiEnabled: boolean;
  language: AppLocale;
}

export function normalizeLocale(value: unknown): AppLocale {
  return value === 'zh-CN' ? 'zh-CN' : 'en';
}

function detectDefaultLocale(): AppLocale {
  // 默认语言只用来做首次体验，后续以用户在设置页里保存的值为准。
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export const defaultSettings: AppSettings = {
  landingPageRules: [],
  customGroupRules: [],
  hiddenDomains: [],
  soundEnabled: true,
  confettiEnabled: true,
  language: detectDefaultLocale()
};

export interface SettingsRuleParseResult<T> {
  value: T;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function normalizeRuleString(value: unknown, lowercase = false): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return lowercase ? trimmed.toLowerCase() : trimmed;
}

function normalizeStringArray(value: unknown, lowercase = false): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((item) => normalizeRuleString(item, lowercase))
      .filter((item): item is string => Boolean(item))
  )];
}

function parseRuleTarget(rule: Record<string, unknown>, path: string): { hostname?: string; hostnameEndsWith?: string; errors: string[] } {
  const hostname = normalizeRuleString(rule.hostname, true);
  const hostnameEndsWith = normalizeRuleString(rule.hostnameEndsWith, true);
  const errors: string[] = [];

  if (!hostname && !hostnameEndsWith) {
    errors.push(`${path} must include "hostname" or "hostnameEndsWith".`);
  }

  return {
    hostname: hostname ?? undefined,
    hostnameEndsWith: hostnameEndsWith ?? undefined,
    errors
  };
}

export function parseLandingPageRules(value: unknown): SettingsRuleParseResult<LandingPageRule[]> {
  if (!Array.isArray(value)) {
    return {
      value: [],
      errors: ['landingPageRules must be a JSON array.']
    };
  }

  const rules: LandingPageRule[] = [];
  const errors: string[] = [];

  value.forEach((entry, index) => {
    const path = `landingPageRules[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${path} must be an object.`);
      return;
    }

    const { hostname, hostnameEndsWith, errors: targetErrors } = parseRuleTarget(entry, path);
    errors.push(...targetErrors);

    const pathExact = normalizeStringArray(entry.pathExact);
    if ('pathExact' in entry && !Array.isArray(entry.pathExact)) {
      errors.push(`${path}.pathExact must be an array of paths.`);
    }

    const pathPrefix = normalizeRuleString(entry.pathPrefix);
    if ('pathPrefix' in entry && entry.pathPrefix != null && !pathPrefix) {
      errors.push(`${path}.pathPrefix must be a non-empty string.`);
    }

    if (targetErrors.length) return;

    rules.push({
      hostname,
      hostnameEndsWith,
      pathExact: pathExact.length ? pathExact : undefined,
      pathPrefix: pathPrefix ?? undefined
    });
  });

  return { value: rules, errors };
}

export function parseCustomGroupRules(value: unknown): SettingsRuleParseResult<CustomGroupRule[]> {
  if (!Array.isArray(value)) {
    return {
      value: [],
      errors: ['customGroupRules must be a JSON array.']
    };
  }

  const rules: CustomGroupRule[] = [];
  const errors: string[] = [];

  value.forEach((entry, index) => {
    const path = `customGroupRules[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${path} must be an object.`);
      return;
    }

    const groupKey = normalizeRuleString(entry.groupKey);
    const groupLabel = normalizeRuleString(entry.groupLabel);
    const { hostname, hostnameEndsWith, errors: targetErrors } = parseRuleTarget(entry, path);
    errors.push(...targetErrors);

    if (!groupKey) errors.push(`${path}.groupKey must be a non-empty string.`);
    if (!groupLabel) errors.push(`${path}.groupLabel must be a non-empty string.`);

    const pathPrefix = normalizeRuleString(entry.pathPrefix);
    if ('pathPrefix' in entry && entry.pathPrefix != null && !pathPrefix) {
      errors.push(`${path}.pathPrefix must be a non-empty string.`);
    }

    if (!groupKey || !groupLabel || targetErrors.length) return;

    rules.push({
      groupKey,
      groupLabel,
      hostname,
      hostnameEndsWith,
      pathPrefix: pathPrefix ?? undefined
    });
  });

  return { value: rules, errors };
}

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!isRecord(value)) return defaultSettings;

  return {
    landingPageRules: parseLandingPageRules(value.landingPageRules).value,
    customGroupRules: parseCustomGroupRules(value.customGroupRules).value,
    hiddenDomains: normalizeStringArray(value.hiddenDomains, true),
    soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : defaultSettings.soundEnabled,
    confettiEnabled: typeof value.confettiEnabled === 'boolean' ? value.confettiEnabled : defaultSettings.confettiEnabled,
    language: normalizeLocale(value.language)
  };
}
