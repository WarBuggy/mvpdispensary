const mailerConfig = require('./config.js');
const nodemailer = require('nodemailer');
const common = require('../common.js');
const dayjs = require('dayjs');
const dayjsCustomParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(dayjsCustomParseFormat);

let transporter = null;

module.exports = {
    sendPartiallyPaidNotifEmailToShopAdmin: function (params) {
        let content = 'Xin chào MVP Shop admin,<br><br>'
            + `Hệ thống vừa nhận được 01 đơn hàng được thanh toán <span style='color: red; '><b>không đầy đủ</b></span>.<br>`
            + createPaymentContent(params)
            + '<br>'
            + createOrderContent(params)
            + '<br>'
            + 'Xin admin vui lòng liên hệ với khách hàng qua email trên và đề nghị thanh toán đầy đủ!<br>Xin cảm ơn!';
        sendMail(content, true, mailerConfig.shopEmail, `Đơn hàng chưa được thanh toán đầy đủ (${params.orderId})`, 'warning shop admin about a partially paid order ');
    },

    sendPaymentConfirmEmailToShopAdmin: function (params) {
        let content = 'Xin chào MVP Shop admin,<br><br>'
            + `Hệ thống vừa nhận được 01 đơn hàng đã được thanh toán <span style='color: green;'><b>đầy đủ</b></span>.<br>`
            + createPaymentContent(params)
            + '<br>'
            + createOrderContent(params)
            + '<br>'
            + 'Xin vui lòng kiểm tra hàng hóa và sắp xếp việc giao hàng cho khách khi có thể.<br>Xin cảm ơn!';
        sendMail(content, true, mailerConfig.shopEmail, `Đơn hàng đã được thanh toán đầy đủ (${params.orderId})`, 'notify shop admin about a fully paid order');
    },

    sendPartiallyPaidNotifEmailToCustomer: function (params) {
        let content = `Xin chào ${params.customerName},<br>`
            + 'Xin gửi đến quý khách lời chúc sức khỏe và may mắn!<br>'
            + `MVP Dispensay xin chân thành cảm ơn quý khách đã tin tưởng và mua sắm tại mvpdispensary.com. Chúng tôi luôn cố gắng phấn đấu để đem đến cho quý khách những trải nghiệm trực tuyến tốt nhất có thể.`
            + '<br>'
            + `Chúng tôi vừa nhận được thanh toán từ quý khách cho 01 đơn hàng. Tuy nhiên, số tiền mà chúng tôi nhận được lại <b>không đủ để hoàn tất</b> việc thanh toán cho đơn hàng này. Cụ thể như sau:<br>`
            + createPaymentContent(params)
            + '<br>'
            + 'Để quý khách tiện theo dõi, sau đây là chi tiết của đơn hàng mà quý khách đã đặt:<br>'
            + createOrderContent(params)
            + '<br>'
            + 'Chúng tôi sẽ liên hệ với quý khách trong vòng 24 tiếng đồng hồ để đề nghị phương hướng giải quyết cụ thể. Nếu cần thiết, quý khách có thể liên hệ với chúng tôi qua những phương thức sau:<br>'
            + createContactContent()
            + '<br>'
            + 'Chúng tôi luôn cố gắng để trải nghiệm mua sắp tại mvpdispensary.com luôn được hoàn hảo. Tuy nhiên đôi lúc vẫn nảy sinh vấn đề. '
            + 'Xin quý khách vui lòng thông cảm và hợp lực cùng chúng tôi để vấn đề được giải quyết thỏa đáng. Xin chân thành cảm ơn quý khách!'
            + '<br>'
            + 'Trân trọng,'
        sendMail(content, true, params.customerEmail, `Đơn hàng chưa được thanh toán đầy đủ (${params.orderId})`, 'warning customer about a partially paid order');
    },
    sendPaymentConfirmEmailToCustomer: function (params) {
        let content = `Xin chào ${params.customerName},<br>`
            + 'Xin gửi đến quý khách lời chúc sức khỏe và may mắn!<br>'
            + `MVP Dispensay xin chân thành cảm ơn quý khách đã tin tưởng và mua sắm tại mvpdispensary.com. Chúng tôi luôn cố gắng phấn đấu để đem đến cho quý khách những trải nghiệm trực tuyến tốt nhất có thể.`
            + '<br>'
            + `Chúng tôi vừa nhận được thanh toán đủ từ quý khách cho 01 đơn hàng. Cụ thể như sau:<br>`
            + createPaymentContent(params)
            + '<br>'
            + 'Để quý khách tiện theo dõi, sau đây là chi tiết của đơn hàng mà quý khách đã đặt:<br>'
            + createOrderContent(params)
            + '<br>'
            + 'Chúng tôi sẽ tiến hàng xử lý đơn hàng và chuyển giao đến cho quý khách trong thời gian sớm nhất có thể. Nếu cần thiết, quý khách có thể liên hệ với chúng tôi qua những phương thức sau:<br>'
            + createContactContent()
            + '<br>'
            + 'Chúng tôi luôn cố gắng để trải nghiệm mua sắp tại mvpdispensary.com luôn được hoàn hảo. Xin chân thành cảm ơn quý khách!'
            + '<br>'
            + 'Trân trọng,'
        sendMail(content, true, params.customerEmail, `Đơn hàng đã được thanh toán đầy đủ (${params.orderId})`, 'notify customer about a fully paid order');
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

function createOrderContent(params) {
    let content = 'Chi tiết của đơn hàng'
        + `<table style='padding: 10px; border-spacing: 10px;'>`
        + '<tr>'
        + '<td>Tên khách hàng</td>'
        + `<td style='vertical-align: top;'><b>${params.customerName}</b></td>`
        + '</tr>'
        + '<tr>'
        + '<td>Email</td>'
        + `<td><b>${params.customerEmail}</b></td>`
        + '</tr>'
        + '<tr>'
        + `<td style='vertical-align: top;'>Địa chỉ giao hàng</td>`
        + `'<td>${params.deliveryAddress}</td>`
        + '</tr>'
        + '<tr>'
        + `<td style='vertical-align: top;'>Lưu ý</td>`
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
        + `<th style='text-align: left;'>Sản phẩm</th>`
        + `<th style='text-align: right;'>Số lượng</th>`
        + `<th style='text-align: right;'>Giá (USD)</th>`
        + `<th style='text-align: right;'>Thành tiền(USD)</th>`
        + '</tr>';
    for (let i = 0; i < params.orderDetail.length; i++) {
        let item = params.orderDetail[i];
        content = content + '<tr>'
            + `<td><b>${item.name}</b></td>`
            + `<td style='text-align: right;'>x ${item.quantity}</td>`
            + `<td style='text-align: right;'>${item.price}.${item.price_decimal}</td>`
            + `<td style='text-align: right;'>${item.quantity * (item.price + '.' + item.price_decimal)}</td>`
            + '</tr>';
    }
    content = content + '<tr>'
        + '<td></td>'
        + '<td></td>'
        + `<td style='text-align: right;'><b>Tổng thành tiền (USD)</b></td>`
        + `<td style='text-align: right;'><b>${params.orderTotal}</b></td>`
        + '</tr>'
        + '</table>';
    return content;
};

function createPaymentContent(params) {
    let content = `<table style='padding: 10px; border-spacing: 10px;'>`
        + '<tr>'
        + '<td>Tổng thành tiền của đơn hàng</td>'
        + `<td style='text-align: right;'><b>${params.orderTotal} USD</b></td>`
        + '</tr>'
        + '<tr>'
        + '<td>Số tiền phải trả</td>'
        + `<td style='text-align: right;'><b>${params.payAmount} ${params.payCurrency}</b></td>`
        + '</tr>'
        + '<tr>'
        + '<td>Số tiền đã trả</td>'
        + `<td style='text-align: right;'><b>${params.actuallyPaidAmount} ${params.payCurrency}</b></td>`
        + '</tr>'
        + '</table>';
    return content;
};

function createContactContent() {
    let content = `<table style='padding: 10px; border-spacing: 10px;'>`
        + '<tr>'
        + '<td>Email</td>'
        + `<td style='text-align: right;'><b>mvpdispensary2022@gmail.com</b></td>`
        + '</tr>'
        + '<tr>'
        + '<td>WhatsApp</td>'
        + `<td style='text-align: right;'><b>+19513994256</b></td>`
        + '</tr>'
        + '</table>';
    return content;
};
