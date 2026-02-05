# fonts/ - 字体资源目录

本目录存放游戏运行所需的中文字体文件。

## 字体列表

| 文件名 | 字体名称 | 用途 | 描述 |
|--------|---------|------|------|
| `方正北魏楷书_GBK.woff` | 方正北魏楷书 | 主要字体 | 古风楷体，适合标题和重要文字 |
| `方正行楷_GBK.woff` | 方正行楷 | 主要字体 | 古风行楷，适合正文和对话 |
| `花园明朝体A.woff` | 花园明朝体 | 补充字体 | 日式明朝体，适合注释和说明 |
| `mplus-1m-regular.woff` | M PLUS 1p Regular | 补充字体 | 日文字体，界面元素使用 |
| `mplus-2p-bold-sub.woff` | M PLUS 2p Bold | 补充字体 | 日文粗体，按钮和标题使用 |
| `SIMKAI.woff` | 楷体 | 补充字体 | 系统楷体，备用字体 |

## 字体优先级

游戏会按以下优先级尝试加载字体：

1. **方正行楷_GBK** - 主要对话字体
2. **方正北魏楷书_GBK** - 标题和强调文字
3. **花园明朝体A** - 注释和说明文字
4. **SIMKAI** - 备用字体

如果以上字体都不可用，将使用系统默认字体。

## CSS 字体引用

字体在 `module/css/index.css` 中通过 `@font-face` 定义：

```css
@font-face {
    font-family: 'FZXingKai';
    src: url('../fonts/方正行楷_GBK.woff') format('woff');
}

@font-face {
    font-family: 'FZBeiwaiKai';
    src: url('../fonts/方正北魏楷书_GBK.woff') format('woff');
}
```

## 字体大小

- `.woff` 格式文件大小范围：100KB - 500KB
- 总字体文件大小：约 1.5MB

## 注意事项

1. 这些字体文件受版权保护，仅供本项目使用
2. 如需更换字体，请确保字体文件格式为 `.woff` 或 `.woff2`
3. 更新字体后，需要在 CSS 中更新 `@font-face` 定义
4. 某些浏览器可能有字体加载限制，建议使用 Web Safe 字体作为备用