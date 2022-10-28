/**
 * recursively set value
 * @param {array} keys key array
 * @param {object|array} data The object to be set
 * @param {any} value The value to set
 * @param {string} child The subset field to call when recursing
 * @param {boolean} splice whether to use splice to insert data only supports arrays
 */
const recursionSetValue = (keys, data, value, childKey, splice = false) => {
    keys = typeof keys === 'string' ? keys.split('.') : [...keys]
    if (keys.length === 1) {
        if (splice) {
            data.splice(keys[0], 0, value)
        } else {
            data[keys[0]] = value
        }
    } else {
        if (childKey && data[keys[0]][childKey] === undefined) {
            data[keys[0]][childKey] = []
        }
        // override child
        let child = (childKey ? data[keys[0]][childKey] : data[keys[0]])
        if (!child) {
            child = typeof childKey === 'number' ? [] : {}
            if (!childKey) {
                data[keys[0]] = child
            } else {
                data[keys[0]][childKey] = child
            }
        }

        recursionSetValue(keys.slice(1), child, value, childKey, splice)
    }
}

/**
 * Recursively get value
 * @param {array} keys key array
 * @param {object|array} data The object to be obtained
 * @param {string} childKey The subset field to call when recursing
 * @param {boolean} splice whether to delete this value only supports arrays
 */
const recursionGetValue = (keys, data = {}, childKey, splice = false) => {
    keys = typeof keys === 'string' ? keys.split('.') : [...keys]
    if (keys.length === 0) {
        return false
    } if (keys.length === 1) {
        return splice ? data.splice(keys[0], 1)[0] : data[keys[0]]
    } else {
        return recursionGetValue(keys.slice(1), childKey === undefined ? data[keys[0]] : data[keys[0]][childKey], childKey, splice)
    }
}

/**
 * Check if a value is in the given array, otherwise return the specified default value
 * @param {any} value
 * @param {array} array
 * @param {any} defaultValue
 */
const verifyValueInArray = (value, array, defaultValue = array[0]) => {
    if (!value) return defaultValue
    if (array.indexOf(value) !== -1) return value
    return defaultValue
}

const recursionRepeatData = []
/**
 * Recursively check if the value is repeated
 * @param {*} form
 * @param {*} key
 * @param {*} childKey
 * @param {*} indexes
 * @returns
 */
const recursionRepeat = (form, key, childKey, indexes = []) => {
    if (indexes.length === 0) {
        recursionRepeatData.splice(0)
    }
    let num = form.length
    form.forEach((item, index) => {
        const newIndexs = [...indexes, index]
        if (recursionRepeatData.includes(item[key])) {
        } else {
            recursionRepeatData.push(item[key])
        }
        if (item[childKey] && item[childKey].length > 0) {
            num += recursionRepeat(item[childKey], newIndexs)
        }
    })
    return num
}

/**
 * Find whether the value is in the array from the array
 * @param {string} value
 * @param {array} array
 * @param {string} key indicates that the array to be searched is a three-dimensional array, this indicates the key name in the object
 */
const getInArrayIndex = (value, array, key) => {
    if (key !== undefined) {
        for (let i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return i
            }
        }
        return -1
    } else {
        return array.indexOf(value)
    }
}

/**
 * Object deep copy
 * @param {*} source object to copy
 * @returns
 */
const deepCopy = (source = {}) => {
    if (!(source instanceof Object)) return source //If it is not an object, return directly
    const target = Array.isArray(source) ? [] : {} //Array compatible
    for (const k in source) {
        // eslint-disable-next-line no-prototype-builtins
        if (source.hasOwnProperty(k)) {
            if (typeof source[k] === 'object') {
                target[k] = deepCopy(source[k])
            } else {
                target[k] = source[k]
            }
        }
    }
    return target
}

export {
    recursionSetValue,
    recursionGetValue,
    verifyValueInArray,
    getInArrayIndex,
    deepCopy
}
