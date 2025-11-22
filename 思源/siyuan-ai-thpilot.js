// 思源AI划词解释、翻译、纠错、总结、聊天等
// help see https://ld246.com/article/1763821416540
// name SiYuan Thpilot
// author Wilsons
// version 1.0.1
(async () => {
    /////////////////////////// 用户配置区 ///////////////////////////
    
    // 自定义ai对话框的宽度和最大高度
    const width = 420;
    const maxHeight = 468;

    // 设置快捷键打开对话框
    const shortcut = 'ctrl+alt+z';

    // VIP KEY
    // 非vip功能仅能使用划词解释、翻译、纠错、总结等，不能使用聊天功能
    // 也可以在单独的代码片段中通过 var thpilotVipKey = ''; 来配置vipkey，这样防止分享代码时不小心泄露秘钥
    // 购买vip（自动发货） https://ifdian.net/order/create?plan_id=9a2febe8c79d11f082945254001e7c00&product_type=0&remark=&affiliate_code=
    const vipKey = ''; // 👈秘钥填这里

    // 配置用到的类库（建议下载到本地使用更稳定，这些类库均是按需加载，仅在用到时下载）
    const config = {
        libs: {
            "marked": "https://fastly.jsdelivr.net/npm/marked/marked.min.js",
            "ImageViewer": "https://scriptcat.org/lib/4625/1.0.0/ImageViewer.js?sha384-SX26HDt5ICRIw03Z4JwZWNqMyVgZKHTQQ4Q4S6wDhvNir2NBro81yWtdPq7rPMcm",
            "Popup": "https://scriptcat.org/lib/4657/1.0.0/Popup.js?sha384-j1OfUJ1d4vxTeRoRAhzlY61zez7XLLSqGMPqaMmUZcnCGX12UjtVzbz+PpWSh+eG",
            "LLMStream": "https://scriptcat.org/lib/4568/1.0.4/LLMStream.js?sha384-NpPVSgG1S5YGbLGce31JVI0OOxjRmVVIooCutM9rP+ylQJBoLBlWrcDPiE7xhHOK",
            "ChatUi": "https://scriptcat.org/lib/4686/1.0.1/aiDialog.js?sha384-Yus8l6SmfBu2C+ezRy9RWFMq2zX9Y4RR5W6FJLyHHEdZhEdKU2Gbq6PEnRYuXRiD",
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
    // 当前模型(默认模型)
    let model = JSON.parse(JSON.stringify(models[0]));

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

    /////////////////////////// 代码区，非必要勿动 ///////////////////////////

    const debug = false;
    
    if(isMobile()) return; // 暂不支持手机版

    const help = `
        <a href="https://ld246.com/article/1763821416540" target="_blank">帮助</a>&nbsp;&nbsp;
        <a href="https://ifdian.net/order/create?plan_id=9a2febe8c79d11f082945254001e7c00&product_type=0&remark=&affiliate_code=" target="_blank">购买VIP</a>
    `;
    
    // 监听工具栏出现
    document.addEventListener('selectionchange', (event) => {
        const protyle = event.target.activeElement?.closest('.protyle');
        if (!protyle) return;
        if (!hasSelection(protyle)) return;
        const toolbar = protyle.querySelector('.protyle-toolbar');
        if (!toolbar) return;
        if(!toolbar.mouseupEvent) {
            toolbar.mouseupEvent = true;
            const mouseupHandlerWrapper = (event) => {
                toolbar.mouseupEvent = false;
                document.removeEventListener('mouseup', mouseupHandlerWrapper);
                handleMouseUp(event, toolbar, protyle);
            };
            document.addEventListener('mouseup', mouseupHandlerWrapper);
            document.addEventListener('keyup', mouseupHandlerWrapper);
        }
        const dialog = document.querySelector('#aiDialog');

        // 生成按钮
        buttons.reverse();
        for(const button of buttons) {
            if(!button.enable) return;
            // todo 钉住时，选择即执行

            // 创建解释按钮
            let btn = toolbar.querySelector('button[data-type="'+button.id+'"]');
            if (btn) return;
            // 创建按钮
            const html = `
            <button class="protyle-toolbar__item b3-tooltips b3-tooltips__ne" style="font-size:14px;" data-type="${button.id}" aria-label="${button.name}">${button.icon}</button>`;
            toolbar.insertAdjacentHTML('afterbegin', html);
            btn = toolbar.querySelector('button[data-type="'+button.id+'"]');
            const clickHandler = async (event) => {
                event.stopPropagation();
                toolbar.classList.add("fn__none");
                const theme = window.siyuan.config.appearance.mode === 1 ? 'dark' : 'light';
                const pos = getDialogPos();
                const selection = getSelection(protyle);
                aiDialog.openDialog({
                    el: btn,
                    theme: theme,
                    zIndex: ++window.siyuan.zIndex,
                    config: config,
                    top: pos.top,
                    left: pos.left,
                    models: models,
                    model: model,
                    button: button,
                    chatButton: buttons.find(b=>b.isChat) || {},
                    context: await getContext(button),
                    setModel: (m) => model = m,
                    tools: {getCurrentDoc, storeGlobalHistory, getGlobalHistory},
                    globalHistoryNum,
                    help,
                });
                // 开始调用AI
                if(button.isChat) {
                    // 聊天
                    aiDialog.showExplainMessage(false);
                    aiDialog.bottomShow();
                    aiDialog.scrollToBottom();
                    if(button.isAutoSend && selection) {
                        aiDialog.chatWelcomeShow('', true);
                        aiDialog.submitMessage(selection);
                    } else {
                        aiDialog.chatWelcomeShow('开始与AI对话吧！');
                        const input = dialog.querySelector('.dialog-input');
                        input.value = selection;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        setTimeout(()=>input.focus(), 100);
                    }
                } else {
                    // 其他
                    aiDialog.showExplainMessage();
                    aiDialog.chatWelcomeShow(false);
                    aiDialog.sendMessage(button.useSelectedHtml ? getSelectedHtml() : selection);
                }
            };
            btn.addEventListener('click', clickHandler);
        }
    });

    const css = `
        .protyle-toolbar.ai-toolbar-only button, .protyle-toolbar.ai-toolbar-only .protyle-toolbar__divider {display: none;}
        ${buttons.map(b=>`.protyle-toolbar.ai-toolbar-only button[data-type="${b.id}"]`).join(',')} {
            display: inline-block;
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    onKeyPress(shortcut, async (e) => {
        const protyle = e.target.closest('.protyle');
        //if(!protyle) return;
        const selection = getSelection(protyle);
        //if(!selection) return;
        //if(protyle) protyle.querySelector('.protyle-toolbar')?.classList?.add("fn__none");
        const theme = window.siyuan.config.appearance.mode === 1 ? 'dark' : 'light';
        const pos = getDialogPos();
        const button = buttons.find(b => b.isChat) || {};
        //saveSelection();
        aiDialog.openDialog({
            el: null,
            theme: theme,
            zIndex: ++window.siyuan.zIndex,
            top: pos.top,
            left: pos.left,
            models: models,
            model: model,
            button: button,
            chatButton: button,
            context: await getContext(button),
            setModel: (m) => model = m,
            tools: {getCurrentDoc, storeGlobalHistory, getGlobalHistory},
            globalHistoryNum,
            help,
        });
        // 开始调用AI
        aiDialog.showExplainMessage(false);
        aiDialog.bottomShow();
        aiDialog.scrollToBottom();
        if(button.isAutoSend && selection) {
            aiDialog.chatWelcomeShow('', true);
            aiDialog.submitMessage(selection);
        } else {
            aiDialog.chatWelcomeShow('开始与AI对话吧！');
            const dialog = document.querySelector('#aiDialog');
            const input = dialog.querySelector('.dialog-input');
            input.value = selection;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(()=>input.focus(), 100);
        }
    });

    function getSelection(protyle) {
        const selection = window.getSelection().toString().trim();
        if(selection && getCursorElement()?.closest('.hljs')) return selection;
        const selects = protyle ? protyle.querySelectorAll('.protyle-wysiwyg--select') : [];
        if(selects.length) {
            const markdowns = [];
            const lute = Lute.New();
            selects.forEach(block => {
                markdowns.push(lute.BlockDOM2StdMd(block.outerHTML));
            });
            return markdowns.join('\n');
        }
        return selection;
    }

    function hasSelection(protyle) {
        const selection = window.getSelection().toString().trim();
        if(selection && getCursorElement()?.closest('.hljs')) return true;
        const selects = protyle?.querySelectorAll('.protyle-wysiwyg--select');
        if(!selects) return selection;
        if(selects.length) return true;
        return selection;
    }

    // 代码块或多选块显示工具栏
    function handleMouseUp(event, toolbar, protyle) {
        // 代码块
        const hljs = event.target.closest('.hljs') || getCursorElement()?.closest('.hljs');
        if(hljs) {
            toolbar.classList.add('ai-toolbar-only');
            toolbar.classList.remove('fn__none');
            const protyleContent = protyle.querySelector('.protyle-content');
            const codeBlock = hljs.closest('.code-block');
            const toolbarRect = toolbar.getBoundingClientRect();
            const setToolbarPosition = (e, source) => {
                const targetRect = getSelectionPosition();
                toolbar.style.left = targetRect.left + 'px';
                toolbar.style.top = (targetRect.top - toolbarRect.height - 5) + 'px';
                let parentRect;
                if(source === 'hljs') {
                    parentRect = codeBlock.getBoundingClientRect();
                } else {
                    parentRect = protyleContent.getBoundingClientRect();
                }
                if((parseFloat(toolbar.style.top)||0) < parentRect.top) toolbar.style.display = 'none';
                else toolbar.style.display = '';
            };
            setToolbarPosition();
            const callback = function(mutationsList, observer) {
                for (const mutation of mutationsList) {
                    // 我们只关心 'attributes' 类型的变化，并且变化的属性是 'class'
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const targetElement = mutation.target;
                        // 检查当前元素是否包含了 'fn__none' 类
                        if (targetElement.classList.contains('fn__none')) {
                            toolbar.classList.remove('fn__none');
                            //setTimeout(()=>toolbar.classList.remove('fn__none'), 50);
                            observer.disconnect();
                        }
                    }
                }
            };
            const observer = new MutationObserver(callback);
            const config = { 
                attributes: true, // 必须设置为 true，表示观察属性变化
                attributeFilter: ['class'] // (可选但推荐) 只观察 'class' 属性，提高性能
            };
            observer.observe(toolbar, config);

            // 滚动时重新定位
            if(!hljs.scrollEvent) {
                hljs.scrollEvent = true;
                const contentScrollHandlerrWrapper = (e) => setToolbarPosition(e, 'protyleContent');
                const hljsScrollHandlerrWrapper = (e) => setToolbarPosition(e, 'hljs');
                protyleContent.addEventListener('scroll', contentScrollHandlerrWrapper);
                hljs.addEventListener('scroll', hljsScrollHandlerrWrapper);
                onToolbarClose(toolbar, () => {
                    hljs.scrollEvent = false;
                    protyleContent.removeEventListener('scroll', contentScrollHandlerrWrapper);
                    hljs.removeEventListener('scroll', hljsScrollHandlerrWrapper);
                });
            }
            
            return;
        }

        // 多选块
        const selects = protyle.querySelectorAll('.protyle-wysiwyg--select');
        if(!selects.length) {
            toolbar.classList.remove('ai-toolbar-only');
            return;
        }
        toolbar.classList.add('ai-toolbar-only');
        toolbar.classList.remove('fn__none');
        const protyleContent = protyle.querySelector('.protyle-content');
        const toolbarRect = toolbar.getBoundingClientRect();
        const setToolbarPosition = (e) => {
            const contentRect = protyleContent.getBoundingClientRect();
             const targetRect = selects[0].getBoundingClientRect();
            toolbar.style.left = targetRect.left + 'px';
            toolbar.style.top = (targetRect.top - toolbarRect.height) + 'px';
            if((parseFloat(toolbar.style.top)||0) < contentRect.top) toolbar.style.display = 'none';
            else toolbar.style.display = '';
        };
        setToolbarPosition();
        // 滚动时重新定位
        if(!protyleContent.multiBlockscrollEvent){
            protyleContent.multiBlockscrollEvent = true;
            const scrollHandlerrWrapper = (e) => setToolbarPosition(e);
            protyleContent.addEventListener('scroll', scrollHandlerrWrapper);
            onToolbarClose(toolbar, () => {
                protyleContent.multiBlockscrollEvent = false;
                protyleContent.removeEventListener('scroll', scrollHandlerrWrapper);
            });
        }
    }

    function onToolbarClose(toolbar, callback) {
        new MutationObserver(() => {
          if (toolbar.classList.contains('fn__none')) {
            callback();
          }
        }).observe(toolbar, {
          attributes: true,
          attributeFilter: ['class']
        });
    }

    async function getContext(button) {
        if(!button?.context) return '';
        let context = [];
        const contexts = button.context.split(/[，,]/).map(ctx=>ctx.trim()).filter(Boolean);
        for(const ctx of contexts) {
            if(ctx.startsWith('block')) {
                const block = getCursorElement()?.closest('.protyle-wysiwyg [data-node-id][data-type]');
                if(ctx === 'blockText') context.push(`当前块的文本内容是：\n${block.textContent}`);
                else context.push(`当前块的html内容是：\n${block.outerHTML}`);
            } else if(ctx.startsWith('editor')) {
                const protyle = document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
                               .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
                const editor = protyle.querySelector('.protyle-wysiwyg');
                if(ctx === 'editorText') context.push(`当前文档的文本内容是：\n${editor.textContent}`);
                else context.push(`当前文档的html内容是：\n${editor.outerHTML}`);
            } else if(ctx === 'currentMd') {
                const doc = getCurrentDoc();
                context.push(`当前文档的内容是：\n${doc?.content || ''}`);
            } else if(ctx === 'bodyHtml') {
                context.push(`document.body源码是：\n${document.body.outerHTML}`);
            }
        }
        if(context.length) return '\n\n---\n\n以下是相关内容作为上下文：，仅供参考即可（无需对上下文做出任何解释，翻译纠错等）：\n\n'+context.join('\n\n');
        else return '';
    }

    async function getCurrentDoc() {
        const protyleEl = document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')].reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
        const titleEl = protyleEl?.querySelector('.protyle-title');
        const docId = titleEl?.dataset?.nodeId || '';
        const title = titleEl?.querySelector('.protyle-title__input')?.textContent || '';
        const res = await requestApi('/api/lute/copyStdMarkdown', {id:docId});
        return {id: docId, title, content: res?.data || ''};
    }

    function getCursorElement() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // 获取选择范围的起始位置所在的节点
            const startContainer = range.startContainer;
            // 如果起始位置是文本节点，返回其父元素节点
            const cursorElement = startContainer.nodeType === Node.TEXT_NODE
                ? startContainer.parentElement
                : startContainer;
            return cursorElement;
        }
        return null;
    }

    function getSelectedHtml() {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return '';
    
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      return container.innerHTML;
    }

    function getDialogPos() {
        let top = (window.innerHeight - (maxHeight||468)) / 2;
        top = top < 32 ? 32 : top;
        const left = (window.innerWidth - (width||420)) / 2;
        return {top, left};
    }

    function getSelectionPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
    
            // 如果是光标，getBoundingClientRect() 返回一个 0 宽度的矩形
            // 如果是选区，返回包裹整个选区的矩形
            const rect = range.getBoundingClientRect();
    
            if (rect) {
                return rect;
            }
        }
        return null;
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    function getProtyleEl() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
          .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
    }

    /**
     * 监听键盘快捷键
     * @param {string} shortcut - 快捷键字符串，如 'meta+alt+z' 或 'ctrl+shift+a'
     * @param {Function} callback - 回调函数
     * @returns {Function} 返回清理函数，用于移除监听器
     */
    function onKeyPress(shortcut, callback) {
        // 系统兼容处理
        if(isMac()) shortcut = shortcut.replace(/ctrl|control/i, 'meta');
        else shortcut = shortcut.replace(/meta|cmd|command/i, 'ctrl');
        // 解析快捷键字符串
        const keys = shortcut.toLowerCase().split('+').map(k => k.trim());
        
        // 分离功能键和普通键
        const modifiers = {
            ctrl: keys.includes('ctrl') || keys.includes('control'),
            alt: keys.includes('alt'),
            shift: keys.includes('shift'),
            meta: keys.includes('meta') || keys.includes('cmd') || keys.includes('command')
        };
        
        // 获取普通键（最后一个非功能键）
        const normalKey = keys.find(key => 
            !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(key)
        );
        
        // 事件处理函数
        const handleKeyDown = (e) => {
            // 检查所有功能键是否匹配
            const modifiersMatch = 
                e.ctrlKey === modifiers.ctrl &&
                e.altKey === modifiers.alt &&
                e.shiftKey === modifiers.shift &&
                e.metaKey === modifiers.meta;
            
            // 检查普通键是否匹配
            const keyMatch = normalKey ? 
                e.code.toLowerCase() === 'key' + normalKey.toLowerCase() : true;
            
            // 如果都匹配，执行回调
            if (modifiersMatch && keyMatch) {
                e.preventDefault(); // 阻止默认行为
                callback(e);
            }
        };
        
        // 添加事件监听器
        document.addEventListener('keydown', handleKeyDown);
        
        // 返回清理函数
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }

    function sendTextToEditable(element, text) {
        // 聚焦到编辑器
        element.focus();
        // 发送文本
        document.execCommand('insertHTML', false, text);
        // 触发 input 事件
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
    }

    let savedSelection = null;

    function saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            savedSelection = {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset
            };
        }
    }
    
    function restoreSelection() {
        if (!savedSelection) return;
    
        const selection = window.getSelection();
        selection.removeAllRanges();
    
        const range = document.createRange();
        range.setStart(savedSelection.startContainer, savedSelection.startOffset);
        range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
    
        selection.addRange(range);
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    async function getVipKey() {
        const vipKey = await whenElementExist(()=>{
            if(typeof thpilotVipKey !== 'undefined' || typeof window.thpilotVipKey !== 'undefined') {
                return typeof thpilotVipKey !== 'undefined' ? thpilotVipKey : window.thpilotVipKey;
            }
            return '';
        }, null, 1500);
        return vipKey;
    }

    async function getUserModels() {
        const models = await whenElementExist(()=>{
            if(
                (typeof llmModels !== 'undefined' && Array.isArray(llmModels) && llmModels.length) ||
                (typeof window.llmModels !== 'undefined' && Array.isArray(window.llmModels) && window.llmModels.length)
            ) {
                return typeof llmModels !== 'undefined' ? llmModels : window.llmModels;
            }
            return null;
        }, null, 1500);
        return models;
    }

    function storeGlobalHistory(globalHistory) {
        putFile('/tmp/ai-global-history.json', JSON.stringify(globalHistory));
    }

    async function getGlobalHistory() {
        try {
            let res = await getFile('/tmp/ai-global-history.json');
            res = JSON.parse(res);
            if(res?.code && res?.code === 404) {
                return [];
            }
            return res;
        } catch (e) {
            return [];
        }
    }

    function _0x220b(_0x10b7cb,_0x49109a){const _0x498598=_0x4985();return _0x220b=function(_0x220b6e,_0x26f226){_0x220b6e=_0x220b6e-0x1ac;let _0x1d2658=_0x498598[_0x220b6e];return _0x1d2658;},_0x220b(_0x10b7cb,_0x49109a);}function _0x4985(){const _0xd06a3c=['length','835ylfBTY','ONS','758964EhljHI','9wvRKIX','252kvzgDS','string','689','includes','21174osABJX','114981IiLMsZ','42aTjmnx','768995PMNKdP','3252140qEcjVA','20zloULH','871328WljExu','845438SYvvoy'];_0x4985=function(){return _0xd06a3c;};return _0x4985();}(function(_0x38532b,_0x165ffc){const _0x5689a1=_0x220b,_0x7571a9=_0x38532b();while(!![]){try{const _0x22451d=-parseInt(_0x5689a1(0x1b2))/0x1+-parseInt(_0x5689a1(0x1b4))/0x2*(parseInt(_0x5689a1(0x1b0))/0x3)+parseInt(_0x5689a1(0x1ba))/0x4+parseInt(_0x5689a1(0x1b8))/0x5*(-parseInt(_0x5689a1(0x1af))/0x6)+parseInt(_0x5689a1(0x1b1))/0x7*(parseInt(_0x5689a1(0x1b5))/0x8)+parseInt(_0x5689a1(0x1bb))/0x9*(-parseInt(_0x5689a1(0x1b3))/0xa)+parseInt(_0x5689a1(0x1b6))/0xb*(parseInt(_0x5689a1(0x1bc))/0xc);if(_0x22451d===_0x165ffc)break;else _0x7571a9['push'](_0x7571a9['shift']());}catch(_0x52650f){_0x7571a9['push'](_0x7571a9['shift']());}}}(_0x4985,0x5f521));function vk1(_0x2cb1f1){const _0x57fc9c=_0x220b,_0x228456='01abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',_0x166589='wil'+'sons'+'WILS'+_0x57fc9c(0x1b9)+_0x57fc9c(0x1ad),_0x8d6c57=0xa;if(typeof _0x2cb1f1!==_0x57fc9c(0x1ac)||_0x2cb1f1[_0x57fc9c(0x1b7)]!==_0x8d6c57)return![];const _0x73acc9=_0x166589['includes'](_0x2cb1f1[0x2]),_0x1c883b=_0x166589[_0x57fc9c(0x1ae)](_0x2cb1f1[0x5]),_0x2a493f=_0x166589[_0x57fc9c(0x1ae)](_0x2cb1f1[0x8]);return _0x73acc9&&_0x1c883b&&_0x2a493f;}async function cvk(){const _0x518e16=vipKey||await getVipKey();if(!_0x518e16)return![];return vk1(_0x518e16);}

    async function putFile(path, content = '', isDir = false) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", isDir)
        formData.append("file", new Blob([content]));
        const result = await fetch("/api/file/putFile", { // 写入js到本地
            method: "POST",
            body: formData,
        });
        const json = await result.json();
        return json;
    }

    async function getFile(path, type = 'text') {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
        }).then((response) => {
            if (response.ok) {
                if(type==='json') return response.json();
                else if(type==='blob') return response.blob();
                else return response.text();
            } else {
                throw new Error("Failed to get file content");
            }
        }).catch((error) => {
            console.error(error);
            throw error;
        });
    }

    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function' ? selector() : node.querySelector(selector);
                } catch (err) { return resolve(null); }
                if (el) resolve(el);
                else if (Date.now() - start >= timeout) resolve(null);
                else requestAnimationFrame(check);
            }
            check();
        });
    }

    loadJs((debug?'/snippets/libs/llm-stream.js':'') || config?.libs?.LLMStream, 'LLMStream');
    loadJs((debug?'/snippets/libs/chat-ui.js':'') || config?.libs?.ChatUi, 'aiDialog');
    function loadJs(src, type) {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        document.head.appendChild(script);
        if(type === 'aiDialog') {
            setTimeout(() => {
                if(typeof aiDialog !== 'undefined') {
                    var _0x37dae4=_0x46b6;function _0x46b6(_0x1dd364,_0x1470ac){var _0x43e76d=_0x43e7();return _0x46b6=function(_0x46b6fe,_0x4c1f28){_0x46b6fe=_0x46b6fe-0x6d;var _0x2188a0=_0x43e76d[_0x46b6fe];return _0x2188a0;},_0x46b6(_0x1dd364,_0x1470ac);}function _0x43e7(){var _0x3c75b3=['7934136GHGDhW','923742ScnnGl','20530020wRgiwI','3CVTROK','3RzeSPe','42BybNLg','1894732CteQgq','6115475NQZpKz','179964SDPqgy','setVK','1242101KVfiAV'];_0x43e7=function(){return _0x3c75b3;};return _0x43e7();}(function(_0x556eba,_0x5dbeb8){var _0x13c49e=_0x46b6,_0x32453b=_0x556eba();while(!![]){try{var _0x2b57bf=parseInt(_0x13c49e(0x75))/0x1*(parseInt(_0x13c49e(0x6e))/0x2)+-parseInt(_0x13c49e(0x74))/0x3*(parseInt(_0x13c49e(0x77))/0x4)+parseInt(_0x13c49e(0x6d))/0x5+parseInt(_0x13c49e(0x76))/0x6*(-parseInt(_0x13c49e(0x70))/0x7)+-parseInt(_0x13c49e(0x71))/0x8+-parseInt(_0x13c49e(0x72))/0x9+parseInt(_0x13c49e(0x73))/0xa;if(_0x2b57bf===_0x5dbeb8)break;else _0x32453b['push'](_0x32453b['shift']());}catch(_0x5ccae8){_0x32453b['push'](_0x32453b['shift']());}}}(_0x43e7,0xb3a6e),aiDialog[_0x37dae4(0x6f)](cvk));
                }
            }, 2000);
        }
    }
})();