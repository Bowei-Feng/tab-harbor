export interface LandingPageRule {
  hostname?: string;
  hostnameEndsWith?: string;
  pathExact?: string[];
  pathPrefix?: string;
}

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
}

export const defaultSettings: AppSettings = {
  landingPageRules: [],
  customGroupRules: [],
  hiddenDomains: [],
  soundEnabled: true,
  confettiEnabled: true
};
