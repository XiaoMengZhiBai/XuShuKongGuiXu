// ======================[start_screen.js v7.2 (最终完整整合版)]======================
// 功能: 模式、音频、设置、关于、退出全部使用统一的模态弹窗。
// 修复: 解决了设置弹窗只能打开一次的 Bug。
// 修复: 确保了 init/loop 等关键方法的 this 上下文绑定正确。
// 修复: 解决了 CONFIG 异步加载导致的 ReferenceError (严格无回退模式)。
// ==================================================================================

// 定义运行中需要的常量（必须在类定义和 IIFE 外部，以便于全局访问和初始化）
const PHASE = { FLOW: 0, ATTRACT: 1, EXPLODE: 2, OUT: 3 };
const MODE_LIST = ['FLOW', 'ATTRACT', 'BLACKHOLE', 'HYPER', 'AUTO']; 

let CONFIG = null; // 声明 CONFIG 变量，初始值为 null

;(async (global) => { // 更改为 async IIFE
    'use strict';
    // =================== 异步加载配置 (严格模式) ===================
    async function loadConfig() {
        const url = 'module/js/Json/start_screen_config.json';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // HTTP 状态码非200，严格处理：返回 null，中止初始化
                console.error(`配置文件 ${url} HTTP 状态码非200: ${response.status}。跳过启动画面初始化。`);
                return null;
            }
            const config = await response.json();
            
            // 确保 CONFIG 具有运行所需的动态默认属性 (以 config 文件中的 Base 为准)
            config.gravity = config.gravityBase || 1800;
            config.explodeSpeed = config.explodeBase || 360;
            config.trailFade = config.trailFadeBase || 0.22;
            
            return config;
        } catch (error) {
            // 网络或解析错误，严格处理：返回 null，中止初始化
            console.error("加载配置文件失败或文件不存在，跳过启动画面初始化:", error);
            return null;
        }
    }

    // 1. 等待配置加载，并赋值给 CONFIG
    CONFIG = await loadConfig();

    // 2. 严格检查：如果配置未加载成功 (CONFIG 为 null)，则立即停止
    if (!CONFIG) {
        if (typeof GlobalUtils !== 'undefined') {
            GlobalUtils.log('StartScreen 初始化失败: 配置未加载。');
        }
        return; // 中止脚本的进一步执行
    }


    // ==【主类】==
    class StartScreen {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.dpr = window.devicePixelRatio || 1;
            this.width = 0;
            this.height = 0;
            this.cx = 0; 
            this.cy = 0; 
            this.running = false;
            this.lastTime = 0;

            this.runes = [];
            this.matrix = [];
            this.titleChars = [];
            this.titleFragments = []; 
            this.atlas = null; 

            this.buttons = [];
            this._fileInput = null; 
            
            // 设置模态弹窗的缓存
            this._settingsModal = null; 
            this._settingsBackdrop = null; 
            
            this.audio = null;
            this.audioCtx = null;
            this.analyser = null;
            this.freqData = null;
            this.bass = 0;
            this.mid = 0;
            this.treble = 0;

            // 引用 CONFIG 中的属性，现在是安全的
            this.RUNE_FONT = `bold 34px SIMKAI,serif`;
            this.MATRIX_FONT = `${CONFIG.fontSize}px 'MPlus1M', monospace`;
            this.TITLE_FONT = `bold 58px "FZBeiwaiKai","SimHei",serif`;

            this.modeAutoTimer = 0;
            this.parallax = { x: 0, y: 0 };
            this.mouse = { x: 0, y: 0 };
        }

        // ==【公共入口】==
        // 使用箭头函数，确保 'this' 始终指向 StartScreen 实例 (修复 VM60:27 错误)
        init = () => { 
            if (this.running) return;
            
            this.createCanvas();
            this.createButtons(); 
            
            this.resize();
            this.registerHotkeys();

            this.generateRunes();
            this.generateMatrix();
            this.generateTitle();
            if (CONFIG.useOffscreenAtlas) this.buildAtlas();

            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);

            if (typeof GlobalUtils !== 'undefined') {
                GlobalUtils.log('StartScreen v7.2 已启动 (最终整合版)');
            }
        }

        // ==【画布/尺寸】==
        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d', { alpha: true });

            Object.assign(this.canvas.style, {
                position: 'fixed',
                inset: 0,
                zIndex: 9998, 
                background: 'transparent',
                transition: 'opacity 1.4s ease-out',
                pointerEvents: 'none'
            });

            document.body.appendChild(this.canvas);
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.cx = this.width / 2;
            this.cy = this.height / 2;

            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);

            this.generateTitle();
            this.updateButtonPositions();
        }

        // ==【右下角古风按钮】==
        createButtons() {
            const items = [
                { text: "关于",     action: () => this.showAboutModal() }, // 使用弹窗
                { text: "设置",     action: () => this.showSettingsModal() }, 
                { text: "退出",     action: () => this.showExitConfirmation() },
                { text: "继续游戏", action: () => this.enterGame(false) },
                { text: "开始游戏", action: () => this.enterGame(true) },
            ];
            
            // 创建隐藏的文件输入框用于加载音频
            this._fileInput = document.createElement('input');
            this._fileInput.type = 'file';
            this._fileInput.accept = 'audio/*';
            this._fileInput.style.display = 'none';
            this._fileInput.onchange = (e) =>
              this.loadAudioFile(e.target.files && e.target.files[0]);
            document.body.appendChild(this._fileInput);


            items.forEach((item, i) => {
                const btn = document.createElement('div');
                btn.textContent = item.text;
                btn.className = 'ss-btn';

                Object.assign(btn.style, {
                    right: '40px',
                    bottom: `${140 + i * 80}px`, 
                });

                // 鼠标悬停动画和点击事件 (保持不变)
                btn.onmouseenter = () => {
                    btn.style.background = 'rgba(100,15,30,0.95)';
                    btn.style.color = '#fff';
                    btn.style.transform = 'translateY(-6px) scale(1.05)';
                    btn.style.boxShadow = '0 12px 40px rgba(255,0,0,0.7)';
                };
                btn.onmouseleave = () => {
                    btn.style.background = 'rgba(25,8,15,0.92)';
                    btn.style.color = '#e44';
                    btn.style.transform = '';
                    btn.style.boxShadow = '0 0 25px rgba(180,0,0,0.7), inset 0 0 20px rgba(255,80,80,0.25)';
                };
                btn.onclick = () => {
                    item.action();
                };

                document.body.appendChild(btn);
                this.buttons.push(btn);
            });
        }

        updateButtonPositions() {
            this.buttons.forEach((btn, i) => {
                btn.style.bottom = `${140 + i * 80}px`;
            });
        }
        
        registerHotkeys() {
            // 保留热键功能，不显示提示
            window.addEventListener('keydown', (e) => {
                if (e.key === 'm' || e.key === 'M') this.toggleMode();
                if (e.key === 'l' || e.key === 'L') this.triggerLoadAudio();
                if (e.key === 't' || e.key === 'T') this.triggerTitleFracture();
            });
        }

        // ==【模态/弹窗通用逻辑】==
        createModalBackdrop(contentElement) {
            const backdrop = document.createElement('div');
            backdrop.className = 'ss-modal-backdrop';
            backdrop.style.display = 'flex';
            backdrop.appendChild(contentElement);
            document.body.appendChild(backdrop);
            
            // 点击背景关闭
            backdrop.onclick = (e) => {
                if (e.target === backdrop) this._closeModal(backdrop, contentElement);
            };
            return backdrop;
        }
        
        // 关键修复：清除设置弹窗的缓存
        _closeModal(backdrop, contentElement) {
             contentElement.classList.remove('show');
             backdrop.classList.remove('show');
             
             // 检查当前关闭的是否是设置弹窗
             if (contentElement === this._settingsModal) {
                 this._settingsModal = null; 
                 this._settingsBackdrop = null;
             }

             setTimeout(() => {
                 backdrop.parentNode?.removeChild(backdrop); 
             }, 300);
        }

        // ==【关于模态弹窗】==
        showAboutModal() {
            const modal = document.createElement('div');
            modal.className = 'ss-settings-modal ss-about-modal'; 
            modal.style.width = '450px'; 

            modal.innerHTML = `
                <div class="ss-modal-title">📜 虚数归墟 - 关于 🌌</div>
                <div class="ss-about-content" style="text-align: center; line-height: 1.6; font-size: 15px; color: #ffdddd;">
                    <p style="margin-bottom: 15px;">
                        本启动画面是为 **《虚数归墟》** 项目定制的粒子特效启动界面。
                    </p>
                    <p style="margin-bottom: 20px; font-weight: bold; color: #ff9999;">
                        版本：v7.2 (最终整合版)
                    </p>
                    <p>
                        **设计与特效：** 晓梦 & Grok
                    </p>
                    <p style="margin-bottom: 25px;">
                        **功能集成与优化：** Gemini
                    </p>
                    <p style="font-size: 13px; color: #999;">
                        "虚数归墟，万象始源"
                    </p>
                </div>
                <div class="ss-modal-actions">
                    <button class="ss-modal-close">关闭</button>
                </div>
            `;

            const backdrop = this.createModalBackdrop(modal);
            
            modal.querySelector('.ss-modal-close').onclick = () => {
                this._closeModal(backdrop, modal);
            };

            setTimeout(() => { backdrop.classList.add('show'); modal.classList.add('show'); }, 10);
        }

        // ==【设置模态弹窗】==
        showSettingsModal() {
            // 如果已存在缓存，直接显示（避免重复创建DOM和绑定事件）
            if (this._settingsModal) {
                this._settingsBackdrop.style.display = 'flex';
                this._settingsBackdrop.classList.add('show');
                this._settingsModal.querySelector('#mode-action-btn').textContent = `模式切换: ${CONFIG.mode}`;
                setTimeout(() => this._settingsModal.classList.add('show'), 10);
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'ss-settings-modal';
            modal.innerHTML = `
                <div class="ss-modal-title">👾 虚数归墟 - 系统设置 💾</div>
                <div id="ss-setting-speed" class="ss-setting-item"></div>
                <div id="ss-setting-density" class="ss-setting-item"></div>
                <div id="ss-setting-volume" class="ss-setting-item"></div>
                <div id="ss-setting-sensitivity" class="ss-setting-item"></div>
                
                <div class="ss-modal-actions">
                    <button class="ss-modal-action-btn mode" id="mode-action-btn">模式切换: ${CONFIG.mode}</button>
                    <button class="ss-modal-action-btn load-audio">加载音乐 (L)</button>
                    <button class="ss-modal-close">应用并关闭</button>
                </div>
            `;

            const backdrop = this.createModalBackdrop(modal);
            this._settingsModal = modal;
            this._settingsBackdrop = backdrop;
            
            const settings = [
                { id: 'speed', label: '全局速度系数', configKey: 'speedFactor', min: 0.2, max: 3.0, step: 0.1, unit: 'x', display: (v) => v.toFixed(1), update: (v) => CONFIG.speedFactor = v },
                { id: 'density', label: '矩阵粒子数', configKey: 'matrixCount', min: 40, max: 400, step: 20, unit: '', display: (v) => v.toFixed(0), 
                    update: (v) => {
                        CONFIG.matrixCount = Math.round(v);
                        while (this.matrix.length < CONFIG.matrixCount) this.matrix.push(this._makeMatrixParticle());
                        while (this.matrix.length > CONFIG.matrixCount) this.matrix.pop();
                    }},
                { id: 'volume', label: '音乐音量', configKey: 'volume', min: 0.0, max: 1.0, step: 0.01, unit: '', display: (v) => (v * 100).toFixed(0) + '%', 
                    update: (v) => {
                        CONFIG.volume = v;
                        if (this.audio && this.audio.gain) this.audio.gain.gain.value = CONFIG.volume;
                    }},
                { id: 'sensitivity', label: '音频灵敏度', configKey: 'sensitivity', min: 0.1, max: 3.0, step: 0.05, unit: 'x', display: (v) => v.toFixed(2), update: (v) => CONFIG.sensitivity = v },
            ];

            // 动态生成和绑定滑块事件
            settings.forEach(setting => {
                const item = modal.querySelector(`#ss-setting-${setting.id}`);
                const initialValue = CONFIG[setting.configKey];
                item.innerHTML = `
                    <div class="ss-setting-label"><span>${setting.label}</span><span id="ss-value-${setting.id}">${setting.display(initialValue)} ${setting.unit}</span></div>
                    <input type="range" min="${setting.min}" max="${setting.max}" step="${setting.step}" value="${initialValue}" data-config-key="${setting.configKey}">
                `;

                const slider = item.querySelector('input[type="range"]');
                const valueDisplay = item.querySelector(`#ss-value-${setting.id}`);
                slider.oninput = (e) => {
                    const v = parseFloat(e.target.value);
                    valueDisplay.textContent = `${setting.display(v)} ${setting.unit}`;
                    slider.setAttribute('data-new-value', v);
                };
                slider.setAttribute('data-new-value', initialValue);
            });

            // 绑定功能按钮事件
            modal.querySelector('.ss-modal-close').onclick = () => {
                this._applySettings(settings);
                this._closeModal(backdrop, modal);
            };
            
            modal.querySelector('.load-audio').onclick = () => {
                this.triggerLoadAudio();
            };
            
            modal.querySelector('#mode-action-btn').onclick = (e) => {
                this.toggleMode();
                e.target.textContent = `模式切换: ${CONFIG.mode}`;
            };

            setTimeout(() => { backdrop.classList.add('show'); modal.classList.add('show'); }, 10);
        }

        _applySettings(settings) {
            settings.forEach(setting => {
                const slider = this._settingsModal.querySelector(`[data-config-key="${setting.configKey}"]`);
                const newValue = parseFloat(slider.getAttribute('data-new-value') || slider.value);
                setting.update(newValue); 
            });
        }
        
        // ==【退出确认容器】==
        showExitConfirmation() {
            const container = document.createElement('div');
            container.className = 'ss-exit-container';
            container.innerHTML = `
                <div class="ss-modal-title">🚨 确认退出 🚨</div>
                <p>是否确认退出启动界面并关闭游戏？</p>
                <div class="ss-exit-buttons">
                    <button class="ss-exit-btn confirm">确认退出</button>
                    <button class="ss-exit-btn cancel">取消</button>
                </div>
            `;

            const backdrop = this.createModalBackdrop(container);
            
            container.querySelector('.confirm').onclick = () => window.close();
            container.querySelector('.cancel').onclick = () => this._closeModal(backdrop, container);

            setTimeout(() => {
                backdrop.classList.add('show');
                container.classList.add('show');
            }, 10);
        }


        // ==【音频/模式控制】== 
        triggerLoadAudio() {
            this._fileInput.value = null;
            this._fileInput.click();
        }

        async loadAudioFile(file) {
            if (!file) return;
            this.stopAudio();
            try {
                const array = await file.arrayBuffer();
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const buf = await this.audioCtx.decodeAudioData(array.slice(0));
                const src = this.audioCtx.createBufferSource();
                src.buffer = buf;

                const gain = this.audioCtx.createGain();
                gain.gain.value = CONFIG.volume;

                const analyser = this.audioCtx.createAnalyser();
                analyser.fftSize = 2048;
                const freqData = new Uint8Array(analyser.frequencyBinCount);

                src.connect(gain);
                gain.connect(analyser);
                analyser.connect(this.audioCtx.destination);

                src.loop = true;
                src.start(0);

                this.audio = { src, buf, gain };
                this.analyser = analyser;
                this.freqData = freqData;
            } catch(e) {
                alert("无法加载或解码音频文件: " + e.message);
            }
        }
        
        stopAudio() {
            if (this.audio && this.audio.src) { try { this.audio.src.stop(); } catch (e) {} }
            if (this.audio && this.audio.gain) { try { this.audio.gain.disconnect(); } catch (e) {} }
            if (this.audioCtx) { try { this.audioCtx.close(); } catch (e) {} }
            this.audio = this.audioCtx = this.analyser = this.freqData = null;
            this.bass = this.mid = this.treble = 0;
        }

        sampleAudio() {
            if (!this.analyser || !this.freqData) {
                this.bass = this.mid = this.treble = 0;
                return;
            }
            this.analyser.getByteFrequencyData(this.freqData);
            const len = this.freqData.length;
            const bassEnd = Math.floor(len * 0.12);
            const midEnd = Math.floor(len * 0.5);

            let bassSum = 0, midSum = 0, treSum = 0;
            for (let i = 0; i < len; i++) {
                const v = this.freqData[i];
                if (i < bassEnd) bassSum += v;
                else if (i < midEnd) midSum += v;
                else treSum += v;
            }
            this.bass = (bassSum / Math.max(1, bassEnd)) / 255;
            this.mid = (midSum / Math.max(1, midEnd - bassEnd)) / 255;
            this.treble = (treSum / Math.max(1, len - midEnd)) / 255;

            const sens = CONFIG.sensitivity;
            CONFIG.gravity = CONFIG.gravityBase * (1 + this.bass * 1.8 * sens);
            CONFIG.explodeSpeed = CONFIG.explodeBase * (1 + this.bass * 2.8 * sens);
            CONFIG.trailFade = Math.max(0.05, CONFIG.trailFadeBase - this.treble * 0.16);

            if (this.bass > 0.18 && Math.random() < Math.min(0.7, this.bass * 1.2 * sens)) {
                for (let i = 0; i < Math.floor(2 + this.bass * 35); i++) {
                    const m = this.matrix[Math.floor(Math.random() * this.matrix.length)];
                    if (m) this.triggerExplode(m);
                }
            }
        }

        triggerExplode(m) {
            if (!m) return;
            m.phase = PHASE.EXPLODE;
            const angle = Math.random() * Math.PI * 2;
            const speed = CONFIG.explodeSpeed * (0.6 + Math.random() * 0.9);
            m.vx = Math.cos(angle) * speed;
            m.vy = Math.sin(angle) * speed;
            m.explodeTimer = 0.5 + Math.random() * 1.2;
            m.alpha = 1;
        }
        
        toggleMode = (isAuto = false) => {
            const list = MODE_LIST;
            const currentIdx = list.indexOf(CONFIG.mode);
            let nextIdx = (currentIdx + 1) % list.length;
            
            if (isAuto && list[nextIdx] === 'AUTO') {
                nextIdx = (nextIdx + 1) % list.length;
            }

            CONFIG.mode = list[nextIdx];
            
            if (CONFIG.mode !== 'AUTO') {
                 this.modeAutoTimer = 0;
            }
            
            const modeBtn = document.querySelector('#mode-action-btn');
            if(modeBtn) {
                 modeBtn.textContent = `模式切换: ${CONFIG.mode}`;
            }
        }

        // ==【粒子系统、渲染、销毁等】==
        // (此后所有方法，如 _makeMatrixParticle, generateRunes, loop, updateAndDrawRunes 等保持不变)

        _makeMatrixParticle() {
            return {
                x: Math.random() * this.width,
                y: Math.random() * this.height - this.height,
                char: CONFIG.sciChars.charAt(
                    Math.floor(Math.random() * CONFIG.sciChars.length)
                ),
                vx: 0,
                vy: 30 + Math.random() * CONFIG.baseMatrixSpeed,
                alpha: 0.2 + Math.random() * 0.6,
                phase: PHASE.FLOW, 
                attractTimer: 0,    
                explodeTimer: 0,    
            };
        }

        generateRunes() {
            this.runes = Array.from({ length: CONFIG.runeCount }, () => ({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                char: CONFIG.runes.charAt(
                    Math.floor(Math.random() * CONFIG.runes.length)
                ),
                size: 16 + Math.random() * 46,
                alpha: 0,
                targetAlpha: 0.06 + Math.random() * 0.3,
                vx: (Math.random() - 0.5) * CONFIG.baseRuneSpeed,
                vy: (Math.random() - 0.5) * CONFIG.baseRuneSpeed,
                phase: PHASE.FLOW,
            }));
        }

        generateMatrix() {
            this.matrix = Array.from({ length: CONFIG.matrixCount }, () =>
                this._makeMatrixParticle()
            );
        }

        generateTitle() {
            this.titleChars = [];
            const size = 58;
            const lineH = size * 1.5;
            const totalH = (CONFIG.title.length - 1) * lineH;
            const baseY = this.height / 2 - totalH / 2;
            for (let i = 0; i < CONFIG.title.length; i++) {
                this.titleChars.push({
                    char: CONFIG.title[i],
                    x: this.width / 2,
                    y: baseY + i * lineH,
                    delay: i * 0.13,
                });
            }
            this.titleFragments = [];
        }
        
        buildAtlas() {
            const chars = Array.from(new Set(CONFIG.runes.split('')));
            const cell = 96;
            const cols = Math.ceil(Math.sqrt(chars.length));
            const rows = Math.ceil(chars.length / cols);
            const canvas = document.createElement('canvas');
            canvas.width = cols * cell * this.dpr;
            canvas.height = rows * cell * this.dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(this.dpr, this.dpr);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = this.RUNE_FONT;
            const map = new Map();
            chars.forEach((ch, idx) => {
                const c = idx % cols;
                const r = Math.floor(idx / cols);
                const cx = c * cell + cell / 2;
                const cy = r * cell + cell / 2;
                ctx.fillStyle = `rgba(220,40,60,0.98)`;
                ctx.shadowColor = 'rgba(150,20,30,0.6)';
                ctx.shadowBlur = 6;
                ctx.fillText(ch, cx, cy);
                ctx.shadowBlur = 0;
                map.set(ch, { sx: c * cell * this.dpr, sy: r * cell * this.dpr, sw: cell * this.dpr, sh: cell * this.dpr });
            });
            this.atlas = { canvas, ctx, map, cell };
        }

        // ==【渲染循环】==
        loop = () => {
            if (!this.running) return;

            const now = performance.now();
            let dt = (now - this.lastTime) * 0.001;
            this.lastTime = now;
            dt = Math.min(CONFIG.dtCap, dt) * CONFIG.speedFactor;

            this.sampleAudio();
            if (CONFIG.mode === 'AUTO') {
                this.modeAutoTimer += dt;
                if (this.modeAutoTimer > 8) {
                    this.toggleMode(true);
                    this.modeAutoTimer = 0;
                }
            }
            
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.ctx.globalCompositeOperation = 'source-over';
            const trailFade = CONFIG.trailFadeBase * (1 - Math.min(0.6, this.treble * 0.8));
            this.ctx.fillStyle = `rgba(0,0,0,${trailFade})`;
            this.ctx.fillRect(0, 0, this.width, this.height);

            const t = now * 0.001;
            const mx = (this.mouse.x / this.width - 0.5) * 2;
            const my = (this.mouse.y / this.height - 0.5) * 2;
            this.parallax.x += (mx - this.parallax.x) * Math.min(1, dt * 6);
            this.parallax.y += (my - this.parallax.y) * Math.min(1, dt * 6);
            const wobbleX = Math.sin(t * 4.5) * 2;
            const wobbleY = Math.cos(t * 6.3) * 2;
            const px = wobbleX + this.parallax.x * 12;
            const py = wobbleY + this.parallax.y * 8;
            
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, px, py);
            this.ctx.globalCompositeOperation = 'lighter';

            this.updateAndDrawRunes(dt);
            this.updateAndDrawMatrix(dt);

            this.ctx.globalCompositeOperation = 'source-over';
            this.drawTitleAndFragments(t * CONFIG.speedFactor);

            requestAnimationFrame(this.loop);
        };

        updateAndDrawRunes(dt) {
            const ctx = this.ctx;
            const buf = 80;

            for (const r of this.runes) {
                r.alpha += (r.targetAlpha - r.alpha) * 0.06;
                
                if (CONFIG.mode === 'BLACKHOLE') {
                    const dx = this.cx - r.x, dy = this.cy - r.y;
                    const dist = Math.hypot(dx, dy) + 0.0001;
                    r.x += (dx / dist) * (CONFIG.gravityBase * 0.0006) * dt;
                    r.y += (dy / dist) * (CONFIG.gravityBase * 0.0006) * dt;
                } else if (CONFIG.mode === 'HYPER') {
                    r.x += r.vx * dt * 3.5;
                    r.y += r.vy * dt * 3.5;
                } else {
                    r.x += r.vx * dt;
                    r.y += r.vy * dt;
                }
                
                if (r.x < -buf) r.x = this.width + buf;
                if (r.x > this.width + buf) r.x = -buf;
                if (r.y < -buf) r.y = this.height + buf;
                if (r.y > this.height + buf) r.y = -buf;

                if (this.atlas) {
                    const m = this.atlas.map.get(r.char);
                    if (m) {
                        ctx.globalAlpha = r.alpha;
                        const scale = Math.max(0.4, r.size / this.atlas.cell);
                        const dw = this.atlas.cell * scale;
                        const dh = this.atlas.cell * scale;
                        ctx.drawImage(this.atlas.canvas, m.sx, m.sy, m.sw, m.sh, r.x - dw / 2, r.y - dh / 2, dw, dh);
                        ctx.globalAlpha = 1;
                    }
                } else {
                    ctx.font = this.RUNE_FONT;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = `rgba(200,40,50,${r.alpha})`;
                    ctx.fillText(r.char, r.x, r.y);
                }
            }
        }

        updateAndDrawMatrix(dt) {
            const ctx = this.ctx;
            ctx.font = this.MATRIX_FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const CX = this.cx, CY = this.cy;

            for (const m of this.matrix) {
                if (m.phase === PHASE.FLOW) {
                    m.y += m.vy * dt;
                    m.x += Math.sin((m.y + m.x) * 0.002) * 6 * dt * (1 + this.treble * 3);
                    
                    if (Math.random() < 0.003 + this.bass * 0.02 * CONFIG.sensitivity) {
                        m.phase = PHASE.ATTRACT;
                        m.attractTimer = 0.6 + Math.random() * 1.2;
                    }
                    if (m.y > this.height + 40) {
                        m.y = Math.random() * -this.height * 0.5 - 40;
                        m.x = Math.random() * this.width;
                    }
                } else if (m.phase === PHASE.ATTRACT) {
                    const dx = CX - m.x, dy = CY - m.y;
                    const dist = Math.hypot(dx, dy) + 0.0001;
                    const force = CONFIG.gravity / (dist * dist + 60);
                    m.vx += (dx / dist) * force * dt;
                    m.vy += (dy / dist) * force * dt;
                    m.x += m.vx * dt;
                    m.y += m.vy * dt;

                    m.attractTimer -= dt;
                    if (dist < CONFIG.coreRadius || m.attractTimer <= 0) {
                        this.triggerExplode(m);
                    }
                } else if (m.phase === PHASE.EXPLODE) {
                    m.x += m.vx * dt;
                    m.y += m.vy * dt;
                    m.vx *= 0.985;
                    m.vy *= 0.985;
                    m.explodeTimer -= dt;
                    if (m.explodeTimer <= 0) m.phase = PHASE.OUT;
                } else if (m.phase === PHASE.OUT) {
                    m.x += m.vx * dt;
                    m.y += m.vy * dt;
                    if (m.x < -80 || m.x > this.width + 80 || m.y < -80 || m.y > this.height + 80) {
                        m.y = Math.random() * -this.height * 0.5 - 40;
                        m.x = Math.random() * this.width;
                        m.phase = PHASE.FLOW;
                        m.vx = 0;
                        m.vy = 30 + Math.random() * CONFIG.baseMatrixSpeed;
                        m.alpha = 0.2 + Math.random() * 0.6;
                    }
                }

                let alpha = Math.min(1, 0.25 + (m.alpha || 0.2));
                let color = `rgba(60,220,255,${alpha})`;
                if (m.phase === PHASE.ATTRACT)
                    color = `rgba(${120 + Math.floor(this.mid * 120)},${200 - Math.floor(this.mid * 80)},${255 - Math.floor(this.mid * 80)},${alpha})`;
                if (m.phase === PHASE.EXPLODE)
                    color = `rgba(${200},${100 + Math.floor(this.bass * 120)},${120},${Math.min(1, alpha + 0.3)})`;

                ctx.fillStyle = color;
                ctx.fillText(m.char, m.x, m.y);
            }
        }

        drawTitleAndFragments(t) {
            const ctx = this.ctx;
            if (this.titleFragments && this.titleFragments.length > 0) {
                for (let i = this.titleFragments.length - 1; i >= 0; i--) {
                    const f = this.titleFragments[i];
                    f.vx *= 0.995;
                    f.vy *= 0.995;
                    f.vy += 60 * 0.01;
                    f.x += f.vx * 0.016;
                    f.y += f.vy * 0.016;
                    f.life -= 0.016;
                    ctx.save();
                    ctx.translate(f.x, f.y);
                    ctx.rotate(f.rot);
                    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
                    ctx.fillStyle = f.color;
                    ctx.font = f.font;
                    ctx.fillText(f.char, 0, 0);
                    ctx.restore();
                    if (f.life <= 0) this.titleFragments.splice(i, 1);
                }
                if (this.titleFragments.length === 0) {
                    this.generateTitle();
                }
                return;
            }

            ctx.save();
            ctx.font = this.TITLE_FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const duration = CONFIG.titleAnimDuration;
            for (const c of this.titleChars) {
                const progress = Math.max(0, Math.min(1, (t - c.delay) / duration));
                const ease = Math.sin(progress * Math.PI / 2);
                
                ctx.fillStyle = `rgba(255,255,255,${ease})`;
                ctx.shadowColor = `rgba(220,40,60,${ease * 0.9})`;
                ctx.shadowBlur = 22 * ease;
                ctx.fillText(c.char, c.x, c.y);
            }
            ctx.restore();
            ctx.shadowBlur = 0;
        }

        triggerTitleFracture() {
            this.titleFragments = [];
            const baseSpeed = 220 + this.bass * 420;
            for (const c of this.titleChars) {
                const angle = (Math.random() - 0.5) * Math.PI * 1.6;
                const speed = baseSpeed * (0.6 + Math.random() * 0.9);
                this.titleFragments.push({
                    char: c.char, x: c.x, y: c.y,
                    vx: Math.cos(angle) * speed * (0.5 + Math.random()),
                    vy: Math.sin(angle) * speed * (0.5 + Math.random()),
                    rot: (Math.random() - 0.5) * 1.4,
                    life: 1.4 + Math.random() * 1.6, maxLife: 1.4 + Math.random() * 1.6,
                    color: `rgba(255,${180 + Math.floor(this.bass * 60)},${180},1)`,
                    font: 'bold 48px "FZBeiwaiKai","SimHei",serif',
                });
            }
        }
        
        // ==【外部方法】==
        enterGame(isNewGame) {
            window.dispatchEvent(new CustomEvent('game:start', { detail: { isNewGame } }));
            this.buttons.forEach((btn, i) => {
                btn.style.transition = 'all 0.8s ease-out';
                btn.style.opacity = '0';
                btn.style.transform = `translateX(300px) rotate(${i % 2 ? '' : '-'}20deg)`;
            });

            this.canvas.style.opacity = '0';
            setTimeout(() => this.destroy(), 1400);
        }

        destroy() {
            this.running = false;
            try { this.stopAudio(); } catch (e) {}
            
            this.canvas?.parentNode?.removeChild(this.canvas);
            this.buttons.forEach(b => b?.parentNode?.removeChild(b));
            
            const backdrop = document.querySelector('.ss-modal-backdrop');
            if (backdrop) backdrop.parentNode?.removeChild(backdrop);

            window.dispatchEvent(new Event('startscreen:destroyed'));
        }

        showError(msg) {
             this.running = false;
             this.ctx.fillStyle = '#110000';
             this.ctx.fillRect(0,0,this.width,this.height);
             this.ctx.fillStyle = '#ff4444';
             this.ctx.font = 'bold 40px sans-serif';
             this.ctx.textAlign = 'center';
             this.ctx.fillText('启动失败', this.width/2, this.height/2 - 50);
             this.ctx.font = '22px sans-serif';
             this.ctx.fillText(msg, this.width/2, this.height/2 + 20);
        }
    }

    // ==【全局暴露】==
    global.StartScreen = new StartScreen(); 

})(window);