window.addEventListener('load', function () {
    let getProductListResult = await getProductList();
});

async function getProductList() {
    try {
        let response = await Common.sendToBackend('product/list');
        console.log(response);
    } catch (error) {
        console.log(error);
    }
};

