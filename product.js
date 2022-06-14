const common = require('./common.js');
const db = require('./db/db.js');

module.exports = function (app) {
    app.post('/product/list', async function (request, response) {
        let requestIp = common.getReadableIP(request);
        let purpose = 'get product data';
        let errorString = `${requestIp} Error when ${purpose}:`;
        common.consoleLog(`${requestIp} Requested to ${purpose}.`);

        let getCategoryResult = await getCategory(requestIp);
        if (!getCategoryResult.result) {
            let errorCode = 600 + getCategoryResult.errorCode;
            common.consoleLogError(`${errorString} ${getCategoryResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Không thể lấy thông tin phân loại sản phẩm', });
            return;
        }
        let categoryList = getCategoryResult.categoryList;
        let getProductResult = await getProduct(requestIp);
        if (!getProductResult.result) {
            let errorCode = 610 + getProductResult.errorCode;
            common.consoleLogError(`${errorString} ${getProductResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Không thể lấy thông tin sản phẩm', });
            return;
        }
        let productList = getProductResult.productList;
        let productImageListResult = await getProductImage(requestIp);
        if (!productImageListResult.result) {
            let errorCode = 620 + productImageListResult.errorCode;
            common.consoleLogError(`${errorString} ${productImageListResult.errorMessage}.`);
            response.status(errorCode);
            response.json({ success: false, message: 'Không thể lấy thông tin hình sản phẩm', });
            return;
        }
        let productImageList = productImageListResult.productImageList;
        processCategoryAndProductList(categoryList, productList, productImageList);
        let resJson = {
            success: true,
            result: 0,
            categoryList,
            productList,
        };
        response.json(resJson);
        common.consoleLog(`${requestIp} Request to ${purpose} was successfully handled.`);
    });

    function processCategoryAndProductList(categoryList, productList, productImageList) {
        for (const categoryId in categoryList) {
            let category = categoryList[categoryId];
            category.productList = {};
            for (const productId in productList) {
                let product = productList[productId];
                if (product.categoryId != categoryId) {
                    continue;
                }
                let id = product.id;
                let name = product.name;
                let description = product.description;
                let price = product.price;
                let priceDecimal = product.priceDecimal;
                let availability = product.availability;
                let priority = product.priority;
                category.productList[id] = {
                    id, name, description, price, priceDecimal, availability, priority,
                    imageList: productImageList[id],
                };
                product.categoryName = category.name;
                product.categoryPriority = category.priority;
                product.imageList = productImageList[id];
            }
        }
    };

    async function getCategory(requestIp) {
        let sql = 'SELECT `category`.`id`, `category`.`name`, `category`.`priority` '
            + 'FROM `mvpdispensary_data`.`category` WHERE `enable` = 0 '
            + 'ORDER BY `priority` DESC';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'get category list',
        };
        let result = await db.query(logInfo);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }
        let categoryList = {};
        for (let i = 0; i < result.sqlResults.length; i++) {
            let category = result.sqlResults[i];
            let id = category.id;
            let name = category.name;
            let priority = category.priority;
            categoryList[id] = {
                id, name, priority,
            };
        }
        return { result: true, categoryList, };
    };


    async function getProduct(requestIp) {
        let sql = 'SELECT `product`.`id`, `product`.`name`, `product`.`description`, `product`.`price`, '
            + '`product`.`availability`, `product`.`priority`, `product`.`price_decimal`, `product`.`category` '
            + 'FROM `mvpdispensary_data`.`product` WHERE `enable` = 0 ORDER BY `priority` DESC';
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'get product list',
        };
        let result = await db.query(logInfo);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }
        let productList = {};
        for (let i = 0; i < result.sqlResults.length; i++) {
            let product = result.sqlResults[i];
            let id = product.id;
            let name = product.name;
            let description = product.description;
            let price = product.price;
            let priceDecimal = product.price_decimal;
            let availability = product.availability;
            let priority = product.priority;
            let categoryId = product.category;
            productList[id] = {
                id, name, description, price, priceDecimal, availability, priority, categoryId,
            };
        }
        return { result: true, productList, };
    };

    async function getProductImage(requestIp) {
        let sql = 'SELECT PI.`id`, PI.`product`, PI.`priority`, PI.`extension` '
            + 'FROM `mvpdispensary_data`.`product_image` PI, `mvpdispensary_data`.`product` P '
            + 'WHERE PI.enable = 0 AND P.`id` = PI.`product` AND P.`enable` = 0 '
            + 'ORDER BY PI.`product`, PI.`priority` DESC;'
        let logInfo = {
            username: 99,
            sql,
            userIP: requestIp,
            purpose: 'get product image list',
        };
        let result = await db.query(logInfo);
        if (result.resultCode != 0) {
            return {
                result: false,
                errorCode: 0,
                errorMessage: `Database error`,
            };
        }
        let productImageList = {};
        for (let i = 0; i < result.sqlResults.length; i++) {
            let productImage = result.sqlResults[i];
            let productId = productImage.product;
            let imageList = productImageList[productId];
            if (imageList == null) {
                imageList = [];
                productImageList[productId] = imageList;
            }
            let image = {
                id: productImage.id,
                product: productImage,
                priority: productImage.priority,
                extension: productImage.extension,
            };
            imageList.push(image);
        }
        return { result: true, productImageList, };
    };

};