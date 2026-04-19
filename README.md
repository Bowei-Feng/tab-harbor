# Tab Harbor

`Tab Harbor` 是一个面向 Microsoft Edge / Chromium 的 MV3 扩展。它把浏览器的新标签页改造成一个更适合“整理标签页、处理重复页签、暂存待办内容、保存工作区快照”的工作台。

这个项目的目标不是做一个花哨的新标签页，而是把浏览器里分散的标签页重新组织成一个更容易清理、更容易恢复、也更容易长期维护的工作区。

## 当前能力

- 接管新标签页，直接展示当前打开的标签工作区
- 按域名、自定义规则、落地页规则对标签页分组
- 识别重复页签，并支持按组清理重复内容
- 搜索标签标题、URL、域名和分组名称
- 批量选中、批量关闭、批量移到 `Later Dock`
- 将选中的标签页移动到新窗口
- 支持拖拽调整分组优先级
- 支持置顶分组
- 支持键盘导航和快捷操作
- 支持 `Later Dock`、归档记录、最近关闭恢复
- 支持工作区快照的导出、导入、自动保存、标签和备注
- 设置页支持中英文切换

## 技术栈

- `WXT`
- `TypeScript`
- `Vitest`
- `Manifest V3`

## 目录结构

- `typed-src/`
  主应用源码，包含 new-tab 页面、options 页面、后台脚本、领域逻辑和存储层
- `assets/`
  静态资源
- `wxt.config.ts`
  WXT 构建配置
- `package.json`
  本地开发、构建、测试、打包脚本

## 本地开发

安装依赖并执行基础检查：

```bash
npm install
npm test
npm run typecheck
npm run build
```

如果要本地热更新调试：

```bash
npm run dev:edge
```

## 在 Edge 中加载

1. 打开 `edge://extensions`
2. 开启“开发人员模式”
3. 点击“加载解压缩的扩展”
4. 选择 `.output/edge-mv3`

说明：

- `.output` 是隐藏目录，因为目录名以 `.` 开头
- 如果 Finder 默认不显示隐藏目录，可以先显示隐藏文件后再选择

## 发布打包

执行：

```bash
npm run zip
```

会生成：

- `.output/tab-harbor-edge-mv3.zip`

## 质量检查

自动化检查：

- `npm test`
- `npm run typecheck`
- `npm run build`

手工回归清单：

- [QA_CHECKLIST.md](./QA_CHECKLIST.md)

## Git 提交建议

不要提交这些目录：

- `node_modules/`
- `.output/`
- `.wxt/`

建议只提交：

- 源码
- 配置文件
- 锁文件
- 文档

## 项目说明

当前仓库已经从早期原型收口到 `typed-src` 这一条主线。后续如果继续迭代，建议优先沿着下面三条线推进：

- 功能回归测试继续补齐，尤其是快照恢复和批量操作
- 界面继续做信息密度优化，让首屏看到更多真实标签分组
- 持续保持领域逻辑、渲染层、浏览器适配层分离，降低后续维护成本
