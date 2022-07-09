class SystemMessage {
    static showMessageInfo(message, buttonLabel, closeBackground, callback) {
        let divBackground = SystemMessage.getDivBackground();
        let divOuter = document.createElement('div');
        divOuter.classList = 'message-info-outer';
        divBackground.appendChild(divOuter);

        let divTitle = document.createElement('div');
        divTitle.classList = 'message-info-title';
        divTitle.innerText = 'Thông báo';
        divOuter.appendChild(divTitle);

        let divMessage = document.createElement('div');
        divMessage.classList = 'message-info-message';
        divMessage.innerHTML = message;
        divOuter.appendChild(divMessage);

        let divButton = document.createElement('div');
        divButton.classList = 'message-info-button';
        divButton.innerText = buttonLabel;
        if (buttonLabel == null) {
            divButton.innerText = 'OK';
        }
        divOuter.appendChild(divButton);
        divButton.onclick = function () {
            let divBackground = document.getElementById('divCartBackground');
            if (closeBackground === false) {
                divBackground.removeChild(divOuter);
            } else {
                document.body.removeChild(divBackground);
            }
            if (callback) {
                callback();
            }
        };
    };

    static getDivBackground() {
        let divBackground = document.getElementById('divCartBackground');
        if (divBackground == null) {
            divBackground = document.createElement('div');
            divBackground.id = 'divCartBackground';
            divBackground.className = 'popup-background';
            document.body.appendChild(divBackground);
        }
        return divBackground;
    };
};

class Common {
    static sendToBackend(webPart, dataJson) {
        let url = window.BACKEND_URL + webPart;
        return new Promise(function (resolve, reject) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        Common.parseJSON(this['response'])
                            .then(function (parseResult) {
                                resolve(parseResult);
                            })
                            .catch(function () {
                                reject('Không đọc được thông tin từ server.\n'
                                    + 'Xin vui lòng liên hệ admin của hệ thống! (909)');
                            });
                    } else if (this.status < 600 || this.status >= 900) {
                        reject('Lỗi hệ thống khi xử lý thông tin tại server (' + this.status + ').\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                    } else {
                        let status = this.status;
                        Common.parseJSON(this['response'])
                            .then(function (parseResult) {
                                reject(`${parseResult.message} (${status})`);
                            })
                            .catch(function (error) {
                                console.log(error);
                                reject('Không đọc được thông tin từ server.\n'
                                    + 'Xin vui lòng liên hệ admin của hệ thống! (910)');
                            });
                    }
                }
            }
            xmlhttp.onerror = function (xmlhttpErr) {
                reject(xmlhttpErr);
            }
            let params = '';
            for (let key in dataJson) {
                if (dataJson.hasOwnProperty(key)) {
                    params = params + key + '=' + dataJson[key] + '&';
                }
            }
            params = params.slice(0, -1);
            xmlhttp.open('POST', url, true);
            xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xmlhttp.setRequestHeader('cache', 'no-cahce');
            xmlhttp.send(params);
        });
    };

    static show(message) {
        if (typeof SystemMessage !== 'function') {
            alert(message);
            return;
        }
        SystemMessage.showMessageInfo(message);
    };

    static parseJSON(input) {
        return new Promise(function (resolve, reject) {
            try {
                let jsonRes = JSON.parse(input);
                resolve(jsonRes);
            } catch (error) {
                reject(error);
            }
        });
    };

    static validateEmail(input) {
        let re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(input).toLowerCase());
    };

    static getURLParameter(sParam, locationSearch) {
        if (locationSearch == null) {
            locationSearch = document.location.search;
        }
        let sPageURL = locationSearch.substring(1);
        let sURLVariables = sPageURL.split('&');
        for (let i = 0; i < sURLVariables.length; i++) {
            let sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0].trim() == sParam) {
                return sParameterName[1].trim();
            }
        }
    };

    static isNumeric(input) {
        return !isNaN(parseFloat(input)) && isFinite(input);
    };

    //#region Copy to clipboard
    // copied from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    static copyTextToClipboard(text, callback) {
        if (!navigator.clipboard) {
            this.fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).
            then(function () {
                if (callback) {
                    callback();
                }
            });
    };

    fallbackCopyTextToClipboard(text) {
        let textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            console.log('fallbackCopyTextToClipboard failed.');
            console.error(err);
        }
        document.body.removeChild(textArea);
    };
    // end of copy
    //#endregion

    static saveToStorage(object) {
        if (typeof (Storage) === "undefined") {
            return;
        }
        let keyList = Object.keys(object);
        for (let i = 0; i < keyList.length; i++) {
            let aKey = keyList[i];
            let aValue = object[aKey];
            localStorage.setItem(aKey, aValue);
        }
    };

    static loadFromStorage(key) {
        if (typeof (Storage) === "undefined") {
            return;
        }
        return localStorage.getItem(key);
    };

    static savePageTraffic(pageId) {
        let sendData = {
            pageId,
        };
        Common.sendToBackend('/api/traffic/page/save', sendData);
    };


    static async getProductList() {
        try {
            let response = await Common.sendToBackend('product/list');
            return {
                result: true,
                categoryList: response.categoryList,
                productList: response.productList,
            }
        } catch (errorMessage) {
            return {
                result: false,
                message: `Không thể nhận được danh sách sản phẩm (${errorMessage})`,
            }
        }
    };

    static populateCategoryMenuItem(parentElement, linkPrefix) {
        for (const categoryId in window.categoryList) {
            let category = window.categoryList[categoryId];
            let li = document.createElement('li');
            li.style['margin-left'] = '15px';
            let a = document.createElement('a');
            a.setAttribute('href', `${linkPrefix}${categoryId}`);
            a.innerText = category.name.toString().toUpperCase();
            li.appendChild(a);
            parentElement.appendChild(li);
        }
    };

    static createDivProduct(product) {
        let divOuter = document.createElement('div');
        divOuter.className = 'col-12 col-md-6 col-lg-4 col-xl-3 aos-init aos-animate';
        divOuter.setAttribute('data-aos', 'fade-up');
        divOuter.setAttribute('data-aos-duration', '500');
        divOuter.style.cursor = 'pointer';
        divOuter.style.maxWidth = '100%';

        let divInner = document.createElement('div');
        divInner.className = 'product-item aos-init aos-animate';
        divInner.setAttribute('data-aos', 'fade-up');
        divInner.setAttribute('data-aos-duration', '500');
        divOuter.appendChild(divInner);

        let a = document.createElement('a');
        a.setAttribute('href', `product-content.html?id=${product.id}`);
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

        let priceDecimal = product.priceDecimal.toString();
        if (priceDecimal.length < 2) {
            priceDecimal = `${priceDecimal}0`;
        }
        let spanPrice = document.createElement('span');
        spanPrice.className = 'currency';
        spanPrice.innerText = `$${product.price}.${priceDecimal}`;
        spanPriceOuter.appendChild(spanPrice);

        let p = document.createElement('p');
        p.className = 'product-name';
        p.innerText = product.name.toUpperCase();
        a.appendChild(p);

        return divOuter;
    };

    static search(inputText) {
        let inputWordList = inputText.split(/\s+/);
        let result = {};
        for (const categoryId in window.categoryList) {
            let category = window.categoryList[categoryId];
            category.searchResult = false;
            let includeWholeCategory = false;
            if (Common.matchMultipleKeyword(category.searchText, inputWordList)) {
                result[categoryId] = category;
                category.searchResult = true;
                includeWholeCategory = true;
            }
            for (const productId in category.productList) {
                let product = category.productList[productId];
                product.searchResult = false;
                if (includeWholeCategory) {
                    product.searchResult = true;
                } else if (Common.matchMultipleKeyword(product.searchText, inputWordList)) {
                    category.searchResult = true;
                    product.searchResult = true;
                    result[categoryId] = category;
                }
            }
        }
        return result;
    };

    static matchMultipleKeyword(text, wordList) {
        for (let i = 0; i < wordList.length; i++) {
            let word = wordList[i];
            if (word.length < 3) {
                continue;
            }
            if (text.includes(word)) {
                return true;
            }
        }
        return false;
    };

    // https://gist.github.com/jarvisluong/f01e108e963092336f04c4b7dd6f7e45
    // This function converts the string to lowercase, then perform the conversion
    static toLowerCaseNonAccentVietnamese(str) {
        str = str.toLowerCase();
        //     We can also use this instead of from line 11 to line 17
        //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
        //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
        //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
        //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
        //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
        //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
        //     str = str.replace(/\u0111/g, "d");
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        // Some system encode vietnamese combining accent as individual utf-8 characters
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
        return str;
    };

    static searchByKeyword() {
        let input = document.getElementById('inputSearch').value.trim();
        if (input.length < 3) {
            return;
        }
        window.location.href = `products.html?search=${input}`;
    };

    static addEnterEventForSearch() {
        let inputSearch = document.getElementById('inputSearch');
        inputSearch.addEventListener("keypress", function (event) {
            // If the user presses the "Enter" key on the keyboard
            if (event.key === "Enter") {
                // Cancel the default action, if needed
                event.preventDefault();
                Common.searchByKeyword();
            }
        });
    };

    static async runScript() {
        let scriptList = [
            { script: 'jquery-3.6.0.min.js', time: 500, },
            { script: 'migrate.js', time: 80, },
            { script: 'library.js', time: 350, },
            { script: 'aos.js', time: 80, },
            { script: 'script.js?ver=1.0.2', time: 80, },];
        for (let i = 0; i < scriptList.length; i++) {
            let script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", `assets/js/${scriptList[i].script}`);
            document.getElementsByTagName("head")[0].appendChild(script);
            await Common.sleep(scriptList[i].time || 500);
        }
    };

    static createDivProductSlider(product) {
        let parent = document.createElement('div');
        parent.className = 'product-item';

        let a = document.createElement('a');
        a.setAttribute('href', `product-content.html?id=${product.id}`);
        parent.appendChild(a);

        let firstImage = product.imageList[0];
        let spanFirstPhoto = document.createElement('span');
        spanFirstPhoto.className = 'st-photo';
        spanFirstPhoto.style.backgroundImage = `url('assets/upload/product/${firstImage.id}.${firstImage.extension}')`;
        a.appendChild(spanFirstPhoto);

        let secondImage = firstImage;
        if (product.imageList.length > 1) {
            secondImage = product.imageList[1];
        }
        let spanSecondPhoto = document.createElement('span');
        spanSecondPhoto.className = 'nd-photo';
        spanSecondPhoto.style.backgroundImage = `url('assets/upload/product/${secondImage.id}.${secondImage.extension}')`;
        a.appendChild(spanSecondPhoto);

        let priceDecimal = product.priceDecimal.toString();
        if (priceDecimal.length < 2) {
            priceDecimal = `${priceDecimal}0`;
        }
        let spanPriceOuter = document.createElement('span');
        spanPriceOuter.className = 'price';
        a.appendChild(spanPriceOuter);
        let spanPrice = document.createElement('span');
        spanPrice.className = 'currency';
        spanPrice.innerText = `$${product.price}.${priceDecimal}`;
        spanPriceOuter.appendChild(spanPrice);

        let p = document.createElement('p');
        p.className = 'product-name';
        p.innerText = product.name;
        a.appendChild(p);

        return parent;
    };

    static sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, ms);
        });
    };

    static sortByPriority(productList) {
        let idInList = Object.keys(productList);
        let sortId = [];
        let tempList = [];
        for (let i = 0; i < idInList.length; i++) {
            let id = idInList[i];
            let object = {
                id,
                priority: productList[id].priority,
            };
            tempList.push(object);
        }
        tempList.sort(function (a, b) {
            return b.priority - a.priority;
        });
        for (let i = 0; i < tempList.length; i++) {
            sortId.push(tempList[i].id);
        }
        return sortId;
    };
};

window.addEventListener('load', async function () {
    let cartItemList = getItemList();
    if (Object.keys(cartItemList).length > 0) {
        showImgCartWithItem();
    }
});

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
    divBackground.id = 'divCartBackground';
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
        let thisDivBackground = document.getElementById('divCartBackground');
        if (thisDivBackground == null) {
            return;
        }
        document.body.removeChild(thisDivBackground);
    };
    divOuter.appendChild(divClose);

    let divNoItem = document.createElement('div');
    divNoItem.id = 'divCartNoItem';
    divNoItem.className = 'cart-no-item';
    divNoItem.innerText = 'Quý khách chưa chọn món hàng nào.\nXin vui lòng xem qua các sản phẩm của chúng tôi và nhấn nút cho vào giỏ hàng!';
    divOuter.appendChild(divNoItem);
    if (Object.keys(cartItemList).length < 1) {
        divNoItem.style.display = 'block';
        showImgCartWithItem(false);
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
                showImgCartWithItem(false);
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
    divCheckout.className = 'cart-checkout';
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
    inputCustomerName.className = 'cart-checkout-input';
    divCheckout.appendChild(inputCustomerName);

    let divCustomerNameValidation = document.createElement('div');
    divCustomerNameValidation.id = 'divCustomerNameValidation';
    divCustomerNameValidation.className = 'cart-checkout-validation';
    divCustomerNameValidation.innerText = 'Họ tên người nhận là bắt buộc.';
    divCheckout.appendChild(divCustomerNameValidation);

    let divCustomerEmailLabel = document.createElement('div');
    divCustomerEmailLabel.className = 'cart-checkout-label';
    divCustomerEmailLabel.innerText = 'Email (*)';
    divCheckout.appendChild(divCustomerEmailLabel);

    let inputCustomerEmail = document.createElement('input');
    inputCustomerEmail.id = 'inputCustomerEmail';
    inputCustomerEmail.className = 'cart-checkout-input';
    divCheckout.appendChild(inputCustomerEmail);

    let divCustomerEmailValidation = document.createElement('div');
    divCustomerEmailValidation.id = 'divCustomerEmailValidation';
    divCustomerEmailValidation.className = 'cart-checkout-validation';
    divCustomerEmailValidation.innerText = 'Email đúng để liên lạc là bắt buộc.';
    divCheckout.appendChild(divCustomerEmailValidation);

    let divSendCode = document.createElement('div');
    divSendCode.id = 'divSendCode';
    divSendCode.innerText = 'Gửi mã xác nhận đến email!';
    divSendCode.className = 'cart-send-code';
    divCheckout.appendChild(divSendCode);
    divSendCode.onclick = function () {
        let divCustomerEmailValidation = document.getElementById('divCustomerEmailValidation');
        divCustomerEmailValidation.style.display = 'none';
        let email = document.getElementById('inputCustomerEmail').value;
        if (!Common.validateEmail(email)) {
            divCustomerEmailValidation.style.display = 'block';
            return;
        }
        sendEmailCode(email);
    };

    let divSendCodeSuccess = document.createElement('div');
    divSendCodeSuccess.id = 'divSendCodeSuccess';
    divSendCodeSuccess.className = 'cart-send-code-success';
    divSendCodeSuccess.innerText = 'Xin kiểm email để nhận mã xác nhận!';
    divCheckout.appendChild(divSendCodeSuccess);


    let divCodeLabel = document.createElement('div');
    divCodeLabel.className = 'cart-checkout-label';
    divCodeLabel.innerText = 'Mã xác nhận(*)';
    divCheckout.appendChild(divCodeLabel);

    let inputCode = document.createElement('input');
    inputCode.id = 'inputCode';
    inputCode.className = 'cart-checkout-input';
    divCheckout.appendChild(inputCode);

    let divCodeValidation = document.createElement('div');
    divCodeValidation.id = 'divCodeValidation';
    divCodeValidation.className = 'cart-checkout-validation';
    divCodeValidation.innerText = 'Mã xác nhận không đúng.';
    divCheckout.appendChild(divCodeValidation);

    let divCustomerAddressLabel = document.createElement('div');
    divCustomerAddressLabel.className = 'cart-checkout-label';
    divCustomerAddressLabel.innerText = 'Địa chỉ (*)';
    divCheckout.appendChild(divCustomerAddressLabel);

    let inputCustomerAddress = document.createElement('textarea');
    inputCustomerAddress.id = 'inputCustomerAddress';
    inputCustomerAddress.className = 'cart-checkout-textarea';
    divCheckout.appendChild(inputCustomerAddress);

    let divCustomerAddressValidation = document.createElement('div');
    divCustomerAddressValidation.id = 'divCustomerAddressValidation';
    divCustomerAddressValidation.className = 'cart-checkout-validation';
    divCustomerAddressValidation.innerText = 'Địa chỉ nhận hàng là bắt buộc.';
    divCheckout.appendChild(divCustomerAddressValidation);

    let divCustomerNoteLabel = document.createElement('div');
    divCustomerNoteLabel.className = 'cart-checkout-label';
    divCustomerNoteLabel.innerText = 'Lưu ý';
    divCheckout.appendChild(divCustomerNoteLabel);

    let inputCustomerNote = document.createElement('textarea');
    inputCustomerNote.id = 'inputCustomerNote';
    inputCustomerNote.className = 'cart-checkout-textarea';
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
    if (total > 0) {
        showImgCartWithItem();
    }
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

    let code = document.getElementById('inputCode').value;
    if (code.length != 6) {
        document.getElementById('divCodeValidation').style.display = 'block';
        allIsOk = false;
    }

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
        code,
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
        otp: validateResult.code,
    };
};

async function makeInvoice(sendData) {
    let divOuter = document.getElementById('divOuter');
    try {
        divOuter.style.display = 'none';
        let response = await Common.sendToBackend('payment/make', sendData);
        window.location.href = response.invoiceLink;
        Common.saveToStorage({ cartItemList: '', });
        showImgCartWithItem(false);
    } catch (errorMessage) {
        SystemMessage.showMessageInfo(errorMessage, null, false, function () {
            divOuter.style.display = 'grid';
        });
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

function showImgCartWithItem(withItem) {
    if (withItem == null || withItem == true) {
        document.getElementById('imgCart').src = 'assets/upload/cart-with-item.svg';
        return;
    }
    document.getElementById('imgCart').src = 'assets/upload/cart-fill-svgrepo-com.svg';
};

async function sendEmailCode(email) {
    let sendData = {
        email,
    };
    try {
        let response = await Common.sendToBackend('email/code', sendData);
        document.getElementById('divSendCode').style.display = 'none';
        document.getElementById('divSendCodeSuccess').style.display = 'block';
        window.setTimeout(function () {
            document.getElementById('divSendCode').style.display = 'block';
            document.getElementById('divSendCodeSuccess').style.display = 'none';
        }, response.otpMinTime * 60 * 1000);
    } catch (errorMessage) {
        let divOuter = document.getElementById('divOuter');
        divOuter.style.display = 'none';
        SystemMessage.showMessageInfo(errorMessage, null, false, function () {
            divOuter.style.display = 'grid';
        });
    }
};