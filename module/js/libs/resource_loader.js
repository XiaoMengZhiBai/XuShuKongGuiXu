// =================== [resource_loader.js] =================
// 资源加载中心：负责脚本和 CSS 文件的加载、重试和超时逻辑。
// 依赖：GlobalUtils, ErrorHandler, 全局常量 (SCRIPT_TIMEOUT_MS, MAX_RETRY, ENABLE_RETRY)
// ==========================================================

/**
 * @class ResourceLoader
 * @description 资源加载中心：负责脚本和 CSS 文件的加载、重试和超时逻辑。
 */
class ResourceLoader {
    
    /** 顺序加载所有脚本 */
    static async loadScripts(scriptUrls) {
        GlobalUtils.log(`开始加载 ${scriptUrls.length} 个脚本...`);
        let loadedScripts = 0;
        const totalScripts = scriptUrls.length;

        for (let i = 0; i < totalScripts; i++) {
            const url = scriptUrls[i];
            await ResourceLoader.loadWithRetry(url);
            loadedScripts++;

            GlobalUtils.log(`[${loadedScripts}/${totalScripts}] 加载完成: ${url}`);

            // 派发加载进度事件
            window.dispatchEvent(new CustomEvent('app:progress', {
                detail: { loaded: loadedScripts, total: totalScripts, url: url }
            }));
        }
    }

    /** 带重试机制的加载 */
    static async loadWithRetry(url) {
        // 依赖全局常量 MAX_RETRY 和 ENABLE_RETRY
        for (let attempt = 1; attempt <= MAX_RETRY + 1; attempt++) {
            try {
                await ResourceLoader.loadScript(url);
                return; 
            } catch (err) {
                GlobalUtils.log(`⚠️ 加载失败: ${url} (第${attempt}次)`);

                if (!ENABLE_RETRY || attempt > MAX_RETRY) {
                    throw err; // 抛出错误给 AppLauncher
                }
                await GlobalUtils.delay(500 * attempt);
            }
        }
    }

    /** 加载单个脚本（支持超时） */
    static loadScript(url) {
        // 依赖全局常量 SCRIPT_TIMEOUT_MS
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            let isDone = false;
            let timeoutId;

            script.src = url;
            script.async = true; 

            const cleanup = () => {
                clearTimeout(timeoutId);
                script.onload = null;
                script.onerror = null;
            };

            script.onload = () => {
                if (!isDone) {
                    isDone = true;
                    cleanup();
                    resolve(url);
                }
            };

            script.onerror = () => {
                if (!isDone) {
                    isDone = true;
                    cleanup();
                    reject(new Error(`加载失败: ${url}`));
                }
            };

            timeoutId = setTimeout(() => {
                if (!isDone) {
                    isDone = true;
                    cleanup();
                    script.remove(); 
                    reject(new Error(`超时未响应 (${SCRIPT_TIMEOUT_MS}ms): ${url}`));
                }
            }, SCRIPT_TIMEOUT_MS);

            document.head.appendChild(script);
        });
    }

    /** 动态加载 CSS 文件 */
    static async loadCSSFiles(urls){
        if(typeof CSSLoader !== "undefined" && typeof CSSLoader.loadAll === "function"){
            GlobalUtils.log('ℹ️ 使用外部 CSSLoader 加载 CSS 文件...');
            await CSSLoader.loadAll(urls);
        } else {
            GlobalUtils.log('ℹ️ CSSLoader 不可用，使用内置 fallback 加载 CSS 文件...');
            await Promise.all(urls.map(url => new Promise((res, rej)=>{
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                link.onload = ()=>res();
                link.onerror = ()=>rej(ErrorHandler.handleNonFatalError('CSS加载失败: '+url));
                document.head.appendChild(link);
            })));
        }
    }
}

// 暴露到全局供 AppLauncher 使用
window.ResourceLoader = ResourceLoader;