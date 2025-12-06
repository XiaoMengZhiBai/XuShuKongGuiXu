// ======================[light_effects.js]=====================
// 古风 × 诡异 × 科学融合 光影特效层
// 作者：晓梦 + Grok + ChatGPT + Gemini
// 修复: 增加画布 CSS 透明度 (opacity)，使其更好地融入背景。
// ============================================================

(function(global){

    const LightFX = {
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        particles: [],
        running: false,
        lastTime: 0, 

        init() {
            this.createCanvas();
            this.spawnParticles();
            this.running = true;
            this.lastTime = performance.now();
            this.loop();
        },

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
            
            // !!! 核心修改点: 设置 CSS Opacity，使整个画布半透明 !!!
            this.canvas.style.opacity = 0.5; // 设置为 50% 透明度

            this.ctx.globalCompositeOperation = 'lighter';

            document.body.appendChild(this.canvas);
            window.addEventListener("resize", () => this.resize());
        },

        resize() {
            const dpr = window.devicePixelRatio || 1;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);
        },

        // 粒子仿佛灵魂 & 科技能量交织
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

        loop() {
            if (!this.running) return;
            this.draw();
            requestAnimationFrame(() => this.loop());
        },

        destroy() {
            this.running = false;
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    };

    global.LightFX = LightFX;

})(window);