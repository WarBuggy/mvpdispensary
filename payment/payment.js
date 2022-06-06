const paymentConfig = require('./config.js');
const common = require('../common.js');
const systemConfig = require('../systemConfig.js');
const db = require('../db/db.js');
const { isNumeric } = require('../common.js');

module.exports = function (app) {
    //#region /api/payment/make
    //a request payment is made
    app.post('/payment/make', function (request, response) {
        let requestIp = common.getReadableIP(request);
        let purpose = 'making a payment';
        common.consoleLog(`(${requestIp}) Received request for ${purpose}.`);

        let cartString = (request.body.cartString || '').trim();
        let email = (request.body.email || '').trim();
        let deliveryAddress = (request.body.deliveryAddress || '').trim();
        let note = (request.body.note || '').trim();
        let total = request.body.total || '';

        console.log(`cartString: ${cartString}`);
        console.log(`email: ${email}`);
        console.log(`deliveryAddress: ${deliveryAddress}`);
        console.log(`note: ${note}`);
        console.log(`total: ${total}`);

        if (!common.validateEmail(email)) {
            let errorCode = 600;
            common.consoleLogError(`Error when ${purpose}: Email is not valid (${email}).`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        if (deliveryAddress == '') {
            let errorCode = 601;
            common.consoleLogError(`Error when ${purpose}: Missing delivery address.`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        if (!common.isNumeric(total)) {
            let errorCode = 602;
            common.consoleLogError(`Error when ${purpose}: Total is not a number (${total}).`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        let checkCartStringResult = checkCartString(cartString);
        if (!checkCartStringResult.result) {
            let errorCode = 603;
            common.consoleLogError(`Error when ${purpose}: ${checkCartStringResult.errorMessage}.`);
            response.status(errorCode + checkCartStringResult.errorCode);
            response.json({ success: false, });
            return;
        }

        let resJson = {
            success: true,
            result: 0,
            url: 'mvpdispensary.com',
        };
        response.json(resJson);
        common.consoleLog(`(${requestIp}) Request for ${purpose} was successfully handled.`);
    });

    function checkCartString(cartString) {
        if (cartString == '') {
            return {
                result: false,
                errorCode: 0,
                errorMessage: 'Empty cart',
            };
        }

        let itemStringList = cartString.split('|||');
        let productIDList = [];
        let itemList = [];
        for (let i = 0; i < itemStringList.length; i++) {
            let itemString = itemStringList[i];
            let itemInfo = itemString.split(';');
            if (itemInfo.length != 3) {
                return {
                    result: false,
                    errorCode: 1,
                    errorMessage: `Bad item info string (${itemString})`,
                };
            }
            let productId = itemInfo[0];
            let quantity = itemInfo[1];
            let price = itemInfo[2];
            if (!common.isNumeric(productId)) {
                return {
                    result: false,
                    errorCode: 2,
                    errorMessage: `Product ID is NaN (${itemString})`,
                };
            }
            if (!common.isNumeric(quantity)) {
                return {
                    result: false,
                    errorCode: 3,
                    errorMessage: `Purchase quantity is NaN (${itemString})`,
                };
            }
            if (!common.isNumeric(price)) {
                return {
                    result: false,
                    errorCode: 4,
                    errorMessage: `Price is NaN (${itemString})`,
                };
            }
            productIDList.push(productId);
            let item = {
                productId,
                quantity,
                price,
            };
            itemList.push(item);
        }
        return { result: true, itemList, };
    };
};
