window.addEventListener('load', async function () {
    Common.addEnterEventForSearch();

    let getProductListResult = await Common.getProductList();
    if (!getProductListResult.result) {
        Common.show(getProductListResult.message);
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
    Common.populateCategoryMenuItem(ulCategory, `home.html#cat`);
    populateProductList();

    Common.runScript();
});

function populateProductList() {
    let divParent = document.getElementById('gridProductParent');
    if (divParent == null) {
        return;
    }
    divParent.innerHTML = '';

    let categoryWithPriorityList = [];
    for (const categoryId in window.categoryList) {
        let category = window.categoryList[categoryId];
        categoryWithPriorityList.push({
            id: categoryId,
            priority: category.priority,
        });
    }
    categoryWithPriorityList.sort(function (a, b) {
        return b.priority - a.priority;
    });

    for (let i = 0; i < categoryWithPriorityList.length; i++) {
        let categoryId = categoryWithPriorityList[i].id;
        let category = window.categoryList[categoryId];
        let hCategoryTitle = document.createElement('h3');
        hCategoryTitle.classList.add('category-title');
        hCategoryTitle.id = `cat${categoryId}`;
        divParent.appendChild(hCategoryTitle);
        let a = document.createElement('a');
        a.setAttribute('href', `products.html?cat=${categoryId}`);
        a.innerText = category.name;
        hCategoryTitle.appendChild(a);

        for (const productId in category.productList) {
            let product = category.productList[productId];
            let divOuter = Common.createDivProduct(product);
            divParent.appendChild(divOuter);
        }
    }
};