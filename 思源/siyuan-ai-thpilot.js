// 思源AI划词解释、翻译、纠错、总结、聊天等
// help see https://ld246.com/article/1763821416540
// name SiYuan Thpilot
// author Wilsons
// version 1.0.5
// 1.0.5 改进拖动窗口时的体验
// 1.0.4 修复拖动窗口高度无法拖动问题
// 1.0.3 新增保存聊天到指定目录（可调用大模型生成标题）；改进重新生成后，默认删除选中区域或最后一个，shift+删除则删除该对话
(async () => {
    /////////////////////////// 用户配置区 ///////////////////////////
    
    // 自定义ai对话框的宽度和最大高度
    const width = 420;
    const maxHeight = 468;

    // 设置快捷键打开对话框
    const shortcut = 'ctrl+alt+z';

    // 聊天默认保存的路径（点右上角保存按钮时会把当前聊天保存到指定目录）
    // ‼️注意：第一个必须是笔记名，然后后面是路径（即笔记名+路径），如果路径不存在则创建
    const saveToPath = '我的笔记/AI/已保存的聊天历史';

    // VIP KEY
    // 非vip功能仅能使用划词解释、翻译、纠错、总结等，不能使用聊天功能
    // 也可以在单独的代码片段中通过 var thpilotVipKey = ''; 来配置vipkey，这样防止分享代码时不小心泄露秘钥
    // 购买VIP https://ld246.com/article/1763821416540#VIP
    const vipKey = ''; // 👈秘钥填这里

    // 配置用到的类库（建议下载到本地使用更稳定，这些类库均是按需加载，仅在用到时下载）
    const config = {
        libs: {
            "marked": "https://fastly.jsdelivr.net/npm/marked/marked.min.js",
            "ImageViewer": "https://fastly.jsdelivr.net/gh/wish5115/my-softs@main/libs/aiDialog/ImageViewer.js?v=1.0.0",
            "Popup": "https://fastly.jsdelivr.net/gh/wish5115/my-softs@main/libs/aiDialog/Popup.js?v=1.0.8",
            "LLMStream": "https://fastly.jsdelivr.net/gh/wish5115/my-softs@main/libs/aiDialog/LLMStream.js?v=1.0.4",
            "ChatUi": "https://fastly.jsdelivr.net/gh/wish5115/my-softs@main/libs/aiDialog/aiDialog.js?v=1.0.5",
        },
    };
    
    // 用户自定义模型列表
    // --------------------------------------------------------
    // url参数数说明：
    // 1. 当带有chat/completions后缀时不进行任何处理；当不带有chat/completions后缀时则自动添加
    // 2. 当以#结尾时，将使用原始输入，即不何添加后缀，仅提取#前面的URL
    // --------------------------------------------------------
    // 外部定义变量说明：
    // 为了方便代码更新或不小心泄露个人私钥，也可以在思源代码片段中单独配置模型参数，只需要定义变量lllmModels即可，比如：
    // var llmModels = [{...}, {...}];
    // --------------------------------------------------------
    // 👇【推荐大模型】（通过邀请链接可获得额外赠送）
    // 1. 免费模型平台 https://cloud.siliconflow.cn/i/8kP68u0B
    // 2. 国外模型平台 https://api.gpt.ge/register?aff=GlNE 价比高，快速稳定，模型齐全（claude4.5，gpt5等）
    // 3. 特别推荐⭑⭑⭑ 如何获取上亿token？https://zhuanlan.zhihu.com/p/1962631242630534169
    // 4. 魔塔平台 http://modelscope.cn 单模型400次/日 总2000次/日
    const models = await getUserModels() || [
        {
            url: 'https://api-inference.modelscope.cn/v1',
            model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
            modelName: 'Qwen/Qwen3-Coder', // 模型显示名称
            apiKey: '', // 你的 apikey
            stream: true, // 是否流式请求
            temperature: 0.7, // 温度
        },
        {
            url: 'https://api-inference.modelscope.cn/v1',
            model: 'deepseek-ai/DeepSeek-R1-0528',
            modelName: 'DeepSeek-R1', // 模型显示名称
            apiKey: '', // 你的 apikey
            stream: true, // 是否流式请求
            temperature: 0.7, // 温度
            thinking: 'auto', // 是否显示深度思考 'auto'自动判断（默认）、true（强制显示，即使为空也显示容器）、false（完全隐藏） 
        },
    ];
    // 当前模型(默认第一个模型)
    let model = JSON.parse(JSON.stringify(models[0]));
    // 生成标题模型（默认最后一个模型）【注意：别用深度思考模型，生成标题太慢】
    let titleModel = JSON.parse(JSON.stringify(models[models.length-1]));
    // 生成标题提示词 {{text}} 是聊天内容，默认截取前1000字
    const titlePrompt = `请根据以下聊天内容生成合适的文档标题，字数在50个字以内（忽略system提示词部分的文本）：\n\n{{text}}`;

    // 用户自定义toolbar按钮列表
    const buttons = [
        {
            enable: true, // 是否启用，也可以直接注释该段代码
            id: 'aiExplian', // 在toolbar列表中必须唯一
            name: 'AI解释', // 通常用于提示信息
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3.25 3.25a2 2 0 0 1 2-2h13.5a2 2 0 0 1 2 2v12.5a2 2 0 0 1-1.257 1.858c-.412.333-.83.898-.83 1.745 0 .429.18.79.441 1.053.198.2.398.301.537.344h.109a1 1 0 0 1 .032 2v.026q-.174 0-.346-.026H6.75a3.5 3.5 0 0 1-3.5-3.5zm13.706 17.5a3.4 3.4 0 0 1-.293-1.397c0-.61.115-1.143.301-1.603H6.75a1.5 1.5 0 0 0 0 3h10.206m1.794-5.054-.087.054H9.25V3.25h9.5zm-13.5.39a3.5 3.5 0 0 1 1.5-.336h.5V3.25h-2z" clip-rule="evenodd"></path></svg>`,
            // 提示词，{{selection}} 代表选中文本
            prompt: `请对以下文本提供一个全面而清晰的解释。要求如下：
1. 如果文中包含不易理解的术语或复杂概念，请根据需要进行解释。
2. 直接解释即可，不要有任何形式的前缀（比如：好的，我下面对xxxx进行解释等）。
3. 先解释常用含义，如果还有其他场景下的含义也简单介绍下。

---
待解释的文本：
\`\`\`\`\`\`
{{selection}}{{context}}
\`\`\`\`\`\``,
            system: `你是一位知识渊博的分析师，擅长将复杂的信息用通俗易懂的方式解释清楚。你的回答应该结构清晰、逻辑严谨。`, // 系统指令
            // 关联上下文，有以下取值
            // blockText 当前块文本 blockHtml 当前块HTML
            // editorText 当前编辑器文本（注意不是当前文本全文，是编辑器可见区域）editorHtml 当前编辑器Html
            // bodyHtml body的html源码（注意，可能文本较长，占用token较大）
            // currentMd 当前文档的Markdown源码
            // 为空则不关联上下文
            context: 'blockText', // 默认 blockText
        },
        {
            enable: true, // 是否启用，也可以直接注释该段代码
            id: 'aiTranslate', // 在toolbar列表中必须唯一
            name: 'AI翻译', // 通常用于提示信息
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M7.128 1.894a.97.97 0 0 0-1.422 1.26H2.668a.97.97 0 0 0 0 1.94h1.084c.463 1.217 1.359 2.568 2.45 3.77-1.12.958-2.338 1.561-3.534 1.561a.97.97 0 0 0 0 1.94c1.882 0 3.574-.951 4.926-2.143 1.064.915 2.267 1.684 3.493 2.093a.97.97 0 0 0 .613-1.84c-.899-.3-1.851-.888-2.748-1.643 1.07-1.258 1.885-2.64 2.324-3.739h1.087a.97.97 0 0 0 0-1.939H8.808zm2.017 3.2H5.877c.389.75.97 1.582 1.683 2.381.666-.8 1.209-1.646 1.585-2.382M16.241 1.7a.97.97 0 1 0 0 1.939h3.878v4.363a.97.97 0 0 0 1.939 0V3.639c0-1.07-.868-1.939-1.939-1.939zM7.516 22.06a.97.97 0 0 0 0-1.94H3.638v-4.363a.97.97 0 0 0-1.94 0v4.363c0 1.071.869 1.94 1.94 1.94zm9.695-8.453 1.436 3.605h-2.872zm3.22 8.082-1.011-2.538h-4.418l-1.01 2.538a.97.97 0 1 1-1.802-.718l4.03-10.116c.357-.896 1.625-.896 1.982 0l4.03 10.116a.97.97 0 1 1-1.801.718" clip-rule="evenodd"></path></svg>`,
            // 提示词，{{selection}} 代表选中文本
            prompt: `请智能识别以下文本的源语言，并将其翻译成最合适的目标语言（例如，中文翻译为英文，英文翻译为中文）。请严格遵循以下要求：
1. Output only the translated content, without explanations or additional content (such as "Here's the translation:" or "Translation as follows:")
2.  **保持风格**: 尽可能保留原文的语气、风格和格式。
3.  **无需解释**: 不要对翻译内容做任何解释或注解。
4. The returned translation must maintain exactly the same number of paragraphs and format as the original text
5. If the text contains HTML tags, consider where the tags should be placed in the translation while maintaining fluency
6. For content that should not be translated (such as proper nouns, code, etc.), keep the original text.

---
待翻译的文本：
\`\`\`\`\`\`
{{selection}}{{context}}
\`\`\`\`\`\``,
            system: `你是当地的母语者，也是一名顶级的专业翻译家，精通多国语言，追求“信、达、雅”的翻译境界。你的任务是提供精准、流畅且忠于原文的翻译。`, // 系统指令
            context: '',
        },
        {
            enable: true, // 是否启用，也可以直接注释该段代码
            id: 'aiSpellCheck', // 在toolbar列表中必须唯一
            name: 'AI纠错', // 通常用于提示信息
            icon: `<svg t="1762724289865" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9080" width="16" height="16"><path d="M453.632 48.832a19.2 19.2 0 0 1 19.968 19.2v57.408a19.2 19.2 0 0 1-18.368 19.328c-12.608 0.64-22.464 1.408-29.76 2.368a368.064 368.064 0 1 0 414.72 396.8l-75.968 0.064a19.2 19.2 0 0 1-14.784-31.488l119.04-142.784a19.2 19.2 0 0 1 29.44 0l119.04 142.72a19.2 19.2 0 0 1-14.72 31.552h-65.728A464 464 0 1 1 424.32 50.56c5.312-0.512 15.04-1.152 29.312-1.728z m288.576 120.064l71.04 71.04a19.84 19.84 0 0 1 0 28.032L467.84 613.44a19.84 19.84 0 0 1-9.28 5.248l-94.72 23.68a19.84 19.84 0 0 1-24-24.064l23.68-94.72a19.84 19.84 0 0 1 5.248-9.216l345.472-345.472a19.84 19.84 0 0 1 28.032 0z m99.072-99.072l71.04 71.04a19.84 19.84 0 0 1 0 28.032l-38.016 38.08a19.84 19.84 0 0 1-28.032 0l-71.04-71.104a19.84 19.84 0 0 1 0-28.032l38.016-38.016a19.84 19.84 0 0 1 28.032 0z" p-id="9081"></path></svg>`,
            // 提示词，{{selection}} 代表选中文本
            prompt: `请仔细检查以下文本中的拼写、语法和标点错误。请严格遵循以下规则：
**输入及分析说明**
输入内容可能包含HTML内容，但纠错时，要忽略HTML部分，仅对文本内容分析判断。
- 案例1
比如：输入内容可能是\`w<span data-type=\"strong\">ord</span>\`。
不要把这里的“ord”当作错误，因为如果去掉HTML部分，实际是word。
但输出时要保持原文的HTML格式输出，详见下面指令部分说明。
- 案例2
再比如：输入内容可能是 \`go<span data-type=\"strong\">o day!</span>\`。
分析时，实际的内容应该是 goo day!，纠错说明应该说把goo改为good，而不应该说把go改为good或其他不符合常理的说法。
同样，输出时也要保持原文的HTML格式输出，详见下面指令部分说明。

**任务指令:**
1.  **仅纠错**: 只修正客观错误，不要改写句子或改变原文的含义和风格。
2.  **保持格式**: 必须完整保留原始格式，包括所有HTML标签、换行符和空格。
3.  **报告修改**: 在修正后的文本前，用列表形式简要说明你做了哪些修改。

**输出格式:**
- 如果发现错误，你的完整回答必须是：
<这里列出具体错误信息>
以下是修正后的完整内容：
<div class="replace-result"><!-- 这里是完整修正后的完整文本 --></div>
- 如果没有发现任何错误，你的回答必须仅仅是：
未发现任何错误。
---
待检查的文本：
\`\`\`\`\`\`html
{{selection}}{{context}}
\`\`\`\`\`\``,
            system: `你是一名严谨细致的编辑和校对专家。你的核心任务是发现并修正文本中的语言错误，同时必须尊重并完整保留原文的结构和格式。`, // 系统指令
            context: '',
            // 替换回调，点击ai回复底部的替换按钮调用此函数，将会用返回数据替换光标处的数据
            replaceCallback: (replaceResult, aiMessage) => {
                const protyle = getProtyleEl();
                const wysiwyg = protyle.querySelector('.protyle-wysiwyg');
                //if(savedSelection) restoreSelection();
                sendTextToEditable(wysiwyg, replaceResult);
            },
            useSelectedHtml: true, // 发给ai时，使用选中html代替选中文本，纠错时为了保持原格式，推荐这样
        },
        {
            enable: true, // 是否启用，也可以直接注释该段代码
            id: 'aiSummary', // 在toolbar列表中必须唯一
            name: 'AI总结/摘要', // 通常用于提示信息
            icon: `<svg t="1763221194995" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5937" width="16" height="16"><path d="M85.333333 128a42.666667 42.666667 0 0 1 42.666667-42.666667h768a42.666667 42.666667 0 0 1 42.666667 42.666667v768a42.666667 42.666667 0 0 1-42.666667 42.666667H128a42.666667 42.666667 0 0 1-42.666667-42.666667V128z m85.333334 42.666667v682.666666h682.666666V170.666667H170.666667z m85.333333 128h85.333333v85.333333H256V298.666667z m85.333333 170.666666H256v85.333334h85.333333v-85.333334z m-85.333333 170.666667h85.333333v85.333333H256v-85.333333z m512-341.333333h-341.333333v85.333333h341.333333V298.666667z m-341.333333 341.333333h341.333333v85.333333h-341.333333v-85.333333z m341.333333-170.666667h-341.333333v85.333334h341.333333v-85.333334z" p-id="5938"></path></svg>`,
            // 提示词，{{selection}} 代表选中文本
            prompt: `请对以下文本进行总结和摘要。
你的行为准则如下：
1.  **绝对直接**：直接输出结果，禁止任何形式的开场白、问候语或解释性文字（例如“好的，这是摘要：”）。
2.  **高度客观**：只根据原文进行总结，绝不添加任何个人观点或推测。
3.  **言简意赅**：用最少的文字表达最关键的信息，避免冗余。

---
待总结/摘要的文本：
\`\`\`\`\`\`
{{selection}}{{context}}
\`\`\`\`\`\``,
            system: `你是一个专业的文本分析师和摘要提炼专家。你唯一的任务是将信息提炼成最核心、最精简的形式。`, // 系统指令
            context: '',
            // 替换回调，点击ai回复底部的替换按钮调用此函数，将会用返回数据替换光标处的数据
            replaceCallback: (replaceResult, aiMessage) => {
                const protyle = getProtyleEl();
                const wysiwyg = protyle.querySelector('.protyle-wysiwyg');
                //if(savedSelection) restoreSelection();
                sendTextToEditable(wysiwyg, aiMessage);
            },
        },
        {
            enable: true, // 是否启用，也可以直接注释该段代码
            id: 'aiChat', // 在toolbar列表中必须唯一
            name: 'AI聊天', // 通常用于提示信息
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M13.5 17a2 2 0 0 0-1.082.318L8.5 19.837V17h-5V4h17v13zm7 2h-7l-5.46 3.51a1 1 0 0 1-1.54-.842V19h-3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h17a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2M7.3 11.8a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6m6-1.3a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0m3.4 1.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6" clip-rule="evenodd"></path></svg>`,
            // 提示词，{{selection}} 代表选中文本
            prompt: `{{selection}}{{context}}`,
            system: `你是一个全能的AI助手，知识渊博、乐于助人。请根据用户的提问，提供准确、清晰且有条理的回答。在必要时，请使用Markdown格式（如列表、粗体、代码块）来增强回答的可读性。你的回答应直接针对当前问题，无需考虑之前的对话历史。`, // 系统指令
            context: '',
            isChat: true, // 聊天助手必须设置这个字段且值为true
            isAutoSend: false, // 是否自动发送
            pin: true, // 打开时是否默认固定
        },
    ];

    // 全局历史最大条数
    const globalHistoryNum = 200;

    /////////////////////////// 代码区开始，非必要勿动 ///////////////////////////

    const _db=false;if(_im())return;const _hp=`<a href="https://ld246.com/article/1763821416540" target="_blank">帮助</a>&nbsp;&nbsp;<a href="https://ld246.com/article/1763821416540#VIP" target="_blank">购买VIP</a>`;document.addEventListener('selectionchange',(e)=>{const p=e.target.activeElement?.closest('.protyle');if(!p||!_hs(p))return;const t=p.querySelector('.protyle-toolbar');if(!t)return;if(!t.mE){t.mE=true;const h=(e)=>{t.mE=false;document.removeEventListener('mouseup',h);document.removeEventListener('keyup',h);_mu(e,t,p)};document.addEventListener('mouseup',h);document.addEventListener('keyup',h)}const d=document.querySelector('#aiDialog');buttons.reverse();for(const b of buttons){if(!b.enable)return;let btn=t.querySelector('button[data-type="'+b.id+'"]');if(btn)return;t.insertAdjacentHTML('afterbegin',`<button class="protyle-toolbar__item b3-tooltips b3-tooltips__ne" style="font-size:14px;" data-type="${b.id}" aria-label="${b.name}">${b.icon}</button>`);btn=t.querySelector('button[data-type="'+b.id+'"]');btn.addEventListener('click',async(ev)=>{ev.stopPropagation();t.classList.add("fn__none");const th=window.siyuan.config.appearance.mode===1?'dark':'light';const pos=_dp();const s=_gs(p);aiDialog.openDialog({el:btn,theme:th,zIndex:++window.siyuan.zIndex,config:config,top:pos.top,left:pos.left,width:width,maxHeight:maxHeight,models:models,model:model,button:b,chatButton:buttons.find(x=>x.isChat)||{},context:await _gc(b),setModel:(m)=>model=m,tools:{getCurrentDoc:_gd,storeGlobalHistory:_sgh,getGlobalHistory:_ggh,saveDialogChats:_sd},globalHistoryNum,help:_hp});if(b.isChat){aiDialog.showExplainMessage(false);aiDialog.bottomShow();aiDialog.scrollToBottom();if(b.isAutoSend&&s){aiDialog.chatWelcomeShow('',true);aiDialog.submitMessage(s)}else{aiDialog.chatWelcomeShow('开始与AI对话吧！');const i=document.querySelector('#aiDialog .dialog-input');i.value=s;i.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(()=>i.focus(),100)}}else{aiDialog.showExplainMessage();aiDialog.chatWelcomeShow(false);aiDialog.sendMessage(b.useSelectedHtml?_sh():s)}})}});const css=`.protyle-toolbar.ai-toolbar-only button, .protyle-toolbar.ai-toolbar-only .protyle-toolbar__divider {display: none;} ${buttons.map(b=>`.protyle-toolbar.ai-toolbar-only button[data-type="${b.id}"]`).join(',')} {display: inline-block;}`;const sty=document.createElement('style');sty.textContent=css;document.head.appendChild(sty);_kp(shortcut,async(e)=>{const p=e.target.closest('.protyle');const s=_gs(p);const th=window.siyuan.config.appearance.mode===1?'dark':'light';const pos=_dp();const b=buttons.find(x=>x.isChat)||{};aiDialog.openDialog({el:null,theme:th,zIndex:++window.siyuan.zIndex,top:pos.top,left:pos.left,width:width,maxHeight:maxHeight,models:models,model:model,button:b,chatButton:b,context:await _gc(b),setModel:(m)=>model=m,tools:{getCurrentDoc:_gd,storeGlobalHistory:_sgh,getGlobalHistory:_ggh,saveDialogChats:_sd},globalHistoryNum,help:_hp});aiDialog.showExplainMessage(false);aiDialog.bottomShow();aiDialog.scrollToBottom();if(b.isAutoSend&&s){aiDialog.chatWelcomeShow('',true);aiDialog.submitMessage(s)}else{aiDialog.chatWelcomeShow('开始与AI对话吧！');const i=document.querySelector('#aiDialog .dialog-input');i.value=s;i.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(()=>i.focus(),100)}});async function _sd(t){if(!t.trim()){_sm('保存失败，暂无聊天内容',true);return}if(!saveToPath){_sm('保存失败，请先设置保存路径',true);return}const ps=saveToPath.split('/');const nn=ps.shift();const ns=await _ra('/api/notebook/lsNotebooks',{"flashcard":false});const nid=ns?.data?.notebooks?.find(n=>n.name===nn)?.id;if(!nid){_sm('保存失败，请先设置笔记本名',true);return}const nt=await _gt(t);const p=ps.join('/');const r=await _ra('/api/filetree/createDocWithMd',{notebook:nid,path:`/${p}/${nt}`,markdown:t,tags:'AI会话'});if(r&&r.code===0)_sm('保存成功');else _sm('保存失败',true)}async function _gt(t){const r=await fetch(_gu(titleModel.url),{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${titleModel.apiKey}`},body:JSON.stringify({model:titleModel.model,messages:[{role:'user',content:titlePrompt.replace('{{text}}',t.substring(0,1000))}],temperature:titleModel.temperature,stream:false})});const d=await r.json();return d?.choices[0]?.message?.content||new Date().toLocaleString().replace(/\//g,'-')}function _gu(u){if(/\/chat\/completions$/i.test(u))return u;if(/#$/i.test(u))return u.replace(/#$/,'');return u.replace(/\/$/,'')+'/chat/completions'}function _gs(p){const s=window.getSelection().toString().trim();if(s&&_ce()?.closest('.hljs'))return s;const ss=p?p.querySelectorAll('.protyle-wysiwyg--select'):[];if(ss.length){const ms=[];const l=Lute.New();ss.forEach(b=>{ms.push(l.BlockDOM2StdMd(b.outerHTML))});return ms.join('\n')}return s}function _hs(p){const s=window.getSelection().toString().trim();if(s&&_ce()?.closest('.hljs'))return true;const ss=p?.querySelectorAll('.protyle-wysiwyg--select');if(!ss)return s;if(ss.length)return true;return s}function _mu(e,t,p){if(!_hs(p))return;const h=e.target.closest('.hljs')||_ce()?.closest('.hljs');if(h){t.classList.add('ai-toolbar-only');t.classList.remove('fn__none');const pc=p.querySelector('.protyle-content');const cb=h.closest('.code-block');const tr=t.getBoundingClientRect();const st=(e,src)=>{const tar=_sp();t.style.left=tar.left+'px';t.style.top=(tar.top-tr.height-5)+'px';let pr;if(src==='hljs')pr=cb.getBoundingClientRect();else pr=pc.getBoundingClientRect();if((parseFloat(t.style.top)||0)<pr.top)t.style.display='none';else t.style.display=''};st();const obs=new MutationObserver((ms,o)=>{for(const m of ms){if(m.type==='attributes'&&m.attributeName==='class'){if(m.target.classList.contains('fn__none')){t.classList.remove('fn__none');o.disconnect()}}}});obs.observe(t,{attributes:true,attributeFilter:['class']});if(!h.se){h.se=true;const csw=(e)=>st(e,'protyleContent');const hsw=(e)=>st(e,'hljs');pc.addEventListener('scroll',csw);h.addEventListener('scroll',hsw);_otc(t,()=>{h.se=false;pc.removeEventListener('scroll',csw);h.removeEventListener('scroll',hsw)})}return}const ss=p.querySelectorAll('.protyle-wysiwyg--select');if(!ss.length){t.classList.remove('ai-toolbar-only');return}t.classList.add('ai-toolbar-only');t.classList.remove('fn__none');const pc=p.querySelector('.protyle-content');const tr=t.getBoundingClientRect();const st=(e)=>{const cr=pc.getBoundingClientRect();const tar=ss[0].getBoundingClientRect();t.style.left=tar.left+'px';t.style.top=(tar.top-tr.height)+'px';if((parseFloat(t.style.top)||0)<cr.top)t.style.display='none';else t.style.display=''};st();if(!pc.mbse){pc.mbse=true;const sw=(e)=>st(e);pc.addEventListener('scroll',sw);_otc(t,()=>{pc.mbse=false;pc.removeEventListener('scroll',sw)})}}function _otc(t,cb){new MutationObserver(()=>{if(t.classList.contains('fn__none'))cb()}).observe(t,{attributes:true,attributeFilter:['class']})}async function _gc(b){if(!b?.context)return'';let c=[];const cs=b.context.split(/[，,]/).map(x=>x.trim()).filter(Boolean);for(const x of cs){if(x.startsWith('block')){const bl=_ce()?.closest('.protyle-wysiwyg [data-node-id][data-type]');if(x==='blockText')c.push(`当前块的文本内容是：\n${bl.textContent}`);else c.push(`当前块的html内容是：\n${bl.outerHTML}`)}else if(x.startsWith('editor')){const p=document.querySelector('#editor')||document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')].reduce((m,t)=>Number(t?.dataset?.activetime)>Number(m?.dataset?.activetime||-1)?t:m,null)?.dataset?.id}"]`);const ed=p.querySelector('.protyle-wysiwyg');if(x==='editorText')c.push(`当前文档的文本内容是：\n${ed.textContent}`);else c.push(`当前文档的html内容是：\n${ed.outerHTML}`)}else if(x==='currentMd'){const d=await _gd();c.push(`当前文档的内容是：\n${d?.content||''}`)}else if(x==='bodyHtml'){c.push(`document.body源码是：\n${document.body.outerHTML}`)}}if(c.length)return'\n\n---\n\n以下是相关内容作为上下文：，仅供参考即可（无需对上下文做出任何解释，翻译纠错等）：\n\n'+c.join('\n\n');else return''}async function _gd(){const p=document.querySelector('#editor')||document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')].reduce((m,t)=>Number(t?.dataset?.activetime)>Number(m?.dataset?.activetime||-1)?t:m,null)?.dataset?.id}"]`);const t=p?.querySelector('.protyle-title');const id=t?.dataset?.nodeId||'';const tt=t?.querySelector('.protyle-title__input')?.textContent||'';const r=await _ra('/api/lute/copyStdMarkdown',{id});return{id,title:tt,content:r?.data||''}}function _ce(){const s=window.getSelection();if(s.rangeCount>0){const r=s.getRangeAt(0);const sc=r.startContainer;return sc.nodeType===Node.TEXT_NODE?sc.parentElement:sc}return null}function _sh(){const s=window.getSelection();if(s.rangeCount===0)return'';const r=s.getRangeAt(0);const c=document.createElement('div');c.appendChild(r.cloneContents());return c.innerHTML}function _dp(){let t=(window.innerHeight-(maxHeight||468))/2;t=t<32?32:t;const l=(window.innerWidth-(width||420))/2;return{top:t,left:l}}function _sp(){const s=window.getSelection();if(s.rangeCount>0){const r=s.getRangeAt(0);const rt=r.getBoundingClientRect();if(rt)return rt}return null}async function _ra(u,d,m='POST'){return await(await fetch(u,{method:m,body:JSON.stringify(d||{})})).json()}function _sm(m,e=false,d=7000){return fetch('/api/notification/'+(e?'pushErrMsg':'pushMsg'),{"method":"POST","body":JSON.stringify({"msg":m,"timeout":d})})}function _kp(s,c){if(_ima())s=s.replace(/ctrl|control/i,'meta');else s=s.replace(/meta|cmd|command/i,'ctrl');const ks=s.toLowerCase().split('+').map(k=>k.trim());const ms={ctrl:ks.includes('ctrl')||ks.includes('control'),alt:ks.includes('alt'),shift:ks.includes('shift'),meta:ks.includes('meta')||ks.includes('cmd')||ks.includes('command')};const nk=ks.find(k=>!['ctrl','control','alt','shift','meta','cmd','command'].includes(k));const hk=(e)=>{const mm=e.ctrlKey===ms.ctrl&&e.altKey===ms.alt&&e.shiftKey===ms.shift&&e.metaKey===ms.meta;const km=nk?e.code.toLowerCase()==='key'+nk.toLowerCase():true;if(mm&&km){e.preventDefault();c(e)}};document.addEventListener('keydown',hk);return()=>{document.removeEventListener('keydown',hk)}}function _st(e,t){e.focus();document.execCommand('insertHTML',false,t);const ie=new Event('input',{bubbles:true});e.dispatchEvent(ie)}function _im(){return!!document.getElementById("sidebar")}function _ima(){return navigator.platform.indexOf("Mac")>-1}async function _gvk(){const v=await _we(()=>{if(typeof thpilotVipKey!=='undefined'||typeof window.thpilotVipKey!=='undefined')return typeof thpilotVipKey!=='undefined'?thpilotVipKey:window.thpilotVipKey;return''},null,1500);return v}
    async function getUserModels(){const m=await _we(()=>{if((typeof llmModels!=='undefined'&&Array.isArray(llmModels)&&llmModels.length)||(typeof window.llmModels!=='undefined'&&Array.isArray(window.llmModels)&&window.llmModels.length))return typeof llmModels!=='undefined'?llmModels:window.llmModels;return null},null,1500);return m}function _sgh(g){_pf('/tmp/ai-global-history.json',JSON.stringify(g))}async function _ggh(){try{let r=await _gf('/tmp/ai-global-history.json');r=JSON.parse(r);if(r?.code&&r?.code===404)return[];return r}catch(e){return[]}}
    function _0x220b(_0x10b7cb,_0x49109a){const _0x498598=_0x4985();return _0x220b=function(_0x220b6e,_0x26f226){_0x220b6e=_0x220b6e-0x1ac;let _0x1d2658=_0x498598[_0x220b6e];return _0x1d2658;},_0x220b(_0x10b7cb,_0x49109a);}function _0x4985(){const _0xd06a3c=['length','835ylfBTY','ONS','758964EhljHI','9wvRKIX','252kvzgDS','string','689','includes','21174osABJX','114981IiLMsZ','42aTjmnx','768995PMNKdP','3252140qEcjVA','20zloULH','871328WljExu','845438SYvvoy'];_0x4985=function(){return _0xd06a3c;};return _0x4985();}(function(_0x38532b,_0x165ffc){const _0x5689a1=_0x220b,_0x7571a9=_0x38532b();while(!![]){try{const _0x22451d=-parseInt(_0x5689a1(0x1b2))/0x1+-parseInt(_0x5689a1(0x1b4))/0x2*(parseInt(_0x5689a1(0x1b0))/0x3)+parseInt(_0x5689a1(0x1ba))/0x4+parseInt(_0x5689a1(0x1b8))/0x5*(-parseInt(_0x5689a1(0x1af))/0x6)+parseInt(_0x5689a1(0x1b1))/0x7*(parseInt(_0x5689a1(0x1b5))/0x8)+parseInt(_0x5689a1(0x1bb))/0x9*(-parseInt(_0x5689a1(0x1b3))/0xa)+parseInt(_0x5689a1(0x1b6))/0xb*(parseInt(_0x5689a1(0x1bc))/0xc);if(_0x22451d===_0x165ffc)break;else _0x7571a9['push'](_0x7571a9['shift']());}catch(_0x52650f){_0x7571a9['push'](_0x7571a9['shift']());}}}(_0x4985,0x5f521));function vk1(_0x2cb1f1){const _0x57fc9c=_0x220b,_0x228456='01abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',_0x166589='wil'+'sons'+'WILS'+_0x57fc9c(0x1b9)+_0x57fc9c(0x1ad),_0x8d6c57=0xa;if(typeof _0x2cb1f1!==_0x57fc9c(0x1ac)||_0x2cb1f1[_0x57fc9c(0x1b7)]!==_0x8d6c57)return![];const _0x73acc9=_0x166589['includes'](_0x2cb1f1[0x2]),_0x1c883b=_0x166589[_0x57fc9c(0x1ae)](_0x2cb1f1[0x5]),_0x2a493f=_0x166589[_0x57fc9c(0x1ae)](_0x2cb1f1[0x8]);return _0x73acc9&&_0x1c883b&&_0x2a493f;}async function cvk(){const _0x518e16=vipKey||await _gvk();if(!_0x518e16)return![];return vk1(_0x518e16);}
    async function _pf(p,c='',d=false){const f=new FormData();f.append("path",p);f.append("isDir",d);f.append("file",new Blob([c]));const r=await fetch("/api/file/putFile",{method:"POST",body:f});return await r.json()}async function _gf(p,t='text'){return fetch("/api/file/getFile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:p})}).then(r=>{if(r.ok){if(t==='json')return r.json();else if(t==='blob')return r.blob();else return r.text()}else throw new Error("Failed")}).catch(e=>{console.error(e);throw e})}function _we(s,n=document,t=5000){return new Promise((r,j)=>{const st=Date.now();function c(){let e;try{e=typeof s==='function'?s():n.querySelector(s)}catch(err){return r(null)}if(e)r(e);else if(Date.now()-st>=t)r(null);else requestAnimationFrame(c)}c()})}
    _lj((_db?'/snippets/libs/llm-stream.js':'')||config?.libs?.LLMStream,'LLMStream');_lj((_db?'/snippets/libs/chat-ui.js':'')||config?.libs?.ChatUi,'aiDialog');function _lj(s,t){const sc=document.createElement('script');sc.src=s;sc.type='text/javascript';document.head.appendChild(sc);if(t==='aiDialog'){setTimeout(()=>{if(typeof aiDialog!=='undefined'){var _0x37dae4=_0x46b6;function _0x46b6(_0x1dd364,_0x1470ac){var _0x43e76d=_0x43e7();return _0x46b6=function(_0x46b6fe,_0x4c1f28){_0x46b6fe=_0x46b6fe-0x6d;var _0x2188a0=_0x43e76d[_0x46b6fe];return _0x2188a0;},_0x46b6(_0x1dd364,_0x1470ac);}function _0x43e7(){var _0x3c75b3=['7934136GHGDhW','923742ScnnGl','20530020wRgiwI','3CVTROK','3RzeSPe','42BybNLg','1894732CteQgq','6115475NQZpKz','179964SDPqgy','setVK','1242101KVfiAV'];_0x43e7=function(){return _0x3c75b3;};return _0x43e7();}(function(_0x556eba,_0x5dbeb8){var _0x13c49e=_0x46b6,_0x32453b=_0x556eba();while(!![]){try{var _0x2b57bf=parseInt(_0x13c49e(0x75))/0x1*(parseInt(_0x13c49e(0x6e))/0x2)+-parseInt(_0x13c49e(0x74))/0x3*(parseInt(_0x13c49e(0x77))/0x4)+parseInt(_0x13c49e(0x6d))/0x5+parseInt(_0x13c49e(0x76))/0x6*(-parseInt(_0x13c49e(0x70))/0x7)+-parseInt(_0x13c49e(0x71))/0x8+-parseInt(_0x13c49e(0x72))/0x9+parseInt(_0x13c49e(0x73))/0xa;if(_0x2b57bf===_0x5dbeb8)break;else _0x32453b['push'](_0x32453b['shift']());}catch(_0x5ccae8){_0x32453b['push'](_0x32453b['shift']());}}}(_0x43e7,0xb3a6e),aiDialog[_0x37dae4(0x6f)](cvk));}},2000)}}

    /////////////////////////// 代码区结束，非必要勿动 ///////////////////////////
})();