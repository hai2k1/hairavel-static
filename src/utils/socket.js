import config from '../config/request'
import { getDomain } from "./request"
import { getLocalUserInfo, onUserLogin } from './user'

class WS {
    constructor() {
        onUserLogin(status => {
            if (status) {
                this.init()
            } else {
                this.unInit()
            }
        })
    }

    // ws instance
    ws = null

    // Listen to the data callback function
    callbacks = []

    // Listen for some type of callback function
    callbackTypes = {}

    // Monitor disconnection and reconnection success
    reconnectCallbacks = []

    init() {
        const api = import.meta.env.DEV?config.wsApi: appConfig?.socket?.api
        if (!api) {
            return
        }
        try {
            const ws = this.ws = new WebSocket(`${getDomain().replace('https://', 'wss://').replace('http://', 'ws://') }${api}`)
            ws.addEventListener('message', e => {
                try {
                    const data = JSON.parse(e.data)
                    this.callbacks.forEach(v => v(data))
                    if (data.type && this.callbackTypes[data.type]) {
                        this.callbackTypes[data.type].forEach(v => v(data))
                    }
                    // login successful
                    if (data.type === 'login') {
                        this.emitReconnect(true)
                    }
                } catch (error) {
                    console.log('Program processing error or not JSON message', error)
                }
            })
            ws.addEventListener('open', () => {
                const { token = '' } = getLocalUserInfo()
                this.send({
                    type: 'login',
                    data: token.replace('Bearer ', '')
                })
            })
            ws.addEventListener('close', err => {
                if (err.code !== 1000) {
                    // 1000 means actively closed and the link is not needed anymore
                    this.reconnect()
                }
                this.emitReconnect()
            })
            ws.addEventListener('error', err => {
                console.log('Link error', err)
                this.reconnect()
                this.emitReconnect()
            })
        } catch (error) {
            console.log('Link initialization error', error)
            this.reconnect()
            this.emitReconnect()
        }
    }

    unInit() {
        this.ws.close?.(1000)
        this.ws = null
        this.callbacks.splice(0)
        this.callbackTypes = {}
    }

    reconnect() {
        console.log('Link down, will try again later')
        this.reconnectTimer && clearTimeout(this.reconnectTimer)
        this.reconnectTimer = setTimeout(() => {
            if (this.ws?.readyState === WebSocket.CLOSING || this.ws?.readyState === WebSocket.CLOSED) {
                console.log('Reconnecting')
                this.init()
            } else {
                console.log('Not eligible for reconnection')
            }
        }, 5000)
    }

    // Execute callbacks for disconnection and link success
    emitReconnect(status = false) {
        this.reconnectCallbacks.forEach(v => v(status))
    }

    // Monitor the link status, disconnect the link and log in successfully
    onReconnect(callback) {
        this.reconnectCallbacks.push(callback)
        return {
            destroy: () => {
                const index = this.reconnectCallbacks.findIndex(v => v === callback)
                ~index && this.reconnectCallbacks.splice(index, 1)
            }
        }
    }

    /**
     * Return data monitoring and data sending of a certain type
     * @param {*} type
     * @returns
     */
    type(type) {
        const callbacks = []
        return {
            // Send a message
            send: (data, message = '') => {
                this.send({
                    type,
                    message,
                    data
                })
            },
            // send message text
            sendMessage: (message = '') => {
                this.send({
                    type,
                    message
                })
            },
            // listen for messages
            on: callback => {
                callbacks.push(callback)
                const list = this.callbackTypes[type] = this.callbackTypes[type] || []
                list.push(callback)
                return {
                    destroy: () => {
                        const index = list.findIndex(v => v === callback)
                        ~index && list.splice(index, 1)
                        if (!list.length) {
                            delete this.callbackTypes[type]
                        }
                    }
                }
            },
            // destroy all listeners
            destroy: () => {
                callbacks.forEach(item => {
                    const list = this.callbackTypes[type]
                    const index = list?.findIndex?.(v => item === v)
                    list && ~index && list.splice(index, 1)
                    if (!list.length) {
                        delete this.callbackTypes[type]
                    }
                })
            }
        }
    }

    /**
     * send data
     * @param {*} data
     */
    send(data) {
        this.ws?.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify(data))
    }

    /**
     * Monitor data
     * @param {*} callback
     * @returns
     */
    on(callback) {
        this.callbacks.push(callback)
        return {
            destroy: () => {
                const index = this.callbacks.findIndex(v => v === callback)
                ~index && this.callbacks.splice(index, 1)
            }
        }
    }

    // cancel all function listeners
    off() {
        this.callbacks.splice(0)
    }
}

export default new WS()
