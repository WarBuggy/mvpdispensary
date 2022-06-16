window.showCart = function () {
    let cartItemList = getItemList();
    createCartPopup(cartItemList);
};

window.addToCart = function () {
    let id = Common.getURLParameter('id');
    if (id == null) {
        return;
    }
    let product = window.productList[id];
    if (product == null) {
        return;
    }
    let cartItemList = Common.loadFromStorage('cartItemList');
    if (cartItemList == null) {
        cartItemList = '';
    }

    let cartItemString = `|||${(new Date()).getTime()};${product.id};1`;
    cartItemList = cartItemList + cartItemString;

    Common.saveToStorage({ cartItemList, });

    showCart();
};

function getItemList() {
    let cartItemObject = {};
    let cartItemList = Common.loadFromStorage('cartItemList');
    if (cartItemList == null) {
        return cartItemObject;
    }
    let listPart = cartItemList.split('|||');
    for (let i = 0; i < listPart.length; i++) {
        let itemString = listPart[i];
        let part = itemString.split(';');
        if (part.length != 3) {
            continue;
        }
        let item = {
            itemId: part[0],
            productId: part[1],
            quantity: part[2],
        }
        cartItemObject[item.itemId] = item;
    }
    return cartItemObject;
};

function saveCartItemListToStorage(cartItemList) {
    let part = []
    for (const itemId in cartItemList) {
        let item = cartItemList[itemId];
        let string = `${itemId};${item.productId};${item.quantity}`;
        part.push(string);
    }
    Common.saveToStorage({ cartItemList: part.join('|||'), });
};

function createCartPopup(cartItemList) {
    let divBackground = document.createElement('div');
    divBackground.className = 'popup-background';
    document.body.appendChild(divBackground);

    let divOuter = document.createElement('div');
    divOuter.className = 'cart-outer';
    divBackground.appendChild(divOuter);

    let divTop = document.createElement('div');
    divTop.className = 'cart-top';
    divTop.innerText = 'Giỏ hàng';
    divOuter.appendChild(divTop);

    let divClose = document.createElement('div');
    divClose.className = 'cart-close';
    divClose.innerText = 'Đóng';
    divClose.onclick = function () {
        document.body.removeChild(divBackground);
    };
    divOuter.appendChild(divClose);

    let divNoItem = document.createElement('div');
    divNoItem.id = 'divCartNoItem';
    divNoItem.classList = 'cart-no-item';
    divNoItem.innerText = 'Quý khách chưa chọn món hàng nào.\nXin vui lòng xem qua các sản phẩm của chúng tôi và nhấn nút cho vào giỏ hàng!';
    divOuter.appendChild(divNoItem);
    if (Object.keys(cartItemList).length > 0) {
        divNoItem.style.display = 'none';
        return;
    }

    let divGrid = document.createElement('div');
    divGrid.className = 'cart-grid';
    divOuter.appendChild(divGrid);

    for (const itemId in cartItemList) {
        let item = cartItemList[itemId];
        let product = window.productList[item.productId];
        let image = product.imageList[0];
        let productLink = `product-content.html?id=${product.id}`;
        let divQuantityId = `quantity_${itemId}`;

        let divGridItem = document.createElement('div');
        divGridItem.className = 'cart-item';
        divGridItem.id = itemId;
        divGrid.appendChild(divGridItem);


        let aImage = document.createElement('a');
        aImage.setAttribute('href', productLink);
        aImage.className = 'cart-item-image-a';
        divGridItem.appendChild(aImage);
        let divItemImage = document.createElement('div');
        divItemImage.className = 'cart-item-image';
        divItemImage.style.backgroundImage = `url(assets/upload/product/${image.id}.${image.extension})`;
        aImage.appendChild(divItemImage);

        let aName = document.createElement('a');
        aName.className = 'cart-item-name-a';
        aName.setAttribute('href', productLink);
        divGridItem.appendChild(aName);
        let divItemName = document.createElement('div');
        divItemName.className = 'cart-item-name';
        let productName = product.name;
        if (productName.length >= 42) {
            productName = `${product.name.substring(0, 40)}...`;
        }
        divItemName.innerText = productName;
        aName.appendChild(divItemName);


        let divMinus = document.createElement('div');
        divMinus.className = 'cart-item-minus';
        divMinus.innerText = '-';
        if (item.quantity <= 1) {
            divMinus.style.display = 'none';
        }
        divGridItem.appendChild(divMinus);
        divMinus.id = `minus_${itemId}`;
        divMinus.onclick = function () {
            let thisItemId = this.id.split('minus_')[1];
            let thisDivQuantity = document.getElementById(`quantity_${thisItemId}`);
            if (thisDivQuantity == null) {
                return;
            }
            let quantity = parseInt(thisDivQuantity.innerText);
            if (!Common.isNumeric(quantity)) {
                return;
            }
            if (quantity <= 1) {
                return;
            }
            quantity = quantity - 1;
            thisDivQuantity.innerText = quantity;
            if (quantity <= 1) {
                this.style.display = 'none';
            }
            cartItemList[thisItemId].quantity = quantity;
            saveCartItemListToStorage(cartItemList);
            updateSubTotal(item, product);
        };

        let divQuantity = document.createElement('div');
        divQuantity.className = 'cart-item-quantity';
        divQuantity.innerText = item.quantity;
        divQuantity.id = divQuantityId;
        divGridItem.appendChild(divQuantity);

        let divPlus = document.createElement('div');
        divPlus.className = 'cart-item-plus';
        divPlus.innerText = '+';
        divGridItem.appendChild(divPlus);
        divPlus.id = `plus_${itemId}`;
        divPlus.onclick = function () {
            let thisItemId = this.id.split('plus_')[1];
            let thisDivQuantity = document.getElementById(`quantity_${thisItemId}`);
            if (thisDivQuantity == null) {
                return;
            }
            let quantity = parseInt(thisDivQuantity.innerText);
            if (!Common.isNumeric(quantity)) {
                return;
            }
            if (quantity < 1) {
                quantity = 1;
            }
            quantity = quantity + 1;
            if (quantity > 1) {
                document.getElementById(`minus_${thisItemId}`).style.display = 'block';
            }
            thisDivQuantity.innerText = quantity;
            cartItemList[thisItemId].quantity = quantity;
            saveCartItemListToStorage(cartItemList);
            updateSubTotal(item, product);
        };

        let divSubTotal = document.createElement('div');
        divSubTotal.id = `st_${itemId}`;
        divSubTotal.className = 'cart-sub-total';
        divGridItem.appendChild(divSubTotal);
        updateSubTotal(item, product);

        let divDelete = document.createElement('div');
        divDelete.id = `del_${itemId}`;
        divDelete.className = 'cart-item-delete';
        divDelete.innerText = 'X';
        divGridItem.appendChild(divDelete);
        divDelete.onclick = function () {
            let thisItemId = this.id.split('del_')[1];
            let thisDivGridItem = document.getElementById(thisItemId);
            divGrid.removeChild(thisDivGridItem);
            delete cartItemList[thisItemId];
            saveCartItemListToStorage(cartItemList);
            if (Object.keys(cartItemList).length < 1) {
                document.getElementById('divCartNoItem').style.display = 'block';
            }
        };
    }
};

function updateSubTotal(item, product) {
    let itemId = item.itemId;
    let divSubTotal = document.getElementById(`st_${itemId}`);
    if (divSubTotal == null) {
        return;
    }
    let subTotal = item.quantity * `${product.price}.${product.priceDecimal}`;
    divSubTotal.innerText = `$${subTotal.toFixed(2)}`;
};