// ======================[css_loader.js v1.3]=================//
// CSS 加载器 - 自动加载 CSS 文件并应用动画效果
// 功能：
//   - 动态加载 CSS 文件
//   - 扫描并应用 data-animation 属性的动画
//   - 从 CSS 中提取关键帧动画并自动应用
// 作者：晓梦 + Grok + ChatGPT
// ============================================================

(function(global) {
    /**
     * CSS 加载器对象
     */
    const CSSLoader = {
        /**
         * 已加载的样式表引用数组
         * @type {HTMLLinkElement[]}
         */
        loadedSheets: [],

        /**
         * 加载单个 CSS 文件
         * @param {string} url - CSS 文件的 URL
         * @returns {Promise<string>} 返回 URL 的 Promise
         * @throws {Error} 当 CSS 加载失败时抛出错误
         */
        loadCSS(url) {
            return new Promise((resolve, reject) => {
                // 参数验证
                if (!url || typeof url !== 'string') {
                    reject(new Error('无效的 CSS URL'));
                    return;
                }

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;

                // 加载成功回调
                link.onload = () => {
                    resolve(url);
                    link.sheet.disabled = false; // 确保样式表启用
                };

                // 加载失败回调
                link.onerror = () => {
                    const error = new Error(`CSS加载失败: ${url}`);
                    // 如果 ErrorHandler 可用，使用它记录错误
                    if (typeof ErrorHandler !== 'undefined') {
                        ErrorHandler.warn(error.message);
                    }
                    reject(error);
                };

                document.head.appendChild(link);
                this.loadedSheets.push(link);
            });
        },

        /**
         * 批量加载 CSS 文件
         * @param {string[]} urls - CSS 文件 URL 数组
         * @returns {Promise<void>}
         */
        async loadAll(urls) {
            if (!Array.isArray(urls)) {
                throw new Error('urls 参数必须是数组');
            }

            for (const url of urls) {
                await this.loadCSS(url);
            }
        },

        /**
         * 自动应用 data-animation 属性的动画
         * 扫描所有具有 data-animation 属性的元素，并应用相应的动画效果
         * @param {number} defaultDuration - 默认动画持续时间（毫秒）
         */
        autoApplyAnimations(defaultDuration = 3000) {
            const elements = document.querySelectorAll('[data-animation]');
            elements.forEach(el => {
                const anim = el.dataset.animation;
                if (anim) {
                    el.style.animation = `${anim} ${defaultDuration}ms ease-in-out infinite alternate`;
                }
            });
        },

        /**
         * 从 CSS 样式表中提取关键帧动画并自动应用
         * 扫描所有样式表，找到关键帧规则，然后将动画应用到对应的元素上
         * @param {number} defaultDuration - 默认动画持续时间（毫秒）
         */
        applyAnimationsFromCSS(defaultDuration = 3000) {
            const sheets = document.styleSheets;

            for (const sheet of sheets) {
                try {
                    const rules = sheet.cssRules || sheet.rules;

                    for (const rule of rules) {
                        // 检查是否为关键帧规则
                        if (rule.type === CSSRule.KEYFRAMES_RULE ||
                            rule.type === CSSRule.WEBKIT_KEYFRAMES_RULE) {
                            const animName = rule.name;
                            this._applyAnimationToElements(animName, defaultDuration);
                        }
                    }
                } catch (e) {
                    // 跨域样式表无法访问，静默处理
                    console.warn('无法访问 CSS（可能跨域）:', e);
                }
            }
        },

        /**
         * 将动画应用到具有特定类名的元素
         * @private
         * @param {string} animName - 动画名称（用作 CSS 类名）
         * @param {number} defaultDuration - 默认动画持续时间（毫秒）
         */
        _applyAnimationToElements(animName, defaultDuration) {
            const elements = document.querySelectorAll(`.${animName}`);
            elements.forEach(el => {
                el.style.animation = `${animName} ${defaultDuration}ms ease-in-out infinite alternate`;
            });
        },

        /**
         * 清理所有已加载的样式表
         * 用于测试或需要重置样式的场景
         */
        cleanup() {
            this.loadedSheets.forEach(link => {
                if (link && link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            });
            this.loadedSheets = [];
        }
    };

    // 暴露到全局
    global.CSSLoader = CSSLoader;

})(window);
