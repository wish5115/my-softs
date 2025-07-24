// 查看当前文档相似文章列表
// see https://ld246.com/article/1753352791640
(()=>{
    ///////////////// 主要逻辑 ////////////////////////////////////

    const main = (event)=>{
        const protyle = event?.detail?.protyle?.element;
        if(!protyle) return;
        if(protyle?.querySelector('.protyle-breadcrumb [data-type="smilarDoc"]')) return;
        const docId = protyle?.querySelector('.protyle-title')?.dataset?.nodeId;
        const exitFocusBtn = protyle.querySelector('.protyle-breadcrumb [data-type="exit-focus"]');
        if(!exitFocusBtn) return;
        const moveHtml = `<button class="block__icon fn__flex-center ariaLabel" aria-label="查看相似文章" data-type="smilarDoc"><svg><use xlink:href="#iconList"></use></svg></button>`;
        exitFocusBtn.insertAdjacentHTML('afterend', moveHtml);
        const newBtn = protyle.querySelector('.protyle-breadcrumb [data-type="smilarDoc"]');
        newBtn.addEventListener('click', async () => {
            const icon = newBtn.querySelector('svg');
            const iconUse = icon.querySelector('use');
            icon.classList.add('fn__rotate');
            iconUse.setAttribute('xlink:href', '#iconRefresh');
            const data = await getSimilarDocs(docId, 50);
            icon.classList.remove('fn__rotate');
            iconUse.setAttribute('xlink:href', '#iconList');
            if(data.length === 0) {showMessage('没有找到相关文章'); return;}
            const item = await optionsDialog(newBtn, data);
            if(item) {
                openBlock(item.dataset.id);
                window.siyuan.menus.menu.remove();
            }
        });
    }
    eventBusOn('loaded-protyle-static', main);

    // 预加载分词
    setTimeout(()=>initSegmentit(), 2000);

    ///////////////// 辅助函数 ////////////////////////////////////

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
    
    function eventBusOn(eventName, callback) {
        const pluginName = 'my-custom-plugin';
        if(window.siyuan.ws.app.plugins?.length === 0) {
            console.log('绑定事件'+eventName+'失败，请至少安装一个插件');
            return false;
        }
        let myPlugin = window.siyuan.ws.app.plugins.find(item=>item.name === pluginName);
        if(!myPlugin) {
            const Plguin = Object.getPrototypeOf(window.siyuan.ws.app.plugins[0].constructor);
            const MyPlugin = class extends Plguin{};
            myPlugin = new MyPlugin({app:window.siyuan.ws.app.appId, name:pluginName, displayName:pluginName});
            myPlugin.openSetting = null; // 防止顶部插件按钮添加设置菜单
            window.siyuan.ws.app.plugins.push(myPlugin);
        }
        myPlugin.eventBus.on(eventName, callback);
        return true;
    }

    // 调用示例
    // openBlock('20250627184916-xhmqiqj');
    function openBlock(id) {
        const wysiwyg = document.querySelector('#editor .protyle-wysiwyg');
        if(wysiwyg) {
            const html = `<span class="protyle-custom open-block-link" data-type="a" data-href="siyuan://blocks/${id}" style="display:none;"></span>`;
            wysiwyg.insertAdjacentHTML('beforeend', html);
            const link = wysiwyg.querySelector('.open-block-link');
            link.click();
            link.remove();
        } else {
            window.open('siyuan://blocks/' + id);
        }
    }

    ///////////////// 获取相似文章列表函数 //////////////////////////
    
    // 获取相似文章列表函数
    // docId 文档id，即哪个文档作为参考
    // showNum 返回多少条相似文章，默认20条
    // keywordNum 允许传入的最大分词个数
    // wordNum 参与提取分词的字数，0 全部 >0 前n个字符
    // titleTagWeight 标题和tag权重 默认0.7，代表70%
    // contentWeight 内容权重 默认0.3，代表30%
    // 返回 相似文章列表，如 [{id:'',title:'',score:-0,root_id:''}]
    // 调用示例 await getSimilarDocs('20250702014415-7rk1d1g');
    async function getSimilarDocs(docId, showNum = 20, keywordNum = 100, wordNum = 2000, titleTagWeight=0.7, contentWeight=0.3) {
        if(!docId) return [];
        // 获取文章信息
        const blockBlacks = ['c', 'html', 'iframe', 'm', 'query_embed', 'tb', 'video', 'audio', 'widget']; // 过滤块，在此列表中的不筛选
        let doc = await querySql(`select content as title, tag from blocks where id = '${docId}'`);
        doc = doc[0] || {};
        blockBlacks.push('d'); // 不包含文档类型
        let contents = await querySql(`SELECT id, content, type FROM blocks WHERE root_id = '${docId}' AND type not in (${blockBlacks.map(i=>`'${i}'`).join(',')});`);
        const ids = contents.map(item => item.id);
        const indexs = (await requestApi('/api/block/getBlocksIndexes', {ids}))?.data || {};
        contents = moveHeadersToFront(sortContentsByIndexs(contents, indexs));
        doc.content = contents.map(item => item.content).join("\n")?.trim()?.slice(0, wordNum || undefined);
        // 加载分词js
        if(!window.Segmentit) {
            await loadJs([
                '/snippets/libs/segmentit.min.js', // 本地js路径
                'https://jsd.onmicrosoft.cn/npm/segmentit@2.0.3/dist/umd/segmentit.min.js',
            ]);
            if(!window.Segmentit) return [];
            // 自定义停用词
            let resp = await fetch('/snippets/libs/cn_stopwords.txt'); // 本地停用词
            if(resp.status === 404) resp = await fetch('https://jsd.onmicrosoft.cn/gh/goto456/stopwords@master/cn_stopwords.txt');
            const cnStopWords = await resp.text() || '';
            Segmentit.stopwords.push(cnStopWords);
            Segmentit.stopwords.push(`a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm\nn\no\np\nq\nr\ns\nt\nu\nv\nw\nx\ny\nz\nA\nB\nC\nD\nE\nF\nG\nH\nI\nJ\nK\nL\nM\nN\nO\nP\nQ\nR\nS\nT\nU\nV\nW\nX\nY\nZ`);
        }
        // 获取分词信息（过滤标点符号2048）
        const segmentit = window.segmentit1 || Segmentit.useDefault(new Segmentit.Segment());
        let stopedWords = window?.segmentit1?.stopedWords || [];
        if(!window.segmentit1) {
            Segmentit.stopwords.forEach(item => stopedWords = [...stopedWords, ...item]);
            segmentit.stopedWords = stopedWords;
            window.segmentit1 = segmentit;
        }
        // 从内到外依次是，过滤空值和停用词，去除不重要词性，去重，按词性重要程度排序，取前n个分词
        const titleKeywords = sortWordsByPriority(segmentit, uniqueWords(segmentit.doSegment(doc.title).filter(word => word.w && word.p && word.p !== 2048 && !stopedWords.includes(word.w) && !getExcludeWords(segmentit, word.p) && !isLink(word.w)))).slice(0, keywordNum || undefined);
        const contentKeywords = sortWordsByPriority(segmentit, uniqueWords(segmentit.doSegment(doc.content).filter(word => word.w && word.p && word.p !== 2048 && !stopedWords.includes(word.w) && !getExcludeWords(segmentit, word.p) && !isLink(word.w)))).slice(0, keywordNum || undefined);
        const tagKeywords = sortWordsByPriority(segmentit, uniqueWords(segmentit.doSegment(doc.tag).filter(word => word.w && word.p && word.p !== 2048 && !stopedWords.includes(word.w) && !getExcludeWords(segmentit, word.p) && !isLink(word.w)))).slice(0, keywordNum || undefined);
        // 根据分词查询相似文章
        // 原理：通过查询标题和tag的匹配结果的rank，然后与查询内容的匹配结果的rank进行加权计算得分
        // sql说明：1 MATCH中的关键词必须替换双引号和单引号为两个进行转义
        //         2 MAX(title)， MAX(id)为了防止GROUP BY时出现null的情况
        //         3 MATCH不允许有空值存在，否则完全匹配不到，因此SQL需要按需动态拼接
        //         4 得分用ROUND防止浮点数溢出
        const whereParts = [];
        if(tagKeywords.length) whereParts.push(`tag MATCH '${getKeywordsSql(tagKeywords)}'`);
        if(titleKeywords.length) whereParts.push(`content MATCH '${getKeywordsSql(titleKeywords)}'`);
        const sql = `
            SELECT 
                root_id,
                Max(hpath) AS hpath,
                MAX(title) AS title,
                MAX(id) AS id,
                ROUND(
                    ${titleTagWeight} * MAX(COALESCE(doc_score, 0)) + 
                    ${contentWeight} * MAX(COALESCE(content_score, 0)), 
                    6
                ) AS score
            FROM (
                -- 文档元信息：标题和tag（type='d'）
                SELECT 
                    id AS root_id,
                    hpath,
                    content AS title,
                    id,
                    -bm25(blocks_fts_case_insensitive) AS doc_score,
                    NULL AS content_score
                FROM blocks_fts_case_insensitive
                WHERE type = 'd'
                  AND id != '${docId}'
                  AND (${whereParts.join(' OR ')})
                
                UNION ALL
                
                -- 文档内容（type≠'d'）
                SELECT 
                    root_id,
                    NULL AS hpath,
                    NULL AS title,
                    NULL AS id,
                    NULL AS doc_score,
                    -bm25(blocks_fts_case_insensitive) AS content_score
                FROM blocks_fts_case_insensitive
                WHERE type not in (${blockBlacks.map(i=>`'${i}'`).join(',')})
                  AND root_id != '${docId}'
                  AND content MATCH '${getKeywordsSql(contentKeywords)}'
            ) AS combined
            GROUP BY root_id
            HAVING score > 0
            ORDER BY score DESC
            LIMIT ${showNum};
        `;
        const result = await querySql(sql);
        // 补全标题（当标题或tag未匹配到，仅内容匹配到时，此时标题和标题id为null，需要补全）
        const nullTitleIds = result.filter(doc=>doc.id === null || doc.title === null).map(doc=>doc.root_id);
        if(nullTitleIds.length) {
            const docs = await querySql(`select id, content, hpath from blocks where type='d' and id in (${nullTitleIds.map(id=>`'${id}'`).join(',')});`);
            const docsMap = {};
            docs.forEach(doc=>docsMap[doc.id] = doc);
            result.forEach(doc=>{
                if(doc.id === null) doc.id = docsMap[doc.root_id]?.id;
                if(doc.title === null) doc.title = docsMap[doc.root_id]?.content;
                if(doc.hpath === null) doc.hpath = docsMap[doc.root_id]?.hpath;
            });
        }
        return result;
        ///////////////////// 辅助函数 ////////////////////
        function moveHeadersToFront(blocks) {
            const headers = [];
            const others = [];
            // 一次遍历，分类
            blocks.forEach(block => {
                if (block.type === 'h') {
                    headers.push(block);
                } else {
                    others.push(block);
                }
            });
            // 合并：headers 在前，others 在后
            return [...headers, ...others];
        }
        function sortWordsByPriority(segmentit, words) {
            const priorityOrder = [
                segmentit.POSTAG.D_N,   // 名词
                segmentit.POSTAG.A_NR,  // 人名
                segmentit.POSTAG.A_NS,  // 地名
                segmentit.POSTAG.A_NT,  // 机构团体
                segmentit.POSTAG.A_NZ,  // 其他专名
                segmentit.POSTAG.D_V,   // 动词
                segmentit.POSTAG.D_A,   // 形容词
                segmentit.POSTAG.D_I,   // 成语
                segmentit.POSTAG.D_L,   // 习语
                segmentit.POSTAG.D_MQ,  // 数量词
                segmentit.POSTAG.A_M    // 数词
            ];
            // 用 Map 作为哈希表分组
            const inPriority = new Map(); // Map<POSTAG, Array<Word>>
            const notInPriority = [];
            words.forEach(word => {
                const p = Array.isArray(word.p) ? word.p[0] : word.p;
                if (priorityOrder.includes(p)) {
                    if (!inPriority.has(p)) {
                        inPriority.set(p, []);
                    }
                    inPriority.get(p).push(word);
                } else {
                    notInPriority.push(word);
                }
            });
            // 最终结果数组
            const newWords = [];
            // 按优先级顺序拼接，使用 push(...), 性能最优
            priorityOrder.forEach(postag => {
                const wordsOfPos = inPriority.get(postag);
                if (wordsOfPos) {
                    newWords.push(...wordsOfPos); // ✅ 原地添加，性能最好
                }
            });
            newWords.push(...notInPriority);
            return newWords;
        }
        function getExcludeWords(segmentit, p) {
            if(Array.isArray(p)) p = p[0];
            return [
                segmentit.POSTAG.D_U,  // 助词
                segmentit.POSTAG.D_P,  // 介词
                segmentit.POSTAG.D_C,  // 连词
                segmentit.POSTAG.D_D,  // 副词
                segmentit.POSTAG.D_W,  // 标点符号
                segmentit.POSTAG.D_O,  // 拟声词
                segmentit.POSTAG.D_X,  // 非语素字
                segmentit.POSTAG.D_Y,  // 语气词
                segmentit.POSTAG.D_Z,  // 状态词
                segmentit.POSTAG.D_E,  // 叹词
                segmentit.POSTAG.D_K,  // 后接成分
                segmentit.POSTAG.D_ZH, // 前接成分
                segmentit.POSTAG.UNK  // 未知词性
            ].includes(p);
        }
        function isLink(word) {
            word = word.toLowerCase();
            return word.startsWith('http://')||word.startsWith('https://')||word.startsWith('file://')||word.startsWith('assets/');
        }
        // 当出现重复时，保留第一个
        function uniqueWords(words) {
            const seen = new Set();
            return words.filter(item => {
                if (seen.has(item.w)) return false;
                seen.add(item.w);
                return true;
            });
        }
        function getKeywordsSql(keywords) {
            if(!Array.isArray(keywords) || keywords.length === 0) return '""';
            // 把关键词中的双引号和单引号都转换为双个以转义
            return keywords.map(w=>`"${w.w.replace(/"/g, '""').replace(/'/, "''")}"`).join(' OR ');
        }
        function sortContentsByIndexs(contents, indexs) {
            return contents.slice().sort((a, b) => {
                const idxA = indexs[a.id] ?? Infinity;
                const idxB = indexs[b.id] ?? Infinity;
                return idxA - idxB;
            });
        }
        async function querySql(sql) {
            const result = await requestApi('/api/query/sql', { "stmt": sql });
            if (result.code !== 0) {
                console.error("查询数据库出错", result.msg);
                return [];
            }
            return result.data;
        }
        async function requestApi(url, data, method = 'POST') {
            return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
        }
        async function loadJs(urls) {
            if (!Array.isArray(urls) || urls.length === 0) {
                throw new Error('Please provide a non-empty array of script URLs');
            }
            for (const url of urls) {
                let script;
                try {
                    await new Promise((resolve, reject) => {
                        script = document.createElement('script');
                        script.src = url;
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () => {
                            script.remove();
                            reject(new Error(`Failed to load ${url}`));
                        };
                        document.head.appendChild(script);
                    });
                    // 只有加载成功才会走到这里，并拿到正确的 script 元素
                    return script;
                } catch (e) {
                    console.warn('加载失败:', url);
                    // 失败时继续下一个 URL
                }
            }
            throw new Error('所有脚本加载失败');
        }
    }
    // 初始化分词，建议加载时执行，以加快第一次执行时的速度
    async function initSegmentit() {
        if(!window.Segmentit) {
            await loadJs([
                '/snippets/libs/segmentit.min.js', // 本地js路径
                'https://jsd.onmicrosoft.cn/npm/segmentit@2.0.3/dist/umd/segmentit.min.js',
            ]);
            if(!window.Segmentit) return;
            // 自定义停用词
            let resp = await fetch('/snippets/libs/cn_stopwords.txt'); // 本地停用词
            if(resp.status === 404) resp = await fetch('https://jsd.onmicrosoft.cn/gh/goto456/stopwords@master/cn_stopwords.txt');
            const cnStopWords = await resp.text() || '';
            Segmentit.stopwords.push(cnStopWords);
            Segmentit.stopwords.push(`a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm\nn\no\np\nq\nr\ns\nt\nu\nv\nw\nx\ny\nz\nA\nB\nC\nD\nE\nF\nG\nH\nI\nJ\nK\nL\nM\nN\nO\nP\nQ\nR\nS\nT\nU\nV\nW\nX\nY\nZ`);
        }
        // 获取分词信息（过滤标点符号2048）
        const segmentit = window.segmentit1 || Segmentit.useDefault(new Segmentit.Segment());
        let stopedWords = window?.segmentit1?.stopedWords || [];
        if(!window.segmentit1) {
            Segmentit.stopwords.forEach(item => stopedWords = [...stopedWords, ...item]);
            segmentit.stopedWords = stopedWords;
            window.segmentit1 = segmentit;
        }
        async function loadJs(urls) {
            if (!Array.isArray(urls) || urls.length === 0) {
                throw new Error('Please provide a non-empty array of script URLs');
            }
            for (const url of urls) {
                let script;
                try {
                    await new Promise((resolve, reject) => {
                        script = document.createElement('script');
                        script.src = url;
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () => {
                            script.remove();
                            reject(new Error(`Failed to load ${url}`));
                        };
                        document.head.appendChild(script);
                    });
                    // 只有加载成功才会走到这里，并拿到正确的 script 元素
                    return script;
                } catch (e) {
                    console.warn('加载失败:', url);
                    // 失败时继续下一个 URL
                }
            }
            throw new Error('所有脚本加载失败');
        }
    }

    ///////////////// 选项列表ui //////////////////////////
    // const item = await optionsDialog(target, data); // data格式 [{title:'', value: '', hpath:'', id: 'blockId', extends:'{}'},...]
    // const item = await optionsDialog(target, (keyword) => {}) // 回调函数需返回 [{title:'', value: '', hpath:'', id: 'blockId', extends:'{}'}, ...]
    // target 对话框显示在哪个元素附近，也可以是对象，指定显示位置，如果{left:0, top:0}
    // data 是对象数组或数据返回函数；afterRender 是渲染完成后的回调，一般不需要
    // 返回值 item是列表选项的dom元素，可通过item.dataset.xxx获取对应的值，比如item.dataset.value
    // see https://github.com/siyuan-note/siyuan/blob/a2a678c5fbb560e3b265dc2c690f568bcf15a663/app/src/protyle/render/av/relation.ts#L55
    function optionsDialog(target, data, afterRender) {
        return new Promise((resolve) => {
            const menu = window.siyuan.menus.menu;
            menu.remove();
            menu.addItem({
                iconHTML: "",
                type: "empty",
                label: `
                    <div class="fn__flex-column b3-menu__filter">
                        <input class="b3-text-field fn__flex-shrink"/>
                        <div class="fn__hr"></div>
                        <div class="b3-list fn__flex-1 b3-list--background">
                            <img style="margin: 0 auto;display: block;width: 64px;height: 64px" src="/stage/loading-pure.svg">
                        </div>
                    </div>
                `,
                async bind(element) {
                    const listElement = element.querySelector(".b3-list");
                    const inputElement = element.querySelector("input");
                    inputElement.addEventListener("keydown", (event) => {
                        if (event.isComposing) return;
                        const currentElement = upDownHint(listElement, event);
                        if (currentElement) event.stopPropagation();
                        if (event.key === "Enter") {
                            event.preventDefault();
                            event.stopPropagation();
                            const listItemElement = listElement.querySelector(".b3-list-item--focus");
                            resolve(listItemElement);
                            menu.remove();
                        }
                    });
                    let timeoutId;
                    inputElement.addEventListener("input", (event) => {
                        event.stopPropagation();
                        if (event.isComposing) return;
                        if(timeoutId) clearTimeout(timeoutId);
                        timeoutId = setTimeout(async ()=>{
                            await genSearchList(listElement, inputElement.value, data);
                            if(timeoutId) clearTimeout(timeoutId);
                        }, 100);
                    });
                    inputElement.addEventListener("compositionend", () => {
                        if(timeoutId) clearTimeout(timeoutId);
                        timeoutId = setTimeout(async ()=>{
                            await genSearchList(listElement, inputElement.value, data);
                            if(timeoutId) clearTimeout(timeoutId);
                        }, 100);
                    });
                    element.lastElementChild.addEventListener("click", (event) => {
                        const listItemElement = event.target.closest(".b3-list-item");
                        if (listItemElement) {
                            event.stopPropagation();
                            resolve(listItemElement);
                            menu.remove();
                        }
                    });
                    await genSearchList(listElement, '', data);
                    const rect = target?.nodeType === 1 ? target.getBoundingClientRect() : target;
                    menu.popup({
                        x: rect.left,
                        y: rect.bottom || rect.top,
                        //w: rect.width,
                        h: rect.height,
                        //isLeft: rect.isLeft
                    });
                    setTimeout(()=>element.querySelector("input").focus(), 100);
                    if(typeof afterRender === 'function') await afterRender(element);
                }
            });
            menu.element.querySelector(".b3-menu__items").setAttribute("style", "overflow: initial");
            const popoverElement = target?.closest ? target.closest('.block__popover') : null;
            menu.element.setAttribute("data-from", popoverElement ? popoverElement.dataset.level + "popover" : "app");
        });
        async function genSearchList(element, keyword = '', data){
            if(typeof data === 'function') {
                data = await data(keyword);
            } else {
                if(!Array.isArray(data)) return;
                data = data.filter(item => item?.value?.toString()?.includes(keyword) || item?.title?.toString()?.includes(keyword) || item?.content?.toString()?.includes(keyword));
            }
            let html = "";
            data.forEach((item, index) => {
                html += `<div class="b3-list-item b3-list-item--narrow${index === 0 ? " b3-list-item--focus" : ""}" data-block-id="${item?.id||''}" data-id="${item?.id||''}" data-value="${item?.value||''}" data-extends="${item?.extends||''}">
        <div class="b3-list-item--two fn__flex-1">
            <div class="b3-list-item__first">
                <span class="b3-list-item__text">${escapeHtml(item?.title || item?.content || window.siyuan.languages.title)}</span>
            </div>
            <div class="b3-list-item__meta b3-list-item__showall">${escapeGreat(item?.hpath||'')}</div>
        </div>
        <svg aria-label="${item?.current || '当前块'}" style="margin: 0 0 0 4px" class="b3-list-item__hinticon ariaLabel${item?.current || (item?.id && target?.dataset?.nodeId && item?.id === target?.dataset?.nodeId) ? "" : " fn__none"}"><use xlink:href="#iconInfo"></use></svg>
    </div>`;
            });
            element.innerHTML = html;
        }
        function escapeHtml(html) {
            if (!html) return html;
            if(typeof html !== 'string') html = html.toString();
            return html.replace(/&/g, "&amp;").replace(/</g, "&lt;");
        }
        function escapeGreat(html) {
            if(typeof html !== 'string') html = html.toString();
            return html.replace(/</g, "&lt;");
        }
        function isNormalItem(currentHintElement, className) {
            return !currentHintElement.classList.contains(className) || currentHintElement.getBoundingClientRect().height === 0;
        };
        // see https://github.com/siyuan-note/siyuan/blob/a2a678c5fbb560e3b265dc2c690f568bcf15a663/app/src/util/upDownHint.ts#L5
        function upDownHint(listElement, event, classActiveName = "b3-list-item--focus", defaultElement) {
            let currentHintElement = listElement.querySelector("." + classActiveName);
            if (!currentHintElement && defaultElement) {
                defaultElement.classList.add(classActiveName);
                defaultElement.scrollIntoView(true);
                return;
            }
            if (!currentHintElement) return;
            const className = classActiveName.split("--")[0];
            if (event.key === "ArrowDown") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = currentHintElement.nextElementSibling;
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.nextElementSibling;
                }
                if (!currentHintElement) {
                    currentHintElement = listElement.children[0];
                    while (currentHintElement && isNormalItem(currentHintElement, className)) {
                        currentHintElement = currentHintElement.nextElementSibling;
                    }
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                if (listElement.scrollTop < currentHintElement.offsetTop - listElement.clientHeight + currentHintElement.clientHeight ||
                    listElement.scrollTop > currentHintElement.offsetTop) {
                    currentHintElement.scrollIntoView(listElement.scrollTop > currentHintElement.offsetTop);
                }
                return currentHintElement;
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = currentHintElement.previousElementSibling;
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.previousElementSibling;
                }
                if (!currentHintElement) {
                    currentHintElement = listElement.children[listElement.children.length - 1];
                    while (currentHintElement &&
                    (currentHintElement.classList.contains("fn__none") || !currentHintElement.classList.contains(className))) {
                        currentHintElement = currentHintElement.previousElementSibling;
                    }
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                const overTop = listElement.scrollTop > currentHintElement.offsetTop - (currentHintElement.previousElementSibling?.clientHeight || 0);
                if (listElement.scrollTop < currentHintElement.offsetTop - listElement.clientHeight + currentHintElement.clientHeight || overTop) {
                    currentHintElement.scrollIntoView(overTop);
                }
                return currentHintElement;
            } else if (event.key === "Home") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = listElement.children[0];
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.nextElementSibling;
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                currentHintElement.scrollIntoView();
                return currentHintElement;
            } else if (event.key === "End") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = listElement.children[listElement.children.length - 1];
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.previousElementSibling;
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                currentHintElement.scrollIntoView(false);
                return currentHintElement;
            }
        }
    }
})();