// =================== [libs/error_handler.js v2.0] ===================
// 错误处理模块，提供常用的 warn、error、fatal 三个方法，并自动初始化全局捕获。
// 使用方式：ErrorHandler.warn() / ErrorHandler.error() / ErrorHandler.fatal()
// ==================================================================

;(() => {
    'use strict';

    const isDev = location.hostname === 'localhost' || location.hostname.includes('127.0.0.1');

    class ErrorHandler {
        // =================== 【非致命】 ===================
        static warn(message, details = null) {
            console.warn('%c[WARN]', 'color:#ff9900; font-weight:bold;', message);
            if (details && isDev) console.warn(details);
        }

        static error(message, details = null) {
            console.error('%c[ERROR]', 'color:#ff5555; font-weight:bold;', message);
            if (details && isDev) console.error(details);
        }

        // =================== 【致命错误 → 直接红屏/StartScreen】 ===================
        static fatal(message, details = '') {
            const fullMsg = details ? `${message}\n${details}` : message;

            console.error('%c[FATAL]', 'background:#c00; color:#fff; padding:4px 8px; font-weight:bold;', fullMsg);

            // 情况1：StartScreen 已经加载 → 用它的 showError（最优雅）
            if (typeof StartScreen !== 'undefined' && StartScreen?.showError) {
                StartScreen.showError(message + (details ? `<br><small>${details}</small>` : ''));
                return;
            }

            // 情况2：兜底红屏
            document.body.innerHTML = `
                <div style="position:fixed;inset:0;background:#110000;color:#fcc;font-family:system-ui,sans-serif;
                            display:flex;flex-direction:column;justify-content:center;align-items:center;
                            text-align:center;padding:40px;box-sizing:border-box;z-index:2147483647;">
                    <h1 style="color:#f66;font-size:3em;margin:0;">游戏启动失败</h1>
                    <p style="margin:20px 0;font-size:1.3em;">${message}</p>
                    ${details ? `<pre style="background:#300;padding:15px;border-radius:8px;max-width:90%;overflow:auto;font-size:0.9em;">${details}</pre>` : ''}
                    <p style="margin-top:40px;color:#aaa;">按 F12 查看控制台获取更多信息</p>
                </div>`;

            // 彻底停掉所有动画循环
            if (typeof cancelAnimationFrame === 'function') {
                let id = requestAnimationFrame(function tick() {
                    cancelAnimationFrame(id);
                    id = requestAnimationFrame(tick);
                });
            }
        }

        // =================== 【全局未捕获错误处理】 ===================
        static initGlobalCapture() {
            // Promise 未被 catch
            window.addEventListener('unhandledrejection', event => {
                const reason = event.reason;
                const msg = reason?.message || String(reason);
                const stack = reason?.stack || '';
                ErrorHandler.fatal('未捕获的 Promise 错误', msg + '\n' + stack);
                event.preventDefault();
            });

            // 同步脚本错误
            window.addEventListener('error', event => {
                if (event.error) {
                    ErrorHandler.fatal('脚本运行时错误', event.error.stack || event.error.message);
                } else {
                    ErrorHandler.error('资源加载失败', `${event.filename}:${event.lineno}`);
                }
                event.preventDefault();
            });
        }
    }

    // 暴露常用别名（兼容你原来的调用习惯）
    window.ErrorHandler = ErrorHandler;
    // 你原来可能写的是 fatalError → 再加一个别名，永不出错！
    window.ErrorHandler.fatalError = ErrorHandler.fatal;

    // 自动初始化全局捕获（一定要最先加载这个文件！）
    ErrorHandler.initGlobalCapture();

    // 开发时友好提示
    if (isDev) {
        console.log('%c[ErrorHandler] 已就绪，致命错误将被优雅捕获', 'color:#0b0');
    }
})();