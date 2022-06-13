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
                                let result = parseResult.result;
                                if (result != 0) {
                                    Common.show('TYPE_ERROR', 'Phản hồi từ server không đúng định dạng (' + result + ').\n'
                                        + 'Xin vui lòng liên hệ admin của hệ thống!');
                                    reject(909);
                                } else {
                                    resolve(parseResult);
                                }
                            })
                            .catch(function () {
                                Common.show('TYPE_ERROR', 'Không đọc được thông tin từ server.\n'
                                    + 'Xin vui lòng liên hệ admin của hệ thống!');
                                reject(909);
                            });
                    } else if (this.status < 550 || this.status >= 900) {
                        Common.show('TYPE_ERROR', 'Lỗi hệ thống khi xử lý thông tin tại server (' + this.status + ').\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 550) {
                        Common.show('TYPE_ERROR', 'Không đủ dữ liệu để thực hiện thao tác.\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 600) {
                        Common.show('TYPE_ERROR', 'Thao tác không thể hoàn thành bởi\nlý do không xác định được.\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 890 || this.status == 891 || this.status == 892
                        || this.status == 893) {
                        Common.show('TYPE_ERROR', 'Hệ thống gặp lỗi khi kiểm tra định danh (' + this.status + ').\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 894) {
                        Common.show('TYPE_WARNING', 'Thời gian thao tác (30 phút) đã hết.\n'
                            + 'Xin bạn vui lòng đăng nhập lại để tiếp tục!', null, null,
                            function () {
                                window.location.reload();
                            });
                        reject(this.status);
                    } else if (this.status == 880 || this.status == 881 || this.status == 882
                        || this.status == 884 || this.status == 885) {
                        Common.show('TYPE_ERROR', 'Hệ thống gặp lỗi khi kiểm tra thông tin tài khoản(' + this.status + ').\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 883) {
                        Common.show('TYPE_ERROR', 'Tài khoản này đã bị khóa.\n'
                            + 'Xin vui lòng liên hệ quản lý để biết thông tin chi tiết!');
                        reject(this.status);
                    } else if (this.status == 879) {
                        Common.show('TYPE_ERROR', 'Hệ thống gặp lỗi trong việc sắp xếp dữ liệu.\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 878) {
                        Common.show('TYPE_ERROR', 'Bạn không có quyền để thực hiện thao tác này.\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else if (this.status == 877) {
                        Common.show('TYPE_ERROR', 'Không tìm được dữ liệu đã chọn để thao tác.\n'
                            + 'Xin vui lòng liên hệ admin của hệ thống!');
                        reject(this.status);
                    } else {
                        reject(this.status);
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
        new SystemMessage(SystemMessage[messageType], message);
    };

    static parseJSON(input) {
        return new Promise(function (resolve, reject) {
            let jsonRes = JSON.parse(input);
            if (jsonRes.success) {
                resolve(jsonRes);
            } else {
                reject(jsonRes);
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
};