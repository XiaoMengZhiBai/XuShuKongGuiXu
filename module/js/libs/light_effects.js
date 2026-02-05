// ======================[light_effects.js]=====================
// 古风 × 诡异 × 科学融合 光影特效层
// 作者：晓梦 + Grok + ChatGPT + Gemini
// 功能：创建具有粒子特效的光影动画层，支持涡旋运动和颜色渐变
// ============================================================

(function(global){

    const LightFX = {
        canvas: null,        // 画布元素
        ctx: null,           // 画布上下文
        width: 0,            // 画布宽度
        height: 0,           // 画布高度
        particles: [],       // 粒子数组
        running: false,      // 动画运行状态
        lastTime: 0,         // 上一帧时间
        resizeHandler: null, // 窗口大小变化事件处理器（用于清理）

        /**
         * 初始化光影特效
         */
        init() {
            this.createCanvas();
            this.spawnParticles();
            this.running = true;
            this.lastTime = performance.now();
            this.loop();
        },

        /**
         * 创建画布并设置样式
         */
        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();

            this.canvas.style.position = "fixed";
            this.canvas.style.left = 0;
            this.canvas.style.top = 0;
            // 页面层级是 9998，保证画布在最上层
            this.canvas.style.zIndex = 9998;
            this.canvas.style.pointerEvents = "none";

            // 设置 CSS Opacity，使整个画布半透明
            this.canvas.style.opacity = 0.5; // 设置为 50% 透明度
            this.canvas.style.transition = "opacity 0.5s ease-out"; // 添加过渡效果

            this.ctx.globalCompositeOperation = 'lighter';

            document.body.appendChild(this.canvas);

            // 保存 resize 处理器引用，便于后续清理
            this.resizeHandler = () => this.resize();
            window.addEventListener("resize", this.resizeHandler);
        },

        /**
         * 调整画布大小以适应窗口
         */
        resize() {
            if (!this.canvas || !this.ctx) return;

            const dpr = window.devicePixelRatio || 1;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);
        },

        /**
         * 生成粒子（仿佛灵魂 & 科技能量交织）
         */
        spawnParticles() {
            const count = 120;
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: 0.5 + Math.random() * 2,
                    speedX: (Math.random() - 0.5) * 8,
                    speedY: (Math.random() - 0.5) * 8,
                    alpha: 0.2 + Math.random() * 0.5,
                    colorHue: Math.floor(Math.random() * 30 + 180),
                    sinOffset: Math.random() * 2 * Math.PI,
                });
            }
        },

        /**
         * 绘制一帧动画
         */
        draw() {
            const now = performance.now();
            const dt = (now - this.lastTime) / 1000;
            this.lastTime = now;

            const trailAlpha = 0.1;
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
            this.ctx.fillRect(0,0,this.width,this.height);
            this.ctx.globalCompositeOperation = 'lighter';

            const cx = this.width / 2;
            const cy = this.height / 2;

            for (let p of this.particles) {

                const dx = cx - p.x;
                const dy = cy - p.y;
                const dist = Math.hypot(dx, dy);

                const vortexStrength = 0.005;
                p.speedX += dx * vortexStrength * dt;
                p.speedY += dy * vortexStrength * dt;

                const waveSpeed = 0.2 + p.size * 0.1;
                p.x += Math.cos(now * 0.0001 + p.sinOffset) * waveSpeed;
                p.y += Math.sin(now * 0.0001 + p.sinOffset) * waveSpeed;

                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < -10 || p.x > this.width + 10 || p.y < -10 || p.y > this.height + 10) {
                     p.x = Math.random() * this.width;
                     p.y = Math.random() * this.height;
                }

                const centerEffect = Math.max(0, 1 - dist / (this.width * 0.5));
                const finalAlpha = Math.max(0.05, centerEffect * 0.8 * p.alpha);

                const finalHue = p.colorHue + (330 - p.colorHue) * centerEffect * 0.5;

                this.ctx.fillStyle = `hsla(${finalHue}, 100%, 75%, ${finalAlpha})`;
                this.ctx.beginPath();
                const finalSize = p.size * (1 + centerEffect * 0.5);
                this.ctx.arc(p.x, p.y, finalSize, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // 绘制径向渐变背景
            const g = this.ctx.createRadialGradient(
                cx, cy, 0,
                cx, cy, this.width/3
            );
            g.addColorStop(0, "hsla(300, 100%, 50%, 0.25)");
            g.addColorStop(0.5, "hsla(200, 100%, 50%, 0.15)");
            g.addColorStop(1, "rgba(0,0,0,0)");

            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = g;
            this.ctx.fillRect(0,0,this.width,this.height);
        },

        /**
         * 动画循环
         */
        loop() {
            if (!this.running) return;
            this.draw();
            requestAnimationFrame(() => this.loop());
        },

        /**
         * 淡出效果（平滑过渡到透明）
         */
        fadeOut() {
            if (this.canvas) {
                this.canvas.style.opacity = 0;
            }
        },

        /**
         * 销毁光影特效，释放所有资源
         * 修复内存泄漏：正确释放画布上下文和 GPU 资源
         */
        destroy() {
            // 停止动画循环
            this.running = false;

            // 移除事件监听器
            if (this.resizeHandler) {
                window.removeEventListener("resize", this.resizeHandler);
                this.resizeHandler = null;
            }

            // 清除画布内容
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.width, this.height);
                // 释放画布上下文
                this.ctx = null;
            }

            // 移除 DOM 元素
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }

            // 清空引用，帮助垃圾回收
            this.canvas = null;
            this.particles = [];
            this.width = 0;
            this.height = 0;
        }
    };

    global.LightFX = LightFX;

})(window);