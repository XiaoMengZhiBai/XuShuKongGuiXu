/**
 * @fileoverview TypewriterUtils - 通用的逐字显示（打字机）效果工具。
 */
class TypewriterUtils {
    
    static #typeWriterEffect(el, text, speed = 60) {
        return new Promise(resolve => {
            let index = 0;
            el.innerHTML = '';
            
            const interval = setInterval(() => {
                const char = text[index];
                
                if (char === undefined) {
                    clearInterval(interval);
                    el.classList.remove('typing-cursor');
                    el.classList.add('typing-done'); 
                    resolve();
                    return;
                }

                if (!el.classList.contains('typing-cursor')) {
                     el.classList.add('typing-cursor');
                }

                if (char === '\n') {
                    el.innerHTML += '<br>';
                } else {
                    el.innerHTML += char;
                }

                index++;
            }, speed);
        });
    }

    static async display(targetEl, textContent, vertical = true, speed = 60) {
        if (!targetEl || !(targetEl instanceof HTMLElement)) {
            return Promise.resolve();
        }
        
        const finalContent = Array.isArray(textContent) 
            ? textContent.join("\n").replace(/<br>/g, '\n') 
            : (textContent || "").replace(/<br>/g, '\n');

        targetEl.innerHTML = ''; 
        targetEl.classList.remove('typing-done');
        
        if (vertical) {
            targetEl.style.writingMode = 'vertical-rl';
            targetEl.style.whiteSpace = 'pre-wrap';
            targetEl.style.textAlign = 'center';
            targetEl.style.padding = '10px';
        } else {
            targetEl.style.writingMode = 'initial';
        }

        return this.#typeWriterEffect(targetEl, finalContent, speed);
    }
}
window.TypewriterUtils = TypewriterUtils;