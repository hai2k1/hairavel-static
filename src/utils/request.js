import qs from 'qs'
import config from '../config/request'
import { deepCopy } from './object'
import { event, requestEvent } from './event'
import { moduleName, router } from './router'
import { clearUserInfo, getLocalUserInfo, login, setLocalUserInfo } from './user'
import axios from 'axios'

/**
 * Convert current url to real URL
 * @param {*} url
 * @param {*} type relative address or absolute address relative absolute absolute address contains /admin relative address does not contain admin and cannot start with /
 * @returns
 */
export const getUrl = (url, type = 'relative') => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }

    let urlArr = []
    urlArr.push(import.meta.env.DEV?config.domain: '')

    if (type === 'relative' && url.lastIndexOf("/" + moduleName(), 0) === -1) {
        urlArr.push("/" + moduleName() + (!url.startsWith('/') ? '/' : ''))
    }

    urlArr.push(url)
    return urlArr.join("")
}

export const getDomain = () => {
    return import.meta.env.DEV ? config.domain : window.location.origin
}

/**
 * request method
 */
export const request = window.ajax = async params => {
    if (typeof params === 'string') {
        params = {
            url: params
        }
    }

    let {
        url,
        urlType,
        data = {},
        method = 'GET',
        header = {},
        onProgress,
        successMsg,
        errorMsg = true,
        onSource
    } = params

    // request header
    const headers = {
        'Accept': 'application/json',
        Authorization: getLocalUserInfo().token || '',
        ...header
    }

    const init = {
        method,
        credentials: 'omit',
        headers
    }

    if (onSource) {
        const source = axios.CancelToken.source()
        init.cancelToken = source.token
        onSource?.(source)
    }
    if (onProgress) {
        init.onUploadProgress = (progressEvent) => {
            const progress = progressEvent.loaded / progressEvent.total * 100 | 0
            onProgress(progress)
        }
    }
    if (method.toUpperCase() !== 'GET') {
        init.data = data
    } else {
        const params = qs.stringify(data)
        if (params && ~url.indexOf('?')) {
            url += '&' + params
        } else if (params) {
            url += '?' + params
        }
    }
    init.url = getUrl(url, urlType)

    return axios(init).then((response) => {
        const result = {
            code: response.status,
            message: response.statusText
        }
        const contentType = response.headers['content-type'].toLowerCase()
        const isJson = contentType.indexOf('application/json') === 0

        // set new validation value
        const token = response.headers['authorization']
        if (token) {
            setLocalUserInfo({ token })
        }

        if (response.headers['x-location']) {
            router(response.headers['x-location'])
        }

        if (response.headers['x-menu-select']) {
            event.emit('request-menu-select', response.headers['x-menu-select'])
        }

        // request event
        result.data = response.data
        if (result.data?.data?.__event) {
            requestEvent.emit(result.data.data.__event.name, result.data.data.__event.data)
        }
        // handle the return script
        if (result.data?.data?.__script) {
            (new Function(result.data?.data?.__script))()
        }

        if (isJson) {
            successMsg && result.data.message && window.message.success(result.data.message)
            return result.data.data
        } else {
            successMsg && result.message && window.message.success(result.message)
            return result.data
        }
    }).catch(async(error) => {
        const result = error.response
        if (result?.status === 401 || result?.status === 402) {
            // The token is invalid, log in to get the token again
            clearUserInfo()
            await login()
            return request(params)
        }

        errorMsg && window.message.error(result?.data?.error?.message || result?.data?.message || error?.message || 'Business is busy, please try again later')
        throw result
    })
}


/**
 * Request cached data
 */
const requestCacheData = {}
/**
 * Can identify url and data cache return results
 * @param {*} option same as request
 * @param {*} copy whether to return the data after deep copy
 */
export const requestCache = (option = {}, copy) => {
    if (typeof option === 'string') {
        option = { url: option }
    }
    const { url, data } = option
    const key = `${url}-${JSON.stringify(data)}`
    let keyData = requestCacheData[key]
    if (!keyData || (!keyData.data && !keyData.request)) {
        keyData = requestCacheData[key] = {
            // result cache
            data: null,
            // queue cache
            queue: [],
            // request cache
            request: null
        }
        keyData.request = request(option).then(res => {
            keyData.data = res
            keyData.queue.forEach(([resolve]) => {
                resolve(copy ? deepCopy(res) : res)
            })
        }).catch(err => {
            keyData.queue.forEach(([, reject]) => {
                reject(err)
            })
        }).finally(() => {
            keyData.request = null
        })
    }
    if (keyData.data) {
        return Promise.resolve(copy ? deepCopy(keyData.data) : keyData.data)
    }
    return new Promise((resolve, reject) => {
        keyData.queue.push([resolve, reject])
    })
}


const searchQuickMarks = {}
/**
 * The request method is the same
 * @param {*} params
 * @param {*} mark
 * @returns
 */
export const searchQuick = (params, mark = '') => {
    if (typeof params === 'string') {
        params = { url: params }
    }
    const key = params.url + mark
    if (searchQuickMarks[key] === undefined) {
        searchQuickMarks[key] = {
            timer: null,
            prevReject: null,
            requestTask: null,
        }
    }
    const item = searchQuickMarks[key]
    return new Promise((resolve, reject) => {
        if (item.timer) {
            clearTimeout(item.timer)
            item.prevReject({ message: 'too fast request', code: 1 })
        }
        if (item.requestTask) {
            item.source?.cancel?.('The request was overwritten')
            item.requestTask = null
            item.source = null
            item.prevReject({ message: 'The request was overwritten', code: 2 })
        }
        item.prevReject = reject
        item.timer = setTimeout(() => {
            item.timer = null
            item.requestTask = request({
                ...params,
                onSource(res) {
                    item.source = res
                }
            }).then(resolve).catch(reject).finally(() => {
                item.requestTask = null
                item.source = null
            })
        }, 200)
    })
}

export const selectQuery = window.selectQuery = function (query, url) {
    if (!query.length) {
        this.nParams.options = []
        return
    }
    this.loading = true
    request({
        url: url,
        method: 'get',
        data: {
            query: query
        }
    }).then(res => {
        let data = res.data.map((item) => {
            return {
                label: item.name,
                value: item.id
            }
        })
        this.nParams.options = data
        this.loading = false
    }).catch(() => {
        this.loading = false
    })
}

export const download = (url, type) => {
    let downloadKey
    const cb = key => {
        event.remove('download-manage-add-callback', cb)
        downloadKey = key
    }
    event.add('download-manage-add-callback', cb)
    event.emit('download-manage-add')

    const xhr = new XMLHttpRequest();
    xhr.open('GET', getUrl(url, type)) // POST method can also be used, according to the interface
    xhr.responseType = 'blob' // return type blob
    const headers = {
        Accept: 'application/json',
        Authorization: getLocalUserInfo().token || ''
    }
    Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key])
    })
    // default filename
    let filename = url.split('?')[0].split('/')
    filename = filename[filename.length - 1]
    // Define the processing function for the completion of the request, you can also add a loading box / disable the download button logic before the request
    xhr.addEventListener('progress', e => {
        event.emit('download-manage-update', {
            key: downloadKey,
            total: e.total,
            loaded: e.loaded
        })
    })

    xhr.addEventListener('readystatechange', () => {
        if (XMLHttpRequest.HEADERS_RECEIVED === xhr.readyState) {
            const disposition = xhr.getResponseHeader('content-disposition')
            if (disposition) {
                filename = decodeURIComponent(xhr.getResponseHeader('content-disposition').split('"')[1])
            }
            event.emit('download-manage-update', { key: downloadKey, filename })
        }
    })
    xhr.onload = function (e) {
        // request completed
        if (this.status === 200) {
            event.emit('download-manage-update', {
                key: downloadKey,
                result: true
            })
            // return 200
            const blob = this.response
            const reader = new FileReader()
            reader.readAsDataURL(blob) // Convert to base64, you can directly put a expression href
            reader.onload = function (e) {
                // conversion is complete, create an a tag for download
                const a = document.createElement('a')
                a.download=filename
                a.href = e.target.result
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            }
        } else {
            event.emit('download-manage-update', {
                key: downloadKey,
                error: true
            })
        }
    };
    // send ajax request
    xhr.send()
}
