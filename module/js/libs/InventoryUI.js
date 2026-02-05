// ======================[InventoryUI.js]=====================
// 背包UI - 显示和管理背包与装备
// 功能：
//   - 背包界面（显示所有物品）
//   - 装备界面（显示已装备物品）
//   - 物品详情弹窗
//   - 装备/卸载操作
// ============================================================

;(() => {
    'use strict';

    /**
     * 背包UI类
     */
        class InventoryUI {
            constructor() {
                this.container = document.body;
                this.currentMenu = null;
                this.currentItem = null;
                this.isMenuOpen = false; // 防止重复打开
                this.currentFilter = null; // 当前筛选类型
            }
    
            /**
             * 初始化
             */
            init() {
                // 绑定快捷键
                document.addEventListener('keydown', (e) => {
                    // I键 - 装备和属性
                    if (e.key === 'i' || e.key === 'I') {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (this.isMenuOpen) {
                            this.hideMenu();
                        } else {
                            this.showEquipment();
                        }
                    }
                    // B键 - 背包
                    else if (e.key === 'b' || e.key === 'B') {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (this.isMenuOpen) {
                            this.hideMenu();
                        } else {
                            this.showInventory();
                        }
                    }
                });
            }
    
            /**
             * 显示装备界面（按I键）
             */
            showEquipment() {
                // 防止重复打开
                if (this.isMenuOpen) {
                    return;
                }
        
                // 先关闭已存在的菜单
                if (this.currentMenu) {
                    this.currentMenu.remove();
                    this.currentMenu = null;
                }
        
                const equipment = window.InventorySystem.getEquipment();
                const totalStats = window.InventorySystem.getTotalStats();
        
                let html = `
                    <div style="display: flex; gap: 30px; max-width: 900px; width: 100%;">
                        <!-- 左侧：装备栏 -->
                        <div style="flex: 0 0 400px;">
                            <h2 style="color: #ff8000; margin-bottom: 20px; font-family: '方正行楷_GBK', serif; font-size: 24px; text-align: center; text-shadow: 0 0 10px rgba(255, 128, 0, 0.5);">⚔️ 装备</h2>
                            ${this._renderEquipmentSlots(equipment)}
                        </div>
                        
                        <!-- 右侧：属性面板 -->
                        <div style="flex: 1;">
                            <h2 style="color: #ffcccc; margin-bottom: 20px; font-family: '方正行楷_GBK', serif; font-size: 24px; text-align: center; text-shadow: 0 0 10px rgba(255, 100, 100, 0.5);">📊 角色属性</h2>
                            <div style="padding: 20px; background: linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(30, 20, 20, 0.95)); border-radius: 12px; border: 2px solid rgba(255, 100, 100, 0.3); box-shadow: 0 0 20px rgba(255, 100, 100, 0.2);">
                                ${this._renderStats(totalStats)}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 25px; text-align: center;">
                        <button id="inventory-close-btn" style="background: linear-gradient(135deg, #780032, #4a1430); border: 2px solid rgba(255, 100, 100, 0.5); padding: 12px 40px; border: none; color: white; border-radius: 10px; cursor: pointer; font-family: '方正行楷_GBK', serif; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(120, 0, 50, 0.4);" onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(120, 0, 50, 0.6)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">关闭 (I)</button>
                    </div>
                `;
        
                this.showMenu(html);
            }
    
            /**
             * 显示背包界面（按B键）
             */
            showInventory() {
                // 防止重复打开
                if (this.isMenuOpen) {
                    return;
                }
        
                // 先关闭已存在的菜单
                if (this.currentMenu) {
                    this.currentMenu.remove();
                    this.currentMenu = null;
                }
        
                const items = window.InventorySystem.getAllItems(this.currentFilter);
                
                // 筛选按钮
                const filterButtons = this._renderFilterButtons();
        
                let html = `
                    <div style="max-width: 1200px; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="color: #4a9eff; margin: 0; font-family: '方正行楷_GBK', serif; font-size: 24px; text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);">🎒 背包</h2>
                            ${filterButtons}
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 12px; padding: 20px; background: rgba(20, 20, 20, 0.8); border-radius: 12px; border: 2px solid rgba(74, 158, 255, 0.3); box-shadow: 0 0 20px rgba(74, 158, 255, 0.2);">
                            ${this._renderInventoryGrid(items)}
                        </div>
                    </div>
                    <div style="margin-top: 25px; text-align: center;">
                        <button id="inventory-close-btn" style="background: linear-gradient(135deg, #780032, #4a1430); border: 2px solid rgba(255, 100, 100, 0.5); padding: 12px 40px; border: none; color: white; border-radius: 10px; cursor: pointer; font-family: '方正行楷_GBK', serif; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(120, 0, 50, 0.4);" onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(120, 0, 50, 0.6)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">关闭 (B)</button>
                    </div>
                `;
        
                this.showMenu(html);
            }        /**
         * 渲染装备槽位（人形布局）
         */
        _renderEquipmentSlots(equipment) {
            const slots = window.InventorySystem.getAllSlotConfigs();
            
            // 人形布局 - 按照人体结构排列
            const layout = [
                ['headwear', null, null],          // 头部
                ['earring', 'necklace', null],     // 颈部
                ['top', 'underwear', 'bracelet'],  // 上身
                ['bottom', 'panties', null],       // 下身
                ['shoes', 'anklet', 'socks']       // 足部
            ];
            
            let html = '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; padding: 20px; background: rgba(25, 25, 25, 0.9); border-radius: 12px; border: 2px solid rgba(255, 128, 0, 0.3); box-shadow: 0 0 20px rgba(255, 128, 0, 0.2);">';
            
            layout.forEach(row => {
                row.forEach(slotType => {
                    if (slotType) {
                        const slotConfig = slots[slotType];
                        const equipped = equipment[slotType];
                        const isEquipped = equipped && (!Array.isArray(equipped) || equipped.length > 0);
                        
                        html += `
                            <div class="equipment-slot" data-action="unequip" data-slot="${slotType}" style="
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                padding: 15px 10px;
                                background: ${isEquipped ? 'rgba(40, 30, 20, 0.9)' : 'rgba(30, 30, 30, 0.6)'};
                                border: 2px solid ${isEquipped ? 'rgba(255, 128, 0, 0.6)' : 'rgba(100, 100, 100, 0.3)'};
                                border-radius: 10px;
                                cursor: ${isEquipped ? 'pointer' : 'default'};
                                transition: all 0.3s ease;
                                min-height: 90px;
                                position: relative;
                                overflow: hidden;
                            " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 15px rgba(255, 128, 0, 0.4)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">
                                ${isEquipped ? `
                                    <div style="
                                        position: absolute;
                                        inset: 0;
                                        background: linear-gradient(135deg, rgba(255, 128, 0, 0.1), transparent);
                                        pointer-events: none;
                                    "></div>
                                    <div style="font-size: 36px; margin-bottom: 5px; text-shadow: 0 0 10px rgba(255, 128, 0, 0.5);">${equipped.icon || equipped[0].icon}</div>
                                    <div style="font-size: 11px; color: ${equipped.quality ? equipped.quality.color : '#ff8000'}; font-weight: bold; text-align: center; line-height: 1.2;">${equipped.name || equipped[0].name}</div>
                                ` : `
                                    <div style="font-size: 32px; margin-bottom: 5px; opacity: 0.4;">${slotConfig.icon}</div>
                                    <div style="font-size: 10px; color: #666; text-align: center;">${slotConfig.name}</div>
                                `}
                            </div>
                        `;
                    } else {
                        // 空占位符
                        html += '<div style="visibility: hidden;"></div>';
                    }
                });
            });
            
            html += '</div>';
            return html;
        }

        /**
         * 渲染筛选按钮
         */
        _renderFilterButtons() {
            const filters = [
                { key: null, label: '全部', icon: '📦' },
                { key: 'headwear', label: '头饰', icon: '🎩' },
                { key: 'earring', label: '耳饰', icon: '💎' },
                { key: 'necklace', label: '项链', icon: '📿' },
                { key: 'underwear', label: '内衣', icon: '👙' },
                { key: 'panties', label: '内裤', icon: '🩲' },
                { key: 'socks', label: '袜子', icon: '🧦' },
                { key: 'top', label: '上衣', icon: '👚' },
                { key: 'bottom', label: '下装', icon: '👖' },
                { key: 'bracelet', label: '手饰', icon: '⌚' },
                { key: 'anklet', label: '脚链', icon: '⛓️' },
                { key: 'shoes', label: '鞋子', icon: '👟' }
            ];

            let html = '<div style="display: flex; gap: 5px; flex-wrap: wrap;">';
            filters.forEach(f => {
                const isActive = this.currentFilter === f.key;
                const filterValue = f.key === null ? 'all' : f.key;
                html += `
                    <button data-filter="${filterValue}" style="
                        padding: 6px 12px;
                        background: ${isActive ? 'linear-gradient(135deg, #4a9eff, #0066cc)' : 'rgba(60, 60, 60, 0.6)'};
                        border: 1px solid ${isActive ? '#4a9eff' : 'rgba(100, 100, 100, 0.3)'};
                        border-radius: 6px;
                        color: ${isActive ? 'white' : '#aaa'};
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s ease;
                        font-family: '方正行楷_GBK', serif;
                    " onmouseenter="this.style.background='${isActive ? 'linear-gradient(135deg, #6ab4ff, #0077dd)' : 'rgba(80, 80, 80, 0.8)'}'" onmouseleave="this.style.background='${isActive ? 'linear-gradient(135deg, #4a9eff, #0066cc)' : 'rgba(60, 60, 60, 0.6)'}'">
                        ${f.icon} ${f.label}
                    </button>
                `;
            });
            html += '</div>';
            return html;
        }

        /**
         * 筛选物品（公开方法）- 使用箭头函数保留 this 绑定
         */
        _filterBy = (filter) => {
            console.log('[InventoryUI] 筛选物品:', filter);
            const newFilter = filter === 'all' ? null : filter;
            this.currentFilter = newFilter;

            // 直接更新窗口内容，避免闪烁
            if (this.currentMenu) {
                const menuContent = this.currentMenu.querySelector('#inventory-menu');
                if (menuContent) {
                    // 重新渲染背包内容
                    const items = window.InventorySystem.getAllItems(this.currentFilter);
                    const filterButtons = this._renderFilterButtons();

                    menuContent.innerHTML = `
                        <div style="max-width: 1200px; width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h2 style="color: #4a9eff; margin: 0; font-family: '方正行楷_GBK', serif; font-size: 24px; text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);">🎒 背包</h2>
                                ${filterButtons}
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 12px; padding: 20px; background: rgba(20, 20, 20, 0.8); border-radius: 12px; border: 2px solid rgba(74, 158, 255, 0.3); box-shadow: 0 0 20px rgba(74, 158, 255, 0.2);">
                                ${this._renderInventoryGrid(items)}
                            </div>
                        </div>
                        <div style="margin-top: 25px; text-align: center;">
                            <button id="inventory-close-btn" style="background: linear-gradient(135deg, #780032, #4a1430); border: 2px solid rgba(255, 100, 100, 0.5); padding: 12px 40px; border: none; color: white; border-radius: 10px; cursor: pointer; font-family: '方正行楷_GBK', serif; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(120, 0, 50, 0.4);" onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(120, 0, 50, 0.6)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">关闭 (B)</button>
                        </div>
                    `;

                    // 重新绑定关闭按钮事件
                    const closeBtn = document.getElementById('inventory-close-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.hideMenu();
                        });
                    }
                }
            }
        }

        /**
         * 渲染已装备的物品
         */
        _renderEquippedItem(equipped, slotType) {
            if (!equipped || (Array.isArray(equipped) && equipped.length === 0)) {
                return '<div style="color: #666; font-size: 12px;">空</div>';
            }

            if (Array.isArray(equipped)) {
                // 多个槽位（饰品）
                let html = '';
                equipped.forEach((item, index) => {
                    html += `
                        <div style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; background: rgba(${item.quality.color.replace('#', '')}, 0.2); border: 1px solid ${item.quality.border}; border-radius: 4px; margin: 2px 0; cursor: pointer;" data-action="unequip" data-slot="${slotType}" data-index="${index}">
                            <span>${item.icon}</span>
                            <span style="color: ${item.quality.color}; font-size: 12px;">${item.name}</span>
                        </div>
                    `;
                });
                return html;
            } else {
                // 单个槽位
                return `
                    <div style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;" data-action="unequip" data-slot="${slotType}">
                        <span>${equipped.icon}</span>
                        <span style="color: ${equipped.quality.color}; font-size: 12px;">${equipped.name}</span>
                    </div>
                `;
            }
        }

        /**
         * 渲染属性面板
         */
        _renderStats(stats) {
            const statNames = {
                hp: '生命',
                mp: '魔力',
                attack: '攻击',
                defense: '防御',
                magicAttack: '魔攻',
                magicDefense: '魔防',
                speed: '速度',
                evasion: '闪避',
                critical: '暴击'
            };

            const statIcons = {
                hp: '❤️',
                mp: '💙',
                attack: '⚔️',
                defense: '🛡️',
                magicAttack: '✨',
                magicDefense: '🔮',
                speed: '💨',
                evasion: '🌀',
                critical: '💥'
            };

            let html = '<div style="display: grid; grid-template-columns: 1fr; gap: 10px;">';
            
            Object.keys(statNames).forEach(stat => {
                const value = stats[stat] || 0;
                html += `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 8px 12px;
                        background: rgba(40, 30, 30, 0.6);
                        border-radius: 8px;
                        border-left: 3px solid #ff8000;
                        transition: all 0.3s ease;
                    " onmouseenter="this.style.background='rgba(60, 40, 40, 0.8)'; this.style.transform='translateX(5px)';" onmouseleave="this.style.background='rgba(40, 30, 30, 0.6)'; this.style.transform='';">
                        <span style="font-size: 18px;">${statIcons[stat]}</span>
                        <div style="flex: 1;">
                            <div style="color: #888; font-size: 11px;">${statNames[stat]}</div>
                            <div style="color: #ffcccc; font-weight: bold; font-size: 16px;">${value}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        }

        /**
         * 渲染背包格子
         */
        _renderInventoryGrid(items) {
            if (items.length === 0) {
                return '<div style="grid-column: 1 / -1; color: #666; text-align: center; padding: 40px; font-size: 14px; font-family: "方正行楷_GBK", serif;">🎒 背包是空的</div>';
            }

            return items.map(item => `
                <div class="inventory-item" data-id="${item.id}" style="
                    width: 100%;
                    aspect-ratio: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(25, 25, 25, 0.9));
                    border: 2px solid ${item.quality.border};
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                " onclick="InventoryUI.showItemDetail('${item.id}')" onmouseenter="this.style.transform='scale(1.08) translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(${item.quality.color.replace('#', '')}, 0.3)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">
                    <div style="
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(135deg, rgba(${item.quality.color.replace('#', '')}, 0.1), transparent);
                        pointer-events: none;
                    "></div>
                    <div style="font-size: 36px; margin-bottom: 6px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));">${item.icon}</div>
                    <div style="
                        font-size: 11px;
                        color: ${item.quality.color};
                        text-align: center;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        width: 100%;
                        font-weight: bold;
                        z-index: 1;
                    ">${item.name}</div>
                    ${item.quantity > 1 ? `<div style="
                        position: absolute;
                        top: 6px;
                        right: 6px;
                        background: linear-gradient(135deg, #ff4444, #cc0000);
                        color: white;
                        font-size: 11px;
                        padding: 3px 8px;
                        border-radius: 10px;
                        font-weight: bold;
                        box-shadow: 0 2px 6px rgba(255, 68, 68, 0.5);
                        z-index: 2;
                    ">${item.quantity}</div>` : ''}
                </div>
            `).join('');
        }

        /**
         * 显示物品详情
         */
        showItemDetail(itemId) {
            const item = window.InventorySystem.getItemInfo(itemId);
            if (!item) return;

            const canEquip = window.InventorySystem.canEquip(itemId);
            const quality = item.quality;
            const stats = item.stats || {};

            let statsHtml = '';
            if (Object.keys(stats).length > 0) {
                const statNames = {
                    hp: '生命',
                    mp: '魔力',
                    attack: '攻击',
                    defense: '防御',
                    magicAttack: '魔攻',
                    magicDefense: '魔防',
                    speed: '速度',
                    evasion: '闪避',
                    critical: '暴击'
                };
                
                statsHtml = '<div style="margin-top: 20px; padding: 20px; background: rgba(20, 20, 20, 0.8); border-radius: 12px; border: 2px solid rgba(74, 158, 255, 0.3);"><h3 style="color: #4a9eff; margin: 0 0 15px 0; font-size: 16px;">📊 属性加成</h3><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
                Object.keys(stats).forEach(stat => {
                    const statName = statNames[stat] || stat;
                    statsHtml += `
                        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(40, 30, 30, 0.6); border-radius: 6px; border-left: 3px solid #4a9eff;">
                            <span style="color: #999;">${statName}</span>
                            <span style="color: #4a9eff; font-weight: bold;">+${stats[stat]}</span>
                        </div>
                    `;
                });
                statsHtml += '</div></div>';
            }

            const html = `
                <div style="text-align: center; padding: 30px; font-family: '方正行楷_GBK', serif;">
                    <div style="
                        position: relative;
                        display: inline-block;
                        margin-bottom: 20px;
                    ">
                        <div style="
                            position: absolute;
                            inset: -10px;
                            background: radial-gradient(circle, ${quality.color}33, transparent);
                            animation: pulse 2s infinite;
                            pointer-events: none;
                        "></div>
                        <div style="font-size: 80px; position: relative; z-index: 1; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));">${item.icon}</div>
                    </div>
                    <h2 style="color: ${quality.color}; margin: 0 0 10px 0; font-size: 28px; text-shadow: 0 0 10px ${quality.color}66;">${item.name}</h2>
                    <div style="
                        color: ${quality.border};
                        border: 2px solid ${quality.border};
                        display: inline-block;
                        padding: 6px 20px;
                        border-radius: 20px;
                        margin-bottom: 15px;
                        font-size: 14px;
                        font-weight: bold;
                        box-shadow: 0 0 15px ${quality.color}33;
                    ">${quality.name}</div>
                    <div style="color: #888; margin-bottom: 15px; font-size: 14px;">
                        <span style="color: #666;">类型:</span> 
                        <span style="color: #e0e0e0;">${window.ItemType[item.type.toUpperCase()].replace('_', ' ')}</span>
                    </div>
                    <p style="color: #e0e0e0; line-height: 1.8; margin-bottom: 10px; font-size: 15px; max-width: 400px; margin-left: auto; margin-right: auto;">${item.description}</p>
                    ${statsHtml}
                    <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
                        ${canEquip ? `
                            <button id="equip-btn-${item.id}" style="
                                background: linear-gradient(135deg, #6b1a40, #4a1430);
                                border: 2px solid rgba(255, 100, 100, 0.6);
                                padding: 12px 30px;
                                color: white;
                                border-radius: 10px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                                transition: all 0.3s ease;
                                box-shadow: 0 0 15px rgba(255, 100, 100, 0.3);
                            " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(255, 100, 100, 0.5)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">
                                ⚔️ 装备
                            </button>
                        ` : ''}
                        <button id="drop-btn-${item.id}" style="
                            background: linear-gradient(135deg, #963232, #6b1a1a);
                            border: 2px solid rgba(255, 100, 100, 0.4);
                            padding: 12px 30px;
                            color: white;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            transition: all 0.3s ease;
                            box-shadow: 0 0 15px rgba(255, 100, 100, 0.2);
                        " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(255, 100, 100, 0.4)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">
                            🗑️ 丢弃
                        </button>
                        <button id="back-btn-${item.id}" style="
                            background: linear-gradient(135deg, #2a2a4a, #1a1a2a);
                            border: 2px solid rgba(74, 158, 255, 0.4);
                            padding: 12px 30px;
                            color: white;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            transition: all 0.3s ease;
                            box-shadow: 0 0 15px rgba(74, 158, 255, 0.2);
                        " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(74, 158, 255, 0.4)';" onmouseleave="this.style.transform=''; this.style.boxShadow='';">
                            🔙 返回
                        </button>
                    </div>
                </div>
            `;

            this.showMenu(html);

            // 绑定按钮事件
            setTimeout(() => {
                const equipBtn = document.getElementById(`equip-btn-${item.id}`);
                const dropBtn = document.getElementById(`drop-btn-${item.id}`);
                const backBtn = document.getElementById(`back-btn-${item.id}`);

                if (equipBtn) {
                    equipBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        this._equip(item.id);
                    });
                }

                if (dropBtn) {
                    dropBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        this._drop(item.id);
                    });
                }

                if (backBtn) {
                    backBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        this.showInventory();
                    });
                }
            }, 100);
        }

        /**
         * 装备物品
         */
        _equip(itemId) {
            if (window.InventorySystem.equipItem(itemId)) {
                this.showNotification('⚔️ 装备成功', `已装备 ${window.InventorySystem.getItemInfo(itemId).name}`);
                this.showInventory();
            }
        }

        /**
         * 卸下装备
         */
        _unequip(slotType, index = 0) {
            const equipment = window.InventorySystem.getSlotEquipment(slotType);
            const item = Array.isArray(equipment) ? equipment[index] : equipment;
            
            // 检查是否是初始装备
            if (item && window.InventorySystem.isInitialItem(item.id)) {
                this.showNotification('⚠️ 无法卸下', '初始装备不可卸下', 'error');
                return;
            }
            
            const success = window.InventorySystem.unequipItem(slotType, index);
            if (success) {
                this.showNotification('📦 卸下成功', '装备已返回背包');
                this.showInventory();
            }
        }

        /**
         * 丢弃物品
         */
        _drop(itemId) {
            // 使用游戏内确认弹窗
            this.showConfirm(
                '⚠️ 确认丢弃',
                `确定要丢弃 <strong style="color: #ff4444;">${window.InventorySystem.getItemInfo(itemId).name}</strong> 吗？此操作不可恢复！`,
                () => {
                    window.InventorySystem.removeItem(itemId);
                    this.showNotification('🗑️ 已丢弃', '物品已从背包移除');
                    this.showInventory();
                }
            );
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
            const existingDialog = document.getElementById('confirm-dialog-overlay');
            if (existingDialog) {
                existingDialog.remove();
            }

            // 关闭当前菜单
            if (this.currentMenu) {
                this.currentMenu.remove();
                this.currentMenu = null;
                this.isMenuOpen = false;
            }

            const overlay = document.createElement('div');
            overlay.id = 'confirm-dialog-overlay';
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
                border: 2px solid rgba(255, 68, 68, 0.5);
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 0 30px rgba(255, 68, 68, 0.3);
                animation: slideIn 0.2s ease;
                font-family: '方正行楷_GBK', serif;
            `;

            dialog.innerHTML = `
                <h3 style="color: #ff4444; margin: 0 0 15px 0; font-size: 20px;">${title}</h3>
                <div style="color: #e0e0e0; margin-bottom: 20px; line-height: 1.6;">${message}</div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="confirm-yes" style="
                        background: linear-gradient(135deg, #ff4444, #cc0000);
                        border: none;
                        padding: 10px 25px;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: '方正行楷_GBK', serif;
                        font-size: 14px;
                    ">确定</button>
                    <button id="confirm-no" style="
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
            document.body.appendChild(overlay);

            // 绑定按钮事件
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            yesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    overlay.remove();
                    this.isMenuOpen = false;
                    onConfirm();
                }, 200);
            });

            noBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    overlay.remove();
                    this.isMenuOpen = false;
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
                        this.isMenuOpen = false;
                        if (onCancel) onCancel();
                    }, 200);
                }
            });

            this.isMenuOpen = true;
        }

        // ==================== 菜单管理 ====================

        /**
         * 显示菜单
         */
        showMenu(content) {
            // 先关闭已存在的菜单
            if (this.currentMenu) {
                this.currentMenu.remove();
                this.currentMenu = null;
                this.isMenuOpen = false;
            }

            const overlay = document.createElement('div');
            overlay.id = 'inventory-menu-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            `;

            const menu = document.createElement('div');
            menu.id = 'inventory-menu';
            menu.style.cssText = `
                background: linear-gradient(135deg, #1a1a1a 0%, #2a1a1a 100%);
                border: 2px solid rgba(255, 128, 0, 0.3);
                border-radius: 16px;
                padding: 40px;
                max-width: 95vw;
                max-height: 95vh;
                overflow-y: auto;
                box-shadow: 0 0 40px rgba(255, 128, 0, 0.4);
                animation: slideIn 0.3s ease;
            `;

            menu.innerHTML = content;
            overlay.appendChild(menu);
            this.container.appendChild(overlay);

            // 设置标志
            this.isMenuOpen = true;

            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideMenu();
                }
            });

            // 点击关闭按钮
            const closeBtn = document.getElementById('inventory-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideMenu();
                });
            }

            // 使用事件委托处理装备点击和筛选按钮
            menu.addEventListener('click', (e) => {
                // 处理卸下装备
                const unequipItem = e.target.closest('[data-action="unequip"]');
                if (unequipItem) {
                    e.preventDefault();
                    e.stopPropagation();
                    const slotType = unequipItem.dataset.slot;
                    const index = parseInt(unequipItem.dataset.index) || 0;
                    this._unequip(slotType, index);
                    return;
                }

                // 处理筛选按钮
                const filterBtn = e.target.closest('[data-filter]');
                if (filterBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const filterValue = filterBtn.dataset.filter;
                    console.log('[InventoryUI] 点击筛选按钮:', filterValue);
                    this._filterBy(filterValue);
                    return;
                }
            });

            this.currentMenu = overlay;
        }

        /**
         * 隐藏菜单
         */
        hideMenu() {
            if (this.currentMenu) {
                const overlay = this.currentMenu;
                overlay.style.animation = 'fadeOut 0.2s ease';
                
                setTimeout(() => {
                    overlay.remove();
                    this.currentMenu = null;
                    this.isMenuOpen = false;
                }, 200);
            }
        }

        /**
         * 显示通知
         */
        showNotification(title, message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(74, 158, 255, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 10001;
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
    }

    // 创建单例
    const inventoryUI = new InventoryUI();

    // 暴露到全局
    window.InventoryUI = inventoryUI;

    // 日志输出
    console.log('%c[InventoryUI] 背包UI已加载', 'color: #ff8000; font-weight: bold;');

})();