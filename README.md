# 虚数归墟 - 视觉小说引擎

> 融合古风美学与科学幻想的交互式视觉小说游戏引擎

## 项目简介

《虚数归墟》是一款基于 Web 技术开发的视觉小说引擎，采用模块化架构设计，支持粒子特效、光影效果、打字机文字显示等丰富功能。项目融合了古风美学与科学幻想，为玩家营造神秘而优雅的视觉体验。

## 技术特性

- **模块化架构**：采用 IIFE 模式封装模块，避免全局命名空间污染
- **异步加载**：使用 Promise 实现资源异步加载，避免阻塞页面渲染
- **粒子特效**：基于 Canvas 的高性能粒子动画系统
- **光影效果**：支持动态光影和渐变背景
- **打字机效果**：支持垂直和水平方向的文字逐字显示
- **错误处理**：完善的错误捕获和用户友好的错误提示
- **自动保存**：支持游戏进度自动保存和恢复

## 项目结构

```
XuShuGuiXu/
├── data/              # 游戏数据目录
│   ├── bg/           # 背景图片
│   ├── bgm/          # 背景音乐
│   ├── char/         # 角色资源
│   └── se/           # 音效
├── fonts/            # 字体文件
├── icon/             # 图标资源
├── module/           # 核心模块
│   ├── css/          # 样式文件
│   ├── json/         # 配置文件
│   └── js/           # JavaScript 模块
│       ├── main.js               # 应用启动器
│       └── libs/                 # 核心库
│           ├── css_loader.js          # CSS 加载器
│           ├── error_handler.js       # 错误处理器
│           ├── game_init.js           # 游戏初始化
│           ├── game_render.js         # 游戏渲染
│           ├── html_element_creator.js # HTML 元素创建器
│           ├── json_extractor.js      # JSON 提取器
│           ├── light_effects.js       # 光影特效
│           ├── MediaManager.js        # 媒体管理器
│           ├── resource_loader.js     # 资源加载器
│           ├── ss_modal_manager.js    # 模态框管理器
│           ├── start_screen.js        # 启动画面
│           ├── storyEngine.js         # 剧情引擎
│           ├── typewriter_utils.js    # 打字机工具
│           └── utils.js               # 工具函数
├── saves/            # 存档目录
└── game.html         # 入口文件
```

## 核心模块说明

### 1. 应用启动器 (main.js)

**功能**：
- 协调所有模块的加载和初始化
- 实现核心依赖的异步加载
- 管理加载状态和错误处理
- 提供平滑的启动画面过渡

**主要方法**：
- `run()` - 启动整个应用
- `loadWithRetry()` - 带重试机制的加载方法
- `logLoadingSummary()` - 输出加载总结报告

### 2. 错误处理器 (error_handler.js)

**功能**：
- 提供统一的错误日志输出
- 全局错误捕获（Promise 和同步错误）
- 安全的错误显示（XSS 防护）
- 用户友好的错误提示

**主要方法**：
- `warn(message, details)` - 输出警告信息
- `error(message, details)` - 输出错误信息
- `fatal(message, details)` - 处理致命错误
- `handleNonFatalError(message, details)` - 处理非致命错误

**安全特性**：
- 所有用户输入都经过 HTML 转义，防止 XSS 攻击
- 使用 `textContent` 替代 `innerHTML` 插入用户内容

### 3. 剧情引擎 (storyEngine.js)

**功能**：
- 管理剧情节点的导航
- 支持选择分支
- 历史记录和回退功能
- 自动保存游戏进度

**主要方法**：
- `init()` - 初始化引擎
- `goTo(nodeId, opts)` - 跳转到指定节点
- `getCurrentNode()` - 获取当前节点
- `getHistory()` - 获取历史记录
- `replaceStoryData(storyData, startNodeId)` - 替换故事数据

### 4. 打字机工具 (typewriter_utils.js)

**功能**：
- 逐字显示文本效果
- 支持垂直和水平方向
- 处理换行符和特殊字符

**主要方法**：
- `display(targetElement, textContent, isVertical, speed)` - 显示打字机效果
- `displayImmediately(targetElement, textContent, isVertical)` - 立即显示文本

### 5. 光影特效 (light_effects.js)

**功能**：
- 基于 Canvas 的粒子动画
- 涡旋运动效果
- 动态颜色渐变
- 平滑的淡入淡出

**主要方法**：
- `init()` - 初始化光影特效
- `fadeOut()` - 淡出效果
- `destroy()` - 销毁特效，释放资源

**性能优化**：
- 正确释放 Canvas 上下文和 GPU 资源
- 移除事件监听器
- 清空引用，帮助垃圾回收

### 6. CSS 加载器 (css_loader.js)

**功能**：
- 动态加载 CSS 文件
- 自动应用 data-animation 属性的动画
- 从 CSS 中提取关键帧动画

**主要方法**：
- `loadCSS(url)` - 加载单个 CSS 文件
- `loadAll(urls)` - 批量加载 CSS 文件
- `autoApplyAnimations(defaultDuration)` - 自动应用动画
- `applyAnimationsFromCSS(defaultDuration)` - 从 CSS 提取并应用动画

### 7. 模态框管理器 (ss_modal_manager.js)

**功能**：
- 创建和管理启动画面的模态框
- 支持自定义标题、内容和按钮
- 提供关于对话框和错误对话框

**主要方法**：
- `show(options)` - 显示模态框
- `hide()` - 隐藏当前模态框
- `hideAll()` - 隐藏所有模态框
- `showAbout()` - 显示关于对话框
- `showError(message, details)` - 显示错误对话框
- `showConfirm(message, onConfirm, onCancel)` - 显示确认对话框

## 安全修复记录

### 已修复的安全问题

1. **XSS 漏洞修复**
   - 位置：`error_handler.js`
   - 问题：错误详情直接插入 HTML 未经过清理
   - 修复：添加 HTML 转义函数，使用 `textContent` 或转义后的 HTML

2. **重复错误监听器**
   - 位置：`main.js`
   - 问题：`AppLauncher.setupErrorHandling()` 和 `ErrorHandler.initGlobalCapture()` 都设置了全局错误监听
   - 修复：移除 `AppLauncher.setupErrorHandling()`，统一由 ErrorHandler 管理

3. **空值检查缺失**
   - 位置：`main.js`
   - 问题：`e.detail?.isNewGame` 未检查 `e.detail` 是否存在
   - 修复：添加完整的空值检查

4. **内存泄漏**
   - 位置：`light_effects.js`
   - 问题：Canvas 销毁时未释放上下文和 GPU 资源
   - 修复：正确释放 Canvas 上下文，移除事件监听器，清空引用

5. **DOM 操作效率**
   - 位置：`storyEngine.js`
   - 问题：使用 `innerHTML = ''` 清除容器效率低
   - 修复：使用 `removeChild` 循环删除子元素

## 开发指南

### 启动流程

1. 加载核心依赖（ErrorHandler、Utils、ResourceLoader 等）
2. 初始化 AppLauncher
3. 加载 CSS 文件
4. 加载启动画面脚本
5. 初始化启动动画和光影效果
6. 并行加载游戏核心脚本
7. 等待用户点击"开始游戏"
8. 销毁启动画面
9. 初始化游戏逻辑

### 扩展开发

#### 添加新的剧情节点

编辑 `module/json/story.json`，添加新的节点配置：

```json
{
  "node1": {
    "title": "第一章",
    "character": "主角",
    "text": "这是第一段剧情文本。",
    "choices": [
      { "text": "选择 A", "target": "node2" },
      { "text": "选择 B", "target": "node3" }
    ]
  }
}
```

#### 自定义样式

编辑 `module/css/` 下的 CSS 文件，添加自定义样式：

```css
.story-node {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a9eff;
  border-radius: 10px;
  padding: 20px;
}
```

#### 添加新的动画

在 CSS 文件中定义关键帧动画：

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

然后在 HTML 中使用：

```html
<div data-animation="fadeIn">内容</div>
```

## 浏览器兼容性

- Chrome/Edge：完全支持
- Firefox：完全支持
- Safari：完全支持
- 移动浏览器：基本支持（建议使用 Chrome）

## 性能优化建议

1. **资源压缩**：使用工具压缩 CSS、JavaScript 和图片资源
2. **懒加载**：大体积资源按需加载
3. **缓存策略**：合理设置 HTTP 缓存头
4. **代码分割**：将常用功能和不常用功能分离
5. **图片优化**：使用 WebP 格式，提供不同分辨率的图片

## 常见问题

### Q: 游戏启动失败怎么办？

A: 检查以下几点：
1. 确保网络连接正常
2. 打开浏览器控制台查看错误信息
3. 检查核心依赖文件是否存在
4. 尝试清除浏览器缓存

### Q: 如何重置游戏进度？

A: 在浏览器控制台执行：

```javascript
localStorage.removeItem('story_engine_state_v1');
location.reload();
```

### Q: 如何自定义打字机速度？

A: 在调用 `TypewriterUtils.display()` 时传入 `speed` 参数：

```javascript
TypewriterUtils.display(element, text, true, 100); // 100ms/字符
```

## 许可证

Copyright © 2024 虚数归墟 · All Rights Reserved

## 贡献者

- 晓梦
- Grok
- ChatGPT
- Gemini

## 更新日志

### v3.1 (2024-02-03)

**安全修复**：
- 修复 XSS 漏洞（HTML 转义）
- 实现缺失的 `handleNonFatalError` 方法
- 移除重复的错误监听器

**性能优化**：
- 修复内存泄漏问题（Canvas 资源释放）
- 优化 DOM 操作（使用 `removeChild` 替代 `innerHTML`）

**代码质量**：
- 添加详细的中文注释
- 规范变量命名
- 完善 JSDoc 类型注释

**功能增强**：
- 实现 SSModalManager 模态框管理器
- 添加空值检查
- 修复无效的动画停止逻辑

### v3.0 (2024-01-XX)

- 重构为异步加载架构
- 移除不安全的 `eval()` 使用
- 添加加载重试机制
- 实现事件监听器清理

---

**祝您游戏愉快！** 🎮