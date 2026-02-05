# js/ - JavaScript 脚本目录

本目录存放游戏的所有 JavaScript 代码文件。

## 目录结构

```
js/
├── main.js      # 应用启动器和资源协调器
├── libs/        # 核心库文件
└── Json/        # JSON 配置文件
```

## 文件说明

### main.js - 应用启动器
**作用**：协调所有模块的加载和初始化，管理启动流程

**主要功能**：
- 分阶段资源加载（核心依赖 → 启动画面 → 游戏核心）
- 管理加载状态和错误处理
- 提供平滑的启动画面过渡
- 输出加载总结报告

**关键方法**：
```javascript
async run()              // 启动整个应用
async loadWithRetry()    // 带重试机制的加载
logLoadingSummary()     // 输出加载总结
```

**依赖关系**：无（顶层启动器）

### libs/ - 核心库目录
存放所有核心功能库，详细说明见 `libs/README.md`

### Json/ - JSON 配置目录
存放 JSON 格式的配置文件，包括启动画面配置等

## 加载流程

```
DOMContentLoaded
    ↓
加载核心依赖（同步）
    ├── error_handler.js
    ├── utils.js
    ├── resource_loader.js
    └── ss_modal_manager.js
    ↓
实例化 AppLauncher
    ↓
加载 CSS 文件
    ↓
加载启动画面脚本
    ├── light_effects.js
    ├── start_screen.js
    └── css_loader.js
    ↓
初始化启动画面和光影效果
    ↓
并行操作：
    ├── 加载游戏核心脚本（后台）
    └── 等待用户点击"开始游戏"
    ↓
销毁启动画面
    ↓
初始化游戏逻辑
    ├── LogicSystem.init()
    ├── GameInit()
    └── UIInit()
    ↓
派发 app:ready 事件
```

## 模块化设计

所有 JavaScript 模块都使用 IIFE（立即执行函数表达式）封装：

```javascript
;(() => {
    'use strict';

    // 模块代码

    // 暴露到全局
    window.ModuleName = ModuleClass;

})();
```

**优点**：
- 避免全局命名空间污染
- 创建私有作用域
- 支持 `use strict` 模式

## 全局对象暴露

核心模块通过 `window` 对象暴露到全局，供其他模块调用：

```javascript
window.ErrorHandler     // 错误处理器
window.GlobalUtils      // 全局工具集
window.ResourceLoader   // 资源加载器
window.SSModalManager   // 模态框管理器
window.StartScreen      // 启动画面
window.LightFX          // 光影特效
window.CssLoader        // CSS 加载器
window.StoryEngine      // 剧情引擎
window.HtmlElementCreator  // HTML 元素创建器
window.TypewriterUtils     // 打字机工具
window.JsonExtractor       // JSON 提取器
window.MediaManager        // 媒体管理器
window.GameInit            // 游戏初始化
window.GameSystem          // 游戏系统
window.GameUI              // 游戏 UI
window.InventorySystem     // 背包系统
window.InventoryUI         // 背包 UI
```

## 错误处理

所有模块的错误都由 `ErrorHandler` 统一处理：

```javascript
try {
    // 模块代码
} catch (e) {
    ErrorHandler.error('模块名称', e);
}
```

## 注意事项

1. **模块依赖**：添加新模块时，需要在 `main.js` 中注册加载
2. **命名规范**：全局对象使用 PascalCase，私有方法使用 `_` 前缀
3. **错误处理**：所有异步操作都需要 try-catch 处理
4. **日志输出**：使用 `GlobalUtils.log()` 而不是 `console.log()`，支持 DEBUG 模式
5. **性能优化**：避免在循环中创建函数，使用事件委托处理大量事件