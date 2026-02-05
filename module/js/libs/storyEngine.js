// ========================= [libs/story_engine.js] =========================
// StoryEngine v1.0 - 可扩展的剧情框架（已修复 story-text 渲染问题）
// ===================================================================================

;(() => {
    'use strict';

    /**
     * 小工具：安全的日志（若 GlobalUtils 存在优先使用）
     */
    const log = {
        info: (...args) => (window.GlobalUtils?.log?.apply(GlobalUtils, args) || console.log('[StoryEngine]', ...args)),
        warn: (...args) => (window.GlobalUtils?.warn?.apply(GlobalUtils, args) || console.warn('[StoryEngine]', ...args)),
        error: (...args) => (window.GlobalUtils?.error?.apply(GlobalUtils, args) || console.error('[StoryEngine]', ...args)),
    };

    /**
     * 默认配置
     */
    const DEFAULT_OPTIONS = {
        containerId: 'game-container',
        startNodeId: 'start',
        storyData: null,         // 可以直接传对象
        storyUrl: null,          // 或者传 JSON URL
        enableTypewriter: true,
        typewriterSpeed: 40,
        typewriterVertical: true, // 是否使用垂直打字模式
        autosaveKey: 'story_engine_state_v1',
        initialVolume: 1.0,
        allowHistoryBack: true,
    };

    /**
     * StoryEngine 类定义
     */
    class StoryEngine {
        constructor(options = {}) {
            this.options = Object.assign({}, DEFAULT_OPTIONS, options);
            this.container = document.getElementById(this.options.containerId) || document.body;
            this.storyData = null;             // 原始 story 对象
            this.nodeElements = new Map();     // nodeId -> DOM element (由 HtmlElementCreator 生成)
            this.currentNodeId = null;
            this.history = [];                 // 历史栈，用于返回
            this.plugins = [];                 // 插件数组
            this.hooks = {};                   // 钩子事件 (name => [fn])
            this.isRendering = false;
            this.typewriterInProgress = false;
        }

        // -------------------- 插件 / 钩子 --------------------
        on(hookName, fn) {
            this.hooks[hookName] = this.hooks[hookName] || [];
            this.hooks[hookName].push(fn);
        }

        off(hookName, fn) {
            if (!this.hooks[hookName]) return;
            this.hooks[hookName] = this.hooks[hookName].filter(f => f !== fn);
        }

        emit(hookName, payload) {
            const fns = this.hooks[hookName] || [];
            for (const fn of fns) {
                try { fn(payload); } catch (e) { log.error(`hook ${hookName} error`, e); }
            }
        }

        use(plugin) {
            if (typeof plugin === 'function') {
                plugin(this);
                this.plugins.push(plugin);
            } else if (plugin && typeof plugin.install === 'function') {
                plugin.install(this);
                this.plugins.push(plugin);
            } else {
                log.warn('不支持的 plugin 格式', plugin);
            }
        }

        // -------------------- 启动流程 --------------------
        async init() {
            try {
                log.info('StoryEngine 初始化：', this.options);

                // 1. 加载故事数据（如果传入 URL）
                if (this.options.storyData) {
                    this.storyData = this.options.storyData;
                } else if (this.options.storyUrl) {
                    this.storyData = await this._fetchJson(this.options.storyUrl);
                } else {
                    this.storyData = {}; // 空数据，需外部注入
                }

                // 2. 使用 HtmlElementCreator（若存在）构建 DOM 元素 map
                if (typeof HtmlElementCreator !== 'undefined') {
                    try {
                        this.nodeElements = HtmlElementCreator.createStoryElementsMap(this.storyData);
                    } catch (e) {
                        log.error('HtmlElementCreator.createStoryElementsMap 失败，退回到内置创建器', e);
                        this.nodeElements = this._fallbackCreateMap(this.storyData);
                    }
                } else {
                    log.warn('HtmlElementCreator 未定义，使用内置创建器');
                    this.nodeElements = this._fallbackCreateMap(this.storyData);
                }

                // 3. 绑定全局事件（按钮点击）
                this._bindGlobalClicks();

                // 4. 尝试恢复进度（若存在）
                const resumed = this._tryRestoreState();
                if (resumed) {
                    log.info('已从本地恢复进度：', this.currentNodeId);
                }

                // 5. 启动首节点
                const startNodeId = this.currentNodeId || this.options.startNodeId;
                if (!this.storyData[startNodeId]) {
                    // 如果没有 start 节点，选择第一个 key
                    const keys = Object.keys(this.storyData);
                    if (keys.length > 0) {
                        this.goTo(keys[0]);
                    } else {
                        log.warn('故事数据为空，未渲染任何节点');
                    }
                } else {
                    this.goTo(startNodeId);
                }

                this.emit('ready', { engine: this });
            } catch (err) {
                log.error('StoryEngine 初始化失败', err);
                if (typeof ErrorHandler !== 'undefined' && ErrorHandler.fatal) {
                    ErrorHandler.fatal('剧情引擎启动失败', err.stack || err.message);
                }
            }
        }

        // -------------------- 加载 JSON 的小函数 --------------------
        async _fetchJson(url) {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`加载失败: ${res.status} ${res.statusText}`);
            return res.json();
        }

        // -------------------- 回退 DOM 生成器 --------------------
        _fallbackCreateMap(storyData) {
            const map = new Map();
            for (const nodeId in storyData) {
                if (!Object.prototype.hasOwnProperty.call(storyData, nodeId)) continue;
                const node = storyData[nodeId];
                const el = document.createElement('div');
                el.id = `story-node-${nodeId}`;
                el.className = 'story-node-fallback';
                // 标题 / 角色
                if (node.title) {
                    const h = document.createElement('h2'); h.textContent = node.title; el.appendChild(h);
                }
                if (node.character) {
                    const c = document.createElement('h3'); c.textContent = node.character; el.appendChild(c);
                }
                const p = document.createElement('p'); p.className = 'story-text'; p.textContent = node.text || ''; el.appendChild(p);
                // choices
                if (Array.isArray(node.choices)) {
                    const choices = document.createElement('div'); choices.className = 'choices-container';
                    node.choices.forEach(choice => {
                        const b = document.createElement('button'); b.className = 'choice-btn'; b.textContent = choice.text;
                        if (choice.target) b.setAttribute('data-target', choice.target);
                        choices.appendChild(b);
                    });
                    el.appendChild(choices);
                } else {
                    const nav = document.createElement('div'); nav.className = 'node-navigation';
                    if (node.next) {
                        const nb = document.createElement('button'); nb.className = 'next-btn'; nb.textContent = '下一章'; nb.setAttribute('data-target', node.next);
                        nav.appendChild(nb);
                    }
                    el.appendChild(nav);
                }
                map.set(nodeId, el);
            }
            log.info(`[StoryEngine] fallback 创建了 ${map.size} 个节点 DOM`);
            return map;
        }

        // -------------------- 全局点击事件（事件代理） --------------------
        _bindGlobalClicks() {
            // 事件代理：放在 container 上
            this.container.addEventListener('click', (e) => {
                const t = e.target;

                // 1) 选择按钮（choice-btn）
                if (t.closest && t.closest('.choice-btn')) {
                    const btn = t.closest('.choice-btn');
                    const target = btn.dataset.target;
                    if (target) {
                        this.emit('choice', { target, button: btn });
                        this.goTo(target, { fromChoice: true });
                    } else {
                        log.warn('choice-btn 没有 data-target');
                    }
                    return;
                }

                // 2) next-btn
                if (t.closest && t.closest('.next-btn')) {
                    const btn = t.closest('.next-btn');
                    const target = btn.dataset.target;
                    if (target) {
                        this.emit('next', { target, button: btn });
                        this.goTo(target);
                    }
                    return;
                }

                // 3) prev-btn (返回)
                if (t.closest && t.closest('.prev-btn')) {
                    if (this.options.allowHistoryBack && this.history.length > 0) {
                        const prev = this.history.pop();
                        if (prev) this.goTo(prev, { skipPushHistory: true });
                    } else {
                        this.emit('prevAttempt', {});
                    }
                    return;
                }
            });
        }

        // -------------------- 渲染逻辑 --------------------
        async goTo(nodeId, opts = {}) {
            if (!this.storyData[nodeId]) {
                log.error('请求跳转到未知节点：', nodeId);
                return;
            }
            if (this.isRendering) {
                log.warn('正在渲染中，忽略重复 goTo 请求', nodeId);
                return;
            }

            this.isRendering = true;
            const prevNode = this.currentNodeId;

            // push history（除非跳转时指定 skip）
            if (!opts.skipPushHistory && prevNode) {
                this.history.push(prevNode);
            }

            this.currentNodeId = nodeId;
            this.emit('beforeRender', { nodeId, prevNode, opts });

            // 清空容器并插入目标节点 DOM（深拷贝节点模板，避免复用导致事件冲突）
            const nodeTemplate = this.nodeElements.get(nodeId);
            if (!nodeTemplate) {
                log.error('找不到节点 DOM 模板：', nodeId);
                this.isRendering = false;
                return;
            }

            // 移除旧内容并显示新的
            // 🔧 性能优化：使用 removeChild 循环替代 innerHTML = ''
            // 这样可以避免触发不必要的 reflow，并且保持其他子元素的事件绑定
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            const nodeDom = nodeTemplate.cloneNode(true);

            // 可选：在节点外层添加容器 class
            nodeDom.classList.add('active-story-node');

            // 插入到页面
            this.container.appendChild(nodeDom);

            // 将文字元素交给 TypewriterUtils（若可用）或直接显示
            const textEl = nodeDom.querySelector('.story-text') || nodeDom.querySelector('p');
            const nodeData = this.storyData[nodeId] || {};
            
            // 1. 文本内容预处理
            let processedText = nodeData.text || '';

            // 根据书写模式决定是否在标点后添加换行
            if (this.options.enableTypewriter && this.options.typewriterVertical !== false) {
                // 垂直模式：保持原文，由 CSS 的 writing-mode 控制换行
                processedText = processedText;
            } else {
                // 水平模式：在标点后添加换行
                processedText = processedText
                    .replace(/。/g, "。\n")
                    .replace(/？/g, "？\n")
                    .replace(/！/g, "！\n");
            }

            // 2. 核心渲染逻辑
            if (textEl) {
                try {
                    // 检查是否启用了打字机并且 TypewriterUtils 可用
                    if (this.options.enableTypewriter && typeof TypewriterUtils !== 'undefined') {
                        log.info('启动打字机效果，速度:', this.options.typewriterSpeed, '垂直模式:', this.options.typewriterVertical);
                        log.info('文本内容:', processedText);
                        this.typewriterInProgress = true;
                        // 使用配置中的垂直模式设置
                        await TypewriterUtils.display(textEl, processedText, this.options.typewriterVertical, this.options.typewriterSpeed);
                        this.typewriterInProgress = false;
                        log.info('打字机效果完成');
                    } else {
                        log.info('打字机未启用或 TypewriterUtils 不可用，直接显示文本');
                        // 🌟 修复点：如果禁用打字机，必须手动将 \n 替换为 <br> 并写入 innerHTML
                        textEl.innerHTML = processedText.replace(/\n/g, '<br>');
                    }
                } catch (e) {
                    log.error('打字机渲染失败，退回直接渲染', e);
                    // 确保失败时文本也能显示
                    if (textEl) {
                        textEl.innerHTML = (processedText || '').replace(/\n/g, '<br>');
                    }
                }
            } else {
                log.warn('未找到文本元素 (.story-text 或 p)');
            }


            // 自动滚动到顶部（如果节点很长）
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}

            this.emit('afterRender', { nodeId, dom: nodeDom });

            // 自动保存一次进度
            this._autosave();

            this.isRendering = false;
        }

        // -------------------- 状态保存/恢复 --------------------
        _autosave() {
            try {
                const s = {
                    currentNodeId: this.currentNodeId,
                    history: this.history.slice(),
                    timestamp: Date.now()
                };
                localStorage.setItem(this.options.autosaveKey, JSON.stringify(s));
                this.emit('autosave', s);
            } catch (e) {
                log.warn('自动保存失败', e);
            }
        }

        _tryRestoreState() {
            try {
                const raw = localStorage.getItem(this.options.autosaveKey);
                if (!raw) return false;
                const s = JSON.parse(raw);
                if (s && s.currentNodeId && this.storyData[s.currentNodeId]) {
                    this.currentNodeId = s.currentNodeId;
                    this.history = s.history || [];
                    return true;
                }
            } catch (e) {
                log.warn('恢复进度失败', e);
            }
            return false;
        }

        clearSave() {
            localStorage.removeItem(this.options.autosaveKey);
        }

        // -------------------- API: 外部控制 --------------------
        getCurrentNode() {
            return this.currentNodeId;
        }

        getHistory() {
            return [...this.history];
        }

        async jumpTo(nodeId) {
            return this.goTo(nodeId);
        }

        // 注入/替换故事数据（运行时更新）
        async replaceStoryData(storyData, startNodeId) {
            this.storyData = storyData;
            // 重新创建 map
            if (typeof HtmlElementCreator !== 'undefined') {
                this.nodeElements = HtmlElementCreator.createStoryElementsMap(this.storyData);
            } else {
                this.nodeElements = this._fallbackCreateMap(this.storyData);
            }
            if (startNodeId) this.options.startNodeId = startNodeId;
            this.currentNodeId = null;
            this.history = [];
            this._autosave();
            await this.init();
        }
    }

    // 暴露到全局，方便其他模块调用
    window.StoryEngine = StoryEngine;
    log.info('StoryEngine 已注入到全局 (window.StoryEngine)');

})();