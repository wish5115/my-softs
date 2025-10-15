// 思源剑桥查词
// see https://ld246.com/article/1760544378300
// 查词内容解析自 https://dictionary.cambridge.org
// 核心代码改自 https://github.com/yaobinbin333/bob-plugin-cambridge-dictionary/blob/cbdab3becad9b3b33165ff99dff4bab44ed54e17/src/entry.ts#L17
(() => {
  if(!!document.getElementById("sidebar")) return; // 不支持手机版
  const html = `
      <style>
        .cambridge-popup {
          position: fixed;
          top: 100px;
          left: 300px;
          width: 420px;
          max-height: 500px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          z-index: 9999;
          overflow: hidden;
          /* display: flex;*/
          display: none;
          flex-direction: column;
          color: #413732;
        }
    
        /* 标题栏（可拖动区域） */
        .cambridge-popup .popup-header {
          padding: 8px 15px 8px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
          cursor: move;
          user-select: none;
          position: relative;
        }
    
        .cambridge-popup .popup-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }
    
        /* 关闭按钮 */
        .cambridge-popup .close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #e9ecef;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 20px;
          opacity: 0.7;
        }
    
        .cambridge-popup .close-btn:hover {
          background: #dee2e6;
          opacity: 1;
        }
    
        /* 内容区（不可拖动） */
        .cambridge-popup .popup-body {
          padding: 15px;
          overflow-y: auto;
          flex: 1;
          max-height: 480px;
        }
    
        .cambridge-popup .word {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
    
        .cambridge-popup .phonetics {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 14px;
        }
    
        .cambridge-popup .phonetic-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
    
        .cambridge-popup .audio-btn {
          background: none;
          border: none;
          color: #007AFF;
          cursor: pointer;
          font-size: 14px;
          padding: 0px 2px;
        }
    
        .cambridge-popup .audio-btn .audio-icon {
          vertical-align: middle;
          cursor: pointer;
          border: none;
          fill: none;
          stroke: #555;
        }
        .cambridge-popup .audio-btn .audio-icon:hover{
          stroke: #000;
        }
    
        .cambridge-popup .part-item {
          margin: 8px 0;
          padding: 6px 0;
          border-left: 3px solid #007BFF;
          padding-left: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
    
        .cambridge-popup .detail-section {
          margin-top: 16px;
        }
    
        .cambridge-popup .detail-title {
          font-weight: bold;
          color: #545454;
          margin: 12px 0 6px 0;
        }
    
        .cambridge-popup .example {
          margin: 10px 0;
          padding: 8px;
          background: #f1f8ff;
          border-radius: 4px;
          font-size: 14px;
        }
    
        .cambridge-popup .example-en {
          font-style: italic;
          margin-bottom: 4px;
        }
    
        .cambridge-popup .example-zh {
          color: #444;
        }
    
        /* 底部来源说明 */
        .cambridge-popup .footer {
          padding: 5px 15px;
          border-top: 1px solid #eee;
          background: #fafafa;
          color: #888;
          line-height: 20px;
        }
    
        .cambridge-popup .footer a {
          font-size: 14px;
          color: #666;
        }
    
        .cambridge-popup .footer .copyright {
          font-size: 12px;
          float: right;
          cursor: pointer;
        }
        .cambridge-popup .footer .copyright:hover{
          text-decoration: underline;
        }
        .cambridge-popup .cb-level {
            font-weight: bold;
        }
        .cambridge-popup .cambridge-ad{
          cursor: pointer;
        }
        .cambridge-popup .cambridge-ad div {
          margin: 12px 0;
          padding: 10px;
          background: #fff8e1;
          border: 1px solid #ffd54f;
          border-radius: 6px;
          font-size: 13px;
          text-align: center;
          color: #5d4037;
          opacity: 0.85;
        }
        .cambridge-popup .cambridge-ad a {
          display: inline-block;
          margin-top: 6px;
          color: #d32f2f;
          font-weight: bold;
          text-decoration: none;
        }

        .cambridge-popup .close-btn::before {
          content: "×";
          transform: translateY(-1.6px);
          display: block;
        }

        /*************************** 这里添加黑色主题样式 *************************/
        .cambridge-popup.cb-dark {
          background: #1e1e1e;
          border-color: #444;
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .popup-header {
          background: #2d2d2d;
          border-bottom-color: #444;
        }

        .cambridge-popup.cb-dark .popup-title {
          color: #f0f0f0;
        }

        .cambridge-popup.cb-dark .close-btn {
          background: #3c3c3c;
          color: #aaa;
        }

        .cambridge-popup.cb-dark .close-btn:hover {
          background: #555;
          color: #fff;
        }

        .cambridge-popup.cb-dark .popup-body {
          background: #1e1e1e;
        }

        .cambridge-popup.cb-dark .word {
          color: #ffffff;
        }

        .cambridge-popup.cb-dark .phonetic-item {
          color: #cccccc;
        }

        .cambridge-popup.cb-dark .audio-btn {
          color: #4da6ff;
        }

        .cambridge-popup.cb-dark .audio-icon {
          stroke: #cccccc;
        }

        .cambridge-popup.cb-dark .part-item {
          background: #262626;
          border-left-color: #007BFF;
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .detail-title {
          color: #eaeaea;
        }

        .cambridge-popup.cb-dark .example {
          background: #252526;
        }

        .cambridge-popup.cb-dark .example-en {
          color: #d4d4d4;
        }

        .cambridge-popup.cb-dark .example-zh {
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .footer {
          background: #252525;
          border-top-color: #444;
          color: #999;
        }

        .cambridge-popup.cb-dark .footer a {
          color: #aaa;
        }

        .cambridge-popup.cb-dark .footer a:hover,
        .cambridge-popup.cb-dark .footer .copyright:hover{
          color: #ddd;
        }

        .cambridge-popup.cb-dark .cb-level {
          color: #ffd700;
        }

        .cambridge-popup.cb-dark .audio-btn .audio-icon:hover{
          stroke: #fff;
        }

        .cambridge-popup.cb-dark .cambridge-ad div {
          background: #332d22;
          border-color: #b58c00;
          color: #ffe082;
        }

        .cambridge-popup.cb-dark .cambridge-ad a {
          color: #ffcc80 !important;
        }
      </style>
      <div id="cambridgePopup" class="cambridge-popup">
        <div class="popup-header" id="dragHandle">
          <h2 class="popup-title"><img style="vertical-align:middle;" src="https://dictionary.cambridge.org/zhs/external/images/favicon.ico?version=6.0.57" /> 剑桥词典</h2>
          <button class="close-btn"></button>
        </div>
        <div class="popup-body">
          <!-- 数据占位 -->
          <div class="word">Loading</div>
          <div class="phonetics">
            <div class="phonetic-item">
              <span>英</span>
              <span>[Loading]</span>
              <button class="audio-btn">
                <svg class="audio-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                  <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>
            <div class="phonetic-item">
              <span>美</span>
              <span>[Loading]</span>
              <button class="audio-btn">
                <svg class="audio-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                  <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>
          </div>
    
          <div class="part-item">Loading</div>
    
          <div class="detail-section">
            <div class="detail-title">英文释义</div>
            <div>Loading</div>
            <div class="detail-title">中文释义</div>
            <div>Loading</div>
            <div class="example">
              <div class="example-en">Loading</div>
              <div class="example-zh">Loading</div>
            </div>
          </div>
        </div>
        <div class="footer">
          <a class="cb-more" target="_blank"
            href="https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%E7%AE%80%E4%BD%93/">更多释义</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a class="cb-ai" target="_blank"
            href="https://chat.baidu.com/search?word=">问AI</a>
          <span class="copyright">打赏作者</span>
        </div>
      </div>
    `;
  document.body.insertAdjacentHTML('beforeend', html);
  const placeHoder = document.querySelector('#cambridgePopup .popup-body').outerHTML;

  const baseUrl = 'https://dictionary.cambridge.org';
  const showAd = true;

  document.addEventListener('selectionchange', (event) => {
    const selection = window.getSelection().toString().trim();
    if (!selection) return;
    const protyle = event.target.activeElement?.closest('.protyle');
    if (!protyle) return;
    const toolbar = protyle.querySelector('.protyle-toolbar');
    if (!toolbar) return;
    let assistantSelectBtn = toolbar.querySelector('button[data-type="cambridgePopup"]');
    if (assistantSelectBtn) return;
    // 创建按钮
    const button = `<button class="protyle-toolbar__item b3-tooltips b3-tooltips__ne" style="font-size:14px;" data-type="cambridgePopup" aria-label="剑桥词典"><img style="vertical-align:middle;" src="https://dictionary.cambridge.org/zhs/external/images/favicon.ico?version=6.0.57" /></button>`;
    toolbar.insertAdjacentHTML('afterbegin', button);
    assistantSelectBtn = toolbar.querySelector('button[data-type="cambridgePopup"]');
    const clickHandler = (event) => {
      event.stopPropagation();
      toolbar.classList.add("fn__none");
      if(window.siyuan.config.appearance.mode === 1) {
        // 黑色主题
        popup.classList.add('cb-dark');
      } else {
        // 亮色主题
        popup.classList.remove('cb-dark');
      }
      popup.style.display = 'flex';
      //assistantSelectBtn.removeEventListener('click', clickHandler);
      // 开始查词
      const selection = window.getSelection().toString().trim();
      translate({ text: selection, detectFrom: "en" }, (result) => {
        if (result.error) {
          popup.querySelector('.popup-body').innerHTML = '<div class="word">未找到结果</div>';
          return;
        }
        const toDict = result.result.toDict;

        // === 动态填充 UI ===
        const body = popup.querySelector('.popup-body');
        body.innerHTML = '';

        // 单词
        const wordEl = document.createElement('div');
        wordEl.className = 'word';
        wordEl.textContent = toDict.word;
        body.appendChild(wordEl);

        // 音标
        const phoneticsEl = document.createElement('div');
        phoneticsEl.className = 'phonetics';
        toDict.phonetics.forEach(p => {
          if (!p.ipa) return;
          const item = document.createElement('div');
          item.className = 'phonetic-item';
          const regionText = p.region === 'us' ? '美' : '英';
          item.innerHTML = `
                        <span>${regionText}</span>
                        <span>[${p.ipa}]</span>
                        <button class="audio-btn" data-audio="${p.audio}">
                          <svg class="audio-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                            <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
                          </svg>
                        </button>
                    `;
          phoneticsEl.appendChild(item);
        });
        body.appendChild(phoneticsEl);

        // 所有翻译（parts）
        toDict.parts.forEach(part => {
          const partEl = document.createElement('div');
          partEl.className = 'part-item';
          partEl.textContent = `${part.part} ${part.means.join('; ')}`;
          body.appendChild(partEl);
        });

        // 随机广告
        if(showAd) {
          const ads = [
            `
              <strong>🎁 七牛AI平台大放送！</strong><br>
              体验立赠送 <b>1300万Token</b>，邀请10人即享 <b>1亿+Token</b>！<br>
              <a data-href="https://s.qiniu.com/FfQvia">👉 点击立即领取 ←</a>
            `,
            `
              推荐免费AI平台：
              <a data-href="https://cloud.siliconflow.cn/i/8kP68u0B">硅基流动</a>
            `,
            `
              推荐国外AI平台：
              <a data-href="https://api.gpt.ge/register?aff=GlNE">V-API</a>&nbsp;
              <span>模型多、稳定快速，价格比官方更划算。</span>
            `
          ];
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          const adEl = document.createElement('div');
          adEl.className = 'cambridge-ad';
          adEl.innerHTML = `<div>${randomAd}</div>`;
          body.appendChild(adEl);
          body.querySelector('.cambridge-ad').addEventListener('click', function() {
            window.open(this.querySelector('a[data-href]')?.dataset?.href);
          });
        }

        // 详细释义（additions）
        const detailSection = document.createElement('div');
        detailSection.className = 'detail-section';
        toDict.additions.forEach(add => {
          const titleEl = document.createElement('div');
          titleEl.className = 'detail-title';
          titleEl.textContent = add.part;
          detailSection.appendChild(titleEl);

          if (add.part.startsWith('例句')) {
            const [en, zh] = add.means[0].split('\n');
            const exampleEl = document.createElement('div');
            exampleEl.className = 'example';
            exampleEl.innerHTML = `
                            <div class="example-en">${en || ''}</div>
                            <div class="example-zh">${zh || ''}</div>
                        `;
            detailSection.appendChild(exampleEl);
          } else {
            const defEl = document.createElement('div');
            defEl.innerHTML = markLevel(add.means[0] || '');
            detailSection.appendChild(defEl);
          }
        });
        body.appendChild(detailSection);

        // 更新底部链接
        const more = popup.querySelector('.footer a.cb-more');
        if (more) {
          const encodedWord = encodeURIComponent(toDict.word);
          more.href = `${baseUrl}/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%E7%AE%80%E4%BD%93/${encodedWord}`;
        }
        const ai = popup.querySelector('.footer a.cb-ai');
        if (ai) {
          const encodedWord = encodeURIComponent(`你是一个查词助手，帮我查询${toDict.word}，并注明音标，发音，常见释义，例句等，如果可能可适当配些插图或视频。`);
          ai.href = `https://chat.baidu.com/search?word=${encodedWord}`;
        }
      });
    };
    assistantSelectBtn.addEventListener('click', clickHandler);
  });

  /**
   *
   * @param {object} query
   * @param {string} query.detectFrom = en; 一定不是 auto
   * @param {string} query.detectTo = "zh-Hans" 一定不是 auto
   * @param {string} query.from = auto 可能是 auto
   * @param {string} query.to = auto 可能是 auto
   * @param {string} query.text = "string"
   * @param {*} completion
   * see https://github.com/yaobinbin333/bob-plugin-cambridge-dictionary/blob/cbdab3becad9b3b33165ff99dff4bab44ed54e17/src/entry.ts#L17
   */
  /* 调用示例
  translate({ text: "example", detectFrom: "en" }, (result) => {
      console.log(result);
  });
  */
  async function translate(query, completion) {
    if (query.detectFrom !== 'en' || !query.text || query.text.split(' ').length > 3) {
      completion({ error: { type: 'notFound' } });
      return;
    }

    const text = query.text.split(' ').join('-');
    const encodedText = encodeURIComponent(text);
    const url = `${baseUrl}/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%E7%AE%80%E4%BD%93/${encodedText}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const htmlText = await response.text();
      main(htmlText, completion);
    } catch (err) {
      console.error(`Fetch error: ${err}`);
      completion({
        error: { type: 'network', message: String(err) }
      });
    }
  }

  function main(htmlText, completion) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const headwordEl = doc.querySelector('.headword');
    const word = getText(headwordEl);
    const hasWord = headwordEl !== null;

    console.log(`word: ${word}`);

    if (!hasWord) {
      completion({ error: { type: 'notFound' } });
      return;
    }

    // 音标和音频
    const usBlock = doc.querySelector('.us');
    const ukBlock = doc.querySelector('.uk');

    const phonetics = [
      makePhonetic(
        usBlock?.querySelector('.pron .ipa'),
        usBlock?.querySelector('[type="audio/mpeg"]'),
        'us'
      ),
      makePhonetic(
        ukBlock?.querySelector('.pron .ipa'),
        ukBlock?.querySelector('[type="audio/mpeg"]'),
        'uk'
      )
    ];

    console.log(`phonetics: ${JSON.stringify(phonetics)}`);

    const parts = [];
    const partMap = new Map();

    const entryEls = qa('.entry-body__el', doc);
    const explanationCnt = entryEls.length;
    console.log(`explanation count: ${explanationCnt}`);

    entryEls.forEach((el) => {
      const curPartSpeech =
        getText(el.querySelector('.posgram')) ||
        getText(el.querySelector('.anc-info-head')) ||
        'unknown';

      qa('.dsense', el).forEach((dsenseEl) => {
        qa('.def-block', dsenseEl).forEach((defBlockEl) => {
          const enExplanation = getText(defBlockEl.querySelector('.ddef_h'));
          const cnExplanation = getText(defBlockEl.querySelector('.ddef_b')?.firstElementChild);

          pushPart(parts, `${curPartSpeech}-英文释义`, enExplanation);
          pushPart(parts, `${curPartSpeech}-中文释义`, cnExplanation);
          if (cnExplanation) {
            addMap(partMap, curPartSpeech, cnExplanation);
          }

          let exampleCnt = 0;
          let shouldPushEg = true;

          qa('.examp', defBlockEl).forEach((exampEl) => {
            const enExample = getText(exampEl.querySelector('.eg'));
            const cnExample = getText(exampEl.querySelector('.eg')?.nextElementSibling);

            if (shouldPushEg && (enExample || cnExample)) {
              pushPart(parts, `例句${exampleCnt + 1}`, `${enExample}\n${cnExample}`);
            }

            exampleCnt++;
            if (explanationCnt > 1 && exampleCnt >= 1) {
              shouldPushEg = false;
            }
          });
        });
      });
    });

    console.log(`parts: ${JSON.stringify(parts)}`);

    const res = {
      from: 'en',
      to: 'zh-Hans',
      fromParagraphs: [word],
      toDict: {
        phonetics: phonetics,
        additions: transformToAdditions(parts),
        parts: mapToParts(partMap),
        word: word
      },
      raw: '',
      toParagraphs: [word]
    };

    completion({
      result: res
    });

    console.log(`res: ${JSON.stringify(res)}`);
  }

  function markLevel(str) {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const level = levels.find(l => str.startsWith(l));
    if (level?.length) {
      return str.replace(level, `<span class="cb-level">${level}</span>`);
    }
    return str;
  }

  function addMap(map, key, value) {
    if (map.has(key)) {
      map.get(key).push(value);
    } else {
      map.set(key, [value]);
    }
  }

  function mapToParts(map) {
    const parts = [];
    map.forEach((value, key) => {
      parts.push({
        part: key,
        means: value
      });
    });
    return parts;
  }

  // 安全获取文本
  function getText(el) {
    return el?.textContent?.trim() || '';
  }

  // 查询单个元素
  function q(selector, context = document) {
    return context.querySelector(selector);
  }

  // 查询多个元素
  function qa(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  function makePhonetic(ipaEl, audioEl, region) {
    return {
      ipa: getText(ipaEl),
      audio: audioEl?.getAttribute('src') || '',
      region: region
    };
  }

  function pushPart(parts, part, ...means) {
    const trimmedMeans = means.map(m => m.trim()).filter(m => m);
    if (trimmedMeans.length > 0) {
      parts.push({
        part: part.trim(),
        means: trimmedMeans
      });
    }
  }

  // 假设 transformToAdditions 已定义（你需保留该函数）
  // 如果没有，请提供或临时返回空数组
  function transformToAdditions(parts) {
    // 示例：直接返回原结构，或按需转换
    return parts;
  }

  // 播放音频
  function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
  }

  function closePopup() {
    popup.style.display = 'none';
    //popupBody.innerHTML = placeHoder;
  }

  // === 拖动逻辑：仅限标题栏 ===
  const popup = document.getElementById('cambridgePopup');
  const popupBody = popup.querySelector('.popup-body');
  const dragHandle = popup.querySelector('#dragHandle');

  let isDragging = false;
  let offsetX, offsetY;

  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    popup.style.left = `${e.clientX - offsetX}px`;
    popup.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  popup.querySelector('.close-btn').addEventListener('click', () => {
    closePopup();
  });

  popup.querySelector('.audio-btn').addEventListener('click', () => {
    playAudio();
  });

  // 点击空白关闭
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target)) {
      closePopup();
    }
  });

  // 阻止内容区点击关闭
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 播放音频
  popupBody.addEventListener('click', (e) => {
    const audioBtn = e.target?.closest('.audio-btn');
    if (!audioBtn) return;
    playAudio(baseUrl + audioBtn?.dataset?.audio);
  });
  // esc退出
  document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if(popup?.style?.display !== 'none') closePopup();
      }
  });
  // 打赏作者
  popup.querySelector('.copyright').addEventListener('click', () => {
    window.open('https://ld246.com/article/1760544378300#%E6%89%93%E8%B5%8F%E4%BD%9C%E8%80%85');
  });
})();