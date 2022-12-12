/**
 * modify from https://github.com/dcmjs-org/dicomweb-client/blob/c686828ea682e576e846ecf4f8a8160727f2e551/src/api.js#L278
 */

import("../external/formdata/formdata-to-blob.js").then(formDataToBlobModule => {
    window.formDataToBlob = formDataToBlobModule.formDataToBlob;

    import("../external/formdata/formdata.min.js");

});


const MEDIATYPES = {
    DICOM: "application/dicom",
    DICOM_JSON: "application/dicom+json",
    OCTET_STREAM: "application/octet-stream",
    PDF: "application/pdf",
    JPEG: "image/jpeg",
    PNG: "image/png"
};

function isObject(obj) {
    return typeof obj === "object" && obj !== null;
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function parseQueryParameters(params = {}) {
    let queryString = "?";
    Object.keys(params).forEach((key, index) => {
        if (index !== 0) {
            queryString += "&";
        }
        queryString += `${key}=${encodeURIComponent(params[key])}`;
    });
    return queryString;
}


async function fileUpload(url, formData) {
    return new Promise((resolve) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Accept", "*/*");

        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log("upload file success");
            } else {
                console.error("upload file fail", xhr.statusText);
            }
            resolve();
        };

        xhr.upload.onprogress = function (evt) {
            if (evt.lengthComputable) {
                let progressRate =
                    ((evt.loaded / evt.total) * 100) | 0;
                let progressStr = `${progressRate}%`
                console.log(progressStr);
            }
        };

        let myBlob = formDataToBlob(formData);
        let m = myBlob.type.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        let boundary = m[1] || m[2];
        xhr.setRequestHeader(
            "Content-Type",
            `multipart/related; type="application/dicom"; boundary="${boundary}"`
        );
        xhr.send(myBlob);
    });
}

/**
 * Performs an HTTP request.
 *
 * @param {String} url
 * @param {String} method
 * @param {Object} headers
 * @param {Object} options
 * @return {*}
 */
function doHttpRequest(url, method, headers = {}, options) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();

        xhr.open(method, url, true);

        let verbose = Object.prototype.hasOwnProperty.call(options, "verbose")
            ? options.verbose
            : false;

        // Set response type
        if ("responseType" in options) {
            xhr.responseType = options.responseType;
        }

        // Set request headers
        if (typeof headers === "object") {
            Object.keys(headers).forEach((key) => {
                xhr.setRequestHeader(key, headers[key]);
            });
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(xhr.response);
                } else if (xhr.status === 202) {
                    if (verbose) {
                        console.warn(
                            "some resources already existed: ",
                            xhr
                        );
                    }

                    resolve(xhr.response);
                } else if (xhr.status === 204) {
                    if (verbose) {
                        console.warn("empty response for request: ", xhr);
                    }

                    resolve([]);
                } else {
                    const error = new Error("xhr failed");
                    error["request"] = xhr;
                    error.response = xhr.response;
                    error.status = xhr.status;

                    if (verbose) {
                        console.error("request failed: ", xhr);
                        console.error(error);
                        console.error(error.response);
                    }

                    reject(error);
                }
            }
        };

        if ("progressCallback" in options) {
            if (typeof options.progressCallback === "function") {
                xhr.onprogress = options.progressCallback;
            }
        }

        // Add withCredentials to request if needed
        if ("withCredentials" in options) {
            if (options.withCredentials) {
                xhr.withCredentials = true;
            }
        }

        if ("data" in options) {
            xhr.send(options.data);
        } else {
            xhr.send();
        }
    });
}

function doHttpGetApplicationJson(
    url,
    params = {},
    progressCallback,
    withCredentials
) {
    let urlWithQueryParams = url;

    if (typeof params === "object") {
        if (!isEmptyObject(params)) {
            urlWithQueryParams += parseQueryParameters(params);
        }
    }

    const headers = { Accept: MEDIATYPES.DICOM_JSON };
    const responseType = "json";
    return doHttpGet(
        urlWithQueryParams,
        headers,
        responseType,
        progressCallback,
        withCredentials
    );
}

/**
 * Performs an HTTP GET request.
 *
 * @param {String} url
 * @param {Object} headers
 * @param {Object} responseType
 * @param {Function} progressCallback
 * @return {*}
 */
function doHttpGet(
    url,
    headers,
    responseType,
    progressCallback,
    withCredentials
) {
    return doHttpRequest(url, "get", headers, {
        responseType,
        progressCallback,
        withCredentials
    });
}

class DicomWebClient {
    static headers = {};
    /**
     * @constructor
     * @param {Object} options
     * @param {String} options.url - URL of the DICOMweb RESTful Service endpoint
     * @param {String} options.qidoURLPrefix - URL path prefix for QIDO-RS
     * @param {String} options.wadoURLPrefix - URL path prefix for WADO-RS
     * @param {String} options.stowURLPrefix - URL path prefix for STOW-RS
     * @param {String} options.username - Username
     * @param {String} options.password - Password
     * @param {Object} options.headers - HTTP headers
     * @param {Object} options.verbose - print to console request warnings and errors, default true
     */
    constructor(options) {
        this.baseURL = options.url;
        if (!this.baseURL) {
            console.error("no DICOMweb base url provided - calls will fail");
        }

        if ("username" in options) {
            this.username = options.username;
            if (!("password" in options)) {
                console.error(
                    "no password provided to authenticate with DICOMweb service"
                );
            }
            this.password = options.password;
        }

        if ("qidoURLPrefix" in options) {
            console.log(`use URL prefix for QIDO-RS: ${options.qidoURLPrefix}`);
            this.qidoURL = `${this.baseURL}/${options.qidoURLPrefix}`;
        } else {
            this.qidoURL = this.baseURL;
        }

        if ("wadoURLPrefix" in options) {
            console.log(`use URL prefix for WADO-RS: ${options.wadoURLPrefix}`);
            this.wadoURL = `${this.baseURL}/${options.wadoURLPrefix}`;
        } else {
            this.wadoURL = this.baseURL;
        }

        if ("stowURLPrefix" in options) {
            console.log(`use URL prefix for STOW-RS: ${options.stowURLPrefix}`);
            this.stowURL = `${this.baseURL}/${options.stowURLPrefix}`;
        } else {
            this.stowURL = this.baseURL;
        }

        // Headers to pass to requests.
        this.headers = options.headers || {};

        // Verbose - print to console request warnings and errors, default true
        this.verbose = options.verbose !== false;

        //#region QIDO-RS
        this.QidoRs = {
            /**
             * Searches for DICOM studies.
             *
             * @param {Object} options
             * @param {Object} [options.queryParams] - HTTP query parameters
             * @return {Object[]} Study representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2)
             */
            searchForStudies: (options = {}) => {
                console.log("search for studies");
                let withCredentials = false;
                let url = `${this.qidoURL}/studies`;
                if ("queryParams" in options) {
                    url += parseQueryParameters(options.queryParams);
                }
                if ("withCredentials" in options) {
                    if (options.withCredentials) {
                        withCredentials = options.withCredentials;
                    }
                }
                return doHttpGetApplicationJson(
                    url,
                    {},
                    false,
                    withCredentials
                );
            },
            /**
             * Searches for DICOM series.
             *
             * @param {Object} options
             * @param {Object} [options.studyInstanceUID] - Study Instance UID
             * @param {Object} [options.queryParams] - HTTP query parameters
             * @returns {Object[]} Series representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2a)
             */
            searchForSeries: (options = {}) => {
                let url = this.qidoURL;
                if ("studyInstanceUID" in options) {
                    console.log(
                        `search series of study ${options.studyInstanceUID}`
                    );
                    url += `/studies/${options.studyInstanceUID}`;
                }
                url += "/series";
                if ("queryParams" in options) {
                    url += parseQueryParameters(options.queryParams);
                }
                let withCredentials = false;
                if ("withCredentials" in options) {
                    if (options.withCredentials) {
                        withCredentials = options.withCredentials;
                    }
                }
                return doHttpGetApplicationJson(
                    url,
                    {},
                    false,
                    withCredentials
                );
            },
            /**
             * Searches for DICOM Instances.
             *
             * @param {Object} options
             * @param {Object} [options.studyInstanceUID] - Study Instance UID
             * @param {Object} [options.seriesInstanceUID] - Series Instance UID
             * @param {Object} [options.queryParams] - HTTP query parameters
             * @returns {Object[]} Instance representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2b)
             */
            searchForInstances: (options = {}) => {
                let url = this.qidoURL;
                let withCredentials = false;
                if ("studyInstanceUID" in options) {
                    url += `/studies/${options.studyInstanceUID}`;
                    if ("seriesInstanceUID" in options) {
                        console.log(
                            `search for instances of series ${options.seriesInstanceUID}`
                        );
                        url += `/series/${options.seriesInstanceUID}`;
                    } else {
                        console.log(
                            `search for instances of study ${options.studyInstanceUID}`
                        );
                    }
                } else {
                    console.log("search for instances");
                }
                url += "/instances";
                if ("queryParams" in options) {
                    url += parseQueryParameters(
                        options.queryParams
                    );
                }
                if ("withCredentials" in options) {
                    if (options.withCredentials) {
                        withCredentials = options.withCredentials;
                    }
                }
                return doHttpGetApplicationJson(
                    url,
                    {},
                    false,
                    withCredentials
                );
            }
        };
        //#endregion

        this.StowRs = {
            storeDicomInstance: async (file) => {
                let formData = new FormData();
                formData.append("file", file);
                await fileUpload(`${this.stowURL}/studies`, formData);
            }
        };

    }
}

export { DicomWebClient };
