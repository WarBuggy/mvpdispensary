window.createOrder = async function () {
    let sendData = {
        email: 'tester@zacbdefz.com',
        deliveryAddress: '233 Acbfkfe St, ACBDEF, EKLMN, VIM',
        note: 'Xin giao hàng vào lúc tối. Gọi số 0xxx xxx xxx để nhận hàng',
        total: 300,
        cartString: '4;1;4;0',
    };
    try {
        let response = await Common.sendToBackend('payment/make', sendData);
        window.location.href = response.invoiceLink;
    } catch (error) {
        console.log(error);
    }
};