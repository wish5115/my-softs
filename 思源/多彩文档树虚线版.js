/* [css片段] 多彩文档树04--ediary风格-不带文档图标 20251003_094258
from https://gitee.com/Hug_Zephyr/siyuan_script/blob/master/css/%E5%A4%9A%E5%BD%A9%E6%96%87%E6%A1%A3%E6%A0%9104%20--ediary%E9%A3%8E%E6%A0%BC-%E4%B8%8D%E5%B8%A6%E6%96%87%E6%A1%A3%E5%9B%BE%E6%A0%87.css
*/
:root {
  /* 文档缩进距离 */
  --file-retract-length: 20px;
  /* 折叠按钮宽度 */
  --fold-button-width: calc(3px + var(--file-retract-length));
  /* 横线宽度 */ 
  --horizontal-line-width: calc(3px + var(--file-retract-length));

  /* 竖线颜色 */
  --vertical-line-color: black;
}
[data-theme-mode="dark"]:root {
  /* 竖线颜色 */
  --vertical-line-color: white;
}
/* 拖拽文档时文档的阴影 */
.b3-list--background li.b3-list-item.dragover::after {
  width: 100%;
  left: 0;
}

/* 拖拽文档时的条状长度 */
.b3-list--background .b3-list-item.dragover__top::after,
.b3-list--background .b3-list-item.dragover__bottom::after {
  width: 100%;
  left: 0;
}

/* 每个文档外围缩小一点 */
.sy__file>.fn__flex-1>ul li {
  margin: 1px 4px;
}

/*笔记本的折叠按钮不显示*/
.sy__file>.fn__flex-1>ul>li>.b3-list-item__toggle {
  display: none;
}

/* 折叠按钮宽度 */
.sy__file>.fn__flex-1>ul li>.b3-list-item__toggle {
  padding-left: var(--fold-button-width) !important;
}

/*折叠按钮样式*/
.sy__file>.fn__flex-1>ul li>.b3-list-item__toggle>svg {
  background-color: var(--b3-theme-surface);
  border: 1px solid var(--b3-theme-on-surface-light);
  border-radius: 2px;
  /*
  box-shadow: 0 0 3px 0 hsla(0, 0%, 30%, 0.7);
  */
  padding: 2px;
}

/* 文档树缩进 */
.sy__file>.fn__flex-1>ul>ul ul {
  margin-left: var(--file-retract-length);
}

/*文档的折叠按钮, 图标要比虚线高一层 */
.sy__file>.fn__flex-1>ul li>.b3-list-item__toggle>svg,
.sy__file>.fn__flex-1>ul li>.b3-list-item__icon {
  z-index: 2;
}
.sy__file>.fn__flex-1>ul>ul li>.b3-list-item__icon {display:none;}

/* L型的线 */
.sy__file>.fn__flex-1>ul ul {
  position: relative;
}
.sy__file>.fn__flex-1>ul ul::before {
  content: "";
  visibility: visible;
  position: absolute;
  left: 18px;
  top: -15px;
  width: var(--horizontal-line-width);
  height: 100%;
  background: transparent;
  border-left: 1px dashed var(--vertical-line-color);
  border-bottom: 1px dashed var(--vertical-line-color);
  z-index: 0;
}

/* L型的线并不能完全覆盖, 剩下的由每个文档覆盖*/
.sy__file>.fn__flex-1>ul ul>:not(:last-child)>.b3-list-item__toggle::before {
  content: "";
  visibility: visible;
  position: absolute;
  left: 15px;
  width: var(--horizontal-line-width);
  height: 1px;
  background: transparent;
  border-bottom: 1px dashed var(--vertical-line-color);
  z-index: 0;
}


/* 每个文档外围缩小一点 */
.sy__outline>.fn__flex-1>ul li {
  margin: 1px 4px;
}

/* 折叠按钮宽度 */
.sy__outline>.fn__flex-1>ul>ul li>.b3-list-item__toggle {
  padding-left: var(--fold-button-width) !important;
}

/*折叠按钮样式*/
.sy__outline>.fn__flex-1>ul li>.b3-list-item__toggle>svg {
  background-color: var(--b3-theme-surface);
  border: 1px var(--arrow-btn-border-width) solid var(--b3-theme-on-surface-light);
  padding: 2px;
}

/* 文档树缩进 */
.sy__outline>.fn__flex-1>ul>ul ul {
  margin-left: var(--file-retract-length);
}

/*文档的折叠按钮, 图标要比虚线高一层 */
.sy__outline>.fn__flex-1>ul li>.b3-list-item__toggle>svg,
.sy__outline>.fn__flex-1>ul li>.b3-list-item__icon {
  z-index: 2;
}

/* L型的线 */
.sy__outline>.fn__flex-1>ul ul {
  position: relative;
}
.sy__outline>.fn__flex-1>ul ul::before {
  content: "";
  visibility: visible;
  position: absolute;
  left: 18px;
  top: -15px;
  width: var(--horizontal-line-width);
  height: 100%;
  background: transparent;
  border-left: 1px dashed var(--vertical-line-color);
  border-bottom: 1px dashed var(--vertical-line-color);
  z-index: 0;
}

/* L型的线并不能完全覆盖, 剩下的由每个文档覆盖*/
.sy__outline>.fn__flex-1>ul ul>:not(:last-child)>.b3-list-item__toggle::before {
  content: "";
  visibility: visible;
  position: absolute;
  left: 15px;
  width: var(--horizontal-line-width);
  height: 1px;
  background: transparent;
  border-bottom: 1px dashed var(--vertical-line-color);
  z-index: 0;
}

