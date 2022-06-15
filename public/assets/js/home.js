window.addEventListener('load', async function () {
    Common.addEnterEventForSearch();

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
    Common.populateCategoryMenuItem(ulCategory, 'home.html#cat');
    populateProductList();
});

function populateProductList() {
    let divParent = document.getElementById('gridProductParent');
    if (divParent == null) {
        return;
    }
    divParent.innerHTML = '';

    for (const categoryId in window.categoryList) {
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