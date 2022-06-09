const mailerConfig = require('./config.js');
const nodemailer = require('nodemailer');
const common = require('../common.js');
const dayjs = require('dayjs');
const dayjsCustomParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(dayjsCustomParseFormat);

let transporter = null;

module.exports = {
    sendPartiallyPaidNotifEmail: function (params) {
        let content = `Hello MVP Shop admin,<br><br>There is an invoice that was partially paid.<br>`
            + `<table style='padding: 10px; border-spacing: 10px;'>`
            + '<tr>'
            + '<td>The total amount of the order</td>'
            + `<td style='text-align: right;'><b>${params.orderTotal} USD</b></td>`
            + '</tr>'
            + '<tr>'
            + '<td>The amount should be paid</td>'
            + `<td style='text-align: right;'><b>${params.payAmount} ${params.payCurrency}</b></td>`
            + '</tr>'
            + '<tr>'
            + '<td>The partially paid amount</td>'
            + `<td style='text-align: right;'><b>${params.actuallyPaidAmount} ${params.payCurrency}</b></td>`
            + '</tr>'
            + '</table>'
            + '<br>'
            + 'The details of the order is'
            + `<table style='padding: 10px; border-spacing: 10px;'>`
            + '<tr>'
            + '<td>Customer name</td>'
            + `<td style='vertical-align: top;'><b>${params.customerName}</b></td>`
            + '</tr>'
            + '<tr>'
            + '<td>Email</td>'
            + `<td><b>${params.customerEmail}</b></td>`
            + '</tr>'
            + '<tr>'
            + `<td style='vertical-align: top;'>Delivery address</td>`
            + `'<td>${params.deliveryAddress}</td>`
            + '</tr>'
            + '<tr>'
            + `<td style='vertical-align: top;'>Note</td>`
            + `<td>${params.note}</td>`
            + '</tr>'
            + '<tr>'
            + `<td style='vertical-align: top;'>Order ID</td>`
            + `<td><b>${params.orderId}</b></td>`
            + '</tr>'
            + '<tr>'
            + `<td style='vertical-align: top;'>Invoice ID</td>`
            + `<td><b>${params.invoiceId}</b></td>`
            + '</tr>'
            + '</table>'
            + `<table style='padding: 10px; border-spacing: 10px;'>`
            + '<tr>'
            + `<th style='text-align: left;'>Product</th>`
            + `<th style='text-align: right;'>Quantity</th>`
            + `<th style='text-align: right;'>Price (USD)</th>`
            + `<th style='text-align: right;'>Pay amount(USD)</th>`
            + '</tr>';
        for (let i = 0; i < params.orderDetail.length; i++) {
            let item = params.orderDetail[i];
            content = content + '<tr>'
                + `<td><b>${item.name}</b></td>`
                + `<td style='text-align: right;'>x ${item.quantity}</td>`
                + `<td style='text-align: right;'>${item.price}.${item.price_decimal}</td>`
                + `<td style='text-align: right;'>${item.quantity * (item.price + '.' + item.price_decimal)}</td>`
                + '</tr>'
        }
        content = content + '<tr>'
            + '<td></td>'
            + '<td></td>'
            + `<td style='text-align: right;'><b>Total (USD)</b></td>`
            + `<td style='text-align: right;'><b>${params.orderTotal}</b></td>`
            + '</tr>'
            + '</table>'
            + 'Please contact the customer and arrange possible payment!<br>Thank you!';
        sendMail(content, true, mailerConfig.shopEmail, 'Partially paid order', 'warning about a partially paid order');
    },

    sendPaymentConfirmEmail: function (params) {

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