const OAuth = {
    "authorization_code": {
        getCode: () => {},
        getSessionState: () => {},
        getLoginUrl: () => {},
        getTokenFromOAuthServer: () => {}
    },
    "getTokenObj": () => {},
    /**
     * 
     * @param {XMLHttpRequest} xhr 
     */
    "setRequestHeader": (xhr) => {},
    /**
     * 
     * @param {Object} headers 
     */
    "addAuthToHeadersObj": (headers) => {},
    /**
     * @param {(err: Object | undefined, result: boolean) => void} callback
     */
    "checkTokenValid": (callback) => {},
    "redirectToLoginPage": () => {}
}

OAuth["authorization_code"].getCode = () => {
    let queryString = window.location.search;
    let params = new URLSearchParams(queryString);
    let code = params.get('code');
    return code;
};

OAuth["authorization_code"].getSessionState = () => {
    let queryString = window.location.search;
    let params = new URLSearchParams(queryString);
    let sessionState = params.get('session_state');
    return sessionState;
}

OAuth["authorization_code"].getLoginUrl = () => {
    //https://oauth.dicom.tw/realms/Cylab/protocol/openid-connect/auth?client_id=account&grant_type=authorization_code&response_type=code&redirect_uri=https://bluelight.chin0.com/oauth/
    let authUrlObj = new URL(oauthConfig.authUrl);
    authUrlObj.searchParams.set("client_id", oauthConfig.client_id);
    authUrlObj.searchParams.set("grant_type", "authorization_code");
    authUrlObj.searchParams.set("response_type", "code");
    authUrlObj.searchParams.set("redirect_uri", oauthConfig.redirect_uri);
    return authUrlObj.href;
}

OAuth["authorization_code"].getTokenFromOAuthServer =  () => {
    return new Promise((resolve, reject) => {
        let code = OAuth["authorization_code"].getCode();
        let sessionState = OAuth["authorization_code"].getSessionState();
        if (!code) {
            alert("Invalid token workflow");
            window.location = "/";
        }
        let params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("code", code);
        params.set("client_id", oauthConfig.client_id);
        params.set("redirect_uri", oauthConfig.redirect_uri);
        params.set("session_state", sessionState);
    
        let request = new XMLHttpRequest();
        request.open("POST", oauthConfig.accessTokenUrl, true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let res = JSON.parse(request.response);
                    let tokenObj = {
                        "token_type": res["token_type"],
                        "expires_in": res["expires_in"],
                        "access_token": res["access_token"],
                        "scope": res["scope"],
                        "refresh_token": res["refresh_token"]
                    };
                    return resolve({
                        status: 200,
                        response: tokenObj
                    });
                } else {
                    console.log(request.response);
                    return reject({
                        status: request.status,
                        response: request.response
                    });
                }
            }
        }
        request.send(params);
    });
};

OAuth.getTokenObj = () => {
    let tokenObjStr = localStorage.getItem("blueLight_token");
    let tokenObj = JSON.parse(tokenObjStr);
    return tokenObj;
}

/**
 * 
 * @param {XMLHttpRequest} xhr 
 */
OAuth.setRequestHeader = (xhr) => {
    let tokenObj = OAuth.getTokenObj();
    if (!tokenObj) {
        return;
    }
    if (tokenObj["token_type"] === "Bearer") {
        xhr.setRequestHeader("Authorization", `Bearer ${tokenObj["access_token"]}`);
    }
}

OAuth.addAuthToHeadersObj = (headers) => {
    let tokenObj = OAuth.getTokenObj();
    if (tokenObj["token_type"] === "Bearer") {
        headers["Authorization"] = `Bearer ${tokenObj["access_token"]}`;
    }
}

OAuth.checkTokenValid = (callback) => {
    let checkTokenUrl = oauthConfig.checkTokenUrl;
    let request = new XMLHttpRequest();
    request.open("GET", checkTokenUrl);
    OAuth.setRequestHeader(request);
    request.onload = () => {
        if (request.status === 200) {
            callback(undefined, true);
        } else {
            let error = new Error(request.response);
            callback(error, false);
        }
    }
    request.send();
}

OAuth.checkTokenValidAsync = () => {
    return new Promise((resolve, reject) => {
        let checkTokenUrl = oauthConfig.checkTokenUrl;
        let request = new XMLHttpRequest();
        request.open("GET", checkTokenUrl);
        OAuth.setRequestHeader(request);
        request.onload = () => {
            if (request.status === 200) {
                return resolve(undefined, true);
            } else {
                let error = new Error(request.response);
                return reject(error, false);
            }
        }
        request.send();
    });
}

OAuth.redirectToLoginPage = () => {
    let loginUrl = OAuth[oauthConfig.grant_type].getLoginUrl();
    let currentUrl = window.location.href;
    localStorage.setItem("blueLight_loginFrom", currentUrl);
    window.location.href = loginUrl;
}