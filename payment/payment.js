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
        let errorString = `${requestIp} Error when ${purpose}:`;
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
            common.consoleLogError(`${errorString} Email is not valid (${email}).`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        if (deliveryAddress == '') {
            let errorCode = 601;
            common.consoleLogError(`${errorString} Missing delivery address.`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        if (!common.isNumeric(total)) {
            let errorCode = 602;
            common.consoleLogError(`${errorString} Total is not a number (${total}).`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        let checkCartStringResult = checkCartString(cartString);
        if (!checkCartStringResult.result) {
            let errorCode = 610 + checkCartStringResult.errorCode;
            common.consoleLogError(`${errorString} ${checkCartStringResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        }

        let crossCheckDBDataResult =
            await crossCheckDBData(checkCartStringResult.itemList, checkCartStringResult.productIDList, requestIp);
        if (!crossCheckDBDataResult.result) {
            let errorCode = 620 + crossCheckDBDataResult.errorCode;
            common.consoleLogError(`${errorString} ${crossCheckDBDataResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, });
            return;
        } 1

        let resJson = {
            success: true,
            result: 0,
            url: 'mvpdispensary.com',
        };
        response.json(resJson);
        common.consoleLog(`${requestIp} Request for ${purpose} was successfully handled.`);
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
            if (itemInfo.length != 4) {
                return {
                    result: false,
                    errorCode: 1,
                    errorMessage: `Bad item info string (${itemString})`,
                };
            }
            let productId = itemInfo[0];
            let quantity = itemInfo[1];
            let price = itemInfo[2];
            let priceDecimal = itemInfo[3];
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
            if (!common.isNumeric(priceDecimal)) {
                return {
                    result: false,
                    errorCode: 5,
                    errorMessage: `Price decimal is NaN (${itemString})`,
                };
            }
            if (priceDecimal < 0 || priceDecimal > 99) {
                return {
                    result: false,
                    errorCode: 6,
                    errorMessage: `Invalid price decimal`,
                };
            }
            productIDList.push(productId);
            let item = {
                productId,
                quantity,
                price,
                priceDecimal,
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
        let dbItemList = result.sqlResults;
        for (let i = 0; i < itemList.length; i++) {
            let item = itemList[0];
            let matchId = false;
            let dbPrice = 0;
            let dbPriceDecimal = 0;
            let availability = 0;
            for (let j = 0; j < dbItemList.length; j++) {
                let dbItem = dbItemList[j];
                matchId = false;
                if (item.productId != dbItem.id) {
                    continue;
                }
                matchId = true;
                dbPrice = dbItem.price;
                dbPriceDecimal = dbItem.price_decimal;
                availability = dbItem.availability;
                break;
            }
            if (!matchId) {
                return {
                    result: false,
                    errorCode: 1,
                    errorMessage: `Product with id ${item.productId} does not exists in db`,
                };
            }
            if (item.price != dbPrice) {
                return {
                    result: false,
                    errorCode: 2,
                    errorMessage: `Product with id ${item.productId} does not match db price (${item.price} vs ${dbPrice})`,
                };
            }
            if (item.priceDecimal != dbPriceDecimal) {
                return {
                    result: false,
                    errorCode: 3,
                    errorMessage: `Product with id ${item.productId} does not match db price decimal (${item.priceDecimal} vs ${dbPriceDecimal})`,
                };
            }
            if (availability != 0) {
                return {
                    result: false,
                    errorCode: 4,
                    errorMessage: `Product with id ${item.productId} is no long available`,
                };
            }
        }
        return { result: true };
    }
};
