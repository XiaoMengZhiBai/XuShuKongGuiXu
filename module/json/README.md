# json/ - 游戏数据配置目录

本目录存放游戏的所有数据配置文件。

## 文件列表

| 文件名 | 用途 | 格式 |
|--------|------|------|
| `story.json` | 基础剧情数据 | JSON |
| `story_enhanced.json` | 增强剧情数据（含变量、成就） | JSON |
| `story_template.json` | 剧情模板文件 | JSON |
| `equipment.json` | 装备数据配置 | JSON |

## 详细说明

### story.json - 基础剧情数据
存放游戏的基础剧情数据，包含所有剧情节点。

**结构**：
```json
{
  "start": {
    "id": "1",
    "title": "幽墟入口",
    "character": "旁白",
    "text": "风声穿过残破的石门...",
    "background": "data/bg/1.jpg",
    "bgm": "data/bgm/佳人伴孤灯（竹笛）.mp3",
    "choices": [
      {
        "text": "继续",
        "target": "encounter_ghost"
      }
    ]
  }
}
```

**字段说明**：
- `id` - 节点 ID（唯一标识）
- `title` - 节点标题
- `character` - 角色名称
- `text` - 对话文本
- `background` - 背景图片路径
- `bgm` - 背景音乐路径
- `choices` - 选择选项列表
- `next` - 自动跳转的下一节点 ID

### story_enhanced.json - 增强剧情数据
增强版剧情数据，支持变量系统、成就系统、角色定义等。

**结构**：
```json
{
  "meta": {
    "version": "2.0",
    "title": "虚数归墟",
    "author": "晓梦",
    "startNode": "chapter1_prologue"
  },
  "characters": {
    "protagonist": {
      "name": "你",
      "avatar": "",
      "color": "#ffcccc"
    }
  },
  "variables": {
    "sanity": 100,
    "karma": 0,
    "encountered_ghost": false
  },
  "achievements": {
    "first_encounter": {
      "id": "first_encounter",
      "name": "初遇",
      "description": "第一次遇到神秘女子",
      "hidden": false
    }
  },
  "nodes": {
    "chapter1_prologue": {
      "id": "c1_p0",
      "type": "narrative",
      "actions": [
        { "type": "setVar", "key": "chapter_progress", "value": 1 }
      ],
      "choices": [...]
    }
  }
}
```

**新增功能**：
- `meta` - 元数据（版本、作者、起始节点）
- `characters` - 角色定义
- `variables` - 游戏变量
- `achievements` - 成就定义
- `nodes` - 增强节点（支持动作、条件判断）

### story_template.json - 剧情模板
剧情模板文件，用于快速创建新剧情节点。

**用途**：
- 提供标准节点结构
- 包含所有可用字段示例
- 作为开发参考

### equipment.json - 装备数据配置
存放游戏的所有装备和物品数据。

**结构**：
```json
{
  "version": "1.0",
  "itemTypes": {
    "headwear": "头饰",
    "earring": "耳饰",
    ...
  },
  "equipmentSlots": {
    "headwear": {
      "name": "头饰",
      "icon": "🎩",
      "max": 1
    }
  },
  "itemQuality": {
    "common": {
      "name": "普通",
      "color": "#ffffff",
      "border": "#888888"
    }
  },
  "items": {
    "headwear_1": {
      "id": "headwear_1",
      "name": "布巾",
      "type": "headwear",
      "quality": "common",
      "icon": "🎗️",
      "description": "普通的布巾，简单遮风挡雨。",
      "stats": {
        "defense": 2,
        "hp": 5
      },
      "price": 50
    }
  },
  "startingItems": [
    "headwear_1",
    "earring_1",
    ...
  ]
}
```

**装备槽位**（11个）：
- `headwear` - 头饰
- `earring` - 耳饰
- `necklace` - 项链
- `underwear` - 内衣
- `panties` - 内裤
- `socks` - 袜子
- `top` - 上衣
- `bottom` - 下装
- `bracelet` - 手饰
- `anklet` - 脚链
- `shoes` - 鞋子

**物品品质**（5种）：
- `common` - 普通（白色）
- `uncommon` - 优秀（绿色）
- `rare` - 稀有（蓝色）
- `epic` - 史诗（紫色）
- `legendary` - 传说（橙色）

## 使用方式

### 加载剧情数据
```javascript
const storyData = await JsonExtractor.load('module/json/story.json');
const engine = new StoryEngine({ storyData });
await engine.init();
```

### 加载装备数据
```javascript
await InventorySystem._loadItemData();
await InventorySystem.addStartingItems();
```

## 文件大小

- `story.json` - 约 10KB
- `story_enhanced.json` - 约 50KB
- `story_template.json` - 约 5KB
- `equipment.json` - 约 20KB

## 注意事项

1. 所有 JSON 文件必须符合标准 JSON 格式（使用双引号）
2. 节点 ID 必须唯一，建议使用有意义的命名
3. 路径使用相对路径，以 `data/` 开头
4. 修改数据后，建议使用 JSON 验证工具检查格式
5. 支持添加注释（使用 JSONC 格式或通过注释字段）
6. 建议使用版本控制，便于回滚和对比