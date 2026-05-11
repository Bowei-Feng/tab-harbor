// 统一放最基础的 HTML 转义，避免各个渲染文件重复维护同一段逻辑。
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
