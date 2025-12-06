// StoryDisplay.js
(function(global) {
    'use strict';

    function adaptStoryData(originalData) {
        if (!Array.isArray(originalData) && typeof originalData === 'object') {
            return originalData;
        }
        return originalData.reduce((map, scene, i) => {
            const id = scene.id || `pt${String(i+1).padStart(3,'0')}`;
            map[id] = { ...scene };
            return map;
        }, {});
    }

    global.initStory = function(mainInstance, initialSceneId = null) {
        if (!window.storyData) {
            console.error("Story data missing or invalid.");
            return;
        }

        mainInstance.storyDataMap = adaptStoryData(window.storyData);

        mainInstance.currentSceneId = initialSceneId 
            || Object.keys(mainInstance.storyDataMap)[0];

        if (typeof global.initButtons === 'function') {
            global.initButtons(mainInstance);
        }

        if (!mainInstance.gameStarted) {
            global.displayScene(mainInstance, mainInstance.currentSceneId, false);
            mainInstance.gameStarted = true;
        }
    };

    // ------------------🔥 方案 A 核心：每次进入场景重新创建 DOM ------------------
    global.displayScene = async function(main, sceneId, pushToHistory = true) {
        const scene = main.storyDataMap?.[sceneId];

        if (!scene) {
            console.error(`场景 ${sceneId} 未找到`);
            return;
        }
        
        main.currentSceneId = sceneId;

        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error("game-container 容器不存在");
            return;
        }

        // ❗❗❗ 每次重新创建 DOM，绝不复用旧元素
        const sceneElement = HtmlElementCreator.createFullStoryNodeElement(sceneId, scene);

        gameContainer.innerHTML = '';
        gameContainer.appendChild(sceneElement);

        // ----------- 打字机效果 -----------
        const textEl = sceneElement.querySelector('.story-text');
        const textContent = scene.text || "";

        let typingPromise = Promise.resolve();
        if (textEl && window.TypewriterUtils) {
            typingPromise = TypewriterUtils.display(textEl, textContent, true, 60);
        } else if (textEl) {
            textEl.innerHTML = textContent.replace(/\n/g, "<br>");
        }

        await typingPromise;

        // 接下来你自己的 "choices / next" 逻辑...
    };

})(window);
