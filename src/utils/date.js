/**
 * Convert a date object to a string in the specified format
 * @param {string} formatStr Date format, the format is defined as follows yyyy-MM-dd HH:mm:ss
 * @param {Date|string|number} date Date date object or timestamp or timestamp with milliseconds, if default, the current time
 * YYYY/yyyy/YY/yy indicates the year
 *MM/M months
 * w/w week
 * dd/DD/d/D date
 * hh/HH/h/H time
 * mm/m min
 * ss/SS/s/S seconds
 * @return string time string in specified format
 */
const dateToStr = (formatStr = "yyyy-MM-dd HH:mm:ss", date) => {
    date = timeStampToDate(date)
    let str = formatStr
    let Week = ['day', 'one', 'two', 'three', 'four', 'five', 'six']
    str = str.replace(/yyyy|YYYY/, date.getFullYear())
    str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100 ))
    str = str.replace(/MM/, date.getMonth() > 8 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1))
    str = str.replace(/M/g, (date.getMonth() + 1))
    str = str.replace(/w|W/g, Week[date.getDay()])

    str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate())
    str = str.replace(/d|D/g, date.getDate())

    str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours())
    str = str.replace(/h|H/g, date.getHours())
    str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes())
    str = str.replace(/m/g, date.getMinutes())

    str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds())
    str = str.replace(/s|S/g, date.getSeconds())

    return str
}

/**
 * Convert a 10-bit or 13-bit timestamp to a time object
 * @param {Date|string|number} date Date date object or timestamp or timestamp with milliseconds, if default, the current time
 * @return {Date}
 */
const timeStampToDate = (date = new Date()) => {
    //Automatic calculation of incoming numbers
    if (typeof date !== 'object') {
        date = String(date)
        const len = date.length
        if (len == 10) {
            date += '000'
            date = new Date(date * 1)
        } else if (len == 13) {
            date = new Date(date * 1)
        } else if (len < 10) {
            let num = (Array(10).join(0) + date).slice(-10)
            num += '000'
            date = new Date(num * 1)
        } else {
            date = new Date()
        }
    }
    return date
}

/**
 * Compare date difference dtEnd format is date type or valid date format string
 * @param {string} strInterval optional value y year m month d day w week ww week h hour n minute s second
 * @param {Date} dtStart optional value y year m month d day w week ww week h hour n minute s second
 * @param {Date} dtEnd optional value y year m month d day w week ww week h hour n minute s second
 */
const dateDiff = (strInterval, dtStart, dtEnd) => {
    switch (strInterval) {
        case 's': return parseInt((dtEnd - dtStart) / 1000)
        case 'n': return parseInt((dtEnd - dtStart) / 60000)
        case 'h': return parseInt((dtEnd - dtStart) / 3600000)
        case 'd': return parseInt((dtEnd - dtStart) / 86400000)
        case 'w': return parseInt((dtEnd - dtStart) / (86400000 * 7))
        case 'm': return (dtEnd.getMonth() + 1) + ((dtEnd.getFullYear() - dtStart.getFullYear()) * 12) - (dtStart.getMonth() + 1)
        case 'y': return dtEnd.getFullYear() - dtStart.getFullYear()
    }
}

/**
 * Date calculation
 * @param {string} strInterval optional value y year m month d day w week ww week h hour n minute s second
 * @param {int} num corresponds to the value
 * @param {Date} date date object
 * @return {Date} returns the calculated date object
 */
const dateAdd = (strInterval, num, date = new Date()) => {
    switch (strInterval) {
        case 's': return new Date(date.getTime() + (1000 * num))
        case 'n': return new Date(date.getTime() + (60000 * num))
        case 'h': return new Date(date.getTime() + (3600000 * num))
        case 'd': return new Date(date.getTime() + (86400000 * num))
        case 'w': return new Date(date.getTime() + ((86400000 * 7) * num))
        case 'm': return new Date(date.getFullYear(), (date.getMonth()) + num, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
        case 'y': return new Date((date.getFullYear() + num), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
    }
}

/**
 * Judge leap year
 * @param {Date|string} date Date date object or time string
 * @return {boolean}
 */
const isLeapYear = (date = new Date()) => {
    if (typeof date !== 'object') {
        date = strToDate(date)
    }
    return (0 == date.getYear() % 4 && ((date.getYear() % 100 != 0) || (date.getYear() % 400 == 0)))
}

/**
 * Convert string to date object
 * @param {string} dateStr The format is yyyy-MM-dd HH:mm:ss, which must be in the order of year, month, day, hour, minute, second, and the middle separator is not limited
 * @return {Date} the converted date object
 */
const strToDate = dateStr => {
    const reCat = /(\d{1,4})/gm
    return new Date(...dateStr.match(reCat).map((item, index) => index === 1 ? --item : item))
}

/**
 * Convert a string in the specified format to a date object
 * @param {string} formatStr The time format of the time to be converted yyyy-MM-dd HH:mm:ss
 * @param {string} dateStr The time string to be converted
 * @return {Date} the converted date object
 */
const strFormatToDate = (formatStr, dateStr) => {
    let year = 0
    let start = -1
    const len = dateStr.length
    if ((start = formatStr.indexOf('yyyy')) > -1 && start < len) {
        year = dateStr.substr(start, 4)
    }
    let month = 0
    if ((start = formatStr.indexOf('MM')) > -1 && start < len) {
        month = parseInt(dateStr.substr(start, 2)) - 1
    }
    let day = 0
    if ((start = formatStr.indexOf('dd')) > -1 && start < len) {
        day = parseInt(dateStr.substr(start, 2))
    }
    let hour = 0
    if (((start = formatStr.indexOf('HH')) > -1 || (start = formatStr.indexOf('hh')) > 1) && start < len) {
        hour = parseInt(dateStr.substr(start, 2))
    }
    let minute = 0
    if ((start = formatStr.indexOf('mm')) > -1 && start < len) {
        minute = dateStr.substr(start, 2)
    }
    let second = 0
    if ((start = formatStr.indexOf('ss')) > -1 && start < len) {
        second = dateStr.substr(start, 2)
    }
    return new Date(year, month, day, hour, minute, second)
}

/**
 * Date object converted to milliseconds
 */
const dateToLong = (date = new Date()) => {
    return date.getTime()
}

/**
 * Convert milliseconds to date objects
 * @param {number} dateVal Date in milliseconds
 * @return {Date} the converted date object
 */
const longToDate = dateVal => {
    return new Date(dateVal)
}

/**
 * Determine if the string is a number
 * @param {string} str string
 * @return {boolean}
 */
const isNumber = str => {
    let regExp = /^\d+$/g
    return regExp.test(str)
}

/**
 * Determine if the string is in date format
 * @param {string} str string
 * @param {string} formatStr date format, as follows yyyy-MM-dd
 * @return {boolean}
 */
const isDate = (str, formatStr = "yyyyMMdd") => {
    const yIndex = formatStr.indexOf("yyyy")
    if (yIndex == -1) {
        return false
    }
    const year = str. substring(yIndex, yIndex + 4)
    const mIndex = formatStr.indexOf("MM")
    if (mIndex == -1) {
        return false
    }
    const month = str. substring(mIndex, mIndex + 2)
    const dIndex = formatStr.indexOf("dd")
    if (dIndex == -1) {
        return false
    }
    const day = str. substring(dIndex, dIndex + 2)
    if (!isNumber(year) || year > "2100" || year < "1900") {
        return false
    }
    if (!isNumber(month) || month > "12" || month < "01") {
        return false
    }
    if (day > getMaxDay(year, month) + "" || day < "01") {
        return false
    }
    return true
}

/**
 * Returns the maximum number of days in the month
 * @param {number} year year
 * @param {number} month month
 * @return {number} the maximum number of days in the current month
 */
const getMaxDay = (year, month) => {
    if (month == 4 || month == 6 || month == 9 || month == 11)
        return 30
    if (month == 2)
        if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0)
            return 29
        else
            return 28
    return 31
}

/**
 * Get the maximum number of days in the month of the current date
 * @param {Date} date date object
 * @return {number}
 */
const maxDayOfDate = (date = new Date()) => {
    date.setDate(1)
    date.setMonth(date.getMonth() + 1)
    const time = date.getTime() - 24 * 60 * 60 * 1000
    const newDate = new Date(time)
    return newDate.getDate()
}

/**
 * Get the data information of the specified date
 * @param {string} interval indicates the data type y year M month d day w week ww week h hour n minutes s seconds
 * @param {Date} myDate date object
 * @return {string|number}
 */
const datePart = (interval, myDate = new Date()) => {
    let partStr = ''
    const Week = ['Day', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']
    switch (interval) {
        case 'y': partStr = myDate.getFullYear(); break
        case 'M': partStr = myDate.getMonth() + 1; break
        case 'd': partStr = myDate.getDate(); break
        case 'w': partStr = Week[myDate.getDay()]; break
        case 'ww': partStr = myDate.WeekNumOfYear(); break
        case 'h': partStr = myDate.getHours(); break
        case 'm': partStr = myDate.getMinutes(); break
        case 's': partStr = myDate.getSeconds(); break
    }
    return partStr
}

/**
 * Calculate countdown
 * @param {Date|string} time pass in different parameters according to the type
 * @param {formatStr} formatStr d h m s ms stands for days, hours, minutes, seconds, milliseconds respectively. Turning them into uppercase will complete them as 2 digits and milliseconds as 3 digits
 * @param {boolean} isEndTime true The first parameter is the end time false The first parameter is the remaining seconds
 * @param {boolean} getAll true returns all types of time
 * @return {object|str} Returns the day, hour, minute and second object or returns the formatted time string
 */
const endTime = (time, formatStr = 'd days H hours M minutes S seconds', isEndTime = false, getAll = false) => {
    if (isEndTime) {
        time = (timeStampToDate(time).getTime() - (new Date()).getTime())
    }
    time = Math.max(0, time)
    // Completion
    const completion = (number, length = 2) => {
        if (length === 2) {
            return `${number > 9 ? number : '0' + number}`
        } else {
            return `${number > 99 ? number : number > 9 ? '0' + number : '00' + number}`
        }
    }

    const data = {
        d: Math.floor(time / 1000 / 86400),
        h: Math.floor(time / 1000 / 3600 % 24),
        m: Math.floor(time / 1000 / 60 % 60),
        s: Math.floor(time / 1000 % 60),
        ms: Math.floor(time % 1000)
    }
    if (getAll) {
        return data
    }
    return formatStr
        .replace('d', data.d)
        .replace('D', completion(data.d))

        .replace('h', data.h)
        .replace('H', completion(data.h))

        .replace('ms', data.ms)
        .replace(/Ms|mS|MS/, completion(data.ms, 3))

        .replace('m', data.m)
        .replace('M', completion(data.m))

        .replace('s', data.s)
        .replace('S', completion(data.s))
}

/**
 * Countdown class
 */
class countDown {
    // time left
    time = 0
    // format type
    formatStr
    onFunc = null
    // listen time
    onTime(func) {
        this.onFunc = func
    }
    // Listen for the countdown to end
    stopFunc = null
    onStop(func) {
        this.stopFunc = func
    }
    // timer
    timer = null
    // start countdown
    start(time, formatStr, isEndTime = false, interval = 1000) {
        if (this.timer) {
            this.stop()
        }
        if (isEndTime) {
            time = (timeStampToDate(time).getTime() - (new Date()).getTime())
        }
        this.formatStr = formatStr
        this.time = time
        this.onFunc && this.onFunc(endTime(this.time, this.formatStr))
        this.timer = setInterval(() => {
            this.time -= interval
            if (this.time <= 0) {
                this.stop()
                this.stopFunc && this.stopFunc()
                return
            }
            this.onFunc && this.onFunc(endTime(this.time, this.formatStr))
        }, interval)
    }

    // stop execution
    stop() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
    }
}

/**
 * Time beautification The general user chat interface shows the message sending time
 * @param {Date|string} date time object or timestamp
 */
const dateBeautiful = (date) => {
    date = timeStampToDate(date)
    const nowDate = new Date(date)
    date = {
        time: date.getTime(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes()
    }
    const now = {
        time: nowDate.getTime(),
        year: nowDate.getFullYear(),
        month: nowDate.getMonth() + 1,
        day: nowDate.getDate()
    }

    if (now.time - date.time < 60) {
        return 'just now'
    } else if (now.time - date.time < 600) {
        return ((now.time - date.time) / 60 | 0) + 'minutes ago'
    } else if (date.year === now.year && date.month === now.month && date.day === now.day) {
        // the same day
        return `${date.hour}:${date.minute}`
    } else if (date.year === now.year) {
        return `${date.month}-${date.day}`
    } else {
        return `${date.month}year`
    }
}

/**
 * Timer class
 */
const Timer = {
    data: {
        timers: []
    },
    timer: null,
    timerOut: [],
    // listen time
    onTime(times, callback) {
        const { timers } = this.data
        const now = (new Date()).getTime()
        for (let i = 0, il = times.length; i < il; i++) {
            const item = times[i]
            if (now > item) {
                continue
            }
            let mark = false
            for (let j = 0, jl = timers.length; j < jl; j++) {
                const selfTime = timers[j].time
                const prevTime = j === 0 ? now : timers[j - 1].time
                // in the time period
                if (item > prevTime && item < selfTime) {
                    timers.splice(j, 0, { time: item, callback: [callback] })
                    mark = true
                    break
                }
                // equal to the current time
                if (item === selfTime) {
                    timers[j].callback.push(callback)
                    mark = true
                    break
                }
            }
            // greater than the last item
            !mark && timers.push({ time: item, callback: [callback] })
        }
        if (!this.timer) {
            this.startTimer()
        }
    },
    offTime(callback) {
        const { timers } = this.data
        if (!callback) {
            timers.splice(0, timers.length)
            return
        }
        for (let i = timers.length - 1; i > 0; i--) {
            const callbacks = timers[i].callback
            for (let j = callbacks.length - 1; j >= 0; j--) {
                if (callbacks[j] === callback) {
                    callbacks.splice(j, 1)
                }
            }
            if (callbacks.length === 0) {
                timers.splice(i, 1)
            }
        }
    },
    startTimer() {
        const { timers } = this.data
        this.clear()
        this.timer = setInterval(() => {
            const now = (new Date).getTime()
            let timeIndex = 0
            for (let i = 0, j = timers.length; i < j; i++) {
                if (timers[i].time > now + 6000) {
                    break
                }
                timeIndex++
            }
            timers.splice(0, timeIndex).map(item => item.time - now > 0 && setTimeout(() => item.callback.map(func => func(item.time)), item.time - now ))
        }, 5000)
    },
    clear() {
        this.timer && (clearInterval(this.timer), this.timer = null)
    }
}

export {
    dateToStr,
    dateDiff,
    dateAdd,
    isLeapYear,
    strToDate,
    strFormatToDate,
    dateToLong,
    longToDate,
    isDate,
    getMaxDay,
    maxDayOfDate,
    datePart,
    endTime,
    dateBeautiful,
    countDown,
    Timer
}
