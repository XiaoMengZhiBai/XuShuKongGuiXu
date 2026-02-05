// ======================[GameUI.js]=====================
// 游戏UI管理器 - 负责存档菜单、设置菜单、日志界面等UI
// 功能：
//   - 存档菜单（显示/保存/读取）
//   - 设置菜单（音量、速度等）
//   - 日志/回顾界面
//   - 快捷键处理
// ============================================================

;(() => {
    'use strict';

    /**
     * 游戏UI管理器
     */
    class GameUI {
        constructor() {
            this.container = null;
            this.currentMenu = null;
            this.shortcuts = {
                // 存档/读取
                'F5': 'save',
                'F9': 'load',
                // 设置
                'F1': 'settings',
                // 日志
                'F2': 'log',
                // 跳过
                'Ctrl': 'skip',
                // 全屏
                'F11': 'fullscreen',
                // 快速保存/读取
                'F6': 'quickSave',
                'F8': 'quickLoad'
            };
        }

        /**
         * 初始化
         */
        init() {
            // 创建UI容器
            this._createContainer();
            // 绑定快捷键
            this._bindShortcuts();
        }

        /**
         * 创建UI容器
         */
        _createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'game-ui-container';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }

        /**
         * 绑定快捷键
         */
        _bindShortcuts() {
            document.addEventListener('keydown', (e) => {
                const key = e.key;
                const ctrl = e.ctrlKey;

                // 跳过模式（按住Ctrl跳过）
                if (ctrl && key === 'Control') {
                    if (window.GameSystem) {
                        window.GameSystem.updateSetting('skipMode', true);
                    }
                    return;
                }

                // 快捷键处理
                if (this.shortcuts[key]) {
                    e.preventDefault();
                    const action = this.shortcuts[key];

                    switch (action) {
                        case 'save':
                            this.showSaveMenu();
                            break;
                        case 'load':
                            this.showLoadMenu();
                            break;
                        case 'settings':
                            this.showSettingsMenu();
                            break;
                        case 'log':
                            this.showLogMenu();
                            break;
                        case 'fullscreen':
                            this.toggleFullscreen();
                            break;
                        case 'quickSave':
                            this.quickSave();
                            break;
                        case 'quickLoad':
                            this.quickLoad();
                            break;
                    }
                }
            });

            document.addEventListener('keyup', (e) => {
                // 释放Ctrl时停止跳过
                if (e.key === 'Control' && window.GameSystem) {
                    window.GameSystem.updateSetting('skipMode', false);
                }
            });
        }

        // ==================== 菜单通用方法 ====================

        /**
         * 显示菜单
         */
        showMenu(content) {
            // 清空容器
            this.container.innerHTML = '';

            // 创建遮罩
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                pointer-events: auto;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease;
            `;

            // 创建菜单容器
            const menu = document.createElement('div');
            menu.style.cssText = `
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #4a9eff;
                border-radius: 12px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 0 30px rgba(74, 158, 255, 0.3);
                animation: slideIn 0.3s ease;
            `;

            menu.innerHTML = content;
            overlay.appendChild(menu);
            this.container.appendChild(overlay);

            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideMenu();
                }
            });

            this.currentMenu = overlay;
        }

        /**
         * 隐藏菜单
         */
        hideMenu() {
            if (this.currentMenu) {
                this.currentMenu.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    this.container.innerHTML = '';
                    this.currentMenu = null;
                }, 200);
            }
        }

        // ==================== 存档菜单 ====================

        /**
         * 显示保存菜单
         */
        showSaveMenu() {
            const saves = window.GameSystem ? window.GameSystem.getSaveList() : [];

            let html = `
                <h2 style="color: #4a9eff; margin-bottom: 20px; font-family: '方正行楷_GBK', serif;">📁 存档</h2>
                <div class="save-slots" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            `;

            for (let i = 1; i <= 10; i++) {
                const save = saves.find(s => s.slot === i);
                const hasSave = !!save;

                html += `
                    <div class="save-slot" data-slot="${i}" style="
                        background: ${hasSave ? 'rgba(74, 158, 255, 0.1)' : 'rgba(50, 50, 50, 0.3)'};
                        border: 1px solid ${hasSave ? '#4a9eff' : '#666'};
                        border-radius: 8px;
                        padding: 15px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    ">
                        <div style="font-size: 14px; color: #4a9eff; margin-bottom: 5px;">存档 ${i}</div>
                        ${hasSave ? `
                            <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${window.GameSystem.formatDate(save.timestamp)}</div>
                            <div style="font-size: 12px; color: #999;">${window.GameSystem.formatTime(save.playTime)}</div>
                        ` : '<div style="font-size: 12px; color: #666;">空</div>'}
                    </div>
                `;
            }

            html += `
                </div>
                <button onclick="GameUI.hideMenu()" style="background: rgba(120, 0, 50, 0.5);">关闭</button>
            `;

            this.showMenu(html);

            // 绑定点击事件
            this.container.querySelectorAll('.save-slot').forEach(slot => {
                slot.addEventListener('click', () => {
                    const slotNum = parseInt(slot.dataset.slot);
                    this.confirmSave(slotNum);
                });

                slot.addEventListener('mouseenter', () => {
                    slot.style.transform = 'translateY(-5px)';
                    slot.style.boxShadow = '0 5px 15px rgba(74, 158, 255, 0.3)';
                });

                slot.addEventListener('mouseleave', () => {
                    slot.style.transform = '';
                    slot.style.boxShadow = '';
                });
            });
        }

        /**
         * 确认保存
         */
        async confirmSave(slot) {
            this.showConfirm(
                '💾 确认保存',
                `确定要保存到存档 <strong style="color: #4a9eff;">${slot}</strong> 吗？`,
                async () => {
                    try {
                        await window.GameSystem.createSave(slot);
                        this.showNotification('✅ 保存成功', '游戏进度已保存', 'success');
                        this.showSaveMenu(); // 刷新显示
                    } catch (e) {
                        this.showNotification('❌ 保存失败', e.message, 'error');
                    }
                }
            );
        }

        /**
         * 显示读取菜单
         */
        showLoadMenu() {
            const saves = window.GameSystem ? window.GameSystem.getSaveList() : [];

            let html = `
                <h2 style="color: #4a9eff; margin-bottom: 20px; font-family: '方正行楷_GBK', serif;">📂 读取</h2>
                <div class="load-slots" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            `;

            for (let i = 1; i <= 10; i++) {
                const save = saves.find(s => s.slot === i);
                const hasSave = !!save;

                html += `
                    <div class="load-slot" data-slot="${i}" style="
                        background: ${hasSave ? 'rgba(74, 158, 255, 0.1)' : 'rgba(50, 50, 50, 0.3)'};
                        border: 1px solid ${hasSave ? '#4a9eff' : '#666'};
                        border-radius: 8px;
                        padding: 15px;
                        cursor: ${hasSave ? 'pointer' : 'not-allowed'};
                        transition: all 0.3s ease;
                        text-align: center;
                        opacity: ${hasSave ? '1' : '0.5'};
                    ">
                        <div style="font-size: 14px; color: #4a9eff; margin-bottom: 5px;">存档 ${i}</div>
                        ${hasSave ? `
                            <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${window.GameSystem.formatDate(save.timestamp)}</div>
                            <div style="font-size: 12px; color: #999;">${window.GameSystem.formatTime(save.playTime)}</div>
                        ` : '<div style="font-size: 12px; color: #666;">空</div>'}
                    </div>
                `;
            }

            html += `
                </div>
                <button onclick="GameUI.hideMenu()" style="background: rgba(120, 0, 50, 0.5);">关闭</button>
            `;

            this.showMenu(html);

            // 绑定点击事件
            this.container.querySelectorAll('.load-slot').forEach(slot => {
                const slotNum = parseInt(slot.dataset.slot);
                const hasSave = saves.find(s => s.slot === slotNum);

                if (hasSave) {
                    slot.addEventListener('click', () => {
                        this.confirmLoad(slotNum);
                    });

                    slot.addEventListener('mouseenter', () => {
                        slot.style.transform = 'translateY(-5px)';
                        slot.style.boxShadow = '0 5px 15px rgba(74, 158, 255, 0.3)';
                    });

                    slot.addEventListener('mouseleave', () => {
                        slot.style.transform = '';
                        slot.style.boxShadow = '';
                    });
                }
            });
        }

        /**
         * 确认读取
         */
        async confirmLoad(slot) {
            this.showConfirm(
                '📂 确认读取',
                `确定要读取存档 <strong style="color: #4a9eff;">${slot}</strong> 吗？<br>当前进度将丢失！`,
                async () => {
                    try {
                        // 读取存档数据
                        const saveData = await window.GameSystem.loadSave(slot);
                        
                        // 关闭菜单
                        this.hideMenu();

                        // 恢复存档到引擎
                        await window.GameSystem.restoreToEngine(saveData);

                        // 显示成功提示
                        this.showNotification('📂 读取成功', '游戏进度已恢复', 'success');
                    } catch (e) {
                        console.error('读取失败:', e);
                        this.showNotification('❌ 读取失败', e.message, 'error');
                    }
                }
            );
        }

        /**
         * 快速保存（F6）
         */
        async quickSave() {
            try {
                await window.GameSystem.createQuickSave();
                this.showNotification('⚡ 快速保存成功', '游戏进度已保存', 'success');
            } catch (e) {
                console.error('快速保存失败:', e);
                this.showNotification('❌ 快速保存失败', e.message, 'error');
            }
        }

        /**
         * 快速读取（F8）
         */
        async quickLoad() {
            try {
                // 读取快速存档数据
                const saveData = await window.GameSystem.loadQuickSave();

                // 恢复存档到引擎
                await window.GameSystem.restoreToEngine(saveData);

                // 显示成功提示
                this.showNotification('⚡ 快速读取成功', '游戏进度已恢复', 'success');
            } catch (e) {
                console.error('快速读取失败:', e);
                this.showNotification('❌ 没有快速存档', '请先进行快速保存（F6）', 'error');
            }
        }

        // ==================== 设置菜单 ====================

        /**
         * 显示设置菜单
         */
        showSettingsMenu() {
            const settings = window.GameSystem ? window.GameSystem.settings : {};

            const html = `
                <h2 style="color: #4a9eff; margin-bottom: 20px; font-family: '方正行楷_GBK', serif;">⚙️ 设置</h2>

                <div class="settings-content" style="display: grid; gap: 20px;">
                    <div class="setting-item">
                        <label style="color: #e0e0e0; display: block; margin-bottom: 5px;">BGM 音量</label>
                        <input type="range" id="setting-bgm" min="0" max="100" value="${settings.bgmVolume * 100}" style="width: 100%;">
                        <span id="setting-bgm-value" style="color: #4a9eff;">${Math.round(settings.bgmVolume * 100)}%</span>
                    </div>

                    <div class="setting-item">
                        <label style="color: #e0e0e0; display: block; margin-bottom: 5px;">音效音量</label>
                        <input type="range" id="setting-se" min="0" max="100" value="${settings.seVolume * 100}" style="width: 100%;">
                        <span id="setting-se-value" style="color: #4a9eff;">${Math.round(settings.seVolume * 100)}%</span>
                    </div>

                    <div class="setting-item">
                        <label style="color: #e0e0e0; display: block; margin-bottom: 5px;">打字速度</label>
                        <input type="range" id="setting-speed" min="30" max="500" value="${settings.typewriterSpeed}" style="width: 100%;">
                        <span id="setting-speed-value" style="color: #4a9eff;">${settings.typewriterSpeed}ms</span>
                    </div>

                    <div class="setting-item">
                        <label style="color: #e0e0e0; display: block; margin-bottom: 5px;">显示模式</label>
                        <select id="setting-display" style="width: 100%;">
                            <option value="vertical" ${settings.displayMode === 'vertical' ? 'selected' : ''}>垂直模式（古风）</option>
                            <option value="horizontal" ${settings.displayMode === 'horizontal' ? 'selected' : ''}>水平模式</option>
                        </select>
                    </div>

                    <div class="setting-item">
                        <label style="color: #e0e0e0; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="setting-effects" ${settings.textEffects ? 'checked' : ''}>
                            启用文字特效
                        </label>
                    </div>

                    <div class="setting-item">
                        <label style="color: #e0e0e0; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="setting-fullscreen" ${settings.fullscreen ? 'checked' : ''}>
                            全屏模式
                        </label>
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="GameUI.saveSettings()" style="background: #4a9eff;">保存</button>
                    <button onclick="GameUI.resetSettings()" style="background: rgba(120, 0, 50, 0.5);">重置</button>
                    <button onclick="GameUI.hideMenu()" style="background: rgba(100, 100, 100, 0.5);">关闭</button>
                </div>
            `;

            this.showMenu(html);

            // 绑定事件
            const bgmSlider = document.getElementById('setting-bgm');
            const seSlider = document.getElementById('setting-se');
            const speedSlider = document.getElementById('setting-speed');
            const displaySelect = document.getElementById('setting-display');
            const effectsCheckbox = document.getElementById('setting-effects');
            const fullscreenCheckbox = document.getElementById('setting-fullscreen');

            bgmSlider.addEventListener('input', (e) => {
                document.getElementById('setting-bgm-value').textContent = e.target.value + '%';
            });

            seSlider.addEventListener('input', (e) => {
                document.getElementById('setting-se-value').textContent = e.target.value + '%';
            });

            speedSlider.addEventListener('input', (e) => {
                document.getElementById('setting-speed-value').textContent = e.target.value + 'ms';
            });
        }

        /**
         * 保存设置
         */
        saveSettings() {
            const settings = window.GameSystem.settings;

            settings.bgmVolume = parseInt(document.getElementById('setting-bgm').value) / 100;
            settings.seVolume = parseInt(document.getElementById('setting-se').value) / 100;
            settings.typewriterSpeed = parseInt(document.getElementById('setting-speed').value);
            settings.displayMode = document.getElementById('setting-display').value;
            settings.textEffects = document.getElementById('setting-effects').checked;
            settings.fullscreen = document.getElementById('setting-fullscreen').checked;

            window.GameSystem.saveSettings();
            this.showNotification('⚙️ 设置已保存', '游戏设置已更新', 'success');
            this.hideMenu();
        }

        /**
         * 重置设置
         */
        resetSettings() {
            this.showConfirm(
                '⚙️ 重置设置',
                '确定要重置所有设置吗？<br>所有自定义设置将恢复为默认值。',
                () => {
                    window.GameSystem.resetSettings();
                    this.showSettingsMenu(); // 刷新显示
                    this.showNotification('⚙️ 设置已重置', '所有设置已恢复默认值', 'success');
                }
            );
        }

        // ==================== 日志菜单 ====================

        /**
         * 显示日志菜单
         */
        showLogMenu() {
            const log = window.GameSystem ? window.GameSystem.getLog() : [];

            let html = `
                <h2 style="color: #4a9eff; margin-bottom: 20px; font-family: '方正行楷_GBK', serif;">📜 回顾日志</h2>
                <div class="log-content" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
            `;

            if (log.length === 0) {
                html += '<div style="color: #999; text-align: center;">暂无日志</div>';
            } else {
                log.forEach((entry, index) => {
                    html += `
                        <div class="log-entry" style="
                            background: rgba(74, 158, 255, 0.1);
                            border-left: 3px solid #4a9eff;
                            padding: 10px;
                            margin-bottom: 10px;
                            border-radius: 4px;
                        ">
                            <div style="font-size: 12px; color: #999; margin-bottom: 5px;">
                                ${window.GameSystem.formatDate(entry.timestamp)}
                            </div>
                            ${entry.title ? `<div style="font-size: 14px; color: #4a9eff; margin-bottom: 5px;">${entry.title}</div>` : ''}
                            ${entry.character ? `<div style="font-size: 13px; color: #e0e0e0; margin-bottom: 5px;">${entry.character}</div>` : ''}
                            <div style="font-size: 13px; color: #ccc; writing-mode: vertical-rl; text-orientation: upright; max-height: 200px; overflow-y: auto;">${entry.text}</div>
                        </div>
                    `;
                });
            }

            html += `
                </div>
                <button onclick="GameUI.hideMenu()" style="background: rgba(120, 0, 50, 0.5);">关闭</button>
            `;

            this.showMenu(html);
        }

        // ==================== 其他功能 ====================

        /**
         * 切换全屏
         */
        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                if (window.GameSystem) {
                    window.GameSystem.updateSetting('fullscreen', true);
                }
            } else {
                document.exitFullscreen();
                if (window.GameSystem) {
                    window.GameSystem.updateSetting('fullscreen', false);
                }
            }
        }

        /**
         * 显示通知（公开方法）
         * @param {string} title - 通知标题
         * @param {string} message - 通知内容
         * @param {string} type - 通知类型：success/error/info
         */
        showNotification(title, message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? 'rgba(0, 150, 0, 0.9)' : type === 'error' ? 'rgba(200, 0, 0, 0.9)' : 'rgba(74, 158, 255, 0.9)'};
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                font-family: '方正行楷_GBK', serif;
                min-width: 250px;
            `;
            notification.innerHTML = `<strong>${title}</strong><br>${message}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        /**
         * 显示确认弹窗（游戏内模态框）
         * @param {string} title - 标题
         * @param {string} message - 消息内容
         * @param {Function} onConfirm - 确认回调
         * @param {Function} onCancel - 取消回调（可选）
         */
        showConfirm(title, message, onConfirm, onCancel = null) {
            // 移除已存在的确认对话框，防止重复创建
            const existingDialog = document.getElementById('game-confirm-dialog');
            if (existingDialog) {
                existingDialog.remove();
            }

            // 创建遮罩
            const overlay = document.createElement('div');
            overlay.id = 'game-confirm-dialog';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 20000;
                animation: fadeIn 0.2s ease;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: linear-gradient(135deg, #2a1a1a 0%, #1a1a1a 100%);
                border: 2px solid rgba(74, 158, 255, 0.5);
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 0 30px rgba(74, 158, 255, 0.3);
                animation: slideIn 0.2s ease;
                font-family: '方正行楷_GBK', serif;
            `;

            dialog.innerHTML = `
                <h3 style="color: #4a9eff; margin: 0 0 15px 0; font-size: 20px;">${title}</h3>
                <div style="color: #e0e0e0; margin-bottom: 20px; line-height: 1.6;">${message}</div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="game-confirm-yes" style="
                        background: linear-gradient(135deg, #4a9eff, #0066cc);
                        border: none;
                        padding: 10px 25px;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: '方正行楷_GBK', serif;
                        font-size: 14px;
                    ">确定</button>
                    <button id="game-confirm-no" style="
                        background: rgba(100, 100, 100, 0.5);
                        border: none;
                        padding: 10px 25px;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: '方正行楷_GBK', serif;
                        font-size: 14px;
                    ">取消</button>
                </div>
            `;

            overlay.appendChild(dialog);

            // 将对话框直接添加到 document.body，确保在最上层
            // 并设置更高的 z-index 避免与其他UI冲突
            document.body.appendChild(overlay);

            // 绑定按钮事件
            const yesBtn = document.getElementById('game-confirm-yes');
            const noBtn = document.getElementById('game-confirm-no');

            yesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    overlay.remove();
                    onConfirm();
                }, 200);
            });

            noBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    overlay.remove();
                    if (onCancel) onCancel();
                }, 200);
            });

            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    e.preventDefault();
                    e.stopPropagation();
                    overlay.style.animation = 'fadeOut 0.2s ease';
                    setTimeout(() => {
                        overlay.remove();
                        if (onCancel) onCancel();
                    }, 200);
                }
            });
        }

        /**
         * 显示游戏内菜单（右键或ESC）
         */
        showGameMenu() {
            const html = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="GameUI.showSaveMenu()">📁 存档</button>
                    <button onclick="GameUI.showLoadMenu()">📂 读取</button>
                    <button onclick="GameUI.showSettingsMenu()">⚙️ 设置</button>
                    <button onclick="GameUI.showLogMenu()">📜 回顾</button>
                    <button onclick="InventoryUI.showInventory()">🎒 背包 (I)</button>
                    <button onclick="GameUI.toggleFullscreen()">🖥️ 全屏</button>
                    <button onclick="GameUI.showTitleScreen()">🏠 返回标题</button>
                    <button onclick="GameUI.hideMenu()">❌ 关闭</button>
                </div>
            `;

            this.showMenu(html);
        }

        /**
         * 返回标题画面
         */
        showTitleScreen() {
            this.showConfirm(
                '⚠️ 返回标题',
                '确定要返回标题画面吗？<br><strong style="color: #ff4444;">未保存的进度将丢失！</strong>',
                () => {
                    location.reload();
                }
            );
        }
    }

    // 创建单例
    const gameUI = new GameUI();

    // 暴露到全局
    window.GameUI = gameUI;

    // 日志输出
    console.log('%c[GameUI] 游戏UI管理器已加载', 'color: #4a9eff; font-weight: bold;');

})();