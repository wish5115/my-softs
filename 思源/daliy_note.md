.action{ $anchorSunday := "2022-12-25" }
.action{ $yearStartDate := now.Year | printf "%d-01-01" | toDate "2006-01-02" }
.action{ $ysDateDuration := div ($yearStartDate.Sub (toDate "2006-01-02" $anchorSunday)).Hours 24 }
.action{ $ysWeekDay := mod $ysDateDuration 7 }
.action{ $yearStartWeek := add (div (sub $ysDateDuration 1) 7) 1 }
.action{ if or (eq $ysWeekDay 0) (gt $ysWeekDay 4) }
    .action{ $yearStartWeek := add $yearStartWeek 1 }
.action{ end }


.action{ $nowWeek := add (div (div (now.Sub (toDate "2006-01-02" $anchorSunday)).Hours 24) 7) 1 }
.action{ $week := add (sub $nowWeek $yearStartWeek) 1 }
.action{$today:= (now | date "2006-01")}
.action{$weeks:= (list $today "Week" $week| join " ")}



.action{ $nextYear := now.Year | add 1 }
.action{ $nextYearStart := $nextYear | printf "%d-01-01" | toDate "2006-01-02" }
.action{ $dayleft := (div (($nextYearStart).Sub now).Hours 24) }
.action{$week := add (mod (div ((toDate "2006-01-02" "2100-12-27").Sub now).Hours 24) 7) 1}


.action{ $anchorDate := toDate "2006-01-02" $anchorSunday }
.action{ $daysSinceAnchor := div (now.Sub $anchorDate).Hours 24 }
.action{ $weekIndex := mod (add $daysSinceAnchor 7) 7 }
.action{ $weekDays := list "星期天" "星期一" "星期二" "星期三" "星期四" "星期五" "星期六" }
.action{ $currentWeekDay := index $weekDays $weekIndex }


{{{col
{{{row
🕐 创建时间：.action{now | date "2006-01-02 15:04"} .action{$currentWeekDay}
}}}
{{{row
距离 `.action{ $nextYearStart.Year }-01-01` 还剩 `.action{$dayleft}` 天，Power！
}}}
{: style="color: var(--b3-card-info-color); background-color: var(--b3-card-info-background);"}
}}}

<br/>

{{{row

## 🎯Schedule
{: name=".action{now | date "2006-01-02"}" style="background-color: var(--b3-font-background11); --b3-parent-background: var(--b3-font-background11);"}

{{{col

{{{row
### ⏰今日目标
---
- [ ] 
}}}

{{{row
### ⛱相关资源
---
* 
}}}

{{{row
### 🧠其他收获
---
* 
}}}

}}}
{: name="" fold="0"}
.action{/*s上面设置命名为空和不折叠,为了防止超级块内部的属性错位,被超级块获取*/}
}}}

<br/>

---

## <span data-type="strong">✏️工作记录</span>
{: id="20241216161447-5xs9g5h" style="background-color: var(--b3-font-background5); --b3-parent-background: var(--b3-font-background5);"}

@Aim:
{: custom-docinfo="@aim" }

@Point:
{: custom-docinfo="@point"}

###### Main：
<br/>

---

{{{row
## ✍每日总结
{: alias=".action{$weeks}" name=".action{now | date "2006-01-02"}" style="background-color: var(--b3-font-background12); --b3-parent-background: var(--b3-font-background12);"}

* 
<br/>

}}}

{: name="" fold="0"}
.action{/*s上面设置命名为空和不折叠,为了防止超级块内部的属性错位,被超级块获取*/}
---

## 🤨新的问题
{: id="20241216161048-9bcmrl5" style="background-color: var(--b3-font-background1); --b3-parent-background: var(--b3-font-background1);"}

* {: id="20241216163341-tzjytgu"}
  {: id="20241216163341-sapefqz"}
{: id="20241216161048-l036r1d"}

{: id="20241216163337-grbzksp"}

---
{: id="20241216161048-beu85nf"}

## <span data-type="text">📂</span>{: style="background-color: var(--b3-font-background8); color: var(--b3-card-success-color);"}<span data-type="text">知识补充&资源记录</span>{: style="background-color: var(--b3-font-background8);"}
{: id="20241216161826-hc10ke6" style="background-color: var(--b3-font-background8); --b3-parent-background: var(--b3-font-background8);"}

* {: id="20241216161826-sjo55jx"}📂<span data-type="strong">Project</span>
  {: id="20241216161826-n8jfixd"}
* {: id="20241216161826-misoirf"}📂<span data-type="strong">Resources</span>
  {: id="20241216161826-xdiudv6"}
{: id="20241216161826-gqcm5z7"}

{: id="20241216161021-yyxcsay" title="未命名文档" type="doc"}

{{//!js_esc_newline_return (async () =&gt; {_esc_newline_    // 等待时长，默认60秒_esc_newline_    const waitForTime = 60;_esc_newline_    getWeather();_esc_newline_    async function getWeather () {_esc_newline_        const weather = await fetch('https://wttr.in/?format=1');_esc_newline_        const text = await weather.text();_esc_newline_        render(text);_esc_newline_    };_esc_newline_    async function render(text) {_esc_newline_        const {datetimeP, datetimeEl} = getDatetimeEl();_esc_newline_        if(!datetimeP &amp;&amp; !datetimeEl) {_esc_newline_            delItem();_esc_newline_            return;_esc_newline_        }_esc_newline_        const loadingEl = datetimeEl.querySelector('span[data-type~=&quot;loading&quot;]');_esc_newline_        if(loadingEl) {_esc_newline_            loadingEl.remove();_esc_newline_        }_esc_newline_        datetimeEl.innerHTML = datetimeEl.innerHTML + ' ' + text.trim().replace(/\s+/g, ' ');_esc_newline_        // 更新日期块_esc_newline_        fetchSyncPost('/api/block/updateBlock', {_esc_newline_            &quot;dataType&quot;: &quot;dom&quot;,_esc_newline_            &quot;data&quot;: datetimeP.outerHTML,_esc_newline_            &quot;id&quot;: datetimeP.dataset.nodeId_esc_newline_        });_esc_newline_        // 删除嵌入块_esc_newline_        delItem();_esc_newline_    }_esc_newline_    function getDatetimeEl() {_esc_newline_        const protyle = item.closest('.protyle-wysiwyg');_esc_newline_        const datetimeP = protyle?.querySelector('.sb:first-child .p:first-child');_esc_newline_        if(!datetimeP) return {};_esc_newline_        const datetimeEl = datetimeP.querySelector('[contenteditable=&quot;true&quot;]');_esc_newline_        if(!datetimeEl) return {datetimeP};_esc_newline_        return {datetimeP, datetimeEl};_esc_newline_    }_esc_newline_    function delItem() {_esc_newline_        // 删除嵌入块_esc_newline_        fetchSyncPost('/api/block/deleteBlock', {id: item?.dataset?.nodeId});_esc_newline_        // 清除定时器_esc_newline_        if(timer) clearTimeout(timer);_esc_newline_    }_esc_newline_    let timer = 0;_esc_newline_    whenRender().then(el =&gt; {_esc_newline_        el.outerHTML = '正在获取天气...';_esc_newline_        const {datetimeEl} = getDatetimeEl();_esc_newline_        if(datetimeEl) {_esc_newline_            item.style.display = 'none';_esc_newline_            datetimeEl.innerHTML = datetimeEl.innerHTML + '&lt;span data-type=&quot;text loading&quot;&gt; Loading&lt;/span&gt;';_esc_newline_        }_esc_newline_        timer = setTimeout(() =&gt; {_esc_newline_            // 删除嵌入块_esc_newline_            if(item?.dataset?.nodeId) fetchSyncPost('/api/block/deleteBlock', {id: item?.dataset?.nodeId});_esc_newline_            // 删除loading_esc_newline_            const loadingEl = datetimeEl.querySelector('span[data-type~=&quot;loading&quot;]');_esc_newline_            if(loadingEl) loadingEl.remove();_esc_newline_        }, waitForTime * 1000);_esc_newline_    });_esc_newline_    function whenRender(selector = '.b3-form__space--small') {_esc_newline_        return new Promise(resolve =&gt; {_esc_newline_            const check = () =&gt; {_esc_newline_                let el = item.querySelector(selector);_esc_newline_                if (el) resolve(el); else requestAnimationFrame(check);_esc_newline_            };_esc_newline_            check();_esc_newline_        });_esc_newline_    }_esc_newline_    return [];_esc_newline_})();}}
