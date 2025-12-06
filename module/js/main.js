// ==================== [index.js v2.3.1 - 交互式启动] ====================
// 一个优雅、可扩展的前端脚本加载器 + 延迟启动器
// 核心逻辑已拆分至外部文件。流程改为：加载启动画面 -> 显示菜单 -> 并行加载游戏资源 -> 等待用户点击。
// 更新：已集成 HtmlElementCreator
// =========================================================================

// ==================== [核心依赖同步加载器] =====================
// ⚠️ 确保 GlobalUtils, ErrorHandler, ResourceLoader 在 AppLauncher 实例化前同步可用。
(function() {
    const coreDependencies = [
        'module/js/libs/error_handler.js',   // 错误处理
        'module/js/libs/utils.js',           // 日志, 延迟
        'module/js/libs/resource_loader.js',  // 资源加载
        'module/js/libs/ss_modal_manager.js',
    ];

    for (const url of coreDependencies) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false); // false = 同步请求 (Blocking)
        xhr.send(null);

        if (xhr.status === 200) {
            // 在全局作用域执行脚本内容，定义核心工具类
            (window.eval || eval)(xhr.responseText);
        } else {
            // 如果核心依赖加载失败，则应用无法启动，直接抛出致命错误
            console.error(`FATAL: Failed to synchronously load core dependency: ${url}`);
            throw new Error(`Core dependency failure: ${url}`);
        }
    }
})();

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
    'module/js/libs/storyEngine.js',
    'module/js/libs/json_extractor.js',
    'module/js/libs/game_render.js',
    'module/js/libs/MediaManager.js',
    'module/js/libs/game_init.js',
];


// CSS 文件列表
const CSS_URLS = [
    'module/css/animation.css',
    'module/css/index.css',
    'module/css/ui.css',
    'module/css/start_screen_styles.css'
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
    'module/js/libs/ss_modal_manager.js',
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

        // 🆕 新增：用于记录所有配置的URL，以便后续对比哪些未加载
        this.allUrls = [
            ...CSS_URLS.map(url => ({ url, type: 'CSS', loaded: false })),
            ...ESSENTIAL_SCRIPT_URLS.map(url => ({ url, type: 'ESSENTIAL_JS', loaded: false })),
            ...GAME_SCRIPT_URLS.map(url => ({ url, type: 'GAME_JS', loaded: false }))
        ];

        // 核心工具类已同步加载并可用
        if (typeof ErrorHandler !== 'undefined') {
            window.addEventListener('unhandledrejection', ErrorHandler.handleError);
            window.addEventListener('error', ErrorHandler.handleError);
        }

        if (typeof GlobalUtils !== 'undefined') {
            GlobalUtils.log('AppLauncher 初始化完成 ✅');
        }
    }
    
    // ------------------- 新增功能：加载状态记录与报告 -------------------

    /** 记录已加载的 URL */
    markLoaded(url) {
        const item = this.allUrls.find(item => item.url === url);
        if (item) {
            item.loaded = true;
        }
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
            GlobalUtils.log('开始启动流程...');

            // 0️⃣ 动态加载 CSS
            await ResourceLoader.loadCSSFiles(CSS_URLS);
            CSS_URLS.forEach(url => this.markLoaded(url)); // 记录成功加载的CSS
            GlobalUtils.log('✅ CSS 加载完成');

            // 1️⃣ 阶段一：加载启动画面脚本 (ESSENTIAL)
            if (ESSENTIAL_SCRIPT_URLS.length > 0) {
                await ResourceLoader.loadScripts(ESSENTIAL_SCRIPT_URLS);
                ESSENTIAL_SCRIPT_URLS.forEach(url => this.markLoaded(url)); // 记录成功加载的 ESSENTIAL
            }
            GlobalUtils.log('✅ 启动画面脚本加载完毕');

            // 2️⃣ 初始化启动动画 & 光影，并显示菜单
            // StartScreen 在其脚本文件末尾已经实例化并暴露到全局
            if(typeof StartScreen !== "undefined") StartScreen.init();
            if(typeof LightFX !== "undefined") LightFX.init();
            GlobalUtils.log('✨ 启动画面初始化完成，菜单显示...');

            // 3️⃣ **并行操作：** 启动游戏核心脚本的后台加载
            // 这里会加载 HtmlElementCreator 等游戏核心
            const gameLoadPromise = ResourceLoader.loadScripts(GAME_SCRIPT_URLS)
                .then(() => {
                    GAME_SCRIPT_URLS.forEach(url => this.markLoaded(url)); // 记录成功加载的 GAME
                })
                .catch(error => {
                    GlobalUtils.logError('🔴 游戏核心脚本后台加载失败', error);
                    throw error; // 重新抛出错误，让 Promise.all 捕获
                });
            GlobalUtils.log('⚙️ 游戏核心脚本已转入后台加载...');

            // 4️⃣ **并行操作：** 等待用户点击 "开始游戏"
            // 监听 game:start 事件 (通常由 StartScreen 触发)
            const userClickPromise = new Promise(resolve => {
                window.addEventListener('game:start', (e) => resolve(e.detail.isNewGame ? 'start' : 'continue'), { once: true });
            });
            GlobalUtils.log('👤 等待用户操作...');

            // 5️⃣ **同步等待：** 确保用户已点击 AND 所有游戏资源已加载完成
            await Promise.all([gameLoadPromise, userClickPromise]);
            GlobalUtils.log('✅ 用户已点击且后台资源加载完毕！');
            
            // 输出加载总结报告 (在所有加载完成后)
            this.logLoadingSummary(); 

            // 6️⃣ 自动扫描 data-animation
            if(typeof CSSLoader !== "undefined" && typeof CSSLoader.autoApplyAnimations === "function"){
                CSSLoader.autoApplyAnimations(5000);
            }

            // 7️⃣ 初始化业务逻辑
            this.initialize();

            // 8️⃣ 【关键】使用平滑销毁，避免黑屏闪烁
            await this.destroySmoothly();

            // 9️⃣ 启动完成
            this.isInitialized = true;
            GlobalUtils.log('🚀 应用启动成功！');
            window.dispatchEvent(new Event('app:ready'));

        } catch (err) {
            // 如果启动失败，也尝试输出加载总结，帮助调试
            this.logLoadingSummary(); 
            
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.fatalError('启动失败', err);
            } else {
                console.error('CRITICAL ERROR:', err);
            }
        }
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
// ==================== [启动入口] =========================
document.addEventListener('DOMContentLoaded', () => {
    if (window.__APP_LAUNCHER_INSTANTIATED__) {
        console.warn('⚠️ 应用已在运行，阻止重复启动');
        return;
    }
    window.__APP_LAUNCHER_INSTANTIATED__ = true;

    const app = new AppLauncher();
    app.run();
});

// =========================================================
// 可选：暴露到全局，方便调试
window.AppLauncher = AppLauncher;