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
    divOuter.id = 'divOuter';
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
    if (Object.keys(cartItemList).length < 1) {
        divNoItem.style.display = 'block';
        return;
    }

    let divGrid = document.createElement('div');
    divGrid.id = 'divGrid';
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
            updateTotal(cartItemList)
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
            updateTotal(cartItemList)
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
                document.getElementById('divGrid').style.display = 'none';
                document.getElementById('divCheckout').style.display = 'none';
                return;
            }
            updateTotal(cartItemList);
        };
    }
    divGrid.lastChild.style['margin-bottom'] = '0px';

    createDivCheckout(divOuter, cartItemList);
};

function createDivCheckout(divOuter, cartItemList) {
    let divCheckout = document.createElement('div');
    divCheckout.id = 'divCheckout';
    divCheckout.classList = 'cart-checkout';
    divOuter.appendChild(divCheckout);

    let divTotal = document.createElement('div');
    divTotal.id = 'divTotal';
    divTotal.className = 'cart-total';
    divCheckout.appendChild(divTotal);
    updateTotal(cartItemList);

    let divCheckoutTitle = document.createElement('div');
    divCheckoutTitle.className = 'cart-checkout-title';
    divCheckoutTitle.innerText = 'THÔNG TIN NHẬN HÀNG';
    divCheckout.appendChild(divCheckoutTitle);

    let divCustomerNameLabel = document.createElement('div');
    divCustomerNameLabel.className = 'cart-checkout-label';
    divCustomerNameLabel.innerText = 'Họ tên (*)';
    divCheckout.appendChild(divCustomerNameLabel);

    let inputCustomerName = document.createElement('input');
    inputCustomerName.id = 'inputCustomerName';
    inputCustomerName.classList = 'cart-checkout-input';
    divCheckout.appendChild(inputCustomerName);

    let divCustomerNameValidation = document.createElement('div');
    divCustomerNameValidation.id = 'divCustomerNameValidation';
    divCustomerNameValidation.className = 'cart-checkout-validation';
    divCustomerNameValidation.innerText = 'Họ tên người nhận là bắt buộc';
    divCheckout.appendChild(divCustomerNameValidation);

    let divCustomerEmailLabel = document.createElement('div');
    divCustomerEmailLabel.className = 'cart-checkout-label';
    divCustomerEmailLabel.innerText = 'Email (*)';
    divCheckout.appendChild(divCustomerEmailLabel);

    let inputCustomerEmail = document.createElement('input');
    inputCustomerEmail.id = 'inputCustomerEmail';
    inputCustomerEmail.classList = 'cart-checkout-input';
    divCheckout.appendChild(inputCustomerEmail);

    let divCustomerEmailValidation = document.createElement('div');
    divCustomerEmailValidation.id = 'divCustomerEmailValidation';
    divCustomerEmailValidation.className = 'cart-checkout-validation';
    divCustomerEmailValidation.innerText = 'Email đúng để liên lạc là bắt buộc';
    divCheckout.appendChild(divCustomerEmailValidation);

    let divCustomerAddressLabel = document.createElement('div');
    divCustomerAddressLabel.className = 'cart-checkout-label';
    divCustomerAddressLabel.innerText = 'Địa chỉ (*)';
    divCheckout.appendChild(divCustomerAddressLabel);

    let inputCustomerAddress = document.createElement('textarea');
    inputCustomerAddress.id = 'inputCustomerAddress';
    inputCustomerAddress.classList = 'cart-checkout-textarea';
    divCheckout.appendChild(inputCustomerAddress);

    let divCustomerAddressValidation = document.createElement('div');
    divCustomerAddressValidation.id = 'divCustomerAddressValidation';
    divCustomerAddressValidation.className = 'cart-checkout-validation';
    divCustomerAddressValidation.innerText = 'Địa chỉ nhận hàng là bắt buộc';
    divCheckout.appendChild(divCustomerAddressValidation);

    let divCustomerNoteLabel = document.createElement('div');
    divCustomerNoteLabel.className = 'cart-checkout-label';
    divCustomerNoteLabel.innerText = 'Lưu ý';
    divCheckout.appendChild(divCustomerNoteLabel);

    let inputCustomerNote = document.createElement('textarea');
    inputCustomerNote.id = 'inputCustomerNote';
    inputCustomerNote.classList = 'cart-checkout-textarea';
    divCheckout.appendChild(inputCustomerNote);

    let divPay = document.createElement('div');
    divPay.className = 'cart-checkout-pay';
    divPay.innerText = 'THANH TOÁN';
    divCheckout.appendChild(divPay);
    divPay.onclick = function () {
        let validateResult = validateCustomerDetail();
        if (!validateResult.result) {
            return;
        }
        let sendData = makeInvoiceInput(cartItemList, validateResult);
        makeInvoice(sendData);
    };

    loadCustomerDetailFromStorage();
};

function updateSubTotal(item, product) {
    let itemId = item.itemId;
    let divSubTotal = document.getElementById(`st_${itemId}`);
    if (divSubTotal == null) {
        return 0;
    }
    let subTotal = item.quantity * `${product.price}.${product.priceDecimal}`;
    divSubTotal.innerText = `$${subTotal.toFixed(2)}`;
    return subTotal;
};

function updateTotal(cartItemList) {
    let total = 0;
    for (const itemId in cartItemList) {
        let item = cartItemList[itemId];
        let product = window.productList[item.productId];
        let subTotal = item.quantity * `${product.price}.${product.priceDecimal}`;
        total = total + subTotal;
    }
    document.getElementById('divTotal').innerHTML = `<b>Total</b>: $${total.toFixed(2)}`;
};

function validateCustomerDetail() {
    let allIsOk = true;
    let divValidationList = document.getElementsByClassName('cart-checkout-validation');
    for (let i = 0; i < divValidationList.length; i++) {
        divValidationList[i].style.display = 'none';
    }

    let customerName = document.getElementById('inputCustomerName').value;
    if (customerName.trim() == '') {
        document.getElementById('divCustomerNameValidation').style.display = 'block';
        allIsOk = false;
    }
    Common.saveToStorage({ customerName });

    let customerEmail = document.getElementById('inputCustomerEmail').value;
    if (!Common.validateEmail(customerEmail)) {
        document.getElementById('divCustomerEmailValidation').style.display = 'block';
        allIsOk = false;
    }
    Common.saveToStorage({ customerEmail });

    let customerAddress = document.getElementById('inputCustomerAddress').value;
    if (customerAddress.trim() == '') {
        document.getElementById('divCustomerAddressValidation').style.display = 'block';
        allIsOk = false;
    }
    Common.saveToStorage({ customerAddress });

    let customerNote = document.getElementById('inputCustomerNote').value;
    Common.saveToStorage({ customerNote });

    if (!allIsOk) {
        return { result: false };
    }

    return {
        result: true,
        name: customerName,
        email: customerEmail,
        address: customerAddress,
        note: customerNote,
    };
};

function makeInvoiceInput(cartItemList, validateResult) {
    let total = 0;
    let part = [];
    for (const itemId in cartItemList) {
        let item = cartItemList[itemId];
        let product = window.productList[item.productId];
        let subTotal = item.quantity * `${product.price}.${product.priceDecimal}`;
        total = total + subTotal;
        let string = `${product.id};${item.quantity};${product.price};${product.priceDecimal}`;
        part.push(string);
    }
    return {
        name: validateResult.name,
        email: validateResult.email,
        deliveryAddress: validateResult.address,
        note: validateResult.note,
        total,
        cartString: part.join('|||'),
    };
};

async function makeInvoice(sendData) {
    try {
        document.getElementById('divOuter').style.display = 'none';
        let response = await Common.sendToBackend('payment/make', sendData);
        window.location.href = response.invoiceLink;
        Common.saveToStorage({ cartItemList: '', });
    } catch (error) {
        alert(error);
    }
};

function loadCustomerDetailFromStorage() {
    let customerName = Common.loadFromStorage('customerName');
    document.getElementById('inputCustomerName').value = customerName || '';

    let customerEmail = Common.loadFromStorage('customerEmail');
    document.getElementById('inputCustomerEmail').value = customerEmail || '';

    let customerAddress = Common.loadFromStorage('customerAddress');
    document.getElementById('inputCustomerAddress').value = customerAddress || '';

    let customerNote = Common.loadFromStorage('customerNote');
    document.getElementById('inputCustomerNote').value = customerNote || '';
};  