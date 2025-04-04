// see https://ld246.com/article/1737873720071
{
  setTimeout(() => ClickMonitor(), 1000)
  function ClickMonitor() {
    window.addEventListener('mouseup', MenuShow)
  }
  function MenuShow() {
    setTimeout(() => {
      let selectinfo = getBlockSelected()
      if (selectinfo) {
        let selecttype = selectinfo.type
        let selectid = selectinfo.id
        if (selecttype == "NodeList" || selecttype == "NodeTable") {
          setTimeout(() => InsertMenuItem(selectid, selecttype), 0)
        }
      }
    }, 0);
  }
  function getBlockSelected() {
    let node_list = document.querySelectorAll('.protyle-wysiwyg--select');
    if (node_list.length === 1 && node_list[0].dataset.nodeId != null) return {
      id: node_list[0].dataset.nodeId,
      type: node_list[0].dataset.type,
      subtype: node_list[0].dataset.subtype,
    };
    return null;
  }

  function InsertMenuItem(selectid, selecttype) {
    let commonMenu = document.querySelector("#commonMenu .b3-menu__items")
    let readonly = commonMenu.querySelector('[data-id="updateAndCreatedAt"]')
    let selectview = commonMenu.querySelector('[id="viewselect"]')
    if (readonly) {
      if (!selectview) {
        commonMenu.insertBefore(ViewSelect(selectid, selecttype), readonly)
        commonMenu.insertBefore(MenuSeparator(), readonly)
      }
    }
  }


  function ViewSelect(selectid, selecttype) {
    let button = document.createElement("button")
    button.id = "viewselect"
    button.className = "b3-menu__item"
    button.innerHTML = '<svg class="b3-menu__icon" style="null"><use xlink:href="#iconGlobalGraph"></use></svg><span class="b3-menu__label" style="">视图选择</span><svg class="b3-menu__icon b3-menu__icon--arrow" style="null"><use xlink:href="#iconRight"></use></svg></button>'
    button.appendChild(SubMenu(selectid, selecttype))
    return button
  }
  function SubMenu(selectid, selecttype) {
    let button = document.createElement("button")
    button.id = "viewselectSub"
    button.className = "b3-menu__submenu"
    button.appendChild(MenuItems(selectid, selecttype))
    return button
  }

  function MenuItems(selectid, selecttype, className = 'b3-menu__items') {
    let node = document.createElement('div');
    node.className = className;
    if (selecttype == "NodeList") {
      node.appendChild(GraphView(selectid))
      node.appendChild(TableView(selectid))
      node.appendChild(kanbanView(selectid))
      node.appendChild(DefaultView(selectid))
    }
    if (selecttype == "NodeTable") {
      node.appendChild(FixWidth(selectid))
      node.appendChild(AutoWidth(selectid))
      node.appendChild(FullWidth(selectid))
      node.appendChild(vHeader(selectid))
      node.appendChild(Removeth(selectid))
      node.appendChild(Defaultth(selectid))
    }
    return node;
  }

  function GraphView(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", "dt")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconFiles"></use></svg><span class="b3-menu__label">转换为导图</span>`
    button.onclick = ViewMonitor
    return button
  }
  function TableView(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", "bg")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconTable"></use></svg><span class="b3-menu__label">转换为表格</span>`
    button.onclick = ViewMonitor
    return button
  }
  function kanbanView(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", "kb")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconMenu"></use></svg><span class="b3-menu__label">转换为看板</span>`
    button.onclick = ViewMonitor
    return button
  }
  function DefaultView(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.onclick = ViewMonitor
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", '')

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconList"></use></svg><span class="b3-menu__label">恢复为列表</span>`
    return button
  }
  function FixWidth(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.onclick = ViewMonitor
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", "")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconTable"></use></svg><span class="b3-menu__label">自动宽度(换行)</span>`
    return button
  }
  function AutoWidth(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", "auto")
    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconTable"></use></svg><span class="b3-menu__label">自动宽度(不换行)</span>`
    button.onclick = ViewMonitor
    return button
  }
  function FullWidth(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.onclick = ViewMonitor
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "f")
    button.setAttribute("custom-attr-value", "full")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconTable"></use></svg><span class="b3-menu__label">页面宽度</span>`
    return button
  }
  function vHeader(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.onclick = ViewMonitor
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "t")
    button.setAttribute("custom-attr-value", "vbiaotou")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconSuper"></use></svg><span class="b3-menu__label">竖向表头样式</span>`
    return button
  }
  function Removeth(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.onclick = ViewMonitor
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "t")
    button.setAttribute("custom-attr-value", "biaotou")

    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconSuper"></use></svg><span class="b3-menu__label">空白表头样式</span>`
    return button
  }
  function Defaultth(selectid) {
    let button = document.createElement("button")
    button.className = "b3-menu__item"
    button.setAttribute("data-node-id", selectid)
    button.setAttribute("custom-attr-name", "t")
    button.setAttribute("custom-attr-value", "")
    button.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconSuper"></use></svg><span class="b3-menu__label">恢复表头样式</span>`
    button.onclick = ViewMonitor
    return button
  }
  function MenuSeparator(className = 'b3-menu__separator') {
    let node = document.createElement('button');
    node.className = className;
    return node;
  }

  function ViewMonitor(event) {
    let id = event.currentTarget.getAttribute("data-node-id")
    let attrName = 'custom-' + event.currentTarget.getAttribute("custom-attr-name")
    let attrValue = event.currentTarget.getAttribute("custom-attr-value")
    let blocks = document.querySelectorAll(`.protyle-wysiwyg [data-node-id="${id}"]`)
    if (blocks) {
      blocks.forEach(block => block.setAttribute(attrName, attrValue))
    }
    let attrs = {}
    attrs[attrName] = attrValue
    设置思源块属性(id, attrs)
  }
  async function 设置思源块属性(内容块id, 属性对象) {
    let url = '/api/attr/setBlockAttrs'
    return 解析响应体(向思源请求数据(url, {
      id: 内容块id,
      attrs: 属性对象,
    }))
  }
  async function 向思源请求数据(url, data) {
    let resData = null
    await fetch(url, {
      body: JSON.stringify(data),
      method: 'POST',
      headers: {
        Authorization: `Token ''`,
      }
    }).then(function (response) { resData = response.json() })
    return resData
  }
  async function 解析响应体(response) {
    let r = await response
    return r.code === 0 ? r.data : null
  }
}