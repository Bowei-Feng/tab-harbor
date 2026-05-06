const TOOLTIP_DELAY_MS = 2000;
const TOOLTIP_VIEWPORT_GAP = 12;
const TOOLTIP_CURSOR_OFFSET = 18;

export interface UrlTooltipController {
  hide(): void;
}

export function attachUrlTooltipController(hostDocument: Document = document): UrlTooltipController {
  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;
  let tooltipTarget: HTMLElement | null = null;
  let tooltipPointer = { x: 0, y: 0 };
  let tooltipEl: HTMLDivElement | null = null;
  let tooltipTrackEl: HTMLDivElement | null = null;

  function ensureTooltip() {
    if (tooltipEl && tooltipTrackEl) return;

    tooltipEl = hostDocument.createElement('div');
    tooltipEl.className = 'url-tooltip';
    tooltipEl.innerHTML = '<div class="url-tooltip-track-wrap"><div class="url-tooltip-track"></div></div>';
    tooltipTrackEl = tooltipEl.querySelector<HTMLDivElement>('.url-tooltip-track');
    hostDocument.body.appendChild(tooltipEl);
  }

  function clearTooltipTimer() {
    if (!tooltipTimer) return;
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }

  function positionTooltip() {
    if (!tooltipEl) return;

    const width = tooltipEl.offsetWidth;
    const height = tooltipEl.offsetHeight;
    const left = Math.min(
      window.innerWidth - width - TOOLTIP_VIEWPORT_GAP,
      Math.max(TOOLTIP_VIEWPORT_GAP, tooltipPointer.x - width / 2)
    );
    const top = Math.max(TOOLTIP_VIEWPORT_GAP, tooltipPointer.y - height - TOOLTIP_CURSOR_OFFSET);

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  function hide() {
    clearTooltipTimer();
    tooltipTarget = null;
    if (!tooltipEl || !tooltipTrackEl) return;

    tooltipEl.classList.remove('visible', 'scrolling');
    tooltipEl.style.removeProperty('--tooltip-scroll-distance');
    tooltipTrackEl.textContent = '';
  }

  function show(url: string) {
    ensureTooltip();
    if (!tooltipEl || !tooltipTrackEl) return;

    tooltipTrackEl.textContent = url;
    tooltipEl.classList.add('visible');
    positionTooltip();

    requestAnimationFrame(() => {
      if (!tooltipEl || !tooltipTrackEl) return;
      const scrollDistance = Math.max(0, tooltipTrackEl.scrollWidth - tooltipTrackEl.clientWidth);
      if (scrollDistance > 8) {
        tooltipEl.style.setProperty('--tooltip-scroll-distance', `${scrollDistance}px`);
        tooltipEl.classList.add('scrolling');
      } else {
        tooltipEl.style.removeProperty('--tooltip-scroll-distance');
        tooltipEl.classList.remove('scrolling');
      }
      positionTooltip();
    });
  }

  function schedule(target: HTMLElement, url: string) {
    clearTooltipTimer();
    tooltipTarget = target;
    tooltipTimer = setTimeout(() => {
      if (tooltipTarget !== target) return;
      show(url);
    }, TOOLTIP_DELAY_MS);
  }

  // URL 说明只在悬停稳定后显示，避免列表里常驻网址把注意力从标题和操作上拉走。
  hostDocument.addEventListener('mouseover', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-url-tooltip]');
    if (!target) return;
    if (target === tooltipTarget) return;

    tooltipPointer = { x: event.clientX, y: event.clientY };
    schedule(target, target.dataset.urlTooltip ?? '');
  });

  hostDocument.addEventListener('mousemove', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-url-tooltip]');
    if (!target || target !== tooltipTarget) return;

    tooltipPointer = { x: event.clientX, y: event.clientY };
    if (tooltipEl?.classList.contains('visible')) {
      positionTooltip();
    }
  });

  hostDocument.addEventListener('mouseout', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-url-tooltip]');
    if (!target || target !== tooltipTarget) return;

    const related = (event.relatedTarget as HTMLElement | null)?.closest<HTMLElement>('[data-url-tooltip]');
    if (related === target) return;
    hide();
  });

  hostDocument.addEventListener('scroll', () => {
    if (tooltipEl?.classList.contains('visible')) {
      hide();
    }
  }, true);

  return { hide };
}
