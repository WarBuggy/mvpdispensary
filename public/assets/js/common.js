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
                                    + 'Xin vui lòng liên hệ admin của hệ thống!');
                            });
                    } else if (this.status < 600 || this.status >= 900) {
                        reject('Lỗi hệ thống khi xử lý thông tin tại server (' + this.status + ').\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                    } else {
                        Common.parseJSON(this['response'])
                            .then(function (parseResult) {
                                reject(parseResult.message);
                            })
                            .catch(function () {
                                reject('Không đọc được thông tin từ server.\n'
                                    + 'Xin vui lòng liên hệ admin của hệ thống!');
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

    static show(messageType, message) {
        if (typeof SystemMessage !== 'function') {
            alert(message);
            return;
        }
        new SystemMessage(SystemMessage(messageType, message));
    };

    static parseJSON(input) {
        return new Promise(function (resolve, reject) {
            try {
                let jsonRes = JSON.parse(input);
                resolve(jsonRes);
            } catch (error) {
                reject(error.message);
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
        let scriptList = ['jquery-3.6.0.min.js', 'migrate.js', 'library.js', 'aos.js', 'script.js?ver=1.0.2'];
        for (let i = 0; i < scriptList.length; i++) {
            let script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", `assets/js/${scriptList[i]}`);
            document.getElementsByTagName("head")[0].appendChild(script);
            await Common.sleep(window.SCRIPT_LOAD_DELAY || 1000);
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
};
