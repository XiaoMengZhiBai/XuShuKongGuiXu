/**
 * @fileoverview JsonExtractor - 通用的异步 JSON 文件加载和解析工具，
 * 增加了竖排逐字显示功能。
 * @author Gemini
 */
class JsonExtractor {
    
    // --- 核心数据加载方法 ---

    /**
     * @description 通用地加载和解析 JSON 文件。
     * @param {string} url - JSON 文件的路径。
     * @returns {Promise<Object>} 解析后的 JSON 对象。
     */
    static async load(url) {
        if (!url) {
            throw new Error("JsonExtractor: URL 不能为空。");
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorMsg = `HTTP Error ${response.status} while fetching ${url}`;
                console.error(errorMsg);
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            // 简单日志
            const logFn = (typeof GlobalUtils !== 'undefined' && GlobalUtils.log) ? GlobalUtils.log : console.log;
            logFn(`[JsonExtractor] 成功加载并解析: ${url}`);
            
            return data;

        } catch (error) {
            const errMsg = `Failed to load/parse JSON file: ${url}. Details: ${error.message}`;
            console.error(`[JsonExtractor] 致命错误: ${errMsg}`, error);
            throw new Error(errMsg);
        }
    }

    // --- 竖排逐字显示功能实现（打字机） ---

    /**
     * @description 私有方法：实现文本内容的逐字显示效果动画。
     * @param {HTMLElement} el - 用于显示文本的 DOM 元素。
     * @param {string} text - 需要展示的完整文本内容 (可以包含 <br> 标签)。
     * @param {number} [speed=200] - 每个字符输入的时间间隔（毫秒）。
     * @returns {Promise<void>} 动画完成时解析的 Promise。
     */
    static #typeWriterEffect(el, text, speed = 200) {
        return new Promise(resolve => {
            let index = 0;
            el.innerHTML = '';
            
            // 将 <br> 替换为 '\n'，方便逐字迭代
            const processedText = text.replace(/<br\s*\/?>/gi, '\n');

            const interval = setInterval(() => {
                const char = processedText[index];
                
                if (index >= processedText.length) {
                    clearInterval(interval);
                    el.classList.remove('typing-cursor');
                    el.classList.add('typing-done');
                    resolve();
                    return;
                }
                
                el.classList.add('typing-cursor');

                if (char === '\n') {
                    el.innerHTML += '<br>';
                } else {
                    el.innerHTML += char;
                }

                index++;
            }, speed);
        });
    }

    /**
     * @description 封装文本显示逻辑，实现竖排逐字效果。
     * @param {HTMLElement} targetEl - 用于显示文本的 DOM 元素（如 <p>）。
     * @param {(string|string[])} textContent - 要显示的文本，可以是字符串或字符串数组。
     * @param {boolean} [vertical=true] - 是否启用竖排显示样式（vertical-rl）。
     * @param {number} [speed=200] - 打字速度（毫秒/字符）。
     * @returns {Promise<void>} 打字机动画完成时解析的 Promise。
     */
    static async displayStoryText(targetEl, textContent, vertical = true, speed = 200) {
        if (!targetEl || !(targetEl instanceof HTMLElement)) {
            throw new Error("JsonExtractor.displayStoryText: targetEl 必须是有效的 HTMLElement。");
        }
        
        // 1. 文本预处理：将数组或多段文本合并，用 <br> 连接
        const finalContent = Array.isArray(textContent) ? textContent.join("<br>") : textContent || "";

        // 2. 应用竖排样式
        if (vertical) {
            targetEl.style.writingMode = 'vertical-rl';
            targetEl.style.whiteSpace = 'pre-wrap';
            targetEl.style.textAlign = 'center';
            targetEl.style.padding = '10px';
        } else {
            targetEl.style.writingMode = 'horizontal-tb';
        }

        // 3. 执行打字机动画
        return await JsonExtractor.#typeWriterEffect(targetEl, finalContent, speed);
    }
}

window.JsonExtractor = JsonExtractor;