// 右下角显示新年快乐
// 不仅适用于思源、obsidian等，还适用于网页
// version: 0.0.3
// 功能介绍
// 1. 可拖动
// 2. 双击可还原到右下角位置
// 3. 右键关闭（关闭后再次刷新还会出现，如需永久关闭，关闭代码片段即可）
// 4. 鼠标悬停问候（需要先点击或拖动下）
// 5. 上移下移语音交互
// 6. ctrl/meta + 单击暂停问候和语音交互
// 0.0.2 增加鼠标悬停问候
// 0.0.3 上移下移双击语音交互和ctrl/meta + 单击暂停问候和语音交互
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
        <img src="https://b3logfile.com/file/2024/12/sn-Dezgf9B.gif" /><img src="https://b3logfile.com/file/2024/12/happynewyear-yFPd7ZP.gif" />
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

            // 播放语音
            if(!playGreeting || !allowPlayAudio) return;
            pauseOtherAudio();
            if(Math.random() < 0.5) {
                oncePlay('https://b3logfile.com/file/2024/12/zhuren-zaipeiwowanyihuibei-ljBcxEK.mp3');
            } else {
                oncePlay('https://b3logfile.com/file/2024/12/zhuren-zaipeiwowanyihuibei2-ybgk4bd.mp3');
            }
        }, 50);
    });

    // 绑定右键事件
    happyNewYear.addEventListener('contextmenu', (event) => {
        event.stopPropagation();
        happyNewYear.style.display = 'none';
    });

    // ctrl + 单击
    let allowPlayAudio = true;
    happyNewYear.addEventListener('click', (event) => {
        // 判断是否是左键单击
        const ctrlKey = isMac() ? event.metaKey : event.ctrlKey;
        const ctrlKey2 = isMac() ? event.ctrlKey : event.metaKey;
        if (event.button !== 0 || !ctrlKey) return;
        if(event.shiftKey || event.altKey || ctrlKey2) return;
        allowPlayAudio = !allowPlayAudio;
    });

    // 绑定mouseover事件
    const firstImg = document.querySelector('.happy-new-year img:nth-child(1)');
    const secondImg = document.querySelector('.happy-new-year img:nth-child(2)');
    let isActives = [];
    if(playGreeting) {
        firstImg.addEventListener('mouseover', async (event) => {
            if(isActives[1]) playGreeting1();
        });
        secondImg.addEventListener('mouseover', async (event) => {
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
        const index = Math.random() < 0.5 ? 1 : 3;
        if(index === 1) {
            playAudio(1, 'https://b3logfile.com/file/2024/12/zr-xnh-52P4xfQ.mp3');
        } else {
            playAudio(3, 'https://b3logfile.com/file/2024/12/zhuren-nihaohuaiya-laomorenjia2-6Okbh4s.mp3');
        }
    }

    function playGreeting2() {
        const index = Math.random() < 0.5 ? 2 : 4;
        if(index === 2) {
            playAudio(2, 'https://b3logfile.com/file/2024/12/zr-xnkl-yEVrFO3.mp3');
        } else {
            playAudio(4, 'https://b3logfile.com/file/2024/12/zhuren-xinnianyoushenmeyuanwangma-vlB2BV2.mp3');
        }
    }

    // 播放音频
    let audios = [], audioSrc = '';
    function playAudio(index, src) {
        if(!playGreeting || !allowPlayAudio) return;
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
    async function doPlay(audio) {
        if(!audio) return;
        pauseOtherAudio();
        audio.currentTime = 0;
        audioSrc = audio.src;
        // 防止同时触发导致的串音
        await sleep(300);
        if(audioSrc !== audio.src) return;
        audio.play().catch((error) => {
            //console.error('音频播放失败:', error);
        });
    }
    function pauseOtherAudio() {
        audioSrc = '';
        audios.forEach((audio) => {
            if(!audio) return;
            audio.pause();
        });
        if(onceAudio) onceAudio.pause();
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    // 延迟执行
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let onceAudio;
    function oncePlay(src) {
        if(!src) return;
        const audio = new Audio(src);
        onceAudio = audio;
        audio.addEventListener('canplaythrough', async () => {
            // 资源加载完成，可以播放
            audioSrc = audio.src;
            // 防止同时触发导致的串音
            await sleep(300);
            if(audioSrc !== audio.src) return;
            audio.play();
        });
        // audio.addEventListener('error', (event) => {
        //     console.error('音频加载失败', event);
        // });
    }

    let flied = false, lastTop = 0;
    function onStopDrag(dialog, event) {
        if(!playGreeting || !allowPlayAudio) return;
        const top = parseFloat(dialog.style.top);
        let sounds = [];
        if(top < lastTop){
            flied = true;
            // 当向上拖动
            sounds = [
                'https://b3logfile.com/file/2024/12/wawo-wofeiqilaile2-D5ZB9Me.mp3',
                'https://b3logfile.com/file/2024/12/wawo-wofeiqilaile-wbDGqM9.mp3',
            ];
        } else if(top > lastTop && !flied) {
            // 当向下拖动且没有向上拖动过
            sounds = ['https://b3logfile.com/file/2024/12/zhuren-woyaofeigaogao-xKnbREs.mp3'];
        } else if(top > lastTop) {
            // 当向下拖动
            sounds = [
                'https://b3logfile.com/file/2024/12/zhuren-woyaofeigaogao-xKnbREs.mp3',
                'https://b3logfile.com/file/2024/12/no-zhuren-woyaofei-ziMmpbE.mp3',
                'https://b3logfile.com/file/2024/12/zhurenwohaiyaofei-r8UUfW1.mp3',
            ];
        }
        // 随机选择一个值
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        if(randomSound) {
            pauseOtherAudio();
            oncePlay(randomSound);
        }
        lastTop = top;
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
                pauseOtherAudio();
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
                onStopDrag(dialog, e);
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