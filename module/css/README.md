# css/ - 样式表目录

本目录存放游戏的所有 CSS 样式文件。

## 文件列表

| 文件名 | 用途 | 加载顺序 |
|--------|------|---------|
| `index.css` | 全局样式和基础设置 | 1 |
| `ui.css` | UI 组件样式（对话框、按钮等） | 2 |
| `animation.css` | 动画效果定义 | 3 |
| `start_screen_styles.css` | 启动画面专用样式 | 4 |

## 详细说明

### index.css - 全局样式
定义游戏的全局样式，包括：
- CSS 变量（颜色、字体、间距等）
- 自定义字体引入
- 古风暗色主题
- 动态背景动画
- 基础布局和排版

**关键变量**：
```css
:root {
    --primary-red: rgba(120, 0, 50, 0.45);
    --secondary-green: #2a2f1f;
    --text-light: #E2E2E2;
    --bg-main: #0D0D0D;
    --border-radius: 12px;
    --font-primary: 'FZBeiwaiKai', 'FZXingKai', 'GardenMing', 'SIMKAI', serif;
}
```

### ui.css - UI 组件样式
定义游戏 UI 组件样式，包括：
- 左右双卡片布局
- 竖排文字支持（`writing-mode: vertical-rl`）
- 打字机光标效果
- 选择按钮样式
- 故事标题和角色名样式

**主要类**：
```css
.image-card          /* 图片卡片 */
.text-section        /* 文本区域 */
.story-title         /* 故事标题（竖排） */
.story-character     /* 角色名 */
.story-text          /* 正文（竖排） */
.choice-btn          /* 选择按钮 */
.typing-cursor       /* 打字机光标 */
```

### animation.css - 动画效果
定义各种动画效果，包括：
- 淡入淡出（`fadeIn`, `fadeOut`）
- 滑入滑出（`slideIn`, `slideOut`）
- 缩放效果（`scaleIn`, `scaleOut`）
- 旋转效果（`rotate`）
- 脉冲效果（`pulse`）

**使用方式**：
```css
.element {
    animation: fadeIn 0.3s ease;
}
```

### start_screen_styles.css - 启动画面样式
定义启动画面的专用样式，包括：
- 主按钮样式
- 模态弹窗样式
- 设置项样式
- 滑块控件样式
- 粒子特效容器

## CSS 架构特点

1. **CSS 变量**：使用 CSS 自定义属性，便于主题切换和维护
2. **古风设计**：采用暗色调、古风字体、竖排文字
3. **响应式**：支持不同屏幕尺寸的适配
4. **动画优先**：大量使用 CSS 动画，提升用户体验
5. **模块化**：按功能分离，便于维护

## 修改指南

### 更改主题颜色
在 `index.css` 中修改 `:root` 变量：
```css
:root {
    --primary-red: rgba(255, 0, 0, 0.5); /* 改为红色 */
}
```

### 更改字体
在 `index.css` 的 `@font-face` 定义中修改：
```css
@font-face {
    font-family: 'FZXingKai';
    src: url('../fonts/your-font.woff') format('woff');
}
```

### 添加新动画
在 `animation.css` 中添加：
```css
@keyframes newAnimation {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
}
```

## 注意事项

1. 使用 CSS 变量而不是硬编码颜色值，便于主题切换
2. 竖排文字需要设置 `writing-mode: vertical-rl`
3. 动画时长建议在 0.2s - 0.5s 之间，过快会显得突兀
4. 避免使用 `!important`，除非必要
5. 浏览器兼容性要求：支持现代浏览器（Chrome, Firefox, Safari, Edge）