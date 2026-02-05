// =================== [libs/game_init.js v3.0] ===================
// 游戏初始化模块 - 完整的视觉小说游戏初始化系统
// 功能：
//   - 加载故事数据
//   - 初始化 StoryEngine
//   - 集成 GameSystem（存档、设置、变量等）
//   - 集成 GameUI（菜单系统）
//   - 绑定右键菜单
// 使用方式：调用 GameInit() 方法启动游戏初始化
// ==================================================================
(function () {
    let storyEngine = null;     // StoryEngine 实例
    let startTime = null;       // 游戏开始时间
    const container = document.getElementById('game-container');

    if (!container) {
        console.error('❌ Game container not found!');
        return;
    }

    // ======================== 计算游戏时间 ========================
    function getPlayTime() {
        if (!startTime) return 0;
        return Math.floor((Date.now() - startTime) / 1000);
    }

    // ======================== 绑定右键菜单 ========================
    function bindContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.GameUI) {
                window.GameUI.showGameMenu();
            }
        });
    }

    // ======================== 绑定ESC键 ========================
    function bindEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (window.GameUI) {
                    window.GameUI.showGameMenu();
                }
            }
        });
    }

    // ======================== 从存档恢复 ========================
    async function restoreFromSaveSlot(slot) {
        try {
            console.log(`[GameInit] 正在读取存档 ${slot}...`);
            
            // 读取存档数据
            const saveData = await window.GameSystem.loadSave(slot);
            
            if (!storyEngine) {
                // 如果引擎还未初始化，先初始化
                await initializeEngine(saveData.storyData);
            }
            
            // 恢复存档到引擎
            await window.GameSystem.restoreToEngine(saveData);
            
            console.log('[GameInit] 存档恢复成功');
            return true;
        } catch (e) {
            console.error('[GameInit] 恢复存档失败:', e);
            // 使用游戏内通知替代alert
            if (window.GameUI) {
                window.GameUI.showNotification('❌ 恢复存档失败', e.message, 'error');
            }
            return false;
        }
    }

    // ======================== 初始化引擎 ========================
    async function initializeEngine(storyData = null) {
        // 如果没有提供故事数据，则加载
        if (!storyData) {
            storyData = await JsonExtractor.load('module/json/story.json');
            if (!storyData) throw new Error('Story data is empty!');
        }

        // 检查 StoryEngine 是否可用
        if (typeof StoryEngine === 'undefined') {
            throw new Error('StoryEngine 未加载，请检查脚本加载顺序');
        }

        // 获取游戏设置
        const settings = typeof GameSystem !== 'undefined' ? GameSystem.settings : {};

        // 创建 StoryEngine 实例
        storyEngine = new StoryEngine({
            containerId: 'game-container',
            startNodeId: 'start',
            storyData: storyData,
            enableTypewriter: true,
            typewriterSpeed: settings.typewriterSpeed || 150,
            typewriterVertical: settings.displayMode !== 'horizontal',
            autosaveKey: 'story_engine_state_v1'
        });

        // 记录游戏开始时间
        startTime = Date.now();

        // 绑定 GameSystem 到 StoryEngine
        if (typeof GameSystem !== 'undefined') {
            GameSystem.bindEngine(storyEngine);
            console.log('🔗 GameSystem 已绑定到 StoryEngine');
        }

        // 初始化引擎
        await storyEngine.init();

        return storyEngine;
    }

    // ======================== 游戏初始化 ========================
    async function initializeGame() {
        container.innerHTML = '<p style="color:white; font-family: "方正行楷_GBK", serif; font-size: 18px;">正在加载虚数归墟...</p>';

        try {
            // 1. 初始化游戏系统
            if (typeof GameSystem !== 'undefined') {
                console.log('🔧 GameSystem 已就绪');
            } else {
                console.warn('⚠️ GameSystem 未加载');
            }

            // 2. 初始化游戏UI
            if (typeof GameUI !== 'undefined') {
                GameUI.init();
                console.log('🎨 GameUI 已就绪');
            } else {
                console.warn('⚠️ GameUI 未加载');
            }

            // 3. 初始化背包系统
            if (typeof InventorySystem !== 'undefined') {
                await InventorySystem.init();
                await InventorySystem.addStartingItems();
                if (typeof InventoryUI !== 'undefined') {
                    InventoryUI.init();
                }
                console.log('🎒 背包系统已就绪');
            } else {
                console.warn('⚠️ InventorySystem 未加载');
            }

            // 3. 初始化引擎
            await initializeEngine();

            // 4. 绑定上下文菜单
            bindContextMenu();
            bindEscapeKey();

            console.log('✅ 游戏初始化成功，虚数归墟已启动');
            console.log('📋 快捷键提示：');
            console.log('   F5 - 存档 | F9 - 读取 | F1 - 设置 | F2 - 回顾');
            console.log('   F6 - 快速保存 | F8 - 快速读取 | F11 - 全屏');
            console.log('   Ctrl - 按住跳过 | 右键/ESC - 游戏菜单');

        } catch (err) {
            console.error('❌ 游戏初始化失败:', err);
            container.innerHTML = `
                <div style="color: #ff6b6b; font-family: '方正行楷_GBK', serif; text-align: center; padding: 20px;">
                    <h2 style="margin-bottom: 15px;">❌ 游戏加载失败</h2>
                    <p style="margin-bottom: 10px;">${err.message}</p>
                    <button onclick="location.reload()" style="background: #4a9eff; border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-family: '方正行楷_GBK', serif;">刷新页面</button>
                </div>
            `;

            // 如果 ErrorHandler 可用，使用它显示错误
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.error('游戏初始化失败', err);
            }
        }
    }

    // 暴露初始化接口
    window.GameInit = initializeGame;

    // 暴露从存档恢复的接口
    window.GameInit.restoreFromSaveSlot = restoreFromSaveSlot;

    // 暴露 storyEngine 实例供外部使用（例如调试）
    window.getStoryEngine = () => storyEngine;

    // 暴露游戏时间计算
    window.getPlayTime = getPlayTime;

})();
