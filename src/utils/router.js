import qs from 'qs'
import md5 from 'md5'
import { compile } from 'vue/dist/vue.cjs.js'
import requestConfig from '../config/request'

import { getUrl, request } from "./request"
import { event } from './event'
import { getXmlByTagName, getXmlByTagNames } from './xml'

window.addEventListener('popstate', e => {
    routerChange({
        ...(e.state || {
            url: location.href.substr(location.origin.length)
        }),
        agree: 'popstate'
    })
})

let currentState = {}
const routerChange = (state = {}) => {
    if (!state.url) {
        return
    }

    state = {
        agree: state.agree || 'push',
        url: state.url,
        path: state.url.split('?')[0],
        params: qs.parse(state.url.split('?')[1] || ''),
        pathChange: state.url.split('?')[0] !== currentState.path
    }

    currentState = state
    // default route reset
    const path = state.path.split('/')
    if (path.length <= 2 || path[2] === '') {
        // reset the root directory to the first module of the menu
        router.indexPage && router.replace(router.indexPage)
        // Invalid route, do not perform page fetch
        return
    }
    event.emit('router-change', state)
}
/**
 * Get the page when the route changes
 * @param {*} url routing address
 * @param {*} type type page dialog pop-up window
 */
export const getPage = (url, type) => {
    const callback = []
    const promise = new Promise((resolve, reject) => {
        callback.push(resolve, reject)
        request({
            header: {
                'x-dux-sfc': '1',
                ...(type === 'dialog' ? { 'x-dialog': '1' } : {})
            },
            errorMsg: type === 'dialog',
            // delete the module name
            url: url.split('/').slice(2).join('/')
        }, true).then(data => {

            resolve({
                type: typeof data === 'string' ? (getXmlByTagName(data, 'html') ? 'html' : 'vue') : 'node',
                data
            })
        }).catch(reject)
    })
    promise.abort = () => {
        callback[1]?.({
            message: 'Cancel request',
            code: 1
        })
    }
    return promise
}



/**
 * Combine the url and data parameters into a new url
 * @param {*} url
 * @param {*} data
 * @returns
 */
const toUrl = (url = location.pathname, data = {}) => {
    data = { ...qs.parse(url.split('?')[1] || ''), ...data }
    const stringify = qs. stringify(data)
    return url.split('?')[0] + (stringify ? '?' + stringify : '')
}

/**
 * Routing jump function
 */
export const router = window.router = (url, data) => {
    if (!url) {
        return
    }
    const split = url.split(':')
    if (typeof split[1] === 'string' && !split[1]) {
        split[1] = location.href.substr(location.origin.length)
    }
    const agree = split.length > 1 ? split[0] : 'push'
    router[agree]?.(split[1], data)
}
router.indexPage = null
// normal route
router.push = (url, data) => {
    url = toUrl(url, data)
    const state = {
        url,
        agree: 'push'
    }
    history.pushState(state, url, url)
    routerChange(state)
}

// do not reload if the route is the same
router.routerPush = (url, data) => {
    url = toUrl(url, data)
    const state = {
        url,
        agree: 'routerPush'
    }
    history.replaceState(state, url, url)
    routerChange(state)
}

// replace route
router.replace = (url, data) => {
    url = toUrl(url, data)
    const state = {
        url,
        agree: 'replace'
    }
    history.replaceState(state, url, url)
    routerChange(state)
}
// return
router.back = (url) => {
    const num = url | 0 || 1;
    history.go(-num)
}
// Pop-ups
router.dialog = (url, mode) => {
    event.emit('router-dialog', { url, mode })
}
// normal jump
router.http = (url) => {
    window.location.href = `http:${url}`
}
router.https = (url) => {
    window.location.href = `https:${url}`
}
// Convert to a vue component
router.toVueComponent = (template, comp = {}) => {
    comp.render = compile(template)
    return comp
}
router.ajax = (url, data) => {
    const ajaxAction = () => {
        request({
            url: toUrl(url, data),
            method: data?._method,
            successMsg: true,
            urlType: data?._urlType || 'absolute',
        }).then(result => {
            data._callback && data._callback(result)
            router('routerPush:')
            event.emit('router-ajax-finish', {
                url: getUrl(toUrl(url, data), data?._urlType || 'absolute'),
                data,
                result
            })
        })
    }
    if (data?._title) {
        window.dialog.info({
            title: 'Confirm operation',
            content: data?._title,
            hideCancel: false,
            onOk: ajaxAction
        })
    } else {
        ajaxAction()
    }
}

/**
 * Operate the route in the current environment, such as the need to close the route in the pop-up window
 * router.currentAction('back', 1, this)
 * @param {*} type "replace", "back", "push"
 * @param {*} The route to which the url is redirected, if it is back, pass a number
 * @param {*} that the current component imports this
 * @returns
 */
router.currentAction = (type, url, that) => {
    if (!["replace", "back", "push"].includes(type)) {
        return message.error('Route type error')
    }
    const page = getPageContent(that?.$parent);
    if (page) {
        page.changeRouter(url, type);
    } else {
        router[type](url);
    }
}

// Get the nearest pageContent component instance
export const getPageContent = (parent) => {
    const parentName = parent?.$options?.name;
    if (parentName === "PageContent") {
        return parent;
    } else if (!parent.$parent) {
        return;
    }
    return getPageContent(parent.$parent);
}

/**
 * Get the current module
 * @returns module
 */
export const moduleName = () => location.pathname.split('/')[1] || requestConfig.defaultModule
/**
 * Get the current module
 * @returns module
 */
export const isModuleIndex = url => ["/", `/${moduleName()}`, `/${moduleName()}/`].includes(url)

/**
 * Page resource management
 */

export const resource = {

    // already loaded resource
    /**
     * already loaded resources
     * Resource 1: dom node corresponding to dom, easy to remove
     */
    load: {},

    /**
     * The resources referenced by the page and the number of existing pages
     * page: {
     * num: 1,
     * list: ['Resource 1', 'Resource 2']
     * }
     */
    pageLoads: {},

    loadTypeString: {
        css: data => getXmlByTagNames(data, 'link').filter(item => item.attr.href).map(item => item.attr.href),
        style: data => getXmlByTagNames(data, 'style').map(item => item.child),
        script: (data, asyncLoad) => getXmlByTagNames(data, 'script').filter(item => item.attr.src && (asyncLoad ? item.attr.async : !item.attr.async)).map(item => item.attr.src),
        scriptString: () => ([])
    },
    getLoadType(data, type, asyncLoad) {
        if (typeof data === 'string') {
            return this.loadTypeString[type](data, asyncLoad)
        } else if (typeof data === 'object') {
            if (asyncLoad) {
                return []
            }
            if (type === 'style' || type === 'scriptString') {
                if (data[type]) {
                    return [data[type]]
                }
                return []
            }
            return data[type] || []
        }
        return []
    },

    /**
     * Load page style
     * @param {string} data current page template or resource list
     * @param {string} page The current page url is used for identification
     * @param {boolean} asyncLoad The page is loaded successfully, load the asynchronously loaded js file defined on the page
     */
    async pageLoad(data, page, asyncLoad) {
        if(!this.pageLoads[page]) {
            this.pageLoads[page] = {
                num: 0,
                list: []
            }
        }
        const current = this.pageLoads[page]
        // resource load list
        const loadList = asyncLoad
            ? [
                this.loadScript(this.getLoadType(data, 'script', true)),
                this.loadScriptString(this.getLoadType(data, 'scriptString', true))
            ] : [
                this.loadCss(this.getLoadType(data, 'css')),
                this.loadStyle(this.getLoadType(data, 'style')),
                this.loadScript(this.getLoadType(data, 'script')),
                this.loadScriptString(this.getLoadType(data, 'scriptString'))
            ]

        const res = await Promise.all(loadList)

        current.list.push(...res.map(item => item.map(item => item[0])).flat())

        !asyncLoad && current.num++
    },

    /**
     * Unload page resources
     * @param {strnig} page
     * @param {number} num The number of page resources to be uninstalled. The default is 1. When there is more than or equal to 1 same page, the current resource will not be uninstalled
     */
    uninstall(page, num = 1) {
        const current = this.pageLoads[page]
        if (!current || current.num > num) {
            return
        }
        // Resources for all pages except the unload page
        const all = new Set(Object.keys(this.pageLoads).map(key => key === page ? [] : this.pageLoads[key].list).flat())

        // unload data
        current.list.forEach(key => {
            // Not referenced in other pages to delete directly
            if (!all.has(key)) {
                this.load[key]?.source?.parentNode?.removeChild?.(this.load[key].source)
                delete this.load[key]
            }
        })
        // delete the currently loaded page
        delete this.pageLoads[page]
    },
    loadScriptString(list) {
        list.forEach(item => new Function(item))
        return Promise.resolve([])
    },
    // load multiple js asynchronously
    loadScript(list) {
        const arr = list.filter(src => !this.load[src])
        const success = []
        if (!arr.length) {
            return Promise.resolve(success)
        }
        return new Promise((resolve, reject) => {

            // Load js in order to prevent dependency conflicts
            const load = list => {
                if (!list.length) {
                    resolve(success)
                    return
                }
                const script = document.createElement('script')
                script.type = 'text/javascript';
                script.onload = () => {
                    this.load[list[0]] = {
                        source: script,
                        type: 'js'
                    }
                    success.push([list[0], script])
                    load(list.slice(1))
                }
                script.onerror = () => {
                    reject({
                        message: list[0] + 'Load failed'
                    })
                }
                script.src = list[0]
                document.getElementsByTagName('head')[0].appendChild(script)
            }

            load(arr)

        })
    },

    /**
     * Load multiple css files asynchronously
     * @param {*} list
     * @returns
     */
    loadCss(list) {
        const arr = list.filter(href => !this.load[href])
        const success = []
        if (!arr.length) {
            return Promise.resolve(success)
        }

        return new Promise((resolve, reject) => {
            arr.forEach(href => {
                const link = document.createElement('link')
                link.rel = 'stylesheet';
                link.onload = () => {
                    this.load[href] = {
                        source: link,
                        type: 'css'
                    }
                    success.push([href, link])
                    if (success.length === arr.length) {
                        resolve(success)
                    }
                }
                link.onerror = () => {
                    reject({
                        message: href + 'Load failed'
                    })
                }
                link.href = href
                document.getElementsByTagName('head')[0].appendChild(link);
            })
        })
    },

    async loadStyle(list) {
        const arr = []
        list.forEach(string => {
            const stylee = document.createElement('style')
            stylee.innerHTML = string
            document.getElementsByTagName('head')[0].appendChild(stylee)

            const key = md5(string)
            this.load[key] = {
                source: stylee,
                type: 'css'
            }
            arr.push([key, stylee])
        })
        return arr
    }
}


// get async template
export const getComp = async (data, url) => {

    // load page resources
    await resource.pageLoad(data, url)

    // handle component code
    const compScript = (getXmlByTagNames(data, 'script').find(item => Object.keys(item.attr).length === 0)?.child || 'return {}').replace('export default ', 'return ')

    // generate component
    let comp = (new Function(compScript))()
    if (typeof comp !== 'object') {
        comp = {}
    }
    comp.render = compile(getXmlByTagName(data, 'template')?.child || '')

    // The callback function to be executed after the node is rendered
    comp._didCallback = () => {
        resource.pageLoad(data, url, true)
    }
    return comp
}

/**
 * Get the query parameter on the route
 * @param {*} url
 */
export const getParams = (url = window.location.href) => qs.parse(url.split('?')[1] || '')
