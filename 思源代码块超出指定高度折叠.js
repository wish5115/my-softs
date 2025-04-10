// see https://ld246.com/article/1727621671852
(()=>{
    // 当代码块内容高度超出多少像素是折叠，注意：这里的高度是指.hljs元素的高度，默认是300px
    const codeMaxHeight = 300;

    // 展开元素样式，可在这里修改
    addStyle(`
        .code-block .code-down {
            width: 100%;
            text-align: center;
            position: absolute;
            bottom: 0px;
            left: 0;
            padding: 70px 0px 10px;
        }
        .code-block .code-down-btn {
            padding: 3px 14px 1px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            cursor: pointer;
        }
        .code-block .code-down-arrow{
            width: 13px;
            height: 13px;
        }
        [data-theme-mode="light"] {
            .code-block .code-down {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
            }
            .code-block .code-down-btn {
                background-color: rgba(255, 255, 255, 0.6);
            }
        }
        [data-theme-mode="dark"] {
            .code-block .code-down {
                background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5) 70%, rgba(255, 255, 255, 1));
            }
            .code-block .code-down-btn {
                background-color: rgba(0, 0, 0, 0.5);
            }
        }
        /* 代码块限制最大高度 CSS片段 */
        div:not(#preview) > .protyle-wysiwyg .code-block .hljs {
            max-height: ${codeMaxHeight || 300}px;
        }
    `);
    whenElementExist(isMobile()?'body':'.layout__center').then(async el => {
		// 监听代码块内容被提交
        //listenCodeUpdate();
        // 加载时执行
		let protyle;
		await whenElementExist(() => {
			protyle = el.querySelector('.protyle');
			return protyle && protyle?.dataset?.loading === 'finished';
		});
		addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.code-down))'));

		//滚动时执行
		protyle.querySelector(".protyle-content").addEventListener('scroll', () => {
			addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.code-down))'));
		});

		// 监听protyle加载事件
        observeProtyleAddition(el, protyles => {
            protyles.forEach(async protyle => {
				if(!protyle.classList.contains('protyle')) {
					protyle = protyle.closest('.protyle');
				}
				// 加载时执行
				addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.code-down))'));
				// 滚动时执行
				protyle.querySelector(".protyle-content").addEventListener('scroll', () => {
					addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.code-down))'));
				});
            });
        });
    });

	let runing = false;
	function addCodeExtends(codeBlocks) {
		if(codeBlocks.length === 0) return;
		if(runing) return; 
		runing = true;
		setTimeout(() => {runing = false;}, 300);
		codeBlocks.forEach(async codeBlock => {
			if(isCursorInCodeBlock(codeBlock)) {
				codeBlock.querySelector('.hljs').style.maxHeight = '100%';
				return;
			}
            if(codeBlock.querySelector('.code-down')) return;
			const hljs = await whenElementExist(() => codeBlock.querySelector('.hljs'));
			if(hljs && hljs.scrollHeight > codeMaxHeight) {
				const expand = document.createElement('div');
                //see https://github.com/88250/lute/issues/206
				expand.className = 'code-down protyle-custom';
				//expand.contentEditable = false;
				expand.innerHTML = `<span class="code-down-btn"><svg class="code-down-arrow"><use xlink:href="#iconDown"></use></svg></span>`;
				codeBlock.appendChild(expand);
                expand.closest('.code-block').querySelector('.hljs').style.maxHeight = codeMaxHeight+'px';
				expand.querySelector('.code-down-btn').onclick = () => {
					expand.style.display = 'none';
					expand.closest('.code-block').querySelector('.hljs').style.maxHeight = '100%';
				};
			}
		});
	}

    // 临时解决方案，主要解决用户自定义的dom被更新时变为html代码
    // 不过最新方案，通过添加protyle-custom类可忽略用户自定义dom，该方案已不需要了
    let isFetchOverridden = false; // 标志变量，用于判断 fetch 是否已经被覆盖
	async function listenCodeUpdate() {
        if (!isFetchOverridden) {
            const originalFetch = window.fetch;
            window.fetch = async function (url, ...args) {
                try {
                    if (url.endsWith('/api/transactions')) {
						if(args.length > 0) {
                            for(let i in args){
                                if(args[i].body.indexOf(`<div class=\\"code-down\\"`) !== -1) {
                                    let body = JSON.parse(args[i].body);
                                    if(!body.transactions) continue;
                                    for(let j in body.transactions){
                                        if(!body.transactions[j] || !body.transactions[j].doOperations) continue;
                                        for(let k in body.transactions[j].doOperations){
                                            if(!body.transactions[j].doOperations[k] || !body.transactions[j].doOperations[k].data) continue;
                                            body.transactions[j].doOperations[k].data = body.transactions[j].doOperations[k].data.replace(/&lt;div class="code-down".*?&lt;\/div&gt;\n?/ig, '');
                                            body.transactions[j].doOperations[k].data = body.transactions[j].doOperations[k].data.replace(/<div class="code-down"[^>]*?>.*?<\/div>\n?/ig, '');
                                        }
                                    }
                                    body = JSON.stringify(body);
									args[i].body = body;
                                }
                            }
						}
                    }
					const response = await originalFetch(url, ...args);
                    return response;
                } catch (error) {
                    throw error;
                }
            };
            isFetchOverridden = true; // 设置标志变量，表示 fetch 已经被覆盖
        }
	}

    function addStyle(cssRules) {
        // 创建一个新的style元素
        const styleElement = document.createElement('style');
    
        // 将CSS规则添加到style元素中
        styleElement.innerHTML = cssRules;
    
        // 将style元素插入到文档的head中
        document.head.appendChild(styleElement);
    }
    
    function observeProtyleAddition(el, callback) {
        const config = { attributes: false, childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // 查找新增加的 NodeCodeBlock 元素
                    const protyles = Array.from(mutation.addedNodes).filter(node =>
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node.classList.contains('protyle') || node.classList.contains('protyle-content'))
                    );
    
                    // 如果找到了这样的元素，则调用回调函数
                    if (protyles.length > 0) {
                        callback(protyles);
                    }
                }
            });
        });
    
        // 开始观察 body 下的所有变化
        observer.observe(el, config);
    
        // 当不再需要观察时可调用断开来停止观察
        return () => {
            observer.disconnect();
        };
    }

	function isCursorInCodeBlock(codeBlock) {
		if(!codeBlock) return false;
		let cursorEl = getCursorElement();
		if(!cursorEl) return false;
		cursorEl = cursorEl.closest('.code-block');
		if(!cursorEl) return false;
		return cursorEl === codeBlock;
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

    function isMobile() {
        return !!document.getElementById("sidebar");
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