let currentNodeEl = null;

async function renderStoryNode(container, nodeData) {
    // 1️⃣ 创建新节点
    const newNode = document.createElement('div');
    newNode.className = 'story-node';
    
    // 左右卡片容器
    const sceneContainer = document.createElement('div');
    sceneContainer.className = 'game-container';

    // 左侧图片
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-card enter-left';
    if (nodeData.image) {
        const img = document.createElement('img');
        img.src = nodeData.image;
        imgDiv.appendChild(img);
    } else if (nodeData.background) {
        imgDiv.style.backgroundImage = `url(${nodeData.background})`;
        imgDiv.style.backgroundSize = 'cover';
        imgDiv.style.backgroundPosition = 'center';
    }
    sceneContainer.appendChild(imgDiv);

    // 右侧文字
    const textDiv = document.createElement('div');
    textDiv.className = 'text-section enter-right';
    sceneContainer.appendChild(textDiv);

    if (nodeData.title) {
        const h2 = document.createElement('h2');
        await JsonExtractor.displayStoryText(h2, nodeData.title, true, 100);
        textDiv.appendChild(h2);
    }
    if (nodeData.character) {
        const h3 = document.createElement('h3');
        await JsonExtractor.displayStoryText(h3, nodeData.character, true, 100);
        textDiv.appendChild(h3);
    }
    if (nodeData.text) {
        const p = document.createElement('p');
        await JsonExtractor.displayStoryText(p, nodeData.text, true, 100);
        textDiv.appendChild(p);
    }

    // 选项/下一章按钮
    if (nodeData.choices) {
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'choices-container';
        nodeData.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn glow-btn';
            btn.textContent = choice.text;
            btn.setAttribute('data-target', choice.target);
            choicesContainer.appendChild(btn);
        });
        textDiv.appendChild(choicesContainer);
    } else if (nodeData.next) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'next-btn glow-btn';
        nextBtn.textContent = '下一章';
        nextBtn.setAttribute('data-target', nodeData.next);
        textDiv.appendChild(nextBtn);
    }

    // 光影脉动效果
    if (nodeData.effect === 'eerie-pulse') {
        imgDiv.classList.add('pulse');
        textDiv.classList.add('pulse');
    }

    // 2️⃣ 添加到容器
    container.appendChild(newNode);

    // 3️⃣ 触发淡入
    requestAnimationFrame(() => {
        newNode.classList.add('enter');
    });

    // 4️⃣ 旧节点淡出并删除
    if (currentNodeEl) {
        currentNodeEl.classList.remove('enter');
        currentNodeEl.classList.add('exit');
        currentNodeEl.addEventListener('transitionend', () => {
            if (currentNodeEl && currentNodeEl.parentNode) {
                currentNodeEl.parentNode.removeChild(currentNodeEl);
            }
        }, { once: true });
    }

    currentNodeEl = newNode;
    newNode.appendChild(sceneContainer);
}
