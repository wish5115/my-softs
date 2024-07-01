/*
Calculates the number of text in the selected element, and displays the number of groups if the selected element is grouped.

![](https://raw.githubusercontent.com/wish5115/my-softs/main/Excalidraw/Words%20Counter.png)

```excalidraw-script-install
https://raw.githubusercontent.com/wish5115/my-softs/main/Excalidraw/Words%20Counter.md
```

```js
*/

let elements = ea.getViewSelectedElements().filter((el)=>el.type==="text");
if(elements.length===0) {
	new Notice("Select at least one element");
	return;
}

// 统计函数
const countCharactersWordsAndPunctuation = (text) => {
    // 移除所有非单词字符，以便准确统计英文单词
    const wordsOnly = text.replace(/[^a-zA-Z\s]/g, '');
    const words = wordsOnly.split(/\s+/).filter(Boolean); // 分割单词并过滤掉空字符串

    // 统计汉字数量（直接统计非空格、非标点的Unicode字符）
    const chineseCharRegex = /[\u4e00-\u9fff]/g;
    const chineseCharCount = (text.match(chineseCharRegex) || []).length;

    // 统计英文单词数量
    const englishWordCount = words.length;

    // 统计标点符号和空格数量，包括所有非字母数字的字符
    const punctuationSpaceRegex = /[^a-zA-Z0-9\u4e00-\u9fff]/g;
    const punctuationSpaceCount = (text.match(punctuationSpaceRegex) || []).length;

    return {
        chineseCharCount: chineseCharCount,
        englishWordCount: englishWordCount,
        punctuationSpaceCount: punctuationSpaceCount
    };
}

// 开始统计
const elementsNum = elements.length;
const groupSet = new Set();
let wordsCount = 0;
let chineseCount = 0;
let englishCount = 0;
let punctuationCount = 0;
let charactersCount = 0;
elements.forEach((el)=>{
    charactersCount += el.rawText.length;
    const result = countCharactersWordsAndPunctuation(el.rawText);
    chineseCount += result.chineseCharCount;
    englishCount += result.englishWordCount;
    punctuationCount += result.punctuationSpaceCount;
    wordsCount += chineseCount + englishCount + punctuationCount;
    if(el.groupIds.length > 0) {
        el.groupIds.forEach((id)=>{
            groupSet.add(id);
        });
    }
});
const groupsNum = groupSet.size;

//格式化结果
const formatStatisticalResults = `Statistical results:
${wordsCount}: total words
${chineseCount}: Chinese words
${englishCount}: English words
${punctuationCount}: spaces and punctuations
${charactersCount}: Characters
${elementsNum}: elements
${groupsNum}: groups
`
// 显示统计结果
new Notice(formatStatisticalResults);

