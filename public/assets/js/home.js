window.addEventListener('load', async function () {
    let getProductListResult = await getProductList();
    if (!getProductListResult.result) {
        this.alert(getProductListResult.message);
        return;
    }
    window.categoryList = getProductListResult.categoryList;
    window.productList = getProductListResult.productList;
    populateCategoryMenuItem();
    populateProductList();
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
    if (ulCategory == null) {
        return;
    }
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

            let divOuter = document.createElement('div');
            divOuter.className = 'col-12 col-md-6 col-lg-4 col-xl-3 aos-init aos-animate';
            divOuter.setAttribute('data-aos', 'fade-up');
            divOuter.setAttribute('data-aos-duration', '500');
            divOuter.style.cursor = 'pointer';
            divOuter.style.maxWidth = '100%';
            divParent.appendChild(divOuter);

            let divInner = document.createElement('div');
            divInner.className = 'product-item aos-init aos-animate';
            divInner.setAttribute('data-aos', 'fade-up');
            divInner.setAttribute('data-aos-duration', '500');
            divOuter.appendChild(divInner);

            let a = document.createElement('a');
            a.setAttribute('href', `product?id=${productId}`);
            divInner.appendChild(a);

            if (product.imageList.length > 0) {
                let imageFirst = product.imageList[0];
                let spanFirstImage = document.createElement('span');
                spanFirstImage.className = 'st-photo';
                spanFirstImage.style.backgroundImage = `url('assets/upload/product/${imageFirst.id}.${imageFirst.extension}')`;
                a.appendChild(spanFirstImage);
            }
            let secondImageIndex = 0;
            if (product.imageList.length > 1) {
                secondImageIndex = 1;
            }
            let imageSecond = product.imageList[secondImageIndex];
            let spanSecondImage = document.createElement('span');
            spanSecondImage.className = 'nd-photo';
            spanSecondImage.style.backgroundImage = `url('assets/upload/product/${imageSecond.id}.${imageSecond.extension}')`;
            a.appendChild(spanSecondImage);

            let spanPriceOuter = document.createElement('span');
            spanPriceOuter.className = 'price';
            a.appendChild(spanPriceOuter);

            let spanPrice = document.createElement('span');
            spanPrice.className = 'currency';
            spanPrice.innerText = `$${product.price}.${product.priceDecimal}`;
            spanPriceOuter.appendChild(spanPrice);

            let p = document.createElement('p');
            p.className = 'product-name';
            p.innerText = product.name.toUpperCase();
            a.appendChild(p);
        }
    }
};

/*
<div class="col-12 col-md-6 col-lg-4 col-xl-3 aos-init aos-animate" data-aos="fade-up" data-aos-duration="500">

    <div class="product-item sale aos-init aos-animate" data-aos="fade-up" data-aos-duration="500">
        <a href="product-content.html">
            <span class="st-photo" style="background-image: url('assets/upload/product-1.png');"></span>
            <span class="nd-photo" style="background-image: url('assets/upload/product-1.jpg');"></span>
            <span class="price">
                <span class="old-price"><span class="currency"></span>300.00</span>
                <span class="currency"></span>50.00 - <span class="currency">150.00</span>
            </span>
            <p class="product-name">ACAPULCO GOLD 25TH ANNIVERSARY CART</p>
        </a>
    </div>
</div>
*/