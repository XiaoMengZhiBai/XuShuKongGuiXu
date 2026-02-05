/**
 * @fileoverview TypewriterUtils - 通用的逐字显示（打字机）效果工具 v4.0
 * 功能：
 *   - 支持垂直和水平方向的文本逐字显示
 *   - 点击跳过功能
 *   - 下一页提示指示器
 *   - 更灵活的速度控制
 */

;(() => {
    'use strict';

    /**
     * 打字机效果工具类
     * 提供逐字显示文本的功能，支持中文、英文和特殊字符
     */
    class TypewriterUtils {

        /**
         * 打字机速度常量（毫秒）
         */
        static DEFAULT_SPEED = 150;
        static MIN_SPEED = 30;
        static MAX_SPEED = 500;

        /**
         * 存储当前正在运行的打字效果引用（用于跳过）
         */
        static _currentEffect = null;

        /**
         * 私有方法：执行打字机效果
         * @private
         * @param {HTMLElement} element - 目标 DOM 元素
         * @param {string} text - 要显示的文本
         * @param {number} speed - 打字速度（毫秒/字符）
         * @param {boolean} isVertical - 是否垂直显示
         * @returns {Promise<void>} 打字完成的 Promise
         */
        static _typeWriterEffect(element, text, speed, isVertical) {
            return new Promise(resolve => {
                let charIndex = 0;
                element.innerHTML = ''; // 清空内容，准备逐字写入

                // 创建点击跳过处理器
                const clickHandler = (e) => {
                    e.stopPropagation(); // 防止冒泡
                    TypewriterUtils._skipToComplete(element, text, isVertical, resolve);
                };

                // 添加点击事件
                element.addEventListener('click', clickHandler);
                element.style.cursor = 'pointer';

                const intervalId = setInterval(() => {
                    const char = text[charIndex];

                    // 检查是否完成
                    if (char === undefined) {
                        clearInterval(intervalId);
                        element.removeEventListener('click', clickHandler);
                        element.style.cursor = '';
                        TypewriterUtils._onComplete(element, isVertical);
                        resolve();
                        return;
                    }

                    // 添加光标样式
                    if (!element.classList.contains('typing-cursor')) {
                        element.classList.add('typing-cursor');
                    }

                    // 处理换行符
                    if (char === '\n') {
                        element.appendChild(document.createElement('br'));
                    } else {
                        element.appendChild(document.createTextNode(char));
                    }

                    charIndex++;
                }, speed);

                // 保存引用以便跳过
                TypewriterUtils._currentEffect = {
                    intervalId,
                    clickHandler,
                    element,
                    text,
                    isVertical,
                    resolve
                };
            });
        }

        /**
         * 跳过打字效果，立即显示全部文本
         * @private
         */
        static _skipToComplete(element, text, isVertical, resolve) {
            if (TypewriterUtils._currentEffect) {
                const { intervalId, clickHandler } = TypewriterUtils._currentEffect;
                clearInterval(intervalId);
                element.removeEventListener('click', clickHandler);
                element.style.cursor = '';

                // 立即显示全部文本
                element.innerHTML = '';
                for (const char of text) {
                    if (char === '\n') {
                        element.appendChild(document.createElement('br'));
                    } else {
                        element.appendChild(document.createTextNode(char));
                    }
                }

                TypewriterUtils._onComplete(element, isVertical);
                TypewriterUtils._currentEffect = null;
                resolve();
            }
        }

        /**
         * 打字完成后的处理
         * @private
         */
        static _onComplete(element, isVertical) {
            element.classList.remove('typing-cursor');
            element.classList.remove('vertical-mode');
            element.classList.add('typing-done');
        }

        /**
         * 在目标元素上显示打字机效果
         * @param {HTMLElement} targetElement - 目标 DOM 元素
         * @param {string|string[]} textContent - 要显示的文本（可以是字符串或字符串数组）
         * @param {boolean} isVertical - 是否垂直显示（默认 true）
         * @param {number} speed - 打字速度（毫秒/字符，默认 150）
         * @returns {Promise<void>} 打字完成的 Promise
         */
        static async display(targetElement, textContent, isVertical = true, speed = TypewriterUtils.DEFAULT_SPEED) {
            // 参数验证
            if (!targetElement || !(targetElement instanceof HTMLElement)) {
                console.warn('[TypewriterUtils] 目标元素无效，跳过打字效果');
                return Promise.resolve();
            }

            // 限制速度范围
            speed = Math.max(TypewriterUtils.MIN_SPEED, Math.min(TypewriterUtils.MAX_SPEED, speed));

            console.log('[TypewriterUtils] 开始打字效果，垂直模式:', isVertical, '速度:', speed);

            // 处理输入文本
            let finalContent = '';
            if (Array.isArray(textContent)) {
                finalContent = textContent.join('\n').replace(/<br>/g, '\n');
            } else if (textContent) {
                finalContent = String(textContent).replace(/<br>/g, '\n');
            } else {
                finalContent = '';
            }

            // 清空目标元素
            targetElement.innerHTML = '';
            targetElement.classList.remove('typing-done');

            // 移除旧的指示器
            const oldIndicator = targetElement.querySelector('.next-page-indicator');
            if (oldIndicator) {
                oldIndicator.remove();
            }

            // 设置文本显示方向
            if (isVertical) {
                // 垂直书写模式（适合古风游戏）
                targetElement.style.writingMode = 'vertical-rl';
                targetElement.style.textOrientation = 'upright';
                targetElement.style.whiteSpace = 'pre-wrap';
                targetElement.style.textAlign = 'center';
                targetElement.style.padding = '10px';
                // 添加垂直模式类
                targetElement.classList.add('vertical-mode');
            } else {
                // 水平书写模式
                targetElement.style.writingMode = 'horizontal-tb';
                targetElement.style.textOrientation = 'mixed';
                targetElement.style.whiteSpace = 'pre-wrap';
                targetElement.style.textAlign = 'left';
                targetElement.style.padding = '10px';
            }

            // 执行打字机效果
            return TypewriterUtils._typeWriterEffect(targetElement, finalContent, speed, isVertical);
        }

        /**
         * 立即完成打字效果（跳过动画）
         * @param {HTMLElement} targetElement - 目标 DOM 元素
         * @param {string|string[]} textContent - 要显示的文本
         * @param {boolean} isVertical - 是否垂直显示（默认 true）
         */
        static displayImmediately(targetElement, textContent, isVertical = true) {
            if (!targetElement || !(targetElement instanceof HTMLElement)) {
                return;
            }

            // 处理输入文本
            let finalContent = '';
            if (Array.isArray(textContent)) {
                finalContent = textContent.join('\n').replace(/<br>/g, '\n');
            } else if (textContent) {
                finalContent = String(textContent).replace(/<br>/g, '\n');
            }

            // 设置文本显示方向
            if (isVertical) {
                targetElement.style.writingMode = 'vertical-rl';
                targetElement.style.whiteSpace = 'pre-wrap';
                targetElement.style.textAlign = 'center';
                targetElement.style.padding = '10px';
            } else {
                targetElement.style.writingMode = 'initial';
            }

            // 直接显示文本（不添加动画类）
            targetElement.innerHTML = finalContent.replace(/\n/g, '<br>');
            targetElement.classList.add('typing-done');

            // 添加下一页提示
            TypewriterUtils._addNextPageIndicator(targetElement, isVertical);
        }

        /**
         * 暂停打字效果
         */
        static pause() {
            if (TypewriterUtils._currentEffect) {
                clearInterval(TypewriterUtils._currentEffect.intervalId);
            }
        }

        /**
         * 继续打字效果
         */
        static resume() {
            if (TypewriterUtils._currentEffect) {
                const { element, text, speed, isVertical, resolve } = TypewriterUtils._currentEffect;
                TypewriterUtils._typeWriterEffect(element, text, speed, isVertical).then(resolve);
            }
        }

        /**
         * 获取当前打字速度
         * @returns {number} 当前速度（毫秒）
         */
        static getCurrentSpeed() {
            return TypewriterUtils.DEFAULT_SPEED;
        }

        /**
         * 设置默认打字速度
         * @param {number} speed - 新的速度（毫秒）
         */
        static setDefaultSpeed(speed) {
            TypewriterUtils.DEFAULT_SPEED = Math.max(TypewriterUtils.MIN_SPEED, Math.min(TypewriterUtils.MAX_SPEED, speed));
        }
    }

    // 暴露到全局
    window.TypewriterUtils = TypewriterUtils;

    // 日志输出
    console.log('%c[TypewriterUtils] 打字机效果工具已加载 v4.0', 'color: #4a9eff; font-weight: bold;');

})();