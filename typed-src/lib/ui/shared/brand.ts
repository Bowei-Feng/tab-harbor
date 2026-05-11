import { escapeHtml } from '@/lib/ui/shared/html';

interface BrandRenderOptions {
  caption?: string;
}

// 品牌锁定块在 newtab 和 options 两个页面都会出现，抽到共享模块后，
// 后续只需要改一处就能保持两边一致。
export function renderBrandLockup(options: BrandRenderOptions = {}): string {
  return `
    <div class="brand-row">
      <span class="brand-mark" aria-hidden="true">
        <img src="/assets/icons/icon-128.png" alt="" />
      </span>
      <div>
        <p class="eyebrow">Tab Harbor</p>
        ${options.caption ? `<p class="brand-caption">${escapeHtml(options.caption)}</p>` : ''}
      </div>
    </div>
  `;
}
