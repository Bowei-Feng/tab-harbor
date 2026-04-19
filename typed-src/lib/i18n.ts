import type { AppLocale } from '@/lib/domain/settings';
import type { WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';

// 这里集中放“界面层面的本地化辅助函数”，避免文案散落在各个入口文件里。
export function isChinese(locale: AppLocale): boolean {
  return locale === 'zh-CN';
}

export function pickLocale<T>(locale: AppLocale, english: T, chinese: T): T {
  return isChinese(locale) ? chinese : english;
}

export function formatRelativeTime(locale: AppLocale, dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return pickLocale(locale, 'just now', '刚刚');

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 45) return pickLocale(locale, 'just now', '刚刚');

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (absSeconds < 3600) return formatter.format(Math.round(diffSeconds / 60), 'minute');
  if (absSeconds < 86400) return formatter.format(Math.round(diffSeconds / 3600), 'hour');
  return formatter.format(Math.round(diffSeconds / 86400), 'day');
}

export function formatSnapshotDraftName(locale: AppLocale, date = new Date()): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: locale === 'zh-CN' ? 'numeric' : 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return pickLocale(locale, `Workspace ${formatted}`, `工作区 ${formatted}`);
}

export function getAutoSnapshotName(locale: AppLocale): string {
  return pickLocale(locale, 'Auto Snapshot', '自动快照');
}

export function getSnapshotSourceLabel(locale: AppLocale, source: WorkspaceSnapshotV1['source']): string {
  switch (source) {
    case 'auto':
      return pickLocale(locale, 'Auto', '自动保存');
    case 'manual':
      return pickLocale(locale, 'Manual', '手动导出');
    case 'imported':
    default:
      return pickLocale(locale, 'Imported', '外部导入');
  }
}

function localizeRuleCollection(locale: AppLocale, value: string): string {
  if (locale !== 'zh-CN') return value;
  if (value === 'customGroupRules') return '命名分组规则';
  if (value === 'landingPageRules') return '落地页规则';
  return value;
}

export function localizeSettingsError(locale: AppLocale, error: string): string {
  // 设置校验仍然使用英文规则消息，这里统一把它们翻成更像产品提示的中文。
  if (locale !== 'zh-CN') return error;

  const jsonField = error.match(/^(.+?) must contain valid JSON\.$/);
  if (jsonField) {
    return `${jsonField[1]}需要写成合法的 JSON。`;
  }

  const arrayField = error.match(/^(landingPageRules|customGroupRules) must be a JSON array\.$/);
  if (arrayField) {
    return `${localizeRuleCollection(locale, arrayField[1])}需要写成 JSON 数组。`;
  }

  const ruleField = error.match(/^(landingPageRules|customGroupRules)\[(\d+)\](?:\.(\w+))? (.+)$/);
  if (ruleField) {
    const collection = localizeRuleCollection(locale, ruleField[1]);
    const index = Number(ruleField[2]) + 1;
    const property = ruleField[3];
    const detail = ruleField[4];
    const itemLabel = `${collection}第 ${index} 条`;

    if (!property && detail === 'must be an object.') {
      return `${itemLabel}需要是一个对象。`;
    }

    if (!property && detail === 'must include "hostname" or "hostnameEndsWith".') {
      return `${itemLabel}至少要填写 hostname 或 hostnameEndsWith。`;
    }

    if (property === 'pathExact' && detail === 'must be an array of paths.') {
      return `${itemLabel}里的 pathExact 需要是路径数组。`;
    }

    if (property === 'pathPrefix' && detail === 'must be a non-empty string.') {
      return `${itemLabel}里的 pathPrefix 不能为空。`;
    }

    if (property === 'groupKey' && detail === 'must be a non-empty string.') {
      return `${itemLabel}里的 groupKey 不能为空。`;
    }

    if (property === 'groupLabel' && detail === 'must be a non-empty string.') {
      return `${itemLabel}里的 groupLabel 不能为空。`;
    }
  }

  return error;
}
