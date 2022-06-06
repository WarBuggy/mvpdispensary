const paymentConfig = require('./config.js');
const common = require('../common.js');
const systemConfig = require('../systemConfig.js');
const db = require('../db/db.js');
const { isNumeric } = require('../common.js');

module.exports = function (app) {
    //#region /api/payment/make
    //a request payment is made
    app.post('/payment/make', async function (request, response) {
        let requestIp = common.getReadableIP(request);
        let purpose = 'make a payment';
        common.consoleLog(`${requestIp} requested to ${purpose}.`);

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
            let errorCode = 610 + checkCartStringResult.errorCode;
            common.consoleLogError(`Error when ${purpose}: ${checkCartStringResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        let crossCheckDBDataResult =
            await crossCheckDBData(checkCartStringResult.itemList, checkCartStringResult.productIDList, requestIp);
        if (!crossCheckDBDataResult.result) {
            let errorCode = 620 + crossCheckDBDataResult.errorCode;
            common.consoleLogError(`Error when ${purpose}: ${crossCheckDBDataResult.errorMessage}.`);
            response.status(errorCode);
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
        return { result: true, itemList, productIDList, };
    };

    async function crossCheckDBData(itemList, productIDList, requestIp) {
        let sql = `SELECT \`product\`.\`id\`, \`product\`.\`name\`, 
            \`product\`.\`price\`, \`product\`.\`price_decimal\`, \`product\`.\`availability\` 
            FROM \`mvpdispensary_data\`.\`product\` WHERE \`id\` IN (${productIDList.join(',')})`;
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Cross check product db data',
        };
        let result = await db.query(logInfo);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }
        let dbData = result.sqlResults;
        if (itemList.length != dbData.length) {
            return {
                result: false,
                errorCode: 1,
                errorMessage: `At least one product does not exist in database`,
            };
        }
        return { result: true };
    };
};
