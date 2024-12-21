// 右下角显示新年快乐
// 不仅适用于思源、obsidian等，还适用于网页
// version: 0.0.1
// 可拖动，双击可还原右下角位置，右键关闭（关闭后再次刷新还会出现，如需永久关闭，关闭代码片段即可）
(() => {
    // 样式
    const css = `
        .happy-new-year {
            position: fixed;
            bottom: 7px; /* 距离底部的距离 */
            right: 48px; /* 距离右边的距离 */
            z-index: ${++siyuan.zIndex||9999}; /* 确保在其他内容之上 */
        }
        .happy-new-year img:nth-child(1) {
            width: 50px;
        }
        .happy-new-year img:nth-child(2) {
            width: 100px;
            margin-left: -15px;
        }
    `;

    // div内容
    const html = `
        <img src="https://disk.ningsuan.com.cn/index.php?explorer/share/file&hash=0c29RiQxhbSpm_wO0wuzuBrj8sjXPeuE2rgaj8GHgYB5T7Z3sFCwLoSNM4tUoufynLvF7ykWXQ&name=/sn.gif" /><img src="https://disk.ningsuan.com.cn/index.php?explorer/share/file&hash=9f63LxWIw8GhmIoZ_IDdm2QdgeQ2eYEZA8hlMk8bgoVHNE-3Get_s3d7x9Wkvm6cTZyn3OzTkQ&name=/happynewyear.gif" />
    `;

    // 创建一个 <style> 元素
    const styleElement = document.createElement('style');
    // 设置样式内容
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(css));
    // 将 <style> 元素添加到 <head> 中
    document.head.appendChild(styleElement);
    
    // js添加div
    const happyNewYear = document.createElement('div');
    happyNewYear.className = 'happy-new-year';
    happyNewYear.innerHTML = html;
    document.body.appendChild(happyNewYear);

    // 绑定双击事件
    happyNewYear.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        setTimeout(()=> {
            happyNewYear.style.right = '48px';
            happyNewYear.style.bottom = '7px';
            happyNewYear.style.left = 'auto';
            happyNewYear.style.top = 'auto';
        }, 50);
    });

    // 绑定右键事件
    happyNewYear.addEventListener('contextmenu', (event) => {
        event.stopPropagation();
        happyNewYear.style.display = 'none';
    });

    // 可拖动
    const firstImg = document.querySelector('.happy-new-year img:nth-child(1)');
    const secondImg = document.querySelector('.happy-new-year img:nth-child(2)');
    moveableDialog(happyNewYear, [firstImg, secondImg]);
    function moveableDialog(dialog, dragEls) {
        let isDragging = false;
        let offsetX, offsetY;
        const dragHandler = (e) => {
            if (e.type === 'mousedown') {
                isDragging = true;
                document.removeEventListener('mousemove', dragHandler);
                document.removeEventListener('mouseup', dragHandler);
                document.addEventListener('mousemove', dragHandler);
                document.addEventListener('mouseup', dragHandler);
                offsetX = e.clientX - dialog.offsetLeft;
                offsetY = e.clientY - dialog.offsetTop;
                setTimeout(() => {
                    dialog.style.right = 'auto';
                    dialog.style.bottom = 'auto';
                }, 100);
            } else if (e.type === 'mousemove' && isDragging) {
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                dialog.style.left = x + 'px';
                dialog.style.top = y + 'px';
            } else if (e.type === 'mouseup') {
                isDragging = false;
                document.removeEventListener('mousemove', dragHandler);
                document.removeEventListener('mouseup', dragHandler);
            }
            e.preventDefault();
        };
        dragEls.forEach(dragEl => {
            dragEl.removeEventListener('mousedown', dragHandler);
            dragEl.addEventListener('mousedown', dragHandler);
        });
    }
})();