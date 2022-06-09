const paymentConfig = require('./config.js');
const common = require('../common.js');
const systemConfig = require('../systemConfig.js');
const db = require('../db/db.js');
const axios = require('axios');
const crypto = require('crypto');

module.exports = function (app) {
    //#region /payment/make
    //a request payment is made
    app.post('/payment/make', async function (request, response) {
        let requestIp = common.getReadableIP(request);
        let purpose = 'processing an order';
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

        let checkNPGStatusResult = await checkNPGStatus();
        if (!checkNPGStatusResult.result) {
            let errorCode = 660 + checkNPGStatusResult.errorCode;
            common.consoleLogError(`${errorString} ${checkNPGStatusResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Lỗi trong việc xác định tình trạng của NPG' });
            return;
        }

        let createNPGInvoiceResult = await createNPGInvoice(orderId, itemList, inputParams.total);
        if (!createNPGInvoiceResult.result) {
            let errorCode = 670 + createNPGInvoiceResult.errorCode;
            common.consoleLogError(`${errorString} ${createNPGInvoiceResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Lỗi trong việc tạo ra hóa đơn thu tiền' });
            await updateOrderStatus(orderId, 2, requestIp);
            return;
        }

        let invoiceLink = createNPGInvoiceResult.invoiceLink;
        let saveNPGInvoiceToDBResult = await
            saveNPGInvoiceToDB(createNPGInvoiceResult.invoiceId,
                createNPGInvoiceResult.invoiceToken, orderId, invoiceLink, requestIp);
        if (!saveNPGInvoiceToDBResult.result) {
            let errorCode = 680 + saveNPGInvoiceToDBResult.errorCode;
            common.consoleLogError(`${errorString} ${saveNPGInvoiceToDBResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Lỗi trong việc lưu dữ liệu hóa đơn thu tiền' });
            await updateOrderStatus(orderId, 2, requestIp);
            return;
        }

        let resJson = {
            success: true,
            result: 0,
            invoiceLink,
        };
        response.json(resJson);
        await updateOrderStatus(orderId, 1, requestIp);
        common.consoleLog(`${requestIp} Request to ${purpose} was successfully handled.`);
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
            let dbName = '';
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
                dbName = dbItem.name;
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
            item.name = dbName;
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
        let sqlAddon = [];
        let params = [];
        for (let i = 0; i < itemList.length; i++) {
            let item = itemList[i];
            sqlAddon.push('(?, ?, ?, ?, ?)');
            params = params.concat([insertId, item.productId, item.quantity, item.price, item.priceDecimal]);
        }
        sql = sql + sqlAddon.join(', ');
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Save order detail to db',
        };
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

    // NPG: nowspayment gateway
    async function checkNPGStatus() {
        let config = {
            method: 'get',
            url: 'https://api.nowpayments.io/v1/status',
            headers: {},
        };
        try {
            let result = await axios(config);
            if ((result.data || {}).message == 'OK') {
                return { result: true };
            }
            return {
                result: false,
                errorCode: 0,
                errorMessage: `NPG is not online`,
            };
        } catch (error) {
            return {
                result: false,
                errorCode: 1,
                errorMessage: `Failed to check NPG status: ${error.message}`,
            };
        }
    };

    async function updateOrderStatus(orderId, status, requestIp) {
        let sql = 'UPDATE `mvpdispensary_data`.`order` SET `status` = ? WHERE `id` = ?';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: `Update order ${orderId} to status ${status}`,
        };

        let params = [orderId, status];
        let result = await db.query(logInfo, params);
        if (result.resultCode != 0) {
            common.consoleLogError(`${requestIp} Failed to update order ${orderId} to status ${status}.`);
        }
    };

    function createInvoiceDescription(itemList) {
        let parts = [];
        for (let i = 0; i < itemList.length; i++) {
            let item = itemList[i];
            let string = `${item.name} x ${item.quantity}`;
            parts.push(string);
        }
        return parts.join('; ');
    };

    async function createNPGInvoice(orderId, itemList, total) {
        let invoiceDescription = createInvoiceDescription(itemList);
        let data = JSON.stringify({
            price_amount: total,
            price_currency: 'usd',
            order_id: orderId,
            order_description: invoiceDescription,
            ipn_callback_url: paymentConfig.nowspayment.ipn_callback_url,
            success_url: paymentConfig.nowspayment.success_url,
            cancel_url: paymentConfig.nowspayment.cancel_url,
            partially_paid_url: paymentConfig.nowspayment.partially_paid_url,
        });

        let config = {
            method: 'post',
            url: 'https://api.nowpayments.io/v1/invoice',
            headers: {
                'x-api-key': paymentConfig.nowspayment.apiKey,
                'Content-Type': 'application/json'
            },
            data: data
        };

        try {
            let result = await axios(config);
            let invoiceId = result.data.id;
            let invoiceToken = result.data.token_id;
            let invoiceLink = result.data.invoice_url;
            return { result: true, invoiceId, invoiceToken, invoiceLink, };
        } catch (error) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Failed to generate invoice: ${error.message}`,
            };
        }
    };

    async function saveNPGInvoiceToDB(invoiceId, invoiceToken, orderId, invoiceLink, requestIp) {
        let sql = 'INSERT INTO `mvpdispensary_data`.`invoice_npg` (`id`, `token`, `order`, `link`) '
            + 'VALUES (?, ?, ?, ?)';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Save NPG invoice to db',
        };
        let params = [invoiceId, invoiceToken, orderId, invoiceLink];
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
    //#endregion

    //#region /invoice/update
    // webhook to listen to NPG invoice updates
    app.post('/invoice/update', async function (request, response) {
        let requestIp = common.getReadableIP(request);
        let purpose = 'process an invoice status update from NPG';
        let errorString = `${requestIp} Error when ${purpose}:`;
        common.consoleLog(`${requestIp} requested to ${purpose}.`);

        if (!compareIPNSignature(request)) {
            let errorCode = 600;
            common.consoleLogError(`${errorString} Signatures do not match.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Signatures do not match.' });
            return;
        }
        let resJson = {
            success: true,
            message: 'Update received. Thank you!',
        };
        response.json(resJson);

        let params = {
            paymentId: request.body.payment_id,
            paymentStatus: request.body.payment_status,
            payAddress: request.body.pay_address,
            payAmount: request.body.pay_amount,
            actuallyPaidAmount: request.body.actually_paid,
            paidCurrency: request.body.pay_currency,
            orderDescription: request.body.order_description,
            purchaseId: request.body.purchase_id,
            outcomeAmount: request.body.outcome_amount,
            outcomeCurrency: request.body.outcome_currency,
            invoiceId: request.body.invoice_id,
            orderId: request.body.order_id,
        };
        let updateInvoiceDetailsResult = await updateInvoiceDetails(params, requestIp);
        if (!updateInvoiceDetailsResult.result) {
            common.consoleLogError(`${errorString} ${updateInvoiceDetailsResult.errorMessage}.`);
            return;
        }

        if (params.status == 'finished' || params.status == 'partially_paid') {
            let getOrderDetailFromDbResult = await getOrderDetailFromDb(params.orderId);
            if (!getOrderDetailFromDbResult.result) {
                common.consoleLogError(`${errorString} ${getOrderDetailFromDbResult.errorMessage}.`);
                return;
            }
            console.log(getOrderDetailFromDbResult.orderInfo);
        }


        common.consoleLog(`${requestIp} Request to ${purpose} was successfully handled.`);
    });

    function compareIPNSignature(request) {
        let receiverSignature = request.headers['x-nowpayments-sig'];
        const hmac = crypto.createHmac('sha512', paymentConfig.nowspayment.ipn.toString());
        hmac.update(JSON.stringify(request.body, Object.keys(request.body).sort()));
        const signature = hmac.digest('hex');
        if (receiverSignature != signature) {
            return { result: false, };
        }
        return { result: true };
    };

    async function updateInvoiceDetails(params, requestIp) {
        let sql = 'UPDATE `mvpdispensary_data`.`invoice_npg` SET ' +
            '`updated_at` = NOW(), ' +
            '`payment_id` = ?, ' +
            '`status` = ?, ' +
            '`pay_address` = ?, ' +
            '`pay_amount` = ?, ' +
            '`actually_paid` = ?, ' +
            '`pay_currency` = ?, ' +
            '`order_description` = ?, ' +
            '`purchase_id` = ?, ' +
            '`outcome_amount` = ?, ' +
            '`outcome_currency` = ?, ' +
            'WHERE `id` = ? AND `order` = ?';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Update NPG invoice',
        };
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

    async function getOrderDetailFromDb(orderId) {
        let sql = 'SELECT `order`.`email`, `order`.`delivery_address`, `order`.`note`, `order`.`total` '
        'FROM `mvpdispensary_data`.`order` WHERE `order`.`id` = ?';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'Get order detail from db',
        };
        let params = [orderId];
        let result = await db.query(logInfo, params);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }
        return { result: true, orderInfo: result.sqlResults, };
    };
    //#endregion
};
