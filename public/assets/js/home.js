window.addEventListener('load', async function () {
    let getProductListResult = await getProductList();
    if (!getProductListResult.result) {
        this.alert(getProductListResult.message);
        return;
    }
    window.categoryList = getProductListResult.categoryList;
    window.productList = getProductListResult.productList;
    populateCategoryMenuItem();
});

async function getProductList() {
    try {
        let response = await Common.sendToBackend('product/list');
        return {
            result: true,
            categoryList: response.categoryList,
            productList: response.productList,
        }
    } catch (error) {
        return {
            result: false,
            message: `Không thể nhận được danh sách sản phẩm (${error})`,
        }
    }
};

function populateCategoryMenuItem() {
    let ulCategory = document.getElementById('liProduct').childNodes[5];
    ulCategory.innerHTML = '';

    for (const categoryId in window.categoryList) {
        let category = window.categoryList[categoryId];
        let li = document.createElement('li');
        let a = document.createElement('a');
        a.setAttribute('href', `home.html#cat${categoryId}`);
        a.innerText = category.name.toString().toUpperCase();
        li.appendChild(a);
        ulCategory.appendChild(li);
    }
};
