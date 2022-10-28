/**
 * Global event system
 */
export const event = {
    /**
     * save function
     */
    funcs: {},
    /**
     * Add event listener
     * @param {string} name event name
     * @param {string} func callback function
     */
    add(name, func) {
        this.funcs[name] = this.funcs[name] || []
        this.funcs[name].push(func)
    },
    /**
     * Remove event listeners without passing the second parameter to remove all functions of the current event
     * @param {string} name event name
     * @param {function} func The function to remove the listener from
     */
    remove(name, func) {
        if (!func) {
            delete this.funcs[name]
        } else {
            const list = this.funcs[name]
            if (!list) {
                return
            }
            list.every((item, index) => {
                if (item === func) {
                    list.splice(index, 1)
                    return false
                }
                return true
            })
            if (!list.length) {
                delete this.funcs[name]
            }
        }
    },
    /**
     * trigger event
     * @param {string} name event name
     * @param {...any} args event parameters
     */
    emit(name, ...args) {
        const funcs = this.funcs[name] || []
        funcs.forEach(func => func(...args))
    },
    /**
     * Determine if there is an event Pass in func to determine the event bound by func
     * @param {string} name
     * @param {function} func
     * whether @returns exists
     */
    is(name, func) {
        if (!func) {
            return !!this.funcs[name]
        } else {
            const list = this.funcs[name]
            if (!list) {
                return false
            }
            return list.every(item => item === func)
        }
    }
}

/**
 * Request return data event system
 */
export const requestEvent = {
    key(name) {
        return 'request-' + name
    },
    add(name, func) {
        event.add(this.key(name), func)
    },
    remove(name, func) {
        event.remove(this.key(name), func)
    },
    emit(name, ...args) {
        event.emit(this.key(name), ...args)
    },
    is(name, func) {
        event.is(this.key(name), func)
    }
}

export const stopPropagation = e => {
    e.stopPropagation && e.stopPropagation()
}

/**
 * Route navigation change monitoring and triggering
 */
export const menuNavigation = {
    data: [],
    emit(data) {
        this.data = data
        this.callback?.(data)
    },
    on(callback) {
        callback(this.data)
        this.callback = callback
    }
}
