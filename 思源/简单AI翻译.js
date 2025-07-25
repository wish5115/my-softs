// 简单AI翻译（仿沉浸式翻译）
// see https://ld246.com/article/1748748014662
// see https://ld246.com/article/1748607454045 需求贴
// version 0.0.13
// 0.0.13 解决请求过多，后面请求超时问题；解决siyuan引擎专家模式下执行时间过长超时问题；保存引文增加data-type属性，方便其他代码调用
// 0.0.12.3 右键复原时复原提示信息切换状态；优化提示词；
// 0.0.12.2 支持行首缩进对齐；优化提示词
// 0.0.12.1 修复模式切换后，ai受历史对话影响造成返回格式错误的问题
// 0.0.12 改进提示词，完美兼容多语言混合段落；修复专家模式偶发ai返回格式错误问题；改善快捷键交互方式，更符合使用习惯；提示信息实时显示当前状态。
// 0.0.11.1 改进提示词，兼容更多ai，提高翻译的稳定性和准确度。
// 0.0.11 优化提示词，对低版本及国内ai兼容性更好；修复专家模式已是目标语言仍然翻译的问题
// 0.0.10 支持自动跳过已是目标语言的文本和支持多语言混翻；ctrl+点击停止翻译；优化提示词
// 0.0.9 增加ctrl+shift+点击保存译文
// 0.0.8.1 修复切换专家模式时提示词错误问题
// 0.0.8 增加alt+点击切换ai引擎；shift+alt中英切换；ctrl+shift+alt切换专家/普通模式；右键复原
// 0.0.7 增加shift+点击取消翻译
// 0.0.6 修复译文按钮分屏刷新时不显示问题
// 0.0.5 修复译文过长不换行问题
// 0.0.4 增加专家模式
// 0.0.3 支持思源ai翻译
// 0.0.2 生成译文直接放到编辑器中，方便复制等
{
    // default 默认引擎，即本代码自带引擎，完全免费，无需配置
    // siyuan 思源ai引擎，即思源ai配置中设定的ai引擎
    let aiEngine = 'default';
    
    // 翻译成什么语言
    // zh-cn 简体中文 zh-hk 港式繁体 zh-tw 台湾繁体
    // us-en 英语 ja-jp 日语 ko-kr 韩语 ru-ru 俄语 de-de 德语
    let transTo = 'zh-cn';

    // 是否开启专家模式
    // 专家模式将会把所有块一起发送给ai翻译，结果更准确，性能更好，但心理等待时间更久
    let expertMode = false;

    // 普通模式请求超时时间，默认1分钟
    const timeoutCommon = 60000;

    // 专家模式请求超时时间，默认20分钟
    // 注意，当aiEngine='siyuan'时，还需要在设置/AI/超时时间中配置同样的时间才行
    const timeoutExpert = 1200000;

    // ai提示词
    const aiPromptCommon =  `
你是一名专业的翻译人员，母语为 {{to}}。你的任务是将输入文本翻译成标准的、地道的 {{to}}。但在执行前，请先判断输入文本的语言。

翻译规则：
1. 如果文本中包含{{to}}的句子或段落，仅{{to}}这部分文本原样输出（包括但不限于标点符号、空白符等），不要进行任何翻译、润色或改写。其他非{{to}}部分，请翻译成自然流畅、符合使用习惯的 {{to}}。
2. 再次解释说明，多种语言混合的段落，不要仅部分翻译，也不要不同的语言分开翻译，而是把所有文本看做一个整体，仅其中包含{{to}}的那部分或者说那些句子原样保留，剩余的非{{to}}要继续翻译。
3. 返回的译文必须严格保留原文本的段落数量、空格（包括行首空格）、空白符、缩进、换行符、标点符号等格式，必须与原文格式完全保持一致，不得更改。
4. 如果文本包含 HTML 标签，请合理保留标签结构并保证语义通顺。
5. 对于不应翻译的内容（如专有名词、代码等），请保留原内容不翻译。

输出说明：
1. 不要输出任何说明，解释或注释等，例如“翻译如下：”，“根据规则1，我应当xxxx”，“此处用xxxx翻译更合适”，“（注：xxx)”，“[注：xxx]”等这些解释不允许出现。
2. 不要输出JSON格式，直接返回译文文本即可，比如{"id":"译文"}错误，直接返回译文文本即可。
3. 保留所有原始格式：包括行首空格、换行、标点符号等。若某行原文以空格开头，请确保译文也以相同数量的空格开头；若原文行首无空格，则译文也不得添加空格。不得对空白符进行任何改动。比如“　　hello word!”，输出“　　你好世界！”，正确，而输出“你好世界！”，错误。
4. 换行符的格式必须与原文一致，不得自行添加或减少换行，标点符号和空白符也要与原文一致。
5. 不要参考历史对话内容，仅严格按照上述规则执行。

现在，请翻译以下内容：
{{text}}
    `;

    // 专家模式
    // 专家模式将会把所有块一起发送给ai翻译，结果更准确，性能更好，但心理等待时间更久
    const aiPromptExpert = `
你是一名专业的翻译人员，母语为 {{to}}。你将接收一个 JSON 格式的输入，任务是将其中的值翻译成自然流畅、符合 {{to}} 语言表达习惯的内容。

**输入格式说明：**
JSON 结构如下所示：
{"id1": "文本内容1", "id2": "文本内容2", ...}
- 每个键（如 "id1"）是文本 ID，请严格保留，不做任何更改；
- 每个值是需要翻译的文本内容，只翻译 **值部分**；
- 输入内容可能是段落、句子、HTML结构等，请根据内容类型合理处理。

**翻译规则如下：**
1. **语言检测优先级最高**：请在翻译前判断每段文本中是否包含 {{to}} 的句子或段落。如果文本中包含{{to}}的句子或段落，仅{{to}}这部分文本原样输出（包括但不限于标点符号、空白符等），不要进行任何翻译、润色或改写。其他非{{to}}部分，请翻译成自然、流畅、地道的 {{to}}，符合目标语言表达习惯。
2. 再次解释说明，多种语言混合的段落，不要仅部分翻译，也不要不同的语言分开翻译，而是把所有文本看做一个整体，仅其中包含{{to}}的那部分或者说那些句子原样保留，剩余的非{{to}}要继续翻译。
3. 保持原有的段落数量、空格（包括行首空格）、空白符、缩进、换行符、标点符号等格式完全一致。再次强调，必须与原文格式完全保持一致，不得更改。
4. 正确处理 HTML 标签：翻译文本内容的同时，合理保留并安置 HTML 标签，使译文语义通顺、结构正确。
5. **绝对不要翻译任何已为 {{to}} 的文本内容**，无论是什么类型的文本——这项规则必须严格执行，任何违背都会导致输出错误。
6. 不要翻译专有名词、代码或任何明确不需要翻译的内容。

**输出格式说明：**
1. 直接输出 JSON 结果，不要输出任何说明，解释或注释等，例如“翻译如下：”，“根据规则1，我应当xxxx”，“此处用xxxx翻译更合适”等内容。
2. 格式要与输入格式严格保持一致。换行符的格式也必须与原文一致，不得自行添加或减少换行，标点符号和空白符也要与原文一致。
3. 输出必须是纯粹的 JSON 文本，**不要添加任何字符在JSON的首尾，比如 {"id":"文本"}✅正确，\`\`\`json\n{"id":"文本"}\n\`\`\`❌错误**。
4. 输出必须为标准合法的 JSON 格式（键值使用双引号，必要时转义特殊字符）。

**上下文说明：**
1. 该 JSON 中的内容可能来自一篇有上下文有关联的文章，可参考上下文以提高翻译准确度，请综合判断。
2. 不要参考历史对话内容，仅严格按照上述说明执行。

现在，请翻译以下内容：
{{text}}
        `;

    // 动态提示词
    let aiPrompt = aiPromptCommon;
    if(expertMode) {
        aiPrompt = aiPromptExpert;
    }

    // 控制器可以手动调用 .abort() 终止所有请求
    let stopping = false;
    let controllers = [];
    let stopTimeoutId;
    const stopTrans = () => {
        stopping = true;
        if(controllers.length) controllers.forEach(controller => controller.abort());
        controllers = [];
        if(stopTimeoutId) clearTimeout(stopTimeoutId);
        stopTimeoutId = setTimeout(()=>stopping = false, 60000);
    }

    // 任务变量
    const MAX_CONCURRENT = 5;
    let activeCount = 0;
    const queue = [];

    // 主函数
    const focusColor = 'var(--b3-tooltips-color)';
    const focusStyle = `color:${focusColor};`;
    const main = (protyle)=>{
        if(protyle?.querySelector('.protyle-breadcrumb [data-type="trans"]')) return;
        const exitFocusBtn = protyle.querySelector('.protyle-breadcrumb [data-type="exit-focus"]');
        if(!exitFocusBtn) return;
        //shift+点击取消翻译；alt+点击切换ai引擎；shift+alt中英切换；ctrl+shift+alt切换专家/普通模式；右键复原
        const shiftShortcut = isMac() ? '⇧点击' : 'shift+点击';
        const altShortcut = isMac() ? '⌥点击' : 'alt+点击';
        const shiftAltShortcut = isMac() ? '⇧⌥点击' : 'shift+alt+点击';
        const ctrlShiftAltShortcut = isMac() ? '⌘⇧⌥点击' : 'ctrl+shift+alt+点击';
        const ctrlShiftShortcut = isMac() ? '⌘⇧点击' : 'ctrl+shift+点击';
        const ctrlShortcut = isMac() ? '⌘点击' : 'ctrl+点击';
        const transHtml = `<button class="block__icon fn__flex-center ariaLabel" aria-label="点击 <span class='ft__on-surface'>翻译</span><br>${shiftShortcut} <span class='ft__on-surface'>取消翻译</span><br>${altShortcut} <span class='ft__on-surface'>切换AI <span class='tooltip-trans-ai-default' style='${aiEngine==='default'?focusStyle:''}'>default</span>/<span class='tooltip-trans-ai-siyuan' style='${aiEngine==='siyuan'?focusStyle:''}'>siyuan</span></span><br>${shiftAltShortcut} <span class='ft__on-surface'>切换翻译为<span class='tooltip-trans-lang-zh' style='${transTo.startsWith('zh-')?focusStyle:''}'>中文</span>/<span class='tooltip-trans-lang-en' style='${!transTo.startsWith('zh-')?focusStyle:''}'>英文</span></span><br>${ctrlShiftAltShortcut} <span class='ft__on-surface'>切换<span class='tooltip-trans-mode-common' style='${!expertMode?focusStyle:''}'>普通</span>/<span class='tooltip-trans-mode-expert' style='${expertMode?focusStyle:''}'>专家</span>模式</span><br>${ctrlShiftShortcut} <span class='ft__on-surface'>保存译文</span><br>${ctrlShortcut} <span class='ft__on-surface'>停止翻译</span><br>右键 <span class='ft__on-surface'>复原</span>" data-type="trans"><strong>译</strong></button>`;
        exitFocusBtn.insertAdjacentHTML('afterend', transHtml);
        const transBtn = protyle.querySelector('.protyle-breadcrumb [data-type="trans"]');
        if(!transBtn) return;
        let data = {};
        const originAiEngine = aiEngine;
        const originTransTo = transTo;
        const originExpertMode = expertMode;
        const originAiPrompt = aiPrompt;
        // 右键复原
        transBtn.addEventListener('contextmenu', async (event) => {
            aiEngine = originAiEngine;
            transTo = originTransTo;
            expertMode = originExpertMode;
            aiPrompt = originAiPrompt;
            switchStatus('ai', originAiEngine, transBtn);
            switchStatus('lang', originTransTo, transBtn);
            switchStatus('mode', originExpertMode, transBtn);
            showMessage('已恢复到初始状态');
        });
        // shift+单击取消翻译；alt+点击切换ai引擎；shift+alt中英切换；ctrl+shift+alt切换专家/普通模式；右键复原
        transBtn.addEventListener('click', async (event) => {
            // ctrl+shift+alt切换专家/普通模式
            const ctrlKey = isMac() ? event.metaKey : event.ctrlKey;
            if(ctrlKey && event.shiftKey && event.altKey) {
                expertMode = expertMode === true ? false : true;
                aiPrompt = expertMode ? aiPromptExpert : aiPromptCommon;
                switchStatus('mode', expertMode, transBtn);
                //showMessage(expertMode?'已切换到专家模式':'已切换到普通模式');
                return;
            }
            // shift+alt中英切换
            if(event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
                transTo = transTo.startsWith('zh-') ? 'us-en' : (originTransTo.startsWith('zh-')?originTransTo:'zh-cn');
                switchStatus('lang', transTo, transBtn);
                //showMessage(transTo.startsWith('zh-')?'已切换到翻译为中文':'已切换到翻译为英文');
                return;
            }
            // alt+点击切换ai引擎
            if(event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
                aiEngine = aiEngine === 'default' ? 'siyuan' : 'default';
                switchStatus('ai', aiEngine, transBtn);
                //showMessage(aiEngine === 'default' ?'已切换到default引擎':'已切换到siyuan引擎');
                return;
            }
            const editor = transBtn.closest('.protyle')?.querySelector('.protyle-wysiwyg');
            const hasSelect = editor?.querySelector('.protyle-wysiwyg--select');
            // ctrl+shift 保存译文
            if(ctrlKey && event.shiftKey && !event.altKey) {
                const transNodes = editor.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'.trans-node');
                transNodes.forEach(transEl => {
                    const contenteditable = transEl.previousElementSibling;
                    if(!contenteditable.matches('[contenteditable="true"]')) return;
                    const transText = transEl.innerHTML;
                    transEl.remove();
                    if(transText?.trim()) {
                        contenteditable.innerHTML += `<span data-type="ws-ai-trans-text">${transText}</span>`;
                        updateBlock(contenteditable);
                    }
                });
                showMessage('已保存译文成功');
                return;
            }
            // ctrl+点击 停止翻译
            if(ctrlKey && !event.altKey && !event.shiftKey) {
                stopTrans();
                const transNodes = editor.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'.trans-node:has(.loading-icon)');
                transNodes.forEach(transEl => transEl.remove());
                showMessage('已停止翻译');
                return;
            }
            // shift+单击取消翻译
            if(event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                const transNodes = editor.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'.trans-node');
                transNodes.forEach(transEl => transEl.remove());
                showMessage('已取消翻译');
                return;
            }
            if(stopTimeoutId) clearTimeout(stopTimeoutId);
            stopping = false;
            controllers = [];
            data = {};
            const formatTrans = (transText) => {
                const checkText = transText.trim();
                if(checkText.startsWith('{') && checkText.endsWith('}') && checkText.indexOf(':')!==-1 && checkText.indexOf('"')!==-1) {
                    try {
                        transText = JSON.parse(transText.trim());
                        if(typeof transText === 'object') transText = Object.values(transText)[0] || '';
                        return transText;
                    } catch(e) {return transText;}
                }
                return transText;
            };
            const contenteditables = editor?.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'[contenteditable="true"]');
            contenteditables.forEach(async contenteditable => {
                if (stopping) return;
                const block = contenteditable.closest('[data-node-id][data-type]');
                if(!block) return;
                const text = contenteditable.innerHTML;
                if(!text.trim()) return;
                let transEl = contenteditable.nextElementSibling;
                const loadingIcon = `<svg class="b3-menu__icon loading-icon"><use xlink:href="#iconRefresh"></use></svg>`;
                if(!transEl?.matches('.trans-node')) {
                    const transElHtml = `<div class="protyle-custom trans-node" spellcheck="false">${loadingIcon}</div>`;
                    contenteditable.insertAdjacentHTML('afterend', transElHtml);
                    transEl = contenteditable.nextElementSibling;
                } else {
                    transEl.innerHTML = loadingIcon;
                }
                // 调用ai翻译
                if(!expertMode) {
                    // 普通模式
                    try {
                        await runTask(async () => {
                            let transText = aiEngine === 'default' ? 
                                await translateText(text, transTo, timeoutCommon) : 
                                await siyuanAI(text, transTo, timeoutCommon);
                            transText = formatTrans(transText);
                            if(!areLeadingWhitespacesSame(text, transText)) transText = getLeadingWhitespace(text) + removeLeadingWhitespace(transText);
                            transEl = contenteditable.nextElementSibling;
                            if(!transEl?.matches('.trans-node')) return;
                            if(transText?.trim() && transText.trim() === text.trim()) {
                                transEl.remove();
                            } else if(!transText?.trim() || transText.trim() ==='Internal Server Error') {
                                transEl.remove();
                                console.log('可能已触发ai tokens 最大限额，建议少量选择后再翻译。 返回数据：', transText);
                                showMessage('可能已触发ai tokens 最大限额，建议少量选择后再翻译。 返回数据：'+transText, true);
                            } else {
                                transEl.innerHTML = transText;
                            }
                        });
                    } catch(e) {
                        if (e.name === 'AbortError') {
                            transEl.remove();
                            console.log('翻译请求被手动中止');
                            if(!stopping) showMessage('已超时', true);
                        } else {
                            console.error(e);
                            showMessage(e?.message || '未知错误', true);
                        }
                    }
                } else {
                    // 专家模式
                    if(block?.dataset?.nodeId) data[block.dataset.nodeId] = text;
                }
            });
            if(expertMode && Object.keys(data).length > 0) {
                // 专家模式
                try {
                    const text = JSON.stringify(data);
                    const transText = aiEngine === 'default' ? 
                        await translateText(text, transTo, timeoutExpert) : 
                        await siyuanAI(text, transTo, timeoutExpert);
                    if(!transText || transText === 'Internal Server Error') {
                        const transNodes = editor.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'.trans-node:has(.loading-icon)');
                        transNodes.forEach(transEl => transEl.remove());
                        console.log('可能超时或已触发ai tokens 最大限额，建议少量选择后再翻译。 返回数据：', transText);
                        showMessage('可能超时或已触发ai tokens 最大限额，建议少量选择后再翻译。 返回数据：'+transText, true);
                        return;
                    }
                    const transResult = JSON.parse(transText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim());
                    for(const [id, transText] of Object.entries(transResult)) {
                        if (stopping) break;
                        if(!data[id]) continue;
                        if(!areLeadingWhitespacesSame(data[id], transText)) transText = getLeadingWhitespace(data[id]) + removeLeadingWhitespace(transText);
                        const contenteditable = editor.querySelector('[data-node-id="'+id+'"] [contenteditable="true"]');
                        const transEl = contenteditable?.nextElementSibling;
                        if(!transEl || !transEl?.matches('.trans-node')) continue;
                        if(!transText?.trim() || transText.trim() === data[id]?.trim()) {
                            transEl.remove();
                        } else {
                            transEl.innerHTML = transText;
                        }
                    }
                    data = {};
                    showMessage('全部翻译已完成');
                } catch(e) {
                    if (e.name === 'AbortError') {
                        const transNodes = editor.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'.trans-node:has(.loading-icon)');
                        transNodes.forEach(transEl => transEl.remove());
                        console.log('翻译请求被手动中止');
                        if(!stopping) showMessage('已超时', true);
                    } else {
                        console.error(e);
                        showMessage(e?.message || '未知错误', true);
                    }
                    data = {};
                    return;
                }
            }
        });
    };
    
    // 监听protyle加载
    whenElementExist('.protyle:not(.fn__none)').then(()=>{
        const protyles = document.querySelectorAll('.protyle:not(.fn__none)');
        protyles.forEach(protyle => main(protyle));
    }).catch(e=>console.warn(e));
    observeProtyleLoad(main);

    // 切换状态
    function switchStatus(type, to, transBtn) {
        const toes = {
            ai: ['default', 'siyuan'],
            lang: ['zh', 'en'],
            mode: ['common', 'expert'],
        };
        if(type === 'lang') to = to.startsWith('zh-') ? 'zh' : 'en';
        if(type === 'mode') to = to ? 'expert' : 'common';
        doChangeStatus(type, to, transBtn, toes[type][0], toes[type][1]);
    }

    function doChangeStatus(type, to, transBtn, firstTo, secondTo) {
        // tooltip
        const firstSpan = document.querySelector(`#tooltip:not(.fn__none) .tooltip-trans-${type}-${firstTo}`);
        if(firstSpan) firstSpan.style.color = to === firstTo ? focusColor : '';
        const secondSpan = document.querySelector(`#tooltip:not(.fn__none) .tooltip-trans-${type}-${secondTo}`);
        if(secondSpan) secondSpan.style.color = to === secondTo ? focusColor : '';
        // aria-label
        let ariaLabel = transBtn.getAttribute('aria-label');
        const pattern = new RegExp(`(<span class='tooltip-trans-${type}-${firstTo}' style=')([^']*)('>[^<]*<\/span>\/<span class='tooltip-trans-${type}-${secondTo}' style=')([^']*)('>[^<]*<\/span>)`, 'i');
        ariaLabel = ariaLabel.replace(pattern, (match, pre, firstStyle, mid, secondStyle, last) => {
            return `${pre}${(to === firstTo ? focusStyle : '')}${mid}${(to === secondTo ? focusStyle : '')}${last}`;
        });
        transBtn.setAttribute('aria-label', ariaLabel);
    }

    // ai翻译
    async function translateText(text, toLang='zh-cn', timeout = 60000) {
        const abortController = new AbortController();
        controllers.push(abortController);
        const signal = abortController.signal;
        const timeoutId = setTimeout(() => abortController.abort(), timeout);
      try {
        var myHeaders = new Headers();
        myHeaders.append("Pragma", "no-cache");
        myHeaders.append("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36");
        myHeaders.append("Content-Type", "application/json");
        var raw = JSON.stringify({
          "text": aiPrompt.trim().replace('{{text}}', text).replace(/\{\{to\}\}/g, toLang),
          "lang": toLang
        });
        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow',
          signal,
        };
        const response = await fetch("https://ai.bingal.com/api/v1/translate", requestOptions).finally(() => {
            clearTimeout(timeoutId);
            const idx = controllers.indexOf(abortController);
            if (idx > -1) controllers.splice(idx, 1);
        });
        if (!response.ok) {
          console.log(`HTTP error! status: ${response.status}`);
          return '';
        }
        const result = await response.text();
        return result;
      } catch (error) {
        console.log('error', error);
        return '';
      }
    }

    async function siyuanAI(text, toLang, timeout = 60000) {
        // 去掉思源ai的进度条
        whenElementExist('#progress:has(.b3-dialog__loading)', null, 600000).then(progress => {
            if(progress) progress.remove();
        });
        const result = await requestApi('/api/ai/chatGPT', {
            "msg": aiPrompt.trim().replace('{{text}}', text).replace(/\{\{to\}\}/g, toLang)
        }, 'POST', timeout);
        if(result && result.code === 0 && result.data) return result.data;
        return '';
    }

    async function requestApi(url, data, method = 'POST', timeout = 60000) {
        const abortController = new AbortController();
        controllers.push(abortController);
        const signal = abortController.signal;
        const timeoutId = setTimeout(() => abortController.abort(), timeout);
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{}), signal}).finally(() => {
            clearTimeout(timeoutId);
            const idx = controllers.indexOf(abortController);
            if (idx > -1) controllers.splice(idx, 1);
        })).json();
    }

    async function updateBlock(node) {
        if(!node.matches('[data-node-id][data-type]')) {
            node = node.closest('[data-node-id][data-type]');
        }
        await requestApi('/api/block/updateBlock', {
            "dataType": "dom",
            "data": node.outerHTML,
            "id": node.dataset.nodeId
        });
    }

    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            let requestId, timeoutId; // 保存 requestAnimationFrame 的 ID
            const check = () => {
                try {
                    const el = typeof selector === 'function' ? selector() : (node || document).querySelector(selector);
                    if (el) {
                        isResolved = true;
                        cancelAnimationFrame(requestId); // 找到元素时取消未执行的动画帧
                        if(timeoutId) clearTimeout(timeoutId);
                        resolve(el);
                    } else if (!isResolved) {
                        requestId = requestAnimationFrame(check); // 保存新的动画帧 ID
                    }
                } catch(e) {
                    isResolved = true;
                    cancelAnimationFrame(requestId);
                    clearTimeout(timeoutId);
                    reject(e);
                    return;
                }
            };
            check();
            timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    cancelAnimationFrame(requestId); // 超时后取消动画帧
                    reject(new Error(`Timeout: Element not found for selector "${selector}" within ${timeout}ms`));
                }
            }, timeout);
        });
    }
    
    function observeProtyleLoad(callback, parentElement) {
        // 如果 parentElement 是字符串，则将其转换为 DOM 元素
        if (typeof parentElement === 'string') {
            parentElement = document.querySelector(parentElement);
        }
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 检查是否是属性变化并且变化的属性是 class
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetElement = mutation.target; // 发生变化的目标元素
  
                    // 判断目标元素是否匹配指定选择器 .protyle:not(.fn__none)
                    if (targetElement.matches('.protyle:not(.fn__none)')) {
                        // 触发回调
                        callback(targetElement);
                    }
                }
            });
        });
        // 配置观察选项
        const config = {
            attributes: true, // 监听属性变化
            attributeFilter: ['class'], // 仅监听 class 属性
            subtree: true, // 监听父容器及其所有后代元素
        };
        // 启动观察，默认监听 document.body 或指定的父容器
        observer.observe(parentElement || document.body, config);
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    function showMessage(message, isError = false, delay = 5000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    // 获取行首空白符
    function getLeadingWhitespace(str) {
      const match = str.match(/^\s+/);
      return match ? match[0] : '';
    }
    // 判断多行行首空白符是否一致
    function areLeadingWhitespacesSame(...strings) {
      if (strings.length < 2) return true;
      const firstWhitespace = getLeadingWhitespace(strings[0]);
      for (let i = 1; i < strings.length; i++) {
        const currentWhitespace = getLeadingWhitespace(strings[i]);
        if (currentWhitespace !== firstWhitespace) {
          return false;
        }
      }
      return true;
    }
    // 去除行首空白符
    function removeLeadingWhitespace(str) {
      return str.replace(/^\s+/, '');
    }

    // 任务队列
    async function runTask(task) {
      if (activeCount >= MAX_CONCURRENT) {
        // 等待队列中有位置
        await new Promise(resolve => queue.push(resolve));
      }
      activeCount++;
      try {
        await task();
      } finally {
        activeCount--;
        if (queue.length > 0) {
          // 触发下一个排队的任务
          const next = queue.shift();
          next();
        }
      }
    }
}