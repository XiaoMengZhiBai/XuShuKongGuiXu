# libs/ - 核心库目录

本目录存放游戏的核心功能库文件。

## 文件列表

### 基础工具类

| 文件名 | 用途 | 全局对象 |
|--------|------|---------|
| `utils.js` | 基础工具集（日志、延迟） | `GlobalUtils` |
| `error_handler.js` | 错误处理和全局捕获 | `ErrorHandler` |
| `resource_loader.js` | 资源加载器（脚本、CSS） | `ResourceLoader` |
| `ss_modal_manager.js` | 启动画面模态框管理器 | `SSModalManager` |

### 启动画面相关

| 文件名 | 用途 | 全局对象 |
|--------|------|---------|
| `light_effects.js` | 光影特效（Canvas 粒子动画） | `LightFX` |
| `start_screen.js` | 启动画面和菜单系统 | `StartScreen` |
| `css_loader.js` | CSS 动画加载器 | `CssLoader` |

### 游戏核心

| 文件名 | 用途 | 全局对象 |
|--------|------|---------|
| `storyEngine.js` | 剧情引擎（节点导航、选择分支） | `StoryEngine` |
| `html_element_creator.js` | HTML 元素创建器 | `HtmlElementCreator` |
| `typewriter_utils.js` | 打字机效果工具 | `TypewriterUtils` |
| `json_extractor.js` | JSON 文件加载和解析 | `JsonExtractor` |
| `game_render.js` | 游戏渲染器 | `GameRender` |
| `MediaManager.js` | 媒体管理器（音频、视频） | `MediaManager` |
| `game_init.js` | 游戏初始化模块 | `GameInit` |

### 游戏系统

| 文件名 | 用途 | 全局对象 |
|--------|------|---------|
| `GameSystem.js` | 游戏系统管理器（存档、设置、变量） | `GameSystem` |
| `GameUI.js` | 游戏 UI 管理器（菜单、快捷键） | `GameUI` |

### 背包系统

| 文件名 | 用途 | 全局对象 |
|--------|------|---------|
| `InventorySystem.js` | 背包系统（物品、装备） | `InventorySystem` |
| `InventoryUI.js` | 背包 UI 管理器 | `InventoryUI` |

## 详细说明

### utils.js - 基础工具集
提供日志记录和延迟功能：
```javascript
GlobalUtils.log(...args)      // 日志输出（支持 DEBUG 模式）
GlobalUtils.delay(ms)         // 延迟执行
```

### error_handler.js - 错误处理器
提供统一的错误处理和全局捕获：
```javascript
ErrorHandler.warn(message, details)
ErrorHandler.error(message, details)
ErrorHandler.fatal(message, details)
ErrorHandler.initGlobalCapture()  // 初始化全局错误捕获
```

### resource_loader.js - 资源加载器
加载脚本和 CSS 文件：
```javascript
ResourceLoader.loadScripts(urls)   // 加载脚本
ResourceLoader.loadCSSFiles(urls)  // 加载 CSS
ResourceLoader.loadWithRetry(url)  // 带重试的加载
```

### storyEngine.js - 剧情引擎
核心剧情系统，支持：
- 节点导航和跳转
- 选择分支
- 历史记录和回退
- 自动保存
- 插件系统

```javascript
const engine = new StoryEngine(options);
await engine.init();
engine.goTo(nodeId);
engine.getCurrentNode();
engine.getHistory();
```

### GameSystem.js - 游戏系统管理器
管理存档、设置、变量等：
```javascript
GameSystem.createSave(slot)          // 创建存档
GameSystem.loadSave(slot)            // 读取存档
GameSystem.restoreToEngine(saveData) // 恢复存档
GameSystem.setVariable(key, value)   // 设置变量
GameSystem.getVariable(key)          // 获取变量
GameSystem.unlockAchievement(id)     // 解锁成就
```

### GameUI.js - 游戏 UI 管理器
管理游戏菜单和快捷键：
```javascript
GameUI.showSaveMenu()      // 显示存档菜单
GameUI.showLoadMenu()      // 显示读取菜单
GameUI.showSettingsMenu()  // 显示设置菜单
GameUI.showLogMenu()       // 显示日志菜单
GameUI.showGameMenu()      // 显示游戏菜单
GameUI.showNotification(title, message, type)  // 显示通知
```

### InventorySystem.js - 背包系统
管理物品和装备：
```javascript
InventorySystem.addItem(itemId, quantity)  // 添加物品
InventorySystem.removeItem(itemId, quantity)  // 移除物品
InventorySystem.equipItem(itemId)          // 装备物品
InventorySystem.unequipItem(slotType)      // 卸下装备
InventorySystem.getAllItems(filterType)   // 获取所有物品
InventorySystem.getTotalStats()            // 获取总属性
```

### InventoryUI.js - 背包 UI 管理器
显示背包和装备界面：
```javascript
InventoryUI.showInventory()    // 显示背包界面
InventoryUI.showEquipment()    // 显示装备界面
InventoryUI.showItemDetail(itemId)  // 显示物品详情
```

## 设计模式

### 单例模式
核心系统类使用单例模式：
```javascript
class GameSystem {
    constructor() {
        if (GameSystem.instance) return GameSystem.instance;
        // ...
        GameSystem.instance = this;
    }
}
```

### 模块模式
使用 IIFE 封装模块：
```javascript
;(() => {
    'use strict';
    // 私有变量和方法
    class ModuleClass { }
    window.ModuleName = new ModuleClass();
})();
```

### 观察者模式
使用自定义事件进行模块间通信：
```javascript
engine.on('beforeRender', (data) => { });
engine.emit('afterRender', data);
```

## 依赖关系

```
utils.js
    ↓
error_handler.js
    ↓
resource_loader.js
    ↓
ss_modal_manager.js
    ↓
start_screen.js + light_effects.js + css_loader.js
    ↓
html_element_creator.js + typewriter_utils.js + json_extractor.js
    ↓
storyEngine.js + MediaManager.js + GameRender.js
    ↓
game_init.js
    ↓
GameSystem.js + GameUI.js + InventorySystem.js + InventoryUI.js
```

## 注意事项

1. 所有模块都使用 `'use strict'` 模式
2. 全局对象暴露到 `window`，私有方法使用 `_` 前缀
3. 异步操作使用 `async/await`，错误需要 try-catch
4. 事件处理使用事件委托，提高性能
5. 避免循环依赖，确保模块加载顺序正确