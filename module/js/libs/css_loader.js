// ======================[css_loader.js v1.1]=================
// 自动加载 CSS + 扫描并应用动画到元素
// 作者：晓梦 + Grok + ChatGPT
// ============================================================
(function(global){
    const CSSLoader={
        loadedSheets:[],

        loadCSS(url){
            return new Promise((resolve,reject)=>{
                const link=document.createElement('link');
                link.rel='stylesheet';
                link.href=url;
                link.onload=()=>resolve(url);
                link.onerror=()=>reject(new Error('CSS加载失败: '+url));
                document.head.appendChild(link);
                this.loadedSheets.push(link);
            });
        },

        async loadAll(urls){ for(let url of urls) await this.loadCSS(url); },

        autoApplyAnimations(defaultDuration=3000){
            document.querySelectorAll('[data-animation]').forEach(el=>{
                const anim=el.dataset.animation;
                el.style.animation=`${anim} ${defaultDuration}ms ease-in-out infinite alternate`;
            });
        },

        applyAnimationsFromCSS(defaultDuration=3000){
            const sheets=document.styleSheets;
            for(let sheet of sheets){
                try{
                    const rules=sheet.cssRules||sheet.rules;
                    for(let rule of rules){
                        if(rule.type===CSSRule.KEYFRAMES_RULE||rule.type===CSSRule.WEBKIT_KEYFRAMES_RULE){
                            const animName=rule.name;
                            document.querySelectorAll('.'+animName).forEach(el=>{
                                el.style.animation=`${animName} ${defaultDuration}ms ease-in-out infinite alternate`;
                            });
                        }
                    }
                } catch(e){ console.warn('无法访问 CSS（可能跨域）:',e); }
            }
        }
    };

    global.CSSLoader=CSSLoader;
})(window);
