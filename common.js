const systemConfig = require('./systemConfig.js');
const dayjs = require('dayjs');
const dayjsCustomParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(dayjsCustomParseFormat);

const digitInWord = [
    'không', 'một', 'hai', 'ba', 'bốn',
    'năm', 'sáu', 'bảy', 'tám', 'chín',
];

module.exports = {
    getCurrentTime: function () {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    },

    getReadableIP: function (request) {
        let ip = request.headers['x-real-ip'];
        if (ip == null) {
            let parts = (request.connection.remoteAddress + '').split(':');
            return parts.pop();
        }
        return ip.toString();
    },

    sleep: function (ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, ms);
        });
    },

    consoleLog: function (string, consoleColor, time) {
        if (consoleColor == null) {
            consoleColor = systemConfig.consoleColor;
        }
        if (time == null) {
            time = module.exports.getCurrentTime();
        }
        console.log(consoleColor + '%s\x1b[0m', time + ': ' + string);
    },

    consoleLogError: function (string, consoleColor, time) {
        if (consoleColor == null) {
            consoleColor = systemConfig.consoleColor;
        }
        if (time == null) {
            time = module.exports.getCurrentTime();
        }
        console.log(consoleColor + '\x1b[5m%s\x1b[0m', time + ': ' + string);
    },

    cloneObject: function (object) {
        let string = JSON.stringify(object);
        return JSON.parse(string);
    },

    isNumeric: function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },

    numberToWordVN: function (input) {
        let number = parseInt(input);
        if (!module.exports.isNumeric(number)) {
            return '';
        }
        let unitArray = [
            'nghìn', 'triệu', 'tỷ',
        ];
        let numberString = number.toLocaleString('vi-VN');
        let parts = numberString.split('.');
        let firstPart = parts.pop();
        let resultPart = [firstPartToWord(parts, firstPart)];
        for (let i = parts.length - 1; i >= 0; i--) {
            let aPart = parts[i];
            let word = partToWordVN(aPart);
            if (word == '') {
                continue;
            }
            let diff = parts.length - 1 - i;
            let over = Math.floor(diff / unitArray.length);
            let unit = [];
            for (let j = 0; j < over; j++) {
                unit.push('tỷ');
            }
            let mod = diff % unitArray.length;
            let aResultPart = word + ' ' + unitArray[mod];
            if (unit.length > 0) {
                aResultPart = aResultPart + ' ';
            }
            aResultPart = aResultPart + unit.join(' ');
            resultPart.push(aResultPart);
        }
        let result = resultPart.reverse().join(' ');
        return result;
    },

    validateEmail: function (input) {
        let re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(input).toLowerCase());
    },

    checkNumericString: function (input) {
        for (let i = 0; i < input.length; i++) {
            if (!'0123456789'.includes(input[i])) {
                return false;
            }
        }
        return true;
    },
};

function firstPartToWord(parts, firstPart) {
    if (parts.length == 0 || firstPart == '000') {
        return partToWordVN(firstPart);
    }
    let oneOfFirstPart = firstPart[2];
    let tenOfFirstPart = firstPart[1];
    let hundredOfFirstPart = firstPart[0];
    if (tenOfFirstPart == 0 && hundredOfFirstPart == 0) {
        return 'lẻ ' + digitInWord[parseInt(oneOfFirstPart)];
    }
    return partToWordVN(firstPart);
};

function partToWordVN(part) {
    if (part.length == 1) {
        return oneDigitToWordVN(part);
    }
    if (part.length == 2) {
        return twoDigitToWordVN(part);
    }
    return threeDigitToWordVN(part);
};

function oneDigitToWordVN(input) {
    let one = input[0];
    return digitInWord[parseInt(one)];
};

function twoDigitToWordVN(input) {
    let one = input[1];
    let ten = input[0];
    let result = digitInWord[parseInt(ten)] + ' muơi';
    if (ten == 1) {
        result = 'mười';
    }
    if (one == 0) {
        return result;
    }
    if (one == 5) {
        return result + ' lăm';
    }
    if (one == 1 && ten != 1) {
        return result + ' mốt';
    }
    return result + ' ' + digitInWord[parseInt(one)];
};

function threeDigitToWordVN(input) {
    if (input === '000') {
        return '';
    }
    let one = input[2];
    let ten = input[1];
    let hundred = input[0];
    let result = digitInWord[parseInt(hundred)] + ' trăm';
    if (one == 0 && ten == 0) {
        return result;
    }
    if (ten == 0) {
        result = result + ' linh';
        result = result + ' ' + oneDigitToWordVN(one);
    } else {
        result = result + ' ' + twoDigitToWordVN(ten + one);
    }
    return result;
};
