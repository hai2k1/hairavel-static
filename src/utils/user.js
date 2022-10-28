import { event } from '../utils/event'
import { moduleName } from './router'

const userInfoKey = () => moduleName() + 'UserInfo'

/**
 * call login
 * @returns
 */
export const login = () => {
    event.emit('open-login')
    return new Promise((resolve, reject) => {
        const callback = () => {
            event.remove('login-success', callback)
            resolve()
        }
        event.add('login-success', callback)
    })
}

/**
 * Get local user information
 * @returns
 */
export const getLocalUserInfo = () => {
    const userInfo = localStorage.getItem(userInfoKey())
    if (userInfo) {
        try {
            return JSON.parse(userInfo)
        } catch (error) {
            return {}
        }
    } else {
        return {}
    }
}

/**
 * Set local user information
 * @param {*} info
 */
export const setLocalUserInfo = info => {
    localStorage.setItem(userInfoKey(), JSON.stringify({ ...getLocalUserInfo(), ...info }))
}

/**
 * Clear user information
 */
export const clearUserInfo = () => {
    localStorage.removeItem(userInfoKey())
}

/**
 * sign out
 */
export const loginOut = () => {
    clearUserInfo()
    const modName = moduleName()
    onUserLoginFunc.forEach(func => func(false))
    window.location.replace(modName ? `/${modName}` : '/')
}

/**
 * Whether the administrator is already logged in
 * @returns
 */
export const isLogin = () => {
    const userInfo = getLocalUserInfo()
    return !!userInfo.user_id
}

// Callback
const onUserLoginFunc = []
/**
 * Monitor user login behavior
 */
event.add('login-success', () => {
    onUserLoginFunc.forEach(func => func(true))
})
/**
 * Monitor user login status true login false logout
 * @param {*} callback
 */
export const onUserLogin = callback => {
    if (isLogin()) {
        callback(true)
    }
    onUserLoginFunc.push(callback)
}

/**
 * Stop monitoring user login status
 * @param {*} callback
 */
export const offUserLogin = callback => {
    if (typeof callback === 'function') {
        const index = onUserLoginFunc.findIndex(v => v === callback)
        ~index && onUserLoginFunc.splice(index, 1)
    } else {
        onUserLoginFunc.splice(0)
    }
}
