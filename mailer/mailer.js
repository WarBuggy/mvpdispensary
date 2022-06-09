const mailerConfig = require('./config.js');
const nodemailer = require('nodemailer');
const common = require('../common.js');
const dayjs = require('dayjs');
const dayjsCustomParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(dayjsCustomParseFormat);

let transporter = null;

module.exports = {
    sendPartiallyPaidNotifEmail: function (params) {
        let content = `Hello MVP Shop admin,<br>There is an invoice that was partially paid.<br>`
            + `The total of the order is <b>${params.orderTotal} USD</b>.`
            + `The amount should be paid is <b>${params.payAmount} ${params.payCurrency}</b>.`
            + `The partially paid amount is <b>${params} ${params.payCurrency}</b>.`
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