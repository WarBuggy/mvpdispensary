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
    let cartItemArray = [];
    let cartItemList = Common.loadFromStorage('cartItemList');
    if (cartItemList == null) {
        return cartItemArray;
    }
    let listPart = cartItemList.split('|||');
    console.log(listPart);
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
        cartItemArray.push(item);
    }
    return cartItemArray;
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
    divClose.innerText = 'X';
    divClose.onclick = function () {
        document.body.removeChild(divBackground);
    };
    divOuter.appendChild(divClose);

    if (cartItemList.length < 1) {
        let div = document.createElement('div');
        div.classList = 'cart-no-item';
        div.innerText = 'Quý khách chưa chọn món hàng nào.\nXin vui lòng xem qua các sản phẩm của chúng tôi và nhấn nút cho vào giỏ hàng!';
        divOuter.appendChild(div);
        return;
    }
};