// =================== [libs/game_init.js v1.0] ===================
// 游戏初始化模块，负责加载故事数据并渲染初始场景。
// 使用方式：调用 GameInit() 方法启动游戏初始化。
// ==================================================================
(function () {
    let storyMap = null;      // 全部节点 DOM Map
    let currentNodeId = null; // 当前节点 ID
    let storyData = null;     // 原始 JSON 数据
    const container = document.getElementById('game-container');

    if (!container) {
        console.error('❌ Game container not found!');
        return;
    }

    // ======================== 渲染指定节点 ========================
    function renderNode(nodeId) {
        if (!storyMap || !storyMap.has(nodeId)) {
            console.error(`❌ Node not found: ${nodeId}`);
            container.innerHTML = `<p style="color:red;">节点未找到: ${nodeId}</p>`;
            return;
        }

        // 清空并添加节点
        const nodeElement = storyMap.get(nodeId);
        container.innerHTML = '';
        container.appendChild(nodeElement);

        currentNodeId = nodeId;
    }

    // ======================== 点击事件处理 ========================
    function setupClickEvents() {
        container.addEventListener('click', (event) => {
            const target = event.target;

            // ✅ 使用 closest 支持嵌套元素点击
            const choiceBtn = target.closest('.choice-btn, .next-btn');
            if (!choiceBtn) return;

            const nextId = choiceBtn.getAttribute('data-target');
            if (!nextId) {
                console.warn('⚠️ 没有 data-target 属性', choiceBtn);
                return;
            }

            renderNode(nextId);
        });
    }

    // ======================== 游戏初始化 ========================
    async function initializeGame() {
        container.innerHTML = '<p style="color:white;">加载中...</p>';

        try {
            // ✅ 加载 JSON 数据
            storyData = await JsonExtractor.load('module/json/story.json');
            if (!storyData) throw new Error('Story data is empty!');

            // ✅ 转 DOM Map
            storyMap = HtmlElementCreator.createStoryElementsMap(storyData);
            if (!storyMap || storyMap.size === 0) throw new Error('Story Map is empty!');

            // ✅ 渲染第一个节点
            renderNode('start');

            // ✅ 绑定点击事件
            setupClickEvents();
        } catch (err) {
            console.error('❌ 游戏初始化失败:', err);
            container.innerHTML = `<p style="color:red;">加载失败: ${err.message}</p>`;
        }
    }

    // 暴露初始化接口
    window.GameInit = initializeGame;
})();
