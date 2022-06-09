const mailerConfig = require('./config.js');
const nodemailer = require('nodemailer');
const common = require('../common/common.js');
const dayjs = require('dayjs');
const dayjsCustomParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(dayjsCustomParseFormat);

let transporter = null;

module.exports = {
    sendPartiallyPaidEmail: function (params) {
        let content = 'There is an invoice that was partially paid. The required amount ';
    },
};

function createTransporter() {
    let transporterInfo = {
        service: 'gmail',
        auth: {
            user: mailerConfig.username,
            pass: mailerConfig.password,
        },
    };
    let transporter = nodemailer.createTransport(transporterInfo);
    return transporter;
};

function getTransporter() {
    if (transporter == null) {
        transporter = createTransporter();
    }
    return transporter;
};

function sendMail(content, isHtml, receivers, subject, purpose) {
    if (receivers == null) {
        receivers = mailerConfig.adminEmail;
    }
    let transporter = getTransporter();
    let mailInfo = {
        from: mailerConfig.sender + '<' + mailerConfig.sendFrom + '>',
        to: receivers,
        subject: subject,
    };
    if (isHtml === true) {
        mailInfo.html = content;
    } else {
        mailInfo.text = content;
    }
    common.consoleLog('Sending ' + purpose + ' email...');
    transporter.sendMail(mailInfo)
        .then(function () {
            common.consoleLog('Email for ' + purpose + ' sent.');
        })
        .catch(function (error) {
            let errorMessage = 'Unknown error';
            if (error.errno) {
                errorMessage = error.errno;
            } else if (error.code) {
                errorMessage = error.code;
            } else if (error.message) {
                errorMessage = error.message;
            }
            common.consoleLogError('Email for ' + purpose + ' could not be sent. Error: ' + errorMessage + '.');
        });
};