/**
 * Determine if the string is a number
 * @param {string} str string
 * @return {boolean}
 */
export const isNumber = str => {
    if (typeof str === 'number') {
        return true
    }
    const regExp = /^[\d.]+$/g
    return regExp.test(str)
}

/**
 * Converts a string of type number to a number and returns itself if it is not of type string
 * @param {*} str
 * @returns
 */
export const strToNumber = str => isNumber(str) ? Number(str) : str

export default {
    isNumber,
    strToNumber
}
