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
    Common.populateCategoryMenuItem(ulCategory, 'products.html?cat=');

    let param = createParam();
    document.getElementById('spanTitle').innerText = param.titleText;

    let idInList = populateProductList(param);
    populateProductSlider(idInList);

    Common.runScript();
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
        searchParam = decodeURI(searchParam);
        param.search = Common.toLowerCaseNonAccentVietnamese(searchParam);
        param.titleText = 'KẾT QUẢ TÌM KIẾM';
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

    let list = window.categoryList;
    let idInList = [];
    if (param.search != null) {
        list = Common.search(param.search);
        document.getElementById('inputSearch').value = param.search;
    }
    if (Object.keys(list).length < 1) {
        document.getElementById('divNoSearchResult').style.display = 'block';
        return idInList;
    }
    for (const categoryId in list) {
        if (param.category != null) {
            if (param.category != categoryId) {
                continue;
            }
        }
        let category = list[categoryId];
        if (param.search != null && category.searchResult == false) {
            continue;
        }
        let hCategoryTitle = document.createElement('h3');
        hCategoryTitle.classList.add('category-title');
        hCategoryTitle.innerText = category.name;
        hCategoryTitle.id = `cat${categoryId}`;
        divParent.appendChild(hCategoryTitle);

        for (const productId in category.productList) {
            let product = category.productList[productId];
            if (param.search != null && product.searchResult == false) {
                continue;
            }
            let divOuter = Common.createDivProduct(product);
            divParent.appendChild(divOuter);
            idInList.push(product.id);
        }
    }
    return idInList;
};


function populateProductSlider(idInList) {
    if (idInList.length == Object.keys(window.productList).length) {
        document.getElementById('divSliderOuter').style.display = 'none';
        return;
    }
    let outer = document.getElementById('divProductSlider');
    for (const id in window.productList) {
        if (idInList.indexOf(parseInt(id)) >= 0) {
            continue;
        }
        let product = window.productList[id];
        let div = Common.createDivProductSlider(product);
        outer.appendChild(div);
    }
};

