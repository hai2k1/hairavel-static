import { asyncTimeOut } from "./util"
import * as dateUtil from './date'

window.dateUtil = dateUtil

// menu data
const globalMenuData = {
    menuDom: null,
    callback: [],
    close() {
        document.removeEventListener('click', globalMenuData.close)
        globalMenuData.callback[1] && globalMenuData.callback[1]('Normal shutdown')
        globalMenuData.removeEle()
    },
    removeEle() {
        if (!globalMenuData.menuDom) {
            return
        }
        globalMenuData.callback = []
        document.body.removeChild(globalMenuData.menuDom)
        globalMenuData.menuDom = null
    }
}

/**
 * show a global menu
 * @param {*} param0
 * @returns
 */
const openMenu = window.openGlobalMenu = ({ list, event }) => {

    if (globalMenuData.menuDom) {
        globalMenuData.close()
    }

    const childDom = list.map(item => `<div class='item'>${item.text}</div>`).join('')

    globalMenuData.menuDom = document.createElement('div')
    globalMenuData.menuDom.classList.add('global-menus')
    globalMenuData.menuDom.innerHTML = childDom
    asyncTimeOut(10).then(() => {
        document.addEventListener('click', globalMenuData.close)
    })

    document.body.appendChild(globalMenuData.menuDom)

    // window size
    const [width, height] = [document.body.clientWidth, document.body.clientHeight]
    // The width and height can only be obtained after the element is inserted
    const domRect = globalMenuData.menuDom.getBoundingClientRect()

    const [left, top] = [Math.min(event.x, width - domRect.width), Math.min(event.y, height - domRect.height)]

    globalMenuData.menuDom.style.left = left + 'px'
    globalMenuData.menuDom.style.top = top + 'px'

    document.querySelectorAll('.global-menus > .item').forEach((ele, index) => {
        ele.onclick = () => {
            globalMenuData.callback[0] && globalMenuData.callback[0]({
                index,
                item: list[index]
            })
            globalMenuData.removeEle()
        }
    })

    return new Promise((resolve, reject) => {
        globalMenuData.callback = [resolve, reject]
    })
}

export {
    openMenu
}
