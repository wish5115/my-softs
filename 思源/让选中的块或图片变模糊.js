// Ctrl/Meta + Alt + B 让选中的块或图片变模糊
// 单选只需要点击下图片或块标即可
(()=>{
    // 模糊样式
    const filter = 'blur(6px)';
    // 模糊期间块是否可编辑，默认禁止编辑，如果设为true，块编辑后会导致模糊效果被保存，如果你刚好需要这种效果，可以把这个值设为true
    const editableOnBlur = false;
    document.addEventListener('keydown', (event) => {
        // 检查是否按下了 Ctrl/Meta + Alt + B
        if ((event.ctrlKey || event.metaKey) && event.altKey && event.code === 'KeyB' && !event.shiftKey) {
            // 遍历目标元素
            const targetElements = document.querySelectorAll('.protyle-wysiwyg--select, .img--select img');
            const isBlurred = !!document.querySelector(`.protyle-wysiwyg--select[style*="${filter}"], .img--select img[style*="${filter}"]`);
            targetElements.forEach((element) => {
                if (isBlurred) {
                    // 如果已经应用了 blur 样式，则移除
                    element.style.filter = '';
                    // 恢复编辑状态
                    if(!editableOnBlur) {
                        const contenteditableEl = element.querySelector('[contenteditable][data-blurred="true"]')||element.closest('[contenteditable][data-blurred="true"]');
                        if(contenteditableEl) {
                            contenteditableEl.setAttribute('contenteditable', true);
                            delete contenteditableEl.dataset.blurred;
                        }
                    }
                } else {
                    // 如果没有应用 blur 样式，则添加
                    element.style.filter = filter;
                    // 禁止编辑
                    if(!editableOnBlur) {
                        const contenteditableEl = element.querySelector('[contenteditable="true"]')||element.closest('[contenteditable="true"]');
                        if(contenteditableEl) {
                            contenteditableEl.setAttribute('contenteditable', false);
                            contenteditableEl.dataset.blurred = true;
                        }
                    }
                }
            });
        }
    });
})();