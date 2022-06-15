window.addEventListener('load', async function () {
    let getProductListResult = await Common.getProductList();
    if (!getProductListResult.result) {
        this.alert(getProductListResult.message);
        return;
    }
    window.categoryList = getProductListResult.categoryList;
    window.productList = getProductListResult.productList;

    let ulCategory = document.getElementById('liProduct').childNodes[5];
    if (ulCategory == null) {
        return;
    }
    ulCategory.style['margin-top'] = '20px';
    ulCategory.innerHTML = '';
    Common.populateCategoryMenuItem(ulCategory, 'products.html?cat=');

    let param = createParam();
    document.getElementById('spanTitle').innerText = param.titleText;
    populateProductList(param);
});

function createParam() {
    let param = {
        category: null,
        search: null,
        titleText: null,
    };
    let catParam = Common.getURLParameter('cat');
    if (catParam != null) {
        param.category = catParam;
        param.titleText = 'DANH SÁCH SẢN PHẨM';
        return param;
    }
    let searchParam = Common.getURLParameter('search');
    if (searchParam != null) {
        param.search = searchParam;
        param.titleText = 'DANH SÁCH SẢN PHẨM';
        return param;
    }
    param.titleText = 'TẤC CẢ SẢN PHẨM';
    return param;
};

function populateProductList(param) {
    let divParent = document.getElementById('gridProductParent');
    if (divParent == null) {
        return;
    }
    divParent.innerHTML = '';

    for (const categoryId in window.categoryList) {
        if (param.category != null) {
            if (param.category != categoryId) {
                continue;
            }
        }
        let category = window.categoryList[categoryId];
        let hCategoryTitle = document.createElement('h3');
        hCategoryTitle.classList.add('category-title');
        hCategoryTitle.innerText = category.name;
        hCategoryTitle.id = `cat${categoryId}`;
        divParent.appendChild(hCategoryTitle);

        for (const productId in category.productList) {
            let product = category.productList[productId];
            let divOuter = Common.createDivProduct(product);
            divParent.appendChild(divOuter);
        }
    }
};
