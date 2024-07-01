/*
![](https://raw.githubusercontent.com/zsviczian/obsidian-excalidraw-plugin/master/images/scripts-font-family.jpg)

Sets font family of the text block (Virgil, Helvetica, Cascadia, localFont). Useful if you want to set a keyboard shortcut for selecting font family.

This script is adapted from Set Font Family script.

See documentation for more details about Set Font Family script:
https://zsviczian.github.io/obsidian-excalidraw-plugin/ExcalidrawScriptsEngine.html

```javascript
*/
// 用户自定义字体，这里字体的名称是字体文件的文件名
// 自动读取仓库下的字体文件（支持ttf,woff,woff2,otf）
const customFonts = app.vault.getFiles().filter((f=>["ttf", "woff", "woff2", "otf"].contains(f.extension))).map(f=>f.path);
//内置字体，内置字体不可更改
const builtInfonts = ["Virgil","Helvetica","Cascadia"];
// 初始化参数
let elements = ea.getViewSelectedElements().filter((el)=>el.type==="text");
if(elements.length===0) {
	new Notice("Select at least one element");
	return;
}
const isSelectedAllSameFontFamily = elements.every(el=>el.fontFamily === elements[0].fontFamily);
const customFontNames = customFonts.map(f=>(isSelectedAllSameFontFamily && elements[0].fontFamily===4 && f===ea.plugin.settings.experimantalFourthFont?"✓ ":"　")+f.split("/").pop().split(".")[0]);
const buildInFontNames = builtInfonts.map((f,i)=>(isSelectedAllSameFontFamily && elements[0].fontFamily === i+1 ? "✓ " : "　")+f);
const fontNames = [...buildInFontNames, ...customFontNames];
const fonts = [...builtInfonts, ...customFonts];
let font = await utils.suggester(fontNames, fonts, "Select a Font Family (Custom fonts can only exist one at a time)");
//更新元素字体
const updateElements = (font) => {
	if(font === 4) {
		const localFontElements = ea.getViewElements().filter(e=>e.type==='text' && e.fontFamily === 4);
		elements = [...elements, ...localFontElements];
	}
	elements.forEach((el) => {
	    el.fontFamily = font;
	});
	ea.copyViewElementsToEAforEditing(elements);
	ea.addElementsToView(false,false);
}
if(builtInfonts.includes(font)){
	// 内置字体
    font = builtInfonts.indexOf(font);
    font = font === -1 ? 1 : font + 1;
    updateElements(font);
} else if(customFonts.includes(font)) {
	// 修改本地自定义字体为选择的字体
	const excalidraw = ea.plugin;
	excalidraw.settings.experimantalFourthFont = font;
	await excalidraw.saveData(excalidraw.settings);

	// 开始初始化字体
	initializeFonts(()=>{
	    // 字体加载成功，修改元素字体
		font = 4;
		updateElements(font);
	}, ()=>{
	    // 字体加载失败
	    new Notice("Failed to load fonts.");
	});
}

/////////////// 重写 Excalidraw 功能函数 ///////////////

function initializeFonts(callback, failback) {
  app.workspace.onLayoutReady(async () => {
    const font = await getFontDataURL(
      app,
      ea.plugin.settings.experimantalFourthFont,
      "",
      "LocalFont",
    );
    if (font.dataURL === "") {
	    if(typeof callback === 'function') failback();
	    return;
    }
    const fourthFontDataURL = font.dataURL;
    //const fourthFontDataURL = font.dataURL === "" ? VIRGIL_DATAURL : font.dataURL;
    ea.plugin.fourthFontDef = font.fontDef;
    ea.plugin.getOpenObsidianDocuments().forEach((ownerDocument) => {
      addFonts([
        `@font-face{font-family:'LocalFont';src:url("${fourthFontDataURL}");font-display: swap;`,
      ],ownerDocument, callback);
    })
  });
}

async function addFonts(declarations, ownerDocument = document, callback) {
	const FONTS_STYLE_ID = "excalidraw-fonts";
	const newStylesheet = ownerDocument.createElement("style");
	newStylesheet.id = FONTS_STYLE_ID;
	newStylesheet.textContent = declarations.join("");
	const oldStylesheet = ownerDocument.getElementById(FONTS_STYLE_ID);
	ownerDocument.head.appendChild(newStylesheet);
	if (oldStylesheet) {
		ownerDocument.head.removeChild(oldStylesheet);
	}
	// 等待字体加载完毕
	await ownerDocument.fonts.load('20px LocalFont');
	//完成回调
	if(typeof callback === 'function') callback();
}

async function getDataURL(
  file,
  mimeType,
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result;
      resolve(dataURL);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(new Blob([new Uint8Array(file)], { type: mimeType }));
  });
};

async function getFontDataURL(
  app,
  fontFileName,
  sourcePath,
  name,
) {
  let fontDef = "";
  let fontName = "";
  let dataURL = "";
  const f = app.metadataCache.getFirstLinkpathDest(fontFileName, sourcePath);
  if (f) {
    const ab = await app.vault.readBinary(f);
    const mimeType = f.extension.startsWith("woff")
      ? "application/font-woff"
      : "font/truetype";
    fontName = name ?? f.basename;
    dataURL = await getDataURL(ab, mimeType);
    fontDef = ` @font-face {font-family: "${fontName}";src: url("${dataURL}")}`;
     //format("${f.extension === "ttf" ? "truetype" : f.extension}");}`;
    const split = fontDef.split(";base64,", 2);
    fontDef = `${split[0]};charset=utf-8;base64,${split[1]}`;
  }
  return { fontDef, fontName, dataURL };
};

