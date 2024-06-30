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

	// 重写添加字体函数
	const originalAddFonts = excalidraw.addFonts;
	excalidraw.addFonts = async (declarations, ownerDocument = document) => {
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

		// 字体加载完毕，修改元素字体
		font = 4;
		updateElements(font);
		// 恢复字体添加函数
		excalidraw.addFonts = originalAddFonts;
	}
	// 开始初始化字体
	excalidraw.initializeFonts()
}

