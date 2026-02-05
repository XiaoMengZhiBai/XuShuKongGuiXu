// ======================[InventorySystem.js]=====================
// 背包与装备系统 - 支持从头饰到鞋的装备管理
// 功能：
//   - 物品管理（添加、删除、查看）
//   - 装备系统（头饰、耳饰、项链、内衣、内裤、袜子、上衣、下装、手饰、脚链、鞋子）
//   - 装备属性加成
//   - 背包UI显示
//   - 从JSON文件加载装备数据
// ============================================================

;(() => {
    'use strict';

    /**
     * 物品类型枚举（对应11个装备槽位）
     */
    const ItemType = {
        HEADWEAR: 'headwear',   // 头饰
        EARRING: 'earring',     // 耳饰
        NECKLACE: 'necklace',   // 项链
        UNDERWEAR: 'underwear', // 内衣
        PANTIES: 'panties',     // 内裤
        SOCKS: 'socks',         // 袜子
        TOP: 'top',             // 上衣
        BOTTOM: 'bottom',       // 下装
        BRACELET: 'bracelet',   // 手饰
        ANKLET: 'anklet',       // 脚链
        SHOES: 'shoes',         // 鞋子
        CONSUMABLE: 'consumable', // 消耗品
        MATERIAL: 'material',   // 材料
        QUEST: 'quest'          // 任务物品
    };

    /**
     * 物品品质枚举
     */
    const ItemQuality = {
        COMMON: { name: '普通', color: '#ffffff', border: '#888888' },
        UNCOMMON: { name: '优秀', color: '#1eff00', border: '#1eff00' },
        RARE: { name: '稀有', color: '#0070dd', border: '#0070dd' },
        EPIC: { name: '史诗', color: '#a335ee', border: '#a335ee' },
        LEGENDARY: { name: '传说', color: '#ff8000', border: '#ff8000' }
    };

    /**
     * 装备槽位配置（11个固定槽位）
     */
    const EquipmentSlots = {
        headwear: { name: '头饰', icon: '🎩', max: 1 },
        earring: { name: '耳饰', icon: '💎', max: 1 },
        necklace: { name: '项链', icon: '📿', max: 1 },
        underwear: { name: '内衣', icon: '👙', max: 1 },
        panties: { name: '内裤', icon: '🩲', max: 1 },
        socks: { name: '袜子', icon: '🧦', max: 1 },
        top: { name: '上衣', icon: '👚', max: 1 },
        bottom: { name: '下装', icon: '👖', max: 1 },
        bracelet: { name: '手饰', icon: '⌚', max: 1 },
        anklet: { name: '脚链', icon: '⛓️', max: 1 },
        shoes: { name: '鞋子', icon: '👟', max: 1 }
    };

    /**
     * 背包系统类
     */
    class InventorySystem {
        constructor() {
            this.SAVE_KEY = 'xushuguisxu_inventory';
            this.EQUIPMENT_KEY = 'xushuguisxu_equipment';
            
            // 物品数据（从JSON加载）
            this.itemData = null;
            this.equipmentSlots = EquipmentSlots;
            this.itemQuality = ItemQuality;
            
            // 玩家状态
            this.items = {};           // 背包物品（id: 数量）
            this.equipment = {};       // 已装备的物品
            this.initialItems = new Set(); // 初始装备集合（不可卸下）
            this.maxSlots = 32;        // 最大背包格数
            
            // 战斗属性
            this.baseStats = {
                hp: 100,
                mp: 50,
                attack: 10,
                defense: 5,
                magicAttack: 5,
                magicDefense: 3,
                speed: 5,
                evasion: 5,
                critical: 5
            };
            
            this.bonusStats = {};     // 装备加成属性
            this.totalStats = {};     // 总属性
            
            this._initialized = false;
        }

        /**
         * 初始化
         */
        async init() {
            try {
                // 从JSON加载装备数据
                await this._loadItemData();
                // 加载玩家数据
                this._loadPlayerData();
                // 计算属性
                this._calculateStats();
                this._initialized = true;
                console.log('[InventorySystem] 系统初始化完成');
            } catch (e) {
                console.error('[InventorySystem] 初始化失败:', e);
                throw e;
            }
        }

        /**
         * 从JSON加载装备数据
         */
        async _loadItemData() {
            try {
                const response = await fetch('module/json/equipment.json');
                if (!response.ok) {
                    throw new Error(`加载装备数据失败: ${response.status}`);
                }
                const data = await response.json();
                
                // 保存装备数据
                this.itemData = data.items;
                
                // 更新装备槽位配置
                if (data.equipmentSlots) {
                    this.equipmentSlots = data.equipmentSlots;
                }
                
                // 更新品质配置
                if (data.itemQuality) {
                    // 转换品质格式
                    Object.keys(data.itemQuality).forEach(key => {
                        if (ItemQuality[key.toUpperCase()]) {
                            ItemQuality[key.toUpperCase()] = data.itemQuality[key];
                        }
                    });
                    this.itemQuality = ItemQuality;
                }
                
                console.log('[InventorySystem] 装备数据加载成功，共', Object.keys(this.itemData).length, '个物品');
            } catch (e) {
                console.error('[InventorySystem] 加载装备数据失败:', e);
                throw e;
            }
        }

        /**
         * 加载玩家数据
         */
        _loadPlayerData() {
            try {
                const savedItems = localStorage.getItem(this.SAVE_KEY);
                const savedEquipment = localStorage.getItem(this.EQUIPMENT_KEY);
                
                if (savedItems) {
                    this.items = JSON.parse(savedItems);
                }
                
                if (savedEquipment) {
                    this.equipment = JSON.parse(savedEquipment);
                }
            } catch (e) {
                console.warn('[InventorySystem] 加载玩家数据失败，使用默认值', e);
            }
        }

        /**
         * 保存数据
         */
        _saveData() {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.items));
            localStorage.setItem(this.EQUIPMENT_KEY, JSON.stringify(this.equipment));
        }

        /**
         * 计算总属性
         */
        _calculateStats() {
            this.bonusStats = {
                hp: 0,
                mp: 0,
                attack: 0,
                defense: 0,
                magicAttack: 0,
                magicDefense: 0,
                speed: 0,
                evasion: 0,
                critical: 0,
                fireAttack: 0,
                fireDefense: 0,
                iceAttack: 0,
                iceDefense: 0,
                moveSpeed: 0,
                fireResistance: 0,
                iceResistance: 0,
                coldResistance: 0
            };

            // 计算装备加成
            Object.values(this.equipment).forEach(slot => {
                if (Array.isArray(slot)) {
                    slot.forEach(item => {
                        if (item && item.stats) {
                            Object.keys(item.stats).forEach(stat => {
                                this.bonusStats[stat] = (this.bonusStats[stat] || 0) + item.stats[stat];
                            });
                        }
                    });
                } else if (slot && slot.stats) {
                    Object.keys(slot.stats).forEach(stat => {
                        this.bonusStats[stat] = (this.bonusStats[stat] || 0) + slot.stats[stat];
                    });
                }
            });

            // 计算总属性
            this.totalStats = { ...this.baseStats };
            Object.keys(this.totalStats).forEach(stat => {
                this.totalStats[stat] += this.bonusStats[stat] || 0;
            });

            console.log('[InventorySystem] 属性计算完成', {
                base: this.baseStats,
                bonus: this.bonusStats,
                total: this.totalStats
            });
        }

        // ==================== 物品管理 ====================

        /**
         * 添加物品到背包
         */
        addItem(itemId, quantity = 1) {
            if (!this._initialized) {
                console.warn('[InventorySystem] 系统未初始化');
                return false;
            }

            const item = this.itemData[itemId];
            if (!item) {
                console.warn('[InventorySystem] 物品不存在:', itemId);
                return false;
            }

            // 检查背包是否已满
            const currentSlots = Object.keys(this.items).length;
            if (currentSlots >= this.maxSlots && !this.items[itemId]) {
                console.warn('[InventorySystem] 背包已满');
                return false;
            }

            this.items[itemId] = (this.items[itemId] || 0) + quantity;
            this._saveData();
            
            console.log(`[InventorySystem] 添加物品: ${item.name} x${quantity}`);
            return true;
        }

        /**
         * 从背包移除物品
         */
        removeItem(itemId, quantity = 1) {
            if (!this._initialized) {
                return false;
            }

            if (!this.items[itemId]) {
                console.warn('[InventorySystem] 背包中没有该物品:', itemId);
                return false;
            }

            this.items[itemId] -= quantity;
            if (this.items[itemId] <= 0) {
                delete this.items[itemId];
            }

            this._saveData();
            console.log(`[InventorySystem] 移除物品: ${itemId} x${quantity}`);
            return true;
        }

        /**
         * 获取物品信息
         */
        getItemInfo(itemId) {
            if (!this._initialized) {
                return null;
            }
            return this.itemData[itemId] || null;
        }

        /**
         * 获取背包所有物品
         */
        getAllItems(filterType = null) {
            if (!this._initialized) {
                return [];
            }

            const result = [];
            Object.keys(this.items).forEach(itemId => {
                const item = this.itemData[itemId];
                if (item) {
                    // 如果指定了筛选类型，且不匹配则跳过
                    if (filterType && item.type !== filterType) {
                        return;
                    }
                    
                    // 获取品质信息
                    let qualityInfo = ItemQuality.COMMON;
                    if (item.quality && ItemQuality[item.quality.toUpperCase()]) {
                        qualityInfo = ItemQuality[item.quality.toUpperCase()];
                    }
                    
                    result.push({
                        ...item,
                        quality: qualityInfo,
                        quantity: this.items[itemId]
                    });
                }
            });
            return result;
        }

        // ==================== 装备管理 ====================

        /**
         * 装备物品
         */
        equipItem(itemId, slotIndex = 0) {
            if (!this._initialized) {
                console.warn('[InventorySystem] 系统未初始化');
                return false;
            }

            const item = this.itemData[itemId];
            if (!item) {
                console.warn('[InventorySystem] 物品不存在:', itemId);
                return false;
            }

            // 检查是否是装备类型
            if (!this.equipmentSlots[item.type]) {
                console.warn('[InventorySystem] 该物品不可装备:', item.type);
                return false;
            }

            const slotConfig = this.equipmentSlots[item.type];

            // 检查是否有该物品
            if (!this.items[itemId] || this.items[itemId] <= 0) {
                console.warn('[InventorySystem] 背包中没有该物品:', itemId);
                return false;
            }

            // 检查装备槽是否已满（目前所有槽位都是max=1）
            const currentEquipment = this.equipment[item.type];
            if (slotConfig.max === 1) {
                // 单个槽位，卸下现有装备
                if (currentEquipment) {
                    this._unequipItem(item.type);
                }
            } else {
                // 多个槽位
                const equipArray = currentEquipment || [];
                if (equipArray.length >= slotConfig.max) {
                    // 槽位已满，卸下第一个
                    this._unequipItem(item.type, 0);
                }
            }

            // 装备物品
            this.equipment[item.type] = this.equipment[item.type] || [];
            if (slotConfig.max === 1) {
                this.equipment[item.type] = item;
            } else {
                this.equipment[item.type].push(item);
            }

            // 从背包移除
            this.items[itemId]--;

            // 保存并重新计算属性
            this._saveData();
            this._calculateStats();

            console.log(`[InventorySystem] 装备成功: ${item.name}`);
            return true;
        }

        /**
         * 卸下装备
         */
        _unequipItem(slotType, index = 0) {
            const currentEquipment = this.equipment[slotType];
            
            if (!currentEquipment) {
                return;
            }

            if (Array.isArray(currentEquipment)) {
                // 多个槽位
                if (currentEquipment[index]) {
                    const item = currentEquipment[index];
                    
                    // 检查是否是初始装备（不可卸下）
                    if (this.initialItems.has(item.id)) {
                        console.warn('[InventorySystem] 初始装备不可卸下:', item.name);
                        return false;
                    }
                    
                    currentEquipment.splice(index, 1);
                    
                    // 返回背包
                    this.items[item.id] = (this.items[item.id] || 0) + 1;
                    
                    // 如果槽位空了，删除引用
                    if (currentEquipment.length === 0) {
                        delete this.equipment[slotType];
                    }
                }
            } else {
                // 单个槽位
                // 检查是否是初始装备（不可卸下）
                if (this.initialItems.has(currentEquipment.id)) {
                    console.warn('[InventorySystem] 初始装备不可卸下:', currentEquipment.name);
                    return false;
                }
                
                this.items[currentEquipment.id] = (this.items[currentEquipment.id] || 0) + 1;
                delete this.equipment[slotType];
            }

            console.log(`[InventorySystem] 卸下装备: ${slotType}[${index}]`);
            return true;
        }

        /**
         * 卸下装备（公开方法）
         */
        unequipItem(slotType, index = 0) {
            const result = this._unequipItem(slotType, index);
            if (result !== false) {
                this._saveData();
                this._calculateStats();
                return true;
            }
            return false;
        }

        /**
         * 获取当前装备
         */
        getEquipment() {
            return this.equipment;
        }

        /**
         * 获取指定槽位的装备
         */
        getSlotEquipment(slotType) {
            return this.equipment[slotType] || null;
        }

        // ==================== 属性查询 ====================

        /**
         * 获取基础属性
         */
        getBaseStats() {
            return { ...this.baseStats };
        }

        /**
         * 获取装备加成
         */
        getBonusStats() {
            return { ...this.bonusStats };
        }

        /**
         * 获取总属性
         */
        getTotalStats() {
            return { ...this.totalStats };
        }

        /**
         * 获取指定属性值
         */
        getStat(stat) {
            return this.totalStats[stat] || 0;
        }

        // ==================== 工具方法 ====================

        /**
         * 检查是否可以装备
         */
        canEquip(itemId) {
            if (!this._initialized) {
                return false;
            }
            const item = this.itemData[itemId];
            if (!item) return false;
            return !!this.equipmentSlots[item.type];
        }

        /**
         * 检查是否是初始装备（不可卸下）
         */
        isInitialItem(itemId) {
            return this.initialItems.has(itemId);
        }

        /**
         * 获取装备槽配置
         */
        getSlotConfig(slotType) {
            return this.equipmentSlots[slotType] || null;
        }

        /**
         * 获取所有装备槽配置
         */
        getAllSlotConfigs() {
            return this.equipmentSlots;
        }

        /**
         * 清空背包
         */
        clearInventory() {
            this.items = {};
            this._saveData();
            console.log('[InventorySystem] 背包已清空');
        }

        /**
         * 清空装备
         */
        clearEquipment() {
            // 返还所有装备到背包
            Object.keys(this.equipment).forEach(slotType => {
                const equip = this.equipment[slotType];
                if (Array.isArray(equip)) {
                    equip.forEach(item => {
                        this.items[item.id] = (this.items[item.id] || 0) + 1;
                    });
                } else if (equip) {
                    this.items[equip.id] = (this.items[equip.id] || 0) + 1;
                }
            });
            
            this.equipment = {};
            this._saveData();
            this._calculateStats();
            
            console.log('[InventorySystem] 装备已清空');
        }

        /**
         * 重置系统
         */
        reset() {
            this.clearInventory();
            this.clearEquipment();
            console.log('[InventorySystem] 系统已重置');
        }

        /**
         * 添加初始物品（从JSON读取）
         */
        async addStartingItems() {
            if (!this._initialized) {
                await this.init();
            }

            try {
                const response = await fetch('module/json/equipment.json');
                const data = await response.json();
                
                if (data.startingItems && Array.isArray(data.startingItems)) {
                    data.startingItems.forEach(itemId => {
                        // 标记为初始装备
                        this.initialItems.add(itemId);
                        // 添加到背包
                        this.addItem(itemId, 1);
                        // 自动装备
                        this.equipItem(itemId);
                    });
                    console.log('[InventorySystem] 初始物品已添加并自动装备:', data.startingItems.length, '个');
                }
            } catch (e) {
                console.error('[InventorySystem] 添加初始物品失败:', e);
            }
        }

        /**
         * 获取所有物品数据
         */
        getAllItemData() {
            return this.itemData || {};
        }
    }

    // 创建单例
    const inventorySystem = new InventorySystem();

    // 暴露到全局
    window.InventorySystem = inventorySystem;
    window.ItemType = ItemType;
    window.ItemQuality = ItemQuality;

    // 日志输出
    console.log('%c[InventorySystem] 背包与装备系统已加载', 'color: #ff8000; font-weight: bold;');

})();