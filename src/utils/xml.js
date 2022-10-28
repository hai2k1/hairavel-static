/**
 * get a node
 * @param {*} xml
 * @param {*} name
 * @param {*} cursor
 * @returns
 */
export const getXmlByTagName = window.getXmlByTagName = (xml, name, cursor = 0) => {
    const startIndex = xml.indexOf('<' + name, cursor)
    if (!~startIndex) {
        return
    }
    cursor = startIndex + 1
    let endIndex = -1
    let level = 0
    while (!~endIndex) {
        // find next start and end tags
        const nextEnd = xml.indexOf('</' + name, cursor)
        const nextStart = xml.indexOf('<' + name, cursor)
        if (~nextEnd && ((~nextStart && nextEnd < nextStart) || !~nextStart)) {
            // The next tag is the closing tag
            if (level === 0) {
                endIndex = nextEnd
            } else {
                cursor = nextEnd + 1
                level--
            }
        } else if (~nextStart && ((~nextEnd && nextStart < nextEnd) || !~nextEnd)) {
            // The next tag is the start tag
            cursor = nextStart + 1
            level++
        } else {
            console.error('xml structure error or not found: ' + name)
            return
        }
    }
    // get label properties
    const attrEnd = xml.indexOf('>', startIndex)
    const attrString = xml.substr(startIndex + name.length + 2, attrEnd - (startIndex + name.length + 2)).trim()
    let attrAction = attrString
    const attr = {}
    while (attrAction.length) {
        const spaceIndex = attrAction. indexOf(' ')
        const equalIndex = attrAction. indexOf('=')
        if (!~spaceIndex && !~equalIndex) {
            // find the last property with no value
            attr[attrAction] = true
            attrAction = ''
        } else if ((~spaceIndex && ~equalIndex && spaceIndex < equalIndex) || !~equalIndex) {
            // find properties with no value followed by properties with an equals sign or without an equals sign
            const key = attrAction. substr(0, spaceIndex)
            attr[key] = true
            attrAction = attrAction.substr(key.length).trim()
        } else {
            // has the value of the property
            const key = attrAction. substr(0, equalIndex)
            const value = attrAction. substr(equalIndex + 2, attrAction. indexOf(attrAction. substr(equalIndex + 1, 1), equalIndex + 2) - equalIndex - 2)
            attr[key] = value
            attrAction = attrAction.substr((key + value).length + 3).trim()
        }
    }
    const data = {
        attrString,
        attr,
        child: xml.substr(attrEnd + 1, endIndex - attrEnd - 1),
        start: startIndex,
        end: endIndex + name.length + 3,
        nextStart: attrEnd
    }
    return data
}

/**
 * Get multiple nodes
 * @param {*} xml
 * @param {*} name
 * @param {*} cursor
 * @param {*} arr
 * @returns
 */
export const getXmlByTagNames = window.getXmlByTagNames = (xml, name, cursor, arr = []) => {
    const data = getXmlByTagName(xml, name, cursor)
    if (data) {
        arr.push(data)
        return getXmlByTagNames(xml, name, data.nextStart, arr)
    }
    return arr
}
