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
    Common.populateCategoryMenuItem(ulCategory, 'products.html?cat=');

    let product = getProduct();
    if (product == null) {
        window.location.href = 'products.html';
        return;
    }

    populateProductMainImage(product);
    populateProductOtherImage(product);
    populateProductText(product);
    populateProductSlider(product.id);

    Common.runScript();
});

function populateProductText(product) {
    document.getElementById('hProductName').innerText = product.name;
    document.getElementById('divDescription').innerHTML = product.description;
    let decimal = product.priceDecimal.toString();
    if (decimal.length < 2) {
        decimal = `${decimal}0`;
    }
    document.getElementById('spanFirstPrice').innerText = `$${product.price}.${decimal}`;
};

function getProduct() {
    let param = Common.getURLParameter('id');
    let product = window.productList[param];
    return product;
};

function populateProductMainImage(product) {
    let image = product.imageList[0];
    let imagePath = `assets/upload/product/${image.id}.${image.extension}`;
    let parent = document.getElementById('divImage');
    let a = document.createElement('a');
    a.setAttribute('href', imagePath);
    a.setAttribute('data-fancybox', 'gallery');
    a.setAttribute('tabindex', '0');
    a.className = 'gallery-link';
    parent.appendChild(a);

    let img = document.createElement('img');
    img.className = 'main-photo';
    img.src = imagePath;
    img.setAttribute('tabindex', '0');
    a.appendChild(img);

};

function populateProductOtherImage(product) {
    let outer = document.getElementById('divImage');
    let parent = document.createElement('div');
    parent.className = 'row gallery-list active';
    outer.appendChild(parent);

    for (let i = 0; i < product.imageList.length; i++) {
        let image = product.imageList[i];
        let div = document.createElement('div');
        div.className = 'col-3 gallery-item';
        parent.appendChild(div);

        let img = document.createElement('img');
        img.src = `assets/upload/product/${image.id}.${image.extension}`;
        div.appendChild(img);
    }
};

function populateProductSlider(productId) {
    let outer = document.getElementById('divProductSlider');
    for (const id in window.productList) {
        let product = window.productList[id];
        if (product.id == productId) {
            continue;
        }
        let div = Common.createDivProductSlider(product);
        outer.appendChild(div);
    }
};