// =================== [libs/error_handler.js v3.1] ===================
// 错误处理模块 - 提供警告、错误、致命错误处理及全局错误捕获
// 功能：统一的错误日志、安全的错误显示、XSS 防护
// ====================================================================

;(() => {
    'use strict';

    const hostname = (typeof location !== 'undefined' && location.hostname) || '';
    const isDev = hostname === 'localhost' || hostname.includes('127.0.0.1');

    // 统一格式化输出
    const log = {
        warn: (msg) =>
            console.warn('%c[WARN]', 'color:#ff9900;font-weight:bold;', msg),

        error: (msg) =>
            console.error('%c[ERROR]', 'color:#ff5555;font-weight:bold;', msg),

        fatal: (msg) =>
            console.error('%c[FATAL]', 'background:#c00;color:#fff;padding:4px 8px;font-weight:bold;', msg)
    };

    /**
     * HTML 转义函数 - 防止 XSS 攻击
     * @param {string} text - 需要转义的文本
     * @returns {string} 转义后的安全文本
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    class ErrorHandler {

        // -------------------- 普通警告 --------------------
        static warn(message, details = null) {
            log.warn(message);
            if (details && isDev) console.warn(details);
        }

        // -------------------- 普通错误 --------------------
        static error(message, details = null) {
            log.error(message);
            if (details && isDev) console.error(details);
        }

        // -------------------- 非致命错误处理方法（供其他模块调用）--------------------
        /**
         * 处理非致命错误 - 不会中断程序运行
         * @param {string} message - 错误消息
         * @param {Error|Object} details - 错误详情
         * @returns {Error} 返回错误对象
         */
        static handleNonFatalError(message, details = null) {
            const errorObj = new Error(message);
            if (details) {
                if (details instanceof Error) {
                    errorObj.stack = details.stack;
                } else {
                    errorObj.details = details;
                }
            }
            ErrorHandler.error(message, details);
            return errorObj;
        }

        // -------------------- 错误事件处理器（供事件监听器使用）--------------------
        /**
         * 统一的错误事件处理器
         * @param {Event|ErrorEvent|PromiseRejectionEvent} event - 错误事件对象
         */
        static handleError(event) {
            if (event instanceof PromiseRejectionEvent) {
                // Promise 拒绝错误
                const reason = event.reason;
                const msg = reason?.message || String(reason);
                const stack = reason?.stack || '';
                ErrorHandler.fatal('未捕获的 Promise 错误', msg + '\n' + stack);
            } else if (event instanceof ErrorEvent) {
                // 同步错误
                if (event.error) {
                    ErrorHandler.fatal('脚本运行时错误', event.error.stack || event.error.message);
                } else {
                    ErrorHandler.error('资源加载失败', `${event.filename}:${event.lineno}`);
                }
            } else {
                ErrorHandler.error('未知错误', event);
            }
        }

        // -------------------- 致命错误：优雅红屏 --------------------
        static fatal(message, details = '') {
            const fullMsg = details ? `${message}\n${details}` : message;
            log.fatal(fullMsg);

            // 优先使用 StartScreen
            if (typeof StartScreen !== 'undefined' && StartScreen?.showError) {
                // 🔒 安全修复：转义 details 防止 XSS
                const safeMessage = escapeHtml(message);
                const safeDetails = details ? escapeHtml(details) : '';
                StartScreen.showError(
                    safeMessage + (safeDetails ? `<br><small>${safeDetails}</small>` : '')
                );
                return;
            }

            // 避免重复创建红屏 DOM
            if (!document.getElementById('__fatal_screen__')) {
                const div = document.createElement('div');
                div.id = '__fatal_screen__';
                div.style = `
                    position:fixed;inset:0;background:#110000;color:#fcc;font-family:system-ui,sans-serif;
                    display:flex;flex-direction:column;justify-content:center;align-items:center;
                    text-align:center;padding:40px;box-sizing:border-box;z-index:2147483647;
                `;
                // 🔒 安全修复：转义所有用户输入
                const safeMessage = escapeHtml(message);
                const safeDetails = details ? escapeHtml(details) : '';
                div.innerHTML = `
                    <h1 style="color:#f66;font-size:3em;margin:0;">游戏启动失败</h1>
                    <p style="margin:20px 0;font-size:1.3em;">${safeMessage}</p>
                    ${
                        safeDetails
                            ? `
                        <pre style="
                            background:#300;padding:15px;border-radius:8px;
                            max-width:90%;overflow:auto;font-size:0.9em;
                        ">${safeDetails}</pre>`
                            : ''
                    }
                    <p style="margin-top:40px;color:#aaa;">按 F12 查看控制台获取更多信息</p>
                `;
                document.body.appendChild(div);
            }

            // 🔧 修复：正确停止所有动画循环
            // 停止 requestAnimationFrame 循环
            const stopAllAnimations = () => {
                // 重写 requestAnimationFrame，返回一个什么都不做的函数
                const originalRAF = window.requestAnimationFrame;
                let animationIds = [];
                
                window.requestAnimationFrame = (callback) => {
                    const id = originalRAF(callback);
                    animationIds.push(id);
                    return id;
                };
                
                // 取消所有待处理的动画帧
                animationIds.forEach(id => cancelAnimationFrame(id));
                
                // 恢复原始函数
                window.requestAnimationFrame = originalRAF;
            };
            
            try {
                stopAllAnimations();
            } catch (e) {
                // 静默失败，避免在错误处理中再次抛出错误
            }
        }

        // -------------------- 全局错误捕获 --------------------
        static initGlobalCapture() {

            // 捕获未处理的 Promise
            window.addEventListener('unhandledrejection', event => {
                ErrorHandler.handleError(event);
                event.preventDefault();
            });

            // 捕获同步脚本错误
            window.addEventListener('error', event => {
                ErrorHandler.handleError(event);
                event.preventDefault();
            });
        }
    }

    // 暴露全局别名
    window.ErrorHandler = ErrorHandler;
    window.ErrorHandler.fatalError = ErrorHandler.fatal;

    // 自动初始化
    ErrorHandler.initGlobalCapture();

    if (isDev) {
        console.log(
            '%c[ErrorHandler] 已就绪，致命错误将被优雅捕获',
            'color:#0b0;font-weight:bold;'
        );
    }
})();
