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

        let inputParams = {
            email: (request.body.email || '').trim(),
            deliveryAddress: (request.body.deliveryAddress || '').trim(),
            note: (request.body.note || '').trim(),
            total: request.body.total || '',
        }
        let cartString = (request.body.cartString || '').trim();

        let checkInputParamResult = checkInputParam(inputParams);
        if (!checkInputParamResult.result) {
            let errorCode = 600 + checkInputParamResult.errorCode;
            common.consoleLogError(`${errorString} ${checkInputParamResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Dữ liệu nhận được không hợp lệ' });
            return;
        }

        let checkCartStringResult = checkCartString(cartString);
        if (!checkCartStringResult.result) {
            let errorCode = 610 + checkCartStringResult.errorCode;
            common.consoleLogError(`${errorString} ${checkCartStringResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Dữ liệu đặt mua nhận được không hợp lệ' });
            return;
        }

        let itemList = checkCartStringResult.itemList;
        let crossCheckDBDataResult =
            await crossCheckDBData(itemList, checkCartStringResult.productIDList, requestIp);
        if (!crossCheckDBDataResult.result) {
            let errorCode = 620 + crossCheckDBDataResult.errorCode;
            common.consoleLogError(`${errorString} ${crossCheckDBDataResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Thông tin sản phẩm đặt mua nhận được không hợp lệ' });
            return;
        }

        let crossCheckPriceTotalResult = crossCheckPriceTotal(itemList, inputParams.total);
        if (!crossCheckPriceTotalResult.result) {
            let errorCode = 630 + crossCheckPriceTotalResult.errorCode;
            common.consoleLogError(`${errorString} ${crossCheckPriceTotalResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Tổng giá tiền phải trả không đúng' });
            return;
        }

        let saveOrderToDBResult = await saveOrderToDB(inputParams, requestIp);
        if (!saveOrderToDBResult.result) {
            let errorCode = 640 + saveOrderToDBResult.errorCode;
            common.consoleLogError(`${errorString} ${saveOrderToDBResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Lỗi trong việc lưu đơn đặt hàng' });
            return;
        }

        let orderId = saveOrderToDBResult.insertId;
        let saveOrderDetailToDBResult = await saveOrderDetailToDB(itemList, orderId, requestIp);
        if (!saveOrderDetailToDBResult.result) {
            let errorCode = 650 + saveOrderDetailToDBResult.errorCode;
            common.consoleLogError(`${errorString} ${saveOrderDetailToDBResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Lỗi trong việc lưu chi tiết đơn đặt hàng' });
            return;
        }


        let resJson = {
            success: true,
            result: 0,
            url: 'mvpdispensary.com',
        };
        response.json(resJson);
        common.consoleLog(`${requestIp} Request for ${purpose} was successfully handled.`);
    });

    function checkInputParam(inputParams) {

        if (!common.validateEmail(inputParams.email)) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: 'Email is not valid',
            };
        }

        if (inputParams.deliveryAddress == '') {
            return {
                result: false,
                errorCode: 1,
                errorMessage: 'Missing delivery address',
            };
        }

        if (!common.isNumeric(inputParams.total)) {
            return {
                result: false,
                errorCode: 2,
                errorMessage: `Total is not a number (${inputParams.total})`,
            };
        }
        return { result: true, };
    };

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
        let sql = 'SELECT `product`.`id`, `product`.`name`, '
            + '`product`.`price`, `product`.`price_decimal`, `product`.`availability` '
            + 'FROM `mvpdispensary_data`.`product` WHERE `id` IN ' + `(${productIDList.join(',')})`;
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
            let item = itemList[i];
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
    };

    function crossCheckPriceTotal(itemList, inputTotal) {
        let total = 0;
        for (let i = 0; i < itemList.length; i++) {
            let item = itemList[i];
            let batchTotal = item.quantity * (item.price + '.' + item.priceDecimal);
            total = total + batchTotal;
        }
        if (inputTotal != total) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Input total price is not correct ($${inputTotal} vs ${total})`,
            };
        }
        return { result: true };
    };

    async function saveOrderToDB(inputParams, requestIp) {
        let sql = 'INSERT INTO `mvpdispensary_data`.`order` (`email`, `delivery_address`, `note`, `total`) VALUES '
            + '(?, ?, ?, ?)';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Save order to db',
        };

        let params = [inputParams.email, inputParams.deliveryAddress, inputParams.note, inputParams.total];
        let result = await db.query(logInfo, params);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }

        let insertId = result.sqlResults.insertId;
        return { result: true, insertId };
    };

    async function saveOrderDetailToDB(itemList, insertId, requestIp) {
        let sql = 'INSERT INTO `mvpdispensary_data`.`order_detail` (`order`, `product`, `quantity`, `price`, `price_decimal`) VALUES ';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Save order detail to db',
        };
        let sqlAddon = [];
        let params = [];
        for (let i = 0; i < itemList.length; i++) {
            let item = itemList[i];
            sqlAddon.push('(?, ?, ?, ?, ?)');
            params = params.concat([insertId, item.productId, item.quantity, item.price, item.priceDecimal]);
        }
        sql = sql + sqlAddon.join(', ');
        let result = await db.query(logInfo, params);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }
        return { result: true };
    };
};
