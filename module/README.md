# module/ - 模块目录

本目录存放游戏的所有功能模块，包括 JavaScript 代码、CSS 样式和配置数据。

## 目录结构

```
module/
├── css/          # 样式表文件
├── js/           # JavaScript 脚本文件
│   ├── libs/     # 核心库文件
│   └── Json/     # JSON 配置文件
└── json/         # 游戏数据配置文件
```

## 子目录说明

### css/ - 样式表目录
存放所有 CSS 样式文件，包括：
- 全局样式
- UI 组件样式
- 动画效果
- 启动画面样式

详细说明见 `css/README.md`

### js/ - JavaScript 脚本目录
存放所有 JavaScript 代码文件，包括：
- `main.js` - 应用启动器和资源协调器
- `libs/` - 核心功能库
- `Json/` - JSON 配置文件

详细说明见 `js/README.md` 和 `js/libs/README.md`

### json/ - 游戏数据配置目录
存放游戏数据文件，包括：
- 剧情数据
- 装备数据
- 成就系统数据

详细说明见 `json/README.md`

## 模块依赖关系

```
main.js (启动器)
    ├── css_loader.js
    ├── utils.js
    ├── error_handler.js
    ├── resource_loader.js
    └── ss_modal_manager.js
        ├── light_effects.js
        ├── start_screen.js
        └── css_loader.js
            ├── html_element_creator.js
            ├── typewriter_utils.js
            ├── json_extractor.js
            ├── storyEngine.js
            ├── game_render.js
            ├── MediaManager.js
            ├── game_init.js
            ├── GameSystem.js
            ├── GameUI.js
            ├── InventorySystem.js
            └── InventoryUI.js
```

## 加载顺序

1. **核心依赖**（同步加载）
   - `error_handler.js`
   - `utils.js`
   - `resource_loader.js`
   - `ss_modal_manager.js`

2. **启动画面**（异步加载）
   - `light_effects.js`
   - `start_screen.js`
   - `css_loader.js`

3. **游戏核心**（后台加载）
   - `html_element_creator.js`
   - `typewriter_utils.js`
   - `json_extractor.js`
   - `storyEngine.js`
   - `game_render.js`
   - `MediaManager.js`
   - `game_init.js`
   - `GameSystem.js`
   - `GameUI.js`
   - `InventorySystem.js`
   - `InventoryUI.js`

## 注意事项

1. 修改模块文件时，请注意依赖关系，避免循环依赖
2. 所有 JavaScript 文件都使用 IIFE（立即执行函数表达式）封装，避免全局污染
3. 核心类使用单例模式，通过 `window` 对象暴露到全局
4. 添加新模块时，需要在 `main.js` 的 `GAME_SCRIPT_URLS` 中注册