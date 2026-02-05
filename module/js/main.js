// ==================== [index.js v2.3.1 - 交互式启动] ====================
// 一个优雅、可扩展的前端脚本加载器 + 延迟启动器
// 核心逻辑已拆分至外部文件。流程改为：加载启动画面 -> 显示菜单 -> 并行加载游戏资源 -> 等待用户点击。
// 更新：已集成 HtmlElementCreator
// =========================================================================

// ==================== [核心依赖异步加载器] =====================
// ⚠️ 修复：将同步加载改为异步加载，避免阻塞页面渲染
// ⚠️ 修复：移除eval使用，改用更安全的动态脚本加载方式
// ⚠️ 修复：确保核心依赖加载完成后再启动应用
document.addEventListener('DOMContentLoaded', async function() {
    const coreDependencies = [
        'module/js/libs/error_handler.js',   // 错误处理
        'module/js/libs/utils.js',           // 日志, 延迟
        'module/js/libs/resource_loader.js',  // 资源加载
        'module/js/libs/ss_modal_manager.js',
    ];

    // 检查是否已经实例化过，防止重复启动
    if (window.__APP_LAUNCHER_INSTANTIATED__) {
        console.warn('⚠️ 应用已在运行，阻止重复启动');
        return;
    }
    window.__APP_LAUNCHER_INSTANTIATED__ = true;

    console.log('🚀 开始加载核心依赖...');

    // 使用Promise.all并行加载所有核心依赖
    const loadPromises = coreDependencies.map(url => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                console.log(`✅ 核心依赖加载成功: ${url}`);
                resolve(url);
            };
            script.onerror = () => {
                console.error(`❌ 核心依赖加载失败: ${url}`);
                reject(new Error(`Core dependency failure: ${url}`));
            };
            document.head.appendChild(script);
        });
    });

    try {
        await Promise.all(loadPromises);
        console.log('🎉 所有核心依赖加载完成，开始启动应用...');
        
        // 核心依赖加载完成后，再实例化并启动AppLauncher
        const app = new AppLauncher();
        await app.run();
        
    } catch (error) {
        // 如果核心依赖加载失败，则应用无法启动，显示错误信息
        console.error('FATAL: 核心依赖加载失败，应用无法启动', error);
        
        // 显示用户友好的错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 10000;
            text-align: center;
            max-width: 80%;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3 style="color: #ff6b6b; margin-bottom: 15px;">❌ 应用启动失败</h3>
            <p style="margin-bottom: 20px;">核心资源加载失败，请检查网络连接后刷新页面重试。</p>
            <p style="font-size: 12px; opacity: 0.7; margin-bottom: 20px;">错误详情: ${error.message}</p>
            <button onclick="location.reload()" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">刷新页面</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// ==================== [配置区] ===========================

// 阶段一：启动画面和核心工具脚本 (异步加载)
// 这些脚本负责渲染启动界面，必须最先加载
const ESSENTIAL_SCRIPT_URLS = [
    // 启动画面 + 光影
    'module/js/libs/light_effects.js',
    'module/js/libs/start_screen.js', 
    'module/js/libs/css_loader.js',
];

// 阶段二：大体积的游戏脚本 (将在后台并行加载)
// 这些脚本包含游戏核心逻辑、UI构建器等
const GAME_SCRIPT_URLS = [
    'module/js/libs/html_element_creator.js',
    'module/js/libs/typewriter_utils.js',
    'module/js/libs/json_extractor.js',
    'module/js/libs/storyEngine.js',
    'module/js/libs/game_render.js',
    'module/js/libs/MediaManager.js',
    'module/js/libs/game_init.js',
    'module/js/libs/GameSystem.js',
    'module/js/libs/GameUI.js',
    'module/js/libs/InventorySystem.js',
    'module/js/libs/InventoryUI.js',
];


// CSS 文件列表
const CSS_URLS = [
    'module/css/animation.css',
    'module/css/index.css',
    'module/css/ui.css',
    'module/css/start_screen_styles.css',
];

// 启动延迟（毫秒）：现在被用户操作取代，此参数在 run() 中已不再使用
const STARTUP_DELAY_MS = 3000; 

// 是否开启调试日志
const DEBUG = true;

// 单个脚本最大加载时间（毫秒）
const SCRIPT_TIMEOUT_MS = 15000;

// 是否允许脚本加载失败重试
const ENABLE_RETRY = true;

// 最大重试次数
const MAX_RETRY = 2;

// 核心依赖（用于日志输出，假设它们已成功加载）
const CORE_SYNC_DEPENDENCIES = [
    'module/js/libs/error_handler.js',
    'module/js/libs/utils.js',
    'module/js/libs/resource_loader.js',
    'module/js/libs/ss_modal_manager.js'
];

// =========================================================
// ==================== [主应用类 (协调者)] =========================

/**
 * @class AppLauncher
 * @description 优雅、可扩展的前端脚本加载器和延迟启动器。
 */
class AppLauncher {
    constructor() {
        this.isInitialized = false;

        // 用于记录所有配置的URL，以便后续对比哪些未加载
        this.allUrls = [
            ...CSS_URLS.map(url => ({ url, type: 'CSS', loaded: false })),
            ...ESSENTIAL_SCRIPT_URLS.map(url => ({ url, type: 'ESSENTIAL_JS', loaded: false })),
            ...GAME_SCRIPT_URLS.map(url => ({ url, type: 'GAME_JS', loaded: false }))
        ];

        // 注意：全局错误捕获由 ErrorHandler.initGlobalCapture() 统一处理
        // 不需要在此处重复设置错误监听器

        if (typeof GlobalUtils !== 'undefined') {
            GlobalUtils.log('AppLauncher 初始化完成 ✅');
        } else {
            console.warn('⚠️ GlobalUtils 未定义，使用备用日志系统');
        }
    }

    /**
     * 清理方法，防止内存泄漏
     */
    cleanup() {
        // 清理 AppLauncher 自有的资源
        // 全局错误监听器由 ErrorHandler 管理，不需要在此清理

        if (DEBUG) {
            console.log('🔧 AppLauncher 清理完成');
        }
    }
    
    // ------------------- 新增功能：加载状态记录与报告 -------------------

    // 🆕 修复：优化方法名和逻辑，提高可读性
    /** 记录已加载的 URL */
    markUrlAsLoaded(url) {
        const item = this.allUrls.find(item => item.url === url);
        if (item) {
            item.loaded = true;
            if (DEBUG) {
                console.log(`📝 标记为已加载: ${url}`);
            }
        } else {
            console.warn(`⚠️ 尝试标记未知URL: ${url}`);
        }
    }
    
    // 🆕 新增：批量标记URL为已加载
    markUrlsAsLoaded(urls) {
        urls.forEach(url => this.markUrlAsLoaded(url));
    }

    /** 输出加载总结报告 */
    logLoadingSummary() {
        const loadedFiles = this.allUrls.filter(item => item.loaded);
        const failedFiles = this.allUrls.filter(item => !item.loaded);

        // 统一输出核心同步加载的依赖
        const coreDependencies = CORE_SYNC_DEPENDENCIES.map(url => ({ url, type: 'CORE_SYNC_JS', loaded: true }));


        console.log(' ');
        console.log('// ==================== [AppLauncher 加载总结] ====================');
        
        // 1. 绿色（已加载文件）列表
        console.log(`%c✅ 已加载文件总数: ${loadedFiles.length + coreDependencies.length}`, 'color: #10B981; font-weight: bold;');
        
        console.groupCollapsed('%c🟢 查看已加载文件列表 (点击展开)', 'color: #059669; font-weight: bold;');
        
        // 同步核心依赖
        coreDependencies.forEach(item => {
            console.log(`%c[${item.type}] ${item.url}`, 'color: #059669;');
        });

        // 异步加载文件
        loadedFiles.forEach(item => {
            let color = item.type === 'CSS' ? '#60A5FA' : (item.type === 'ESSENTIAL_JS' ? '#FBBF24' : '#3B82F6');
            console.log(`%c[${item.type}] ${item.url}`, `color: ${color};`);
        });
        console.groupEnd();


        // 2. 红色（未加载文件）列表
        if (failedFiles.length > 0) {
            console.log(`%c❌ 未加载文件总数: ${failedFiles.length}`, 'color: #EF4444; font-weight: bold;');
            console.groupCollapsed(`%c🔴 查看未加载/失败文件列表 (点击展开)`, 'color: #B91C1C; font-weight: bold;');
            failedFiles.forEach(item => {
                console.log(`%c[${item.type}] ${item.url}`, 'color: #EF4444;');
            });
            console.groupEnd();
        } else {
            console.log('%c🎉 所有配置的资源文件均已成功加载。', 'color: #10B981; font-weight: bold;');
        }
        
        console.log('// ================================================================');
        console.log(' ');
    }

    // ------------------- 核心流程 -------------------

    /** 启动整个应用 */
    async run() {
        try {
            // 🆕 修复：增强资源加载前的检查
            if (typeof ResourceLoader === 'undefined') {
                throw new Error('ResourceLoader 未定义，无法加载资源');
            }
            
            GlobalUtils?.log('开始启动流程...') || console.log('开始启动流程...');

            // 0️⃣ 动态加载 CSS
            // 🆕 修复：添加超时和重试机制
            await this.loadWithRetry(() => ResourceLoader.loadCSSFiles(CSS_URLS), 'CSS加载');
            this.markUrlsAsLoaded(CSS_URLS); // 记录成功加载的CSS
            GlobalUtils?.log('✅ CSS 加载完成') || console.log('✅ CSS 加载完成');

            // 1️⃣ 阶段一：加载启动画面脚本 (ESSENTIAL)
            if (ESSENTIAL_SCRIPT_URLS.length > 0) {
                await this.loadWithRetry(() => ResourceLoader.loadScripts(ESSENTIAL_SCRIPT_URLS), '启动画面脚本加载');
                this.markUrlsAsLoaded(ESSENTIAL_SCRIPT_URLS); // 记录成功加载的 ESSENTIAL
            }
            GlobalUtils?.log('✅ 启动画面脚本加载完毕') || console.log('✅ 启动画面脚本加载完毕');

            // 2️⃣ 初始化启动动画 & 光影，并显示菜单
            // StartScreen 在其脚本文件末尾已经实例化并暴露到全局
            // 🆕 修复：增强安全检查
            if(typeof StartScreen !== "undefined" && typeof StartScreen.init === "function") {
                StartScreen.init();
            } else {
                console.warn('⚠️ StartScreen.init 不可用');
            }
            
            if(typeof LightFX !== "undefined" && typeof LightFX.init === "function") {
                LightFX.init();
            } else {
                console.warn('⚠️ LightFX.init 不可用');
            }
            
            GlobalUtils?.log('✨ 启动画面初始化完成，菜单显示...') || console.log('✨ 启动画面初始化完成，菜单显示...');

            // 3️⃣ **并行操作：** 启动游戏核心脚本的后台加载
            // 这里会加载 HtmlElementCreator 等游戏核心
            const gameLoadPromise = this.loadWithRetry(() => ResourceLoader.loadScripts(GAME_SCRIPT_URLS), '游戏核心脚本加载')
                .then(() => {
                    this.markUrlsAsLoaded(GAME_SCRIPT_URLS); // 记录成功加载的 GAME
                })
                .catch(error => {
                    GlobalUtils?.logError('🔴 游戏核心脚本后台加载失败', error) || console.error('🔴 游戏核心脚本后台加载失败', error);
                    throw error; // 重新抛出错误，让 Promise.all 捕获
                });
            GlobalUtils?.log('⚙️ 游戏核心脚本已转入后台加载...') || console.log('⚙️ 游戏核心脚本已转入后台加载...');

            // 4️⃣ **并行操作：** 等待用户点击 "开始游戏"
            // 监听 game:start 事件 (通常由 StartScreen 触发)
            const userClickPromise = new Promise((resolve, reject) => {
                // 添加超时机制，防止用户永不点击
                const timeoutId = setTimeout(() => {
                    reject(new Error('用户操作超时，未在指定时间内点击开始游戏'));
                }, 60000); // 60秒超时

                const clickHandler = (e) => {
                    clearTimeout(timeoutId);
                    // 安全检查：确保 e.detail 存在后再访问 isNewGame
                    const detail = e.detail || {};
                    resolve(detail.isNewGame ? 'start' : 'continue');
                };

                window.addEventListener('game:start', clickHandler, { once: true });
            });
            GlobalUtils?.log('👤 等待用户操作...') || console.log('👤 等待用户操作...');

            // 5️⃣ **同步等待：** 确保用户已点击 AND 所有游戏资源已加载完成
            await Promise.all([gameLoadPromise, userClickPromise]);
            GlobalUtils?.log('✅ 用户已点击且后台资源加载完毕！') || console.log('✅ 用户已点击且后台资源加载完毕！');
            
            // 输出加载总结报告 (在所有加载完成后)
            this.logLoadingSummary(); 

            // 6️⃣ 自动扫描 data-animation
            if(typeof CSSLoader !== "undefined" && typeof CSSLoader.autoApplyAnimations === "function"){
                CSSLoader.autoApplyAnimations(5000);
            } else {
                console.warn('⚠️ CSSLoader.autoApplyAnimations 不可用');
            }

            // 7️⃣ 初始化业务逻辑
            this.initialize();

            // 8️⃣ 【关键】使用平滑销毁，避免黑屏闪烁
            await this.destroySmoothly();

            // 9️⃣ 启动完成
            this.isInitialized = true;
            GlobalUtils?.log('🚀 应用启动成功！') || console.log('🚀 应用启动成功！');
            window.dispatchEvent(new Event('app:ready'));

        } catch (err) {
            // 如果启动失败，也尝试输出加载总结，帮助调试
            this.logLoadingSummary(); 
            
            // 🆕 修复：增强错误处理
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.fatalError('启动失败', err);
            } else {
                console.error('CRITICAL ERROR: 启动失败', err);
                // 提供用户友好的错误信息
                this.showErrorToUser('应用启动失败，请刷新页面重试');
            }
            
            // 清理资源
            this.cleanup();
        }
    }
    
    // 🆕 新增：带重试机制的加载方法
    async loadWithRetry(loadFunction, description, maxRetries = MAX_RETRY) {
        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                return await loadFunction();
            } catch (error) {
                if (attempt > maxRetries) {
                    throw error; // 达到最大重试次数，抛出错误
                }
                console.warn(`⚠️ ${description} 第 ${attempt} 次尝试失败，${attempt < maxRetries ? '重试中...' : '最后一次尝试'}`);
                await GlobalUtils?.delay(1000 * attempt) || new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    // 🆕 新增：用户友好的错误显示
    showErrorToUser(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>❌ 应用启动错误</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">刷新页面</button>
        `;
        document.body.appendChild(errorDiv);
    }
    
    /** 平滑销毁启动画面和光影效果 */
    async destroySmoothly() {
        GlobalUtils.log('开始平滑销毁启动画面...');

        const fadeDuration = 500; 

        // 1. 调用 StartScreen/LightFX 的淡出方法
        if (typeof LightFX !== "undefined" && typeof LightFX.fadeOut === "function") {
            LightFX.fadeOut(); 
        }
        if (typeof StartScreen !== "undefined" && typeof StartScreen.fadeOut === "function") {
            StartScreen.fadeOut(); 
        }
        
        // 等待淡出动画完成
        await GlobalUtils.delay(fadeDuration); 

        // 2. 销毁（移除 DOM 元素）
        if(typeof StartScreen !== "undefined") StartScreen.destroy();
        if(typeof LightFX !== "undefined") LightFX.destroy();
        
        GlobalUtils.log('👋 启动画面销毁完成。');
    }


    /** 初始化业务逻辑（所有脚本已就绪） */
    initialize() {
        GlobalUtils.log('执行全局初始化...');

        // 确保主应用容器可见（HTML 文件中为 #game-container）
        const mainAppContainer = document.getElementById('game-container');
        if (mainAppContainer) {
             mainAppContainer.style.display = ''; 
             mainAppContainer.style.opacity = '1';
        }
        
        // 调用所有预期的初始化函数
        // 此时 HtmlElementCreator 已经可用，可以被 LogicSystem 或 GameInit 调用
        
        if (typeof window.LogicSystem?.init === 'function') {
            window.LogicSystem.init();
        }
        if (typeof window.GameInit === 'function') {
            window.GameInit();
        }
        if (typeof window.UIInit === 'function') {
            window.UIInit();
        }

        window.dispatchEvent(new Event('app:initialized'));
    }
}

// =========================================================
// ==================== [启动入口已移至核心依赖加载器] =========================
// 启动逻辑现在在核心依赖加载完成后执行，确保依赖可用

// =========================================================
// 可选：暴露到全局，方便调试
window.AppLauncher = AppLauncher;