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

    // https://gist.github.com/jarvisluong/f01e108e963092336f04c4b7dd6f7e45
    // This function converts the string to lowercase, then perform the conversion
    toLowerCaseNonAccentVietnamese: function (str) {
        str = str.toLowerCase();
        //     We can also use this instead of from line 11 to line 17
        //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
        //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
        //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
        //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
        //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
        //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
        //     str = str.replace(/\u0111/g, "d");
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        // Some system encode vietnamese combining accent as individual utf-8 characters
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
        return str;
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
