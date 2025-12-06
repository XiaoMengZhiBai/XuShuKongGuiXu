/* BgmHandler.js

   自动加载 `data/bgm/` 下的音频文件（通过目录索引解析），
   支持随机播放、循环、音量控制和播放失败时的用户交互降级处理。

   使用示例：
     BgmHandler.init({path: 'data/bgm/', volume: 0.6, shuffle: true});
     BgmHandler.start();

   注意：在某些浏览器未与页面交互前自动播放含声音的 audio 会被阻止。
   处理策略：尝试自动播放；如果被阻止，先静音并播放，然后等待用户第一次交互解除静音。
*/

(function (global) {
    // 如果存在 MediaHandler，优先使用其声明的扩展名
    const AUDIO_EXT = (window.MediaHandler && typeof window.MediaHandler.getAudioExtensions === 'function')
        ? window.MediaHandler.getAudioExtensions()
        : ['mp3','ogg','wav','aac','m4a','lac'];

    class BgmHandler {
        constructor() {
            this.path = 'data/bgm/';
            this.playlist = []; // 完整 URL 列表
            this.index = -1;
            this.audio = null;
            this.shuffle = true;
            // 背景音乐推荐较低音量以免覆盖对话/音效
            this.volume = 0.15;
            this._shuffledOrder = [];
            this._attemptedAutoplay = false;
            this._userInteractListener = null;
            this.volumePresets = [0.08, 0.25];
            this._presetIndex = 0;
            this._keyHandler = null;
        }

        async init(options = {}) {
            if (options.path) this.path = options.path;
            if (typeof options.shuffle === 'boolean') this.shuffle = options.shuffle;
            if (typeof options.volume === 'number') this.volume = Math.max(0, Math.min(1, options.volume));

            // 尝试解析目录索引：fetch path and parse anchor links
            try {
                const url = this.path.endsWith('/') ? this.path : this.path + '/';

                // 先尝试读取目录索引 HTML（比如 python's http.server 会提供）
                const res = await fetch(url, {cache: 'no-store'});
                if (res.ok) {
                    const text = await res.text();
                    const doc = new DOMParser().parseFromString(text, 'text/html');
                    const anchors = Array.from(doc.querySelectorAll('a'));
                    const files = anchors.map(a => a.getAttribute('href')).filter(Boolean);
                    const audios = files.filter(f => {
                        const ext = (f.split('.').pop() || '').toLowerCase();
                        return AUDIO_EXT.includes(ext);
                    }).map(f => (f.startsWith('http') || f.startsWith('/')) ? f : (url + f));

                    if (audios.length) {
                        this.playlist = audios;
                    }
                }

               // 如果上面未能解析到音频，再尝试读取目录下的 index.json（更可靠的服务器端索引方案）
                if (!this.playlist.length) {
                    try {
                        const idxRes = await fetch(url + 'index.json', { cache: 'no-store' });
                        if (idxRes.ok) {
                            const json = await idxRes.json();
                            if (Array.isArray(json) && json.length) {
                                const audios = json
                                    .filter(f => {
                                        const ext = (f.split('.').pop() || '').toLowerCase();
                                        return AUDIO_EXT.includes(ext);
                                    })
                                    .map(f => (f.startsWith('http') || f.startsWith('/')) ? f : (url + f));
                                if (audios.length) this.playlist = audios;
                            }
                        }
                    } catch (e) {
                        // 忽略 index.json 错误，继续尝试其他方式
                        console.warn('BgmHandler: 读取 index.json 失败，继续尝试其他方式。', e);
                    }
                }

                // 若仍无条目，用 options.files 作为最后退路
                if (!this.playlist.length && Array.isArray(options.files) && options.files.length) {
                    this.playlist = options.files.map(f => (f.startsWith('http') || f.startsWith('/')) ? f : (this.path + f));
                }

                if (!this.playlist.length) {
                    console.warn('BgmHandler: 未找到音乐文件。请确认服务器显示目录索引、提供 index.json，或传入 options.files 列表。');
                }
            } catch (e) {
                // 重大错误时退回到 options.files
                if (Array.isArray(options.files) && options.files.length) {
                    this.playlist = options.files.map(f => (f.startsWith('http') || f.startsWith('/')) ? f : (this.path + f));
                } else {
                    console.warn('BgmHandler: 解析音乐目录失败，且未提供 files。错误：', e && e.message ? e.message : e);
                    this.playlist = [];
                }
            }

            if (this.playlist.length) {
                this._buildOrder();
                this._createAudioElement();
                // 绑定默认的键盘快捷键（v：在预设音量间切换）
                this._bindKeys();
            }

            return this.playlist;
        }

        _bindKeys() {
            if (this._keyHandler) return;
            this._keyHandler = (e) => {
                // v 切换预设音量
                if (e.key === 'v' || e.key === 'V') {
                    this._presetIndex = (this._presetIndex + 1) % this.volumePresets.length;
                    const vol = this.volumePresets[this._presetIndex];
                    this.setVolume(vol);
                    if (this.audio) this.audio.muted = false;
                    console.info(`BgmHandler: 切换预设音量 -> ${vol}`);
                    e.preventDefault();
                }
            };
            window.addEventListener('keydown', this._keyHandler);
        }

        _buildOrder() {
            const n = this.playlist.length;
            this._shuffledOrder = Array.from({length: n}, (_, i) => i);
            if (this.shuffle) this._shuffleArray(this._shuffledOrder);
            // start at a random position for variety
            this.index = 0;
        }

        _shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }

        _createAudioElement() {
            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
                this.audio.remove();
                this.audio = null;
            }
            this.audio = document.createElement('audio');
            this.audio.preload = 'auto';
            this.audio.loop = false; // we handle loop by playlist
            this.audio.volume = this.volume;
            this.audio.style.display = 'none';
            document.body.appendChild(this.audio);

            this.audio.addEventListener('ended', () => this._onEnded());
        }

        _onEnded() {
            this.next();
        }

        async start() {
            if (!this.playlist.length) return;
            // ensure audio exists
            if (!this.audio) this._createAudioElement();
            // set first source
            const idx = this._shuffledOrder[this.index % this._shuffledOrder.length];
            this.audio.src = this.playlist[idx];
            // attempt autoplay
            try {
                this._attemptedAutoplay = true;
                await this.audio.play();
            } catch (e) {
                // autoplay blocked — fallback: mute and try, then wait for user interaction to unmute
                console.warn('BgmHandler: autoplay blocked, muting and waiting for interaction.');
                this.audio.muted = true;
                try { await this.audio.play(); } catch (e2) { /* ignore */ }
                this._attachUserUnmute();
            }
        }

        _attachUserUnmute() {
            if (this._userInteractListener) return;
            this._userInteractListener = () => {
                try {
                    this.audio.muted = false;
                    this.audio.volume = this.volume;
                } catch (e) {}
                window.removeEventListener('click', this._userInteractListener);
                window.removeEventListener('keydown', this._userInteractListener);
                this._userInteractListener = null;
            };
            window.addEventListener('click', this._userInteractListener, {once: true});
            window.addEventListener('keydown', this._userInteractListener, {once: true});
        }

        async play() {
            if (!this.audio) return this.start();
            try { await this.audio.play(); } catch (e) { this._attachUserUnmute(); }
        }

        pause() {
            if (this.audio) this.audio.pause();
        }

        stop() {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }
        }

        next() {
            if (!this.playlist.length) return;
            // advance index
            this.index = (this.index + 1) % this._shuffledOrder.length;
            const idx = this._shuffledOrder[this.index];
            this.audio.src = this.playlist[idx];
            this.audio.play().catch(() => this._attachUserUnmute());
        }

        prev() {
            if (!this.playlist.length) return;
            this.index = (this.index - 1 + this._shuffledOrder.length) % this._shuffledOrder.length;
            const idx = this._shuffledOrder[this.index];
            this.audio.src = this.playlist[idx];
            this.audio.play().catch(() => this._attachUserUnmute());
        }

        setVolume(v) {
            this.volume = Math.max(0, Math.min(1, v));
            if (this.audio) this.audio.volume = this.volume;
        }

        toggleShuffle() {
            this.shuffle = !this.shuffle;
            this._buildOrder();
        }

        getPlaylist() { return this.playlist.slice(); }

        getCurrent() {
            if (!this.playlist.length) return null;
            const idx = this._shuffledOrder[this.index % this._shuffledOrder.length];
            return { url: this.playlist[idx], index: idx };
        }
    }

    const instance = new BgmHandler();
    // 暴露到全局
    global.BgmHandler = instance;
})(window);
