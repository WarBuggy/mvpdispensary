const paymentConfig = require('./config.js');
const common = require('../common.js');
const systemConfig = require('../systemConfig.js');
const db = require('../db/db.js');

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

        console.log(`cartString: ${cartString}`);
        console.log(`email: ${email}`);
        console.log(`deliveryAddress: ${deliveryAddress}`);
        console.log(`note: ${note}`);

        if (!common.validateEmail(email)) {
            let errorCode = 600;
            common.consoleLogError(`Error when ${purpose}: Email is not valid (${email})`);
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
};
