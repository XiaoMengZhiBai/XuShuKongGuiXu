// ======================[ss_modal_manager.js]=====================
// 启动画面模态框管理器
// 功能：管理启动画面的模态框显示和隐藏
// ============================================================

;(() => {
    'use strict';

    /**
     * 模态框管理器类
     * 用于创建和管理启动画面的模态框
     */
    class SSModalManager {
        constructor() {
            this.activeModal = null; // 当前活动的模态框
            this.modalStack = [];     // 模态框堆栈
        }

        /**
         * 显示模态框
         * @param {Object} options - 模态框配置选项
         * @param {string} options.title - 模态框标题
         * @param {string} options.content - 模态框内容（HTML 或纯文本）
         * @param {boolean} options.isHtml - 内容是否为 HTML
         * @param {Array} options.buttons - 按钮配置数组
         */
        show(options = {}) {
            const {
                title = '提示',
                content = '',
                isHtml = false,
                buttons = []
            } = options;

            // 创建模态框元素
            const modal = document.createElement('div');
            modal.className = 'ss-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            // 创建模态框内容容器
            const modalContent = document.createElement('div');
            modalContent.className = 'ss-modal-content';
            modalContent.style.cssText = `
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #4a9eff;
                border-radius: 10px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 0 20px rgba(74, 158, 255, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            `;

            // 创建标题
            const titleEl = document.createElement('h2');
            titleEl.className = 'ss-modal-title';
            titleEl.textContent = title;
            titleEl.style.cssText = `
                color: #4a9eff;
                margin: 0 0 20px 0;
                font-size: 24px;
                text-align: center;
                font-family: '方正行楷_GBK', serif;
            `;

            // 创建内容区域
            const contentEl = document.createElement('div');
            contentEl.className = 'ss-modal-body';
            contentEl.style.cssText = `
                color: #e0e0e0;
                margin-bottom: 20px;
                line-height: 1.6;
                max-height: 300px;
                overflow-y: auto;
            `;

            if (isHtml) {
                contentEl.innerHTML = content;
            } else {
                contentEl.textContent = content;
            }

            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'ss-modal-buttons';
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 10px;
            `;

            // 添加按钮
            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn.text;
                button.style.cssText = `
                    padding: 10px 20px;
                    border: 1px solid #4a9eff;
                    background: transparent;
                    color: #4a9eff;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                `;
                button.onmouseover = () => {
                    button.style.background = '#4a9eff';
                    button.style.color = '#fff';
                };
                button.onmouseout = () => {
                    button.style.background = 'transparent';
                    button.style.color = '#4a9eff';
                };
                button.onclick = () => {
                    if (btn.onClick) {
                        btn.onClick();
                    }
                    this.hide();
                };
                buttonContainer.appendChild(button);
            });

            // 组装模态框
            modalContent.appendChild(titleEl);
            modalContent.appendChild(contentEl);
            modalContent.appendChild(buttonContainer);
            modal.appendChild(modalContent);

            // 添加到页面
            document.body.appendChild(modal);

            // 显示动画
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            });

            // 保存引用
            this.activeModal = modal;
            this.modalStack.push(modal);

            return modal;
        }

        /**
         * 隐藏当前模态框
         */
        hide() {
            if (!this.activeModal) return;

            // 隐藏动画
            this.activeModal.style.opacity = '0';
            const content = this.activeModal.querySelector('.ss-modal-content');
            if (content) {
                content.style.transform = 'scale(0.9)';
            }

            // 延迟移除 DOM
            setTimeout(() => {
                if (this.activeModal && this.activeModal.parentNode) {
                    this.activeModal.parentNode.removeChild(this.activeModal);
                }
                this.modalStack.pop();
                this.activeModal = this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
            }, 300);
        }

        /**
         * 隐藏所有模态框
         */
        hideAll() {
            while (this.modalStack.length > 0) {
                this.hide();
            }
        }

        /**
         * 显示关于对话框
         */
        showAbout() {
            this.show({
                title: '📜 虚数归墟 - 关于 🌌',
                content: `
                    <p style="margin-bottom: 15px;">
                        本启动画面是为 **《虚数归墟》** 项目定制的粒子特效启动界面。
                    </p>
                    <p style="margin-bottom: 15px;">
                        融合古风美学与科学幻想，营造神秘而优雅的视觉体验。
                    </p>
                    <p style="margin-bottom: 15px;">
                        <strong>技术特性：</strong>
                    </p>
                    <ul style="text-align: left; margin-bottom: 15px;">
                        <li>粒子涡旋动画系统</li>
                        <li>动态光影效果</li>
                        <li>平滑过渡动画</li>
                        <li>响应式设计</li>
                    </ul>
                    <p style="margin-bottom: 10px;">
                        <strong>开发团队：</strong> 晓梦 + Grok + ChatGPT + Gemini
                    </p>
                    <p style="color: #4a9eff; font-size: 14px;">
                        © 2024 虚数归墟 · All Rights Reserved
                    </p>
                `,
                isHtml: true,
                buttons: [
                    { text: '确定', onClick: () => {} }
                ]
            });
        }

        /**
         * 显示错误对话框
         * @param {string} message - 错误消息
         * @param {string} details - 错误详情
         */
        showError(message, details = '') {
            this.show({
                title: '❌ 错误',
                content: details ? `${message}\n\n${details}` : message,
                isHtml: false,
                buttons: [
                    { text: '确定', onClick: () => {} }
                ]
            });
        }

        /**
         * 显示确认对话框
         * @param {string} message - 确认消息
         * @param {Function} onConfirm - 确认回调
         * @param {Function} onCancel - 取消回调
         */
        showConfirm(message, onConfirm, onCancel) {
            this.show({
                title: '确认',
                content: message,
                isHtml: false,
                buttons: [
                    { text: '取消', onClick: () => onCancel && onCancel() },
                    { text: '确定', onClick: () => onConfirm && onConfirm() }
                ]
            });
        }
    }

    // 创建单例实例
    const modalManager = new SSModalManager();

    // 暴露到全局
    window.SSModalManager = modalManager;

    // 日志输出
    console.log('%c[SSModalManager] 模态框管理器已加载', 'color: #4a9eff; font-weight: bold;');

})();