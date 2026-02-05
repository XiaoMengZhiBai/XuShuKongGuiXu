# saves/ - 存档目录

本目录存放游戏存档数据（本地存储）。

## 说明

本目录目前为空，游戏存档数据存储在浏览器的 `localStorage` 中，而不是存储在文件系统中。

## 存档机制

### 存储位置
游戏使用浏览器的 `localStorage` API 存储存档数据：

```javascript
// 存档数据键名
xushuguisxu_save_1    // 存档位 1
xushuguisxu_save_2    // 存档位 2
...
xushuguisxu_save_10   // 存档位 10
xushuguisxu_quicksave // 快速存档
```

### 存档数据结构
```javascript
{
  "version": "1.0",
  "timestamp": 1234567890,
  "playTime": 3600,
  "currentNodeId": "chapter1_scene2",
  "history": ["start", "chapter1_scene1"],
  "variables": {
    "sanity": 100,
    "karma": 0
  },
  "achievements": ["first_encounter"],
  "storyData": { ... }
}
```

## 存档数量

- **普通存档**：10 个（存档位 1-10）
- **快速存档**：1 个（F6 快捷键）

## 存档操作

### 创建存档
```javascript
GameSystem.createSave(slot)  // slot: 1-10
```

### 读取存档
```javascript
GameSystem.loadSave(slot)   // slot: 1-10
```

### 删除存档
```javascript
GameSystem.deleteSave(slot)
```

### 快速存档
```javascript
GameUI.quickSave()  // F6 快捷键
```

### 快速读取
```javascript
GameUI.quickLoad()  // F8 快捷键
```

## 存档管理

### 查看存档列表
```javascript
const saves = GameSystem.getSaveList();
// 返回：
// [
//   { slot: 1, timestamp: 1234567890, playTime: 3600, currentNodeId: "..." },
//   { slot: 2, timestamp: 1234567900, playTime: 7200, currentNodeId: "..." },
//   ...
// ]
```

### 导出存档数据
```javascript
const data = GameSystem.exportData();
// 返回所有游戏数据（设置、变量、成就、日志、存档）
```

### 清除所有数据
```javascript
GameSystem.clearAllData();
// 清除所有存档、设置、变量、成就等
```

## 存档限制

- **单个存档大小**：约 50KB - 200KB（取决于剧情数据大小）
- **总存储限制**：约 5MB（localStorage 默认限制）
- **自动保存**：每次剧情节点切换时自动保存

## 注意事项

1. **浏览器限制**：不同浏览器的 localStorage 限制可能不同
2. **隐私模式**：在隐私/无痕模式下，存档数据可能在关闭浏览器后丢失
3. **跨设备同步**：localStorage 数据不会自动同步到其他设备
4. **数据备份**：建议定期导出存档数据作为备份
5. **清除数据**：清除浏览器数据会删除所有存档

## 未来扩展

未来版本可能支持以下功能：

1. **文件存档**：将存档保存为 `.json` 文件，便于备份和分享
2. **云存档**：支持云存储，跨设备同步
3. **存档截图**：在存档列表中显示游戏截图
4. **自动存档**：定期自动存档
5. **存档管理**：存档重命名、排序、分类等功能

## 调试

### 查看当前存档数据
在浏览器控制台中执行：
```javascript
// 查看所有存档
for (let i = 1; i <= 10; i++) {
  const save = localStorage.getItem(`xushuguisxu_save_${i}`);
  console.log(`存档 ${i}:`, save ? JSON.parse(save) : '空');
}

// 查看快速存档
const quickSave = localStorage.getItem('xushuguisxu_quicksave');
console.log('快速存档:', quickSave ? JSON.parse(quickSave) : '空');
```

### 查看游戏变量
```javascript
const variables = JSON.parse(localStorage.getItem('xushuguisxu_variables'));
console.log('游戏变量:', variables);
```

### 查看设置
```javascript
const settings = JSON.parse(localStorage.getItem('xushuguisxu_settings'));
console.log('游戏设置:', settings);
```