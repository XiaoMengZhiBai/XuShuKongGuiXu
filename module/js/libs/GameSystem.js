// ======================[GameSystem.js]=====================
// 游戏系统管理器 - 负责存档、设置、日志等核心功能
// 功能：
//   - 存档/读取系统（支持多存档位）
//   - 游戏设置（音量、速度等）
//   - 回顾/日志系统
//   - 变量管理器（影响剧情走向）
//   - 成就系统
// ============================================================

;(() => {
    'use strict';

    /**
     * 游戏系统管理器
     */
    class GameSystem {
        constructor() {
            // 存档配置
            this.SAVE_KEY_PREFIX = 'xushuguisxu_save_';
            this.SETTINGS_KEY = 'xushuguisxu_settings';
            this.LOG_KEY = 'xushuguisxu_log';
            this.VARIABLES_KEY = 'xushuguisxu_variables';
            this.ACHIEVEMENTS_KEY = 'xushuguisxu_achievements';

            // 当前状态
            this.currentSaveSlot = null;
            this.settings = this.defaultSettings();
            this.variables = {};
            this.achievements = [];
            this.log = []; // 游戏日志

            // 绑定的 StoryEngine 引用
            this.engine = null;

            this._init();
        }

        /**
         * 默认设置
         */
        defaultSettings() {
            return {
                bgmVolume: 0.8,           // BGM 音量
                seVolume: 0.7,            // 音效音量
                voiceVolume: 0.8,         // 语音音量
                typewriterSpeed: 100,     // 打字速度
                autoSpeed: 2000,          // 自动播放速度
                skipMode: false,          // 跳过模式
                displayMode: 'vertical',  // 显示模式：vertical/horizontal
                textEffects: true,        // 文字特效
                fullscreen: false         // 全屏模式
            };
        }

        /**
         * 初始化
         */
        _init() {
            // 加载设置
            this._loadSettings();
            // 加载变量
            this._loadVariables();
            // 加载成就
            this._loadAchievements();
            // 加载日志
            this._loadLog();
        }

        // ==================== 存档/读取系统 ====================

        /**
         * 快速存档专用键
         */
        get QUICKSAVE_KEY() {
            return 'xushuguisxu_quicksave';
        }

        /**
         * 创建存档
         * @param {number} slot - 存档位 (1-10)
         * @param {string} screenshot - 截图数据（可选）
         */
        async createSave(slot, screenshot = null) {
            if (!this.engine) {
                throw new Error('StoryEngine 未绑定');
            }

            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                playTime: this.engine.playTime || 0,
                currentNodeId: this.engine.currentNodeId,
                history: [...this.engine.history],
                variables: { ...this.variables },
                achievements: [...this.achievements],
                storyData: this.engine.storyData, // 完整的故事数据
                screenshot: screenshot
            };

            // 保存到 localStorage
            localStorage.setItem(`${this.SAVE_KEY_PREFIX}${slot}`, JSON.stringify(saveData));
            this.currentSaveSlot = slot;

            console.log(`[GameSystem] 存档 ${slot} 已保存`);
            return saveData;
        }

        /**
         * 读取存档
         * @param {number} slot - 存档位
         */
        async loadSave(slot) {
            const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slot}`);

            if (!saveData) {
                throw new Error(`存档 ${slot} 不存在`);
            }

            const data = JSON.parse(saveData);

            // 恢复变量
            this.variables = data.variables || {};
            // 恢复成就
            this.achievements = data.achievements || [];
            // 保存当前存档位
            this.currentSaveSlot = slot;

            return data;
        }

        /**
         * 将存档数据恢复到 StoryEngine
         * @param {Object} saveData - 存档数据
         */
        async restoreToEngine(saveData) {
            if (!this.engine) {
                throw new Error('StoryEngine 未绑定，无法恢复存档');
            }

            console.log('[GameSystem] 开始恢复存档到引擎...');

            // 1. 恢复故事数据
            this.engine.storyData = saveData.storyData || {};

            // 2. 恢复历史记录
            this.engine.history = saveData.history || [];

            // 3. 恢复当前节点
            const targetNodeId = saveData.currentNodeId;
            if (targetNodeId && this.engine.storyData[targetNodeId]) {
                // 跳转到存档节点，不添加到历史记录
                await this.engine.goTo(targetNodeId, { skipPushHistory: true });
                console.log(`[GameSystem] 已恢复到节点: ${targetNodeId}`);
            } else {
                console.warn('[GameSystem] 存档节点不存在，恢复到起始节点');
                await this.engine.goTo(this.engine.options.startNodeId);
            }

            // 4. 恢复变量（已在上面的 loadSave 中完成）

            // 5. 恢复成就（已在上面的 loadSave 中完成）

            console.log('[GameSystem] 存档恢复完成');
        }

        /**
         * 获取存档信息列表
         */
        getSaveList() {
            const saves = [];
            for (let i = 1; i <= 10; i++) {
                const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${i}`);
                if (saveData) {
                    const data = JSON.parse(saveData);
                    saves.push({
                        slot: i,
                        timestamp: data.timestamp,
                        playTime: data.playTime,
                        currentNodeId: data.currentNodeId,
                        screenshot: data.screenshot
                    });
                }
            }
            return saves;
        }

        /**
         * 删除存档
         */
        deleteSave(slot) {
            localStorage.removeItem(`${this.SAVE_KEY_PREFIX}${slot}`);
            console.log(`[GameSystem] 存档 ${slot} 已删除`);
        }

        /**
         * 快速存档（使用专用存储键）
         */
        async createQuickSave() {
            if (!this.engine) {
                throw new Error('StoryEngine 未绑定');
            }

            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                playTime: this.engine.playTime || 0,
                currentNodeId: this.engine.currentNodeId,
                history: [...this.engine.history],
                variables: { ...this.variables },
                achievements: [...this.achievements],
                storyData: this.engine.storyData
            };

            localStorage.setItem(this.QUICKSAVE_KEY, JSON.stringify(saveData));
            console.log('[GameSystem] 快速存档已保存');
            return saveData;
        }

        /**
         * 读取快速存档
         */
        async loadQuickSave() {
            const saveData = localStorage.getItem(this.QUICKSAVE_KEY);

            if (!saveData) {
                throw new Error('快速存档不存在');
            }

            const data = JSON.parse(saveData);

            // 恢复变量
            this.variables = data.variables || {};
            // 恢复成就
            this.achievements = data.achievements || [];

            console.log('[GameSystem] 快速存档已读取');
            return data;
        }

        /**
         * 检查快速存档是否存在
         */
        hasQuickSave() {
            return localStorage.getItem(this.QUICKSAVE_KEY) !== null;
        }

        // ==================== 设置系统 ====================

        /**
         * 加载设置
         */
        _loadSettings() {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            if (saved) {
                this.settings = { ...this.defaultSettings(), ...JSON.parse(saved) };
            }
        }

        /**
         * 保存设置
         */
        saveSettings() {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
            this._applySettings();
        }

        /**
         * 应用设置
         */
        _applySettings() {
            // 应用音量设置
            if (typeof MediaManager !== 'undefined') {
                MediaManager.setBGMVolume(this.settings.bgmVolume);
                MediaManager.setSEVolume(this.settings.seVolume);
            }

            // 应用全屏设置
            if (this.settings.fullscreen) {
                document.documentElement.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
        }

        /**
         * 更新设置
         */
        updateSetting(key, value) {
            this.settings[key] = value;
            this.saveSettings();
        }

        /**
         * 重置设置
         */
        resetSettings() {
            this.settings = this.defaultSettings();
            this.saveSettings();
        }

        // ==================== 变量系统 ====================

        /**
         * 设置变量
         */
        setVariable(key, value) {
            this.variables[key] = value;
            this._saveVariables();
        }

        /**
         * 获取变量
         */
        getVariable(key, defaultValue = null) {
            return this.variables.hasOwnProperty(key) ? this.variables[key] : defaultValue;
        }

        /**
         * 增加变量值
         */
        incrementVariable(key, amount = 1) {
            const current = this.getVariable(key, 0);
            this.setVariable(key, current + amount);
        }

        /**
         * 检查变量条件
         */
        checkCondition(condition) {
            // 支持: key > 10, key == "value", key < 5, key >= 0, key <= 100
            const match = condition.match(/^(\w+)\s*([><=!]+)\s*(.*)$/);
            if (!match) return false;

            const [, key, operator, value] = match;
            const variable = this.getVariable(key);

            const numValue = parseFloat(value);
            const isNumeric = !isNaN(numValue);

            switch (operator) {
                case '==': return isNumeric ? variable == numValue : variable == value;
                case '!=': return isNumeric ? variable != numValue : variable != value;
                case '>': return isNumeric ? variable > numValue : false;
                case '<': return isNumeric ? variable < numValue : false;
                case '>=': return isNumeric ? variable >= numValue : false;
                case '<=': return isNumeric ? variable <= numValue : false;
                default: return false;
            }
        }

        /**
         * 保存变量
         */
        _saveVariables() {
            localStorage.setItem(this.VARIABLES_KEY, JSON.stringify(this.variables));
        }

        /**
         * 加载变量
         */
        _loadVariables() {
            const saved = localStorage.getItem(this.VARIABLES_KEY);
            if (saved) {
                this.variables = JSON.parse(saved);
            }
        }

        // ==================== 成就系统 ====================

        /**
         * 解锁成就
         */
        unlockAchievement(id) {
            if (!this.achievements.includes(id)) {
                this.achievements.push(id);
                this._saveAchievements();
                console.log(`[GameSystem] 成就解锁: ${id}`);
                this._showAchievementPopup(id);
            }
        }

        /**
         * 检查成就是否解锁
         */
        hasAchievement(id) {
            return this.achievements.includes(id);
        }

        /**
         * 保存成就
         */
        _saveAchievements() {
            localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
        }

        /**
         * 加载成就
         */
        _loadAchievements() {
            const saved = localStorage.getItem(this.ACHIEVEMENTS_KEY);
            if (saved) {
                this.achievements = JSON.parse(saved);
            }
        }

        /**
         * 显示成就弹窗
         */
        _showAchievementPopup(id) {
            // 创建成就弹窗元素
            const popup = document.createElement('div');
            popup.style.cssText = `
                position: fixed;
                top: 100px;
                right: -400px;
                width: 380px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #ff8000;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 0 30px rgba(255, 128, 0, 0.5);
                z-index: 10000;
                animation: achievementSlideIn 0.5s ease forwards;
                font-family: '方正行楷_GBK', serif;
            `;

            // 查找成就信息（如果存在 story_enhanced.json）
            let achievementInfo = null;
            try {
                const storyData = this.engine?.storyData;
                if (storyData && storyData.achievements && storyData.achievements[id]) {
                    achievementInfo = storyData.achievements[id];
                }
            } catch (e) {
                // 忽略错误
            }

            const achievementName = achievementInfo?.name || '成就解锁';
            const achievementDesc = achievementInfo?.description || `成就: ${id}`;

            popup.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="
                        font-size: 48px;
                        background: linear-gradient(135deg, #ff8000, #ffcc00);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        filter: drop-shadow(0 0 10px rgba(255, 128, 0, 0.5));
                    ">🏆</div>
                    <div style="flex: 1;">
                        <div style="color: #ff8000; font-size: 18px; font-weight: bold; margin-bottom: 5px;">${achievementName}</div>
                        <div style="color: #e0e0e0; font-size: 14px;">${achievementDesc}</div>
                    </div>
                </div>
            `;

            // 添加CSS动画
            if (!document.getElementById('achievement-animation-style')) {
                const style = document.createElement('style');
                style.id = 'achievement-animation-style';
                style.textContent = `
                    @keyframes achievementSlideIn {
                        0% { right: -400px; opacity: 0; }
                        100% { right: 20px; opacity: 1; }
                    }
                    @keyframes achievementSlideOut {
                        0% { right: 20px; opacity: 1; }
                        100% { right: -400px; opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(popup);

            // 5秒后自动消失
            setTimeout(() => {
                popup.style.animation = 'achievementSlideOut 0.5s ease forwards';
                setTimeout(() => popup.remove(), 500);
            }, 5000);

            console.log(`🏆 成就解锁: ${id}`);
        }

        // ==================== 日志/回顾系统 ====================

        /**
         * 添加日志
         */
        addLog(nodeId, title, character, text) {
            const logEntry = {
                nodeId,
                title,
                character,
                text,
                timestamp: Date.now()
            };
            this.log.push(logEntry);
            this._saveLog();
        }

        /**
         * 获取日志
         */
        getLog() {
            return this.log;
        }

        /**
         * 清空日志
         */
        clearLog() {
            this.log = [];
            this._saveLog();
        }

        /**
         * 保存日志
         */
        _saveLog() {
            // 限制日志数量（最多保存100条）
            if (this.log.length > 100) {
                this.log = this.log.slice(-100);
            }
            localStorage.setItem(this.LOG_KEY, JSON.stringify(this.log));
        }

        /**
         * 加载日志
         */
        _loadLog() {
            const saved = localStorage.getItem(this.LOG_KEY);
            if (saved) {
                this.log = JSON.parse(saved);
            }
        }

        // ==================== 绑定 StoryEngine ====================

        /**
         * 绑定 StoryEngine
         */
        bindEngine(engine) {
            this.engine = engine;

            // 监听引擎事件，自动添加日志
            if (engine.on) {
                engine.on('afterRender', ({ nodeId }) => {
                    const nodeData = engine.storyData[nodeId];
                    if (nodeData) {
                        this.addLog(
                            nodeId,
                            nodeData.title || '',
                            nodeData.character || '',
                            nodeData.text || ''
                        );
                    }
                });
            }
        }

        // ==================== 工具方法 ====================

        /**
         * 格式化时间
         */
        formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }

        /**
         * 格式化日期
         */
        formatDate(timestamp) {
            const date = new Date(timestamp);
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }

        /**
         * 导出所有数据
         */
        exportData() {
            return {
                settings: this.settings,
                variables: this.variables,
                achievements: this.achievements,
                log: this.log,
                saves: this.getSaveList()
            };
        }

        /**
         * 清除所有数据
         */
        clearAllData() {
            localStorage.clear();
            this._init();
            console.log('[GameSystem] 所有数据已清除');
        }
    }

    // 创建单例
    const gameSystem = new GameSystem();

    // 暴露到全局
    window.GameSystem = gameSystem;

    // 日志输出
    console.log('%c[GameSystem] 游戏系统管理器已加载', 'color: #4a9eff; font-weight: bold;');

})();