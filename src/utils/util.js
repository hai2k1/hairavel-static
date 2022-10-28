import { watch, ref } from 'vue'
import { request } from "./request";


/**
 * Execute asynchronous tasks after timing
 * @param {number} time milliseconds
 */
const asyncTimeOut = time => {
    let resolveFunc
    let rejectFunc
    const pro = new Promise((resolve, reject) => {
        resolveFunc = resolve
        rejectFunc = reject
    })
    const timer = setTimeout(() => resolveFunc({ code: 200, message: 'Countdown is over', type: 'timeout' }), time)
    pro.clear = () => {
        clearTimeout(timer)
        rejectFunc({ code: 500, message: 'Clear countdown' })
    }
    return pro
}

const weather = (callback) => {
    let res = localStorage.getItem('weather')
    res = res ? JSON.parse(res) : {}
    if (res.time + 10800000 > new Date().getTime()) {
        callback(res.data)
    } else {
        request({
            url: "map/weather",
            errorMsg: false,
        }).then(res => {
            localStorage.setItem('weather', JSON.stringify({ time: new Date().getTime(), data: res }))
            callback(res)
        })
    }
}

/**
 * Get the relative position of the current element relative to the specified element
 * @param {*} current current dom
 * @param {*} stop find end dom
 * @param {*} data data No need to pass in
 * @returns
 */
const getOffset = (current, stop = document, data = { left: 0, top: 0 }) => {
    if (!current || current === stop) {
        return data
    }
    data.left += current.offsetLeft
    data.top += current.offsetTop
    return getOffset(current.offsetParent, stop, data)
}

const watchAssignObject = (...arg) => {
    const data = ref({})

    arg.forEach(item => {
        watch(item, val => {
            Object.keys(val).forEach(key => {
                data.value[key] = val[key]
            })
        })
        Object.keys(item).forEach(key => {
            data.value[key] = item[key]
        })
    })

    return data.value
}

export {
    asyncTimeOut,
    weather,
    getOffset,
    watchAssignObject
}
