// 右下角显示新年快乐
// 不仅适用于思源、obsidian等，还适用于网页
// version: 0.0.2
// 可拖动，双击可还原右下角位置，右键关闭（关闭后再次刷新还会出现，如需永久关闭，关闭代码片段即可）
// 0.0.2 增加播放问候
(() => {
    // 是否播放问候音频
    const playGreeting = true;
    // 样式
    const css = `
        .happy-new-year {
            position: fixed;
            bottom: 7px; /* 距离底部的距离 */
            right: 48px; /* 距离右边的距离 */
            z-index: ${++siyuan.zIndex||9999}; /* 确保在其他内容之上 */
            white-space: nowrap;
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

    // 绑定mouseover事件
    const firstImg = document.querySelector('.happy-new-year img:nth-child(1)');
    const secondImg = document.querySelector('.happy-new-year img:nth-child(2)');
    let isActives = [];
    if(playGreeting) {
        firstImg.addEventListener('mouseover', (event) => {
            if(isActives[1]) playGreeting1();
        });
        secondImg.addEventListener('mouseover', (event) => {
            if(isActives[2]) playGreeting2();
        });
        firstImg.addEventListener('mousedown', (event) => {
            if(!isActives[1]){
                isActives[1] = true;
                playGreeting1();
            }
        });
        secondImg.addEventListener('mousedown', (event) => {
            if(!isActives[2]) {
                isActives[2] = true;
                playGreeting2();
            }
        });
    }

    function playGreeting1() {
        playAudio(1, 'http://ys-n.ysepan.com/wap/wilson/F952jd3Mga58D6jH7C/Hjg6b2Axf6a8EmBgu5EQJkjf6n18l/zr-xnh.ogg');
    }

    function playGreeting2() {
        playAudio(2, 'http://ys-n.ysepan.com/wap/wilson/F952jd3Mga58D6jH7C/Ijg6b2Axf6a7dBnHhzePKLhe84,9jh/zr-xnkl.ogg');
    }

    // 播放音频
    let audios = [];
    function playAudio(index, src) {
        let audio = audios[index];
        if(!audio) {
            audio = new Audio();
            audio.src = src;
            // 监听音频准备完毕
            const canplayhandler = () => {
                doPlay(audio);
                audio.removeEventListener('canplay', canplayhandler);
            };
            audio.addEventListener('canplay', canplayhandler);
            audio.load();
            audios[index] = audio;
        } else {
            doPlay(audio);
        }
    }
    function doPlay(audio) {
        if(!audio) return;
        pauseOtherAudio();
        try {
            audio.currentTime = 0;
            audio.play();
        } catch (error) {
            console.error('音频播放失败:', error);
        }
    }
    function pauseOtherAudio() {
        audios.forEach((audio) => {
            if(!audio) return;
            audio.pause();
        });
    }

    // 可拖动
    moveableDialog(happyNewYear, [firstImg, secondImg]);
    function moveableDialog(dialog, dragEls) {
        let isDragging = false;
        let offsetX, offsetY;
        let dialogRect = happyNewYear.getBoundingClientRect();
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
                    if(!isNaN(parseFloat(dialog.style.left)) && !isNaN(parseFloat(dialog.style.top))){
                        dialog.style.right = 'auto';
                        dialog.style.bottom = 'auto';
                    }
                }, 100);
            } else if (e.type === 'mousemove' && isDragging) {
                let x = e.clientX - offsetX;
                let y = e.clientY - offsetY;
                //限制不超过窗口大小
                if(x < 0) x = 0;
                if(y < 0) y = 0;
                if(x > window.innerWidth - dialogRect.width) x = window.innerWidth - dialogRect.width;
                if(y > window.innerHeight - dialogRect.height -60) y = window.innerHeight - dialogRect.height -60;
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
        // 改变窗口大小事件
        window.addEventListener("resize", (event)=>{
            if (!isNaN(parseFloat(dialog.style.left)) && !isNaN(parseFloat(dialog.style.top))) {
                if(parseFloat(dialog.style.left) > window.innerWidth) {
                    dialog.style.left = (window.innerWidth - dialogRect.width) + 'px';
                }
                if(parseFloat(dialog.style.top) > window.innerHeight) {
                    dialog.style.top = (window.innerHeight - dialogRect.height - 60) + 'px';
                }
            }
        });
    }
})();