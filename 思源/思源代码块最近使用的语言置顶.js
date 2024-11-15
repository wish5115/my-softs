// 功能：代码块最近使用的语言置顶
(async ()=>{
    // 配置默认的代码语言，注意如果设置了这个参数，则会覆盖上一次使用的语言。始终默认用这个语言，为空不设置
    const defaultCodeLang = "";

    // 配置最近代码语言最大显示个数
    const recentlyCodeLangLength = 10;

    // 配置置顶的代码语言，这个配置里的语言始终置顶，比如 ["js", "java", "php"]
    let topCodeLang = [];

    // 配置持久化文件的存储路径
    const storagePath = "/data/storage/recently_code_lang.json";

    /////////////////// 以下数据不涉及配置项，如无必要请勿修改 /////////////////////////////

    // 获取最近使用的语言
    let recentlyCodeLang = await getFile(storagePath);
    // 置顶语言倒序
    topCodeLang.reverse();
    // 布局完成时执行
    let codeTimer = null;
    whenElementExist(".layout__center").then((element)=>{
        const layoutCenter = element;
        const observer = observeDomChange(layoutCenter, (mutation) => {
            // 监听弹窗代码列表
            if(mutation.target.classList.contains("protyle-util")) {
                const codeList = mutation.target.querySelector(".b3-list--background");
                if(codeList){
                    const firstChild = codeList.firstElementChild;
                    sortLangList([...recentlyCodeLang, ...topCodeLang], codeList, firstChild);
                    // console.log(codeList, 'codeList');
                }
            }
            // 监听代码被选择
            if(mutation.target.classList.contains("code-block") || mutation.target.classList.contains("hljs")) {
                if(codeTimer) clearTimeout(codeTimer);
                codeTimer = setTimeout(() => {
                    const codeBlock = mutation.target.closest(".code-block");
                    const langText = codeBlock?.querySelector(".protyle-action__language")?.textContent;
                    // 添加语言
                    addLanguage(langText);
                    // 设置默认语言
                    setDefaultLang();
                    // console.log(mutation.target.querySelector(".protyle-action__language")?.textContent, 'selected');
                }, 40);
            }
        });
        // 为了体验一致性，第一次使用时加载一次上次使用的语言
        addLanguage(getLastLang());
        // 设置默认语言
        setDefaultLang();
        // 调试时使用
        // window.obsv=observer
    });

    // 排序语言，主要把置顶的语言移动上去
    function sortLangList(topCodeLang, listContainer, clearItem) {
        topCodeLang.forEach(lang => {
            // 查找对应的.b3-list-item元素
            const item = Array.from(listContainer.querySelectorAll('.b3-list-item')).find(item => item.textContent.trim() === lang);
            if (item) {
                // 将找到的元素移动到 "清空" 元素之后
                listContainer.insertBefore(item, clearItem.nextSibling);
            } else {
                // 如果不存在则创建一个新的元素
                const newElement = document.createElement('div');
                newElement.className = 'b3-list-item';
                newElement.textContent = lang;
                listContainer.insertBefore(newElement, clearItem.nextSibling);
            }
        });
        // 移动焦点到第一个子元素
        listContainer.querySelector(".b3-list-item--focus").classList.remove("b3-list-item--focus");
        listContainer.children[1].classList.add("b3-list-item--focus");
    }

    // 添加语言，长度始终保持在recentlyCodeLangLength之内
    async function addLanguage(language) {
        if(!language) return;

        // 传入的language参数仅供参考，真正获取最后一次使用的语言得从思源存储中或数据库查询中获取，
        // 这样可以防止块元素被意外触发，添加非最后一次使用的语言，导致混乱
        // 这样无论哪个代码块被触发都以getLastLang为准
        language = getLastLang();

        if(!language) return;

        // 如果最后一个元素已经是上次使用的语言，则不再重复添加
        if(recentlyCodeLang[recentlyCodeLang.length-1] === language) {
            return;
        }

        // 检查数组中是否已经有相同的元素
        const index = recentlyCodeLang.indexOf(language);
        if (index !== -1) {
            // 如果存在，则移除这个元素
            recentlyCodeLang.splice(index, 1);
        }

        // 添加新语言到数组
        recentlyCodeLang.push(language);

        // 检查数组长度，如果超过最大长度，则删除最前面的元素
        while (recentlyCodeLang.length > recentlyCodeLangLength) {
            recentlyCodeLang.shift(); // 删除数组的第一个元素
        }

        // 存储数据
        putFile(storagePath, recentlyCodeLang);
    }

    // 设置设置默认语言
    function setDefaultLang() {
        if(defaultCodeLang) window.siyuan.storage["local-codelang"] = defaultCodeLang;
    }

    // 获取上次使用的语言
    function getLastLang() {
        // 从思源存储获取
        return window.siyuan.storage["local-codelang"];
        // 从数据库获取，暂未用到
        // return await getLastLangFromDb();
    }

    // 从数据库获取最近使用的语言，暂未用到
    async function getLastLangFromDb() {
        const sql = `SELECT markdown FROM blocks WHERE type = 'c'  ORDER  by updated DESC limit 1`;
        const result = await fetchSyncPost('/api/query/sql', {"stmt": sql});
        if(result.data[0]?.markdown){
            return result.data[0].markdown.split("\n")[0].replace('```', '');
        }
        return "";
    }

    // 获取最近使用的语言持久数据
    async function getFile(storagePath) {
        if(!storagePath) return [];
        const data = await fetchSyncPost('/api/file/getFile', {"path":`${storagePath}`});
        if(data.code && data.code !== 0) return [];
        return data;
    }

    // 存入数据到文件
    function putFile(storagePath, data) {
        const formData = new FormData();
        formData.append("path", storagePath);
        formData.append("file", new Blob([JSON.stringify(data)]));
        return fetch("/api/file/putFile", {
            method: "POST",
            body: formData,
        }).then((response) => {
            if (response.ok) {
                //console.log("File saved successfully");
            }
            else {
                throw new Error("Failed to save file");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    // 请求api
    async function fetchSyncPost (url, data) {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = await res.json();
            return res2;
        } catch(e) {
            console.log(e)
            return [];
        }
    }

    // 监控dom变化
    function observeDomChange(targetNode, callback) {
        const config = { childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    callback(mutation);
                }
            }
        });
        observer.observe(targetNode, config);
        // 返回observer，用于停止观察
        // observer.disconnect();
        return observer;
    }

    // 等待元素渲染完成后执行
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let element = null;
                if (typeof selector === 'function') {
                    element = selector();
                } else {
                    element = document.querySelector(selector);
                }
                if (element) {
                    resolve(element);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }
})();