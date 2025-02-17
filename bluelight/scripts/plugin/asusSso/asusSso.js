
(async function () {
    let config = await loadConfig("../data/configAsusSso.json");

    if (config.enabled) {
        let loginUrl = config.loginUrl;
        let redirectUrl = config.redirectUrl;
        const raccoonLoginUrl = `${loginUrl}?redirectUrl=${encodeURIComponent(redirectUrl)}`;

        let token = localStorage.getItem("asusWebStorageToken");
        if (!token) {

            const overlay = document.createElement('div');
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;';
            overlay.innerHTML = '<div style="color: white;">Loading...</div>';
            document.body.appendChild(overlay);

            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.src = loginUrl;
            document.body.appendChild(iframe);

            const timeoutId = setTimeout(() => {
                localStorage.setItem("bluelightUrl", window.location.href);
                window.location.href = raccoonLoginUrl;
            }, 3500);

            window.addEventListener("message", function messageHandler(event) {
                const allowedOrigin = new URL(loginUrl).origin;
                if (event.origin !== allowedOrigin) return;

                if (event.data.type === "SSO_TOKEN" && event.data.token) {
                    clearTimeout(timeoutId);
                    localStorage.setItem("asusWebStorageToken", event.data.token);
                    overlay.remove();
                    iframe.remove();
                    window.removeEventListener("message", messageHandler);
                }
            });
        }

        if (config.tokenInRequest) {
            XMLHttpRequest.prototype.origOpen = XMLHttpRequest.prototype.open;

            XMLHttpRequest.prototype.open = function () {
                this.origOpen.apply(this, arguments);
                let savedToken = localStorage.getItem("asusWebStorageToken");
                let decodedToken = JSON.parse(atob(savedToken.split(".")[1]));
                let expiresAt = decodedToken.exp;
                let currentTime = Math.floor(Date.now() / 1000);

                if (expiresAt < currentTime) {
                    localStorage.setItem("bluelightUrl", window.location.href);
                    window.location.href = raccoonLoginUrl;
                }
                this.setRequestHeader('Authorization', "Bearer " + savedToken);
            };
            let checkTokenInterval = setInterval(() => {
                let savedToken = localStorage.getItem("asusWebStorageToken");
                if (savedToken) {
                    clearInterval(checkTokenInterval);
                    readAllJson(readJson);
                }
            }, 150);
        }
    }

    async function loadConfig(url) {
        return new Promise((resolve, reject) => {
            let config = {};
            let requestURL = url;
            let request = new XMLHttpRequest();
            request.open('GET', requestURL);
            request.responseType = 'json';
            request.send();

            request.onload = function () {
                config = request.response;
                return resolve(config);
            }
        });
    }
})();


