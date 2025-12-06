// =================== [utils.js] ========================
// 基础工具集：日志记录和延迟。
// 依赖：全局常量 DEBUG
// =======================================================

/**
 * @class GlobalUtils
 * @description 基础工具方法：日志记录和延迟。
 */
class GlobalUtils {
    /** 日志输出 */
    static log(...args) {
        // 假设 DEBUG 变量已在 index.js 中定义为全局常量
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            const timeStamp = performance.now().toFixed(2);
            console.log(`%c[AppLauncher][${timeStamp}ms]`, 'color:#6cf;', ...args);
        }
    }

    /** 延迟 */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 暴露到全局供其他脚本使用
window.GlobalUtils = GlobalUtils;