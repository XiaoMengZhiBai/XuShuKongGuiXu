// ==========================[libs/html_element_creator.js]==========================
// @description 提供用于创建故事节点 HTML 元素的工具类。
// ==================================================================================
class HtmlElementCreator {

    /**
     * 创建一个包含图像卡片 (.image-card) 和文本部分 (.text-section) 的完整故事节点容器。
     * @param {string} nodeId - 故事节点的ID。
     * @param {Object} nodeData - 故事节点的数据 (title, character, text, image, background, choices, next等)。
     * @returns {HTMLElement} 包含图像和文本部分的完整 DOM 元素。
     */
    static createFullStoryNodeElement(nodeId, nodeData) {
        // --- 1. 创建主场景容器 ---
        const mainContainer = document.createElement('div');
        mainContainer.id = `story-node-${nodeId}`;
        mainContainer.className = 'game-scene-container';

        // 适配 CSS：左右排列
        mainContainer.style.display = 'flex';
        mainContainer.style.flexWrap = 'nowrap';
        mainContainer.style.gap = '20px';
        mainContainer.style.alignItems = 'stretch';
        mainContainer.style.justifyContent = 'space-between';

        // --- 2. 创建图片卡片 (.image-card) ---
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        
        if (nodeData.image) {
            const img = document.createElement('img');
            img.src = nodeData.image; 
            img.alt = nodeData.character || 'Scene Image';
            img.className = 'scene-image';
            imageCard.appendChild(img);
        } else if (nodeData.background) {
            imageCard.style.backgroundImage = `url(${nodeData.background})`; 
            imageCard.style.backgroundSize = 'cover';
            imageCard.style.backgroundPosition = 'center';
            imageCard.style.backgroundRepeat = 'no-repeat';
        }

        mainContainer.appendChild(imageCard);

        // --- 3. 创建文本部分 (.text-section) ---
        const textSection = document.createElement('div');
        textSection.className = 'text-section';
        
        // 角色名称
        if (nodeData.character) {
            const charEl = document.createElement('h3');
            charEl.className = 'story-character';
            charEl.textContent = nodeData.character;
            textSection.appendChild(charEl);
        }

        // 标题
        if (nodeData.title) {
            const titleEl = document.createElement('h2');
            titleEl.className = 'story-title';
            titleEl.textContent = nodeData.title;
            textSection.appendChild(titleEl);
        }

        // --- ⭕ 修复：文本内容会正常显示 nodeData.text ---
        const textEl = document.createElement('p');
        textEl.className = 'story-text';

        // 若未来要用打字机效果，可以从外部动态替换 textEl.textContent
        // 自动句号换行
        let t = nodeData.text || '';

        t = t
            .replace(/。/g, "。\n")
            .replace(/？/g, "？\n")
            .replace(/！/g, "！\n");

        textEl.textContent = t;


        textSection.appendChild(textEl);
        

        // --- 4. 按钮逻辑 ---

        // 选项 (choices)
        if (nodeData.choices && Array.isArray(nodeData.choices)) {
            const choicesContainer = document.createElement('div');
            choicesContainer.className = 'choices-container';
            
            nodeData.choices.forEach((choice) => {
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.textContent = choice.text;
                button.setAttribute('data-target', choice.target);
                choicesContainer.appendChild(button);
            });
            textSection.appendChild(choicesContainer);
        }

        // 导航按钮（无 choices 时）
        if (!nodeData.choices) {
            const navContainer = document.createElement('div');
            navContainer.className = 'node-navigation-container';
            
            // A. 上一章按钮（由外部控制显示/隐藏）
            const prevBtn = document.createElement('button');
            prevBtn.className = 'prev-btn';
            prevBtn.textContent = '上一章';
            prevBtn.setAttribute('data-action', 'prev');
            navContainer.appendChild(prevBtn);

            // B. 下一章按钮
            if (nodeData.next) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'next-btn';
                nextBtn.textContent = (nodeId === 'end_placeholder') ? '重来' : '下一章';
                nextBtn.setAttribute('data-target', nodeData.next);
                navContainer.appendChild(nextBtn);
            }
            
            // 单按钮右对齐
            if (!nodeData.prev && nodeData.next) {
                navContainer.style.justifyContent = 'flex-end';
            }
            
            // 如果容器内有按钮，则添加
            if (navContainer.children.length > 0) {
                textSection.appendChild(navContainer);
            }
        }

        mainContainer.appendChild(textSection);

        return mainContainer;
    }


    /**
     * @description 将整个故事数据转换为一个节点 ID 到完整 DOM 元素的 Map。
     */
    static createStoryElementsMap(storyData) {
        if (!storyData || typeof storyData !== 'object') {
            throw new Error("HtmlElementCreator: 提供的故事数据无效。");
        }

        const elementMap = new Map();
        
        for (const nodeId in storyData) {
            if (Object.prototype.hasOwnProperty.call(storyData, nodeId)) {
                const node = storyData[nodeId];
                try {
                    const fullNodeElement = this.createFullStoryNodeElement(nodeId, node);
                    elementMap.set(nodeId, fullNodeElement);
                } catch (e) {
                    console.error(`Error creating element for node ${nodeId}:`, e);
                }
            }
        }
        
        if (typeof GlobalUtils !== 'undefined') {
            GlobalUtils.log(`[HtmlElementCreator] 成功创建 ${elementMap.size} 个完整故事节点DOM元素。`);
        }

        return elementMap;
    }
}

window.HtmlElementCreator = HtmlElementCreator;
