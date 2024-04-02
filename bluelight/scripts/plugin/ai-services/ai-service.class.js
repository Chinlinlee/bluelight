/// <reference path="./dicomParser.d.ts">

/**
 * @typedef SelectorConfig
 * @property {string} name
 * @property {string} level
 */

/**
 * @typedef AiServiceOption
 * @property {string} name
 * @property {SelectorConfig[]} selector
 * @property {object} customElements
 */

import dcmjsMessage from "../../external/dcmjs/utilities/Message.js";
import { AiServiceCustomElementBuilder } from "./ai-service-custom-element-builder.js";
import {
    aiServiceConfig
} from "./config.js";
import { 
    getCachedImageByInstanceUID,
    getCachedImagesBySeriesUID,
    getCachedImagesByStudyUID,
    getCachedSeriesUIDsByStudyUID
} from "./utils.js";

const Toast = Swal.mixin({
    toast: true,
    position: "bottom",
    showConfirmButton: false,
    showCancelButton: false,
    allowOutsideClick: false,
    timerProgressBar: true,
    timer: 1000,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    }
});

/**
 * 
 * @param {FileSystemFileEntry | FileSystemDirectoryEntry} item 
 */
function handleDirectory(item) {
    if (item.isDirectory) {
        let directoryReader = item.createReader();

        let readEntries = (entries) => {
            entries.forEach((entry) => {
                handleDirectory(entry);
            });
            if (entries.length > 0) {
                directoryReader.readEntries(readEntries);
            }
        };

        directoryReader.readEntries(readEntries);

    } else if (item.isFile) {
        item.file((file) => {
            setDicomFileObj(file);
        });
    }
}

window.dicomWebClient = {};
import("./dicomweb-client.js").then((module) => {
    let checkConfigLoadCompleteInterval = setInterval(() => {
        if (Object.prototype.hasOwnProperty.call(ConfigLog, "QIDO")) {
            clearInterval(checkConfigLoadCompleteInterval);

            let schema = ConfigLog["QIDO"].https;
            let port = Number(ConfigLog["QIDO"].PORT);
            let baseUrl = "";
            if (port == 443 || port == 80) {
                baseUrl = `${schema}://${ConfigLog["QIDO"].hostname}`;
            } else {
                baseUrl = `${schema}://${ConfigLog["QIDO"].hostname}:${port}`;
            }

            let qidoPrefix = ConfigLog["QIDO"].service;
            let wadoPrefix = ConfigLog["WADO"].service;
            let stowPrefix = ConfigLog["STOW"].service;

            window.dicomWebClient = new module.DicomWebClient({
                url: baseUrl,
                qidoURLPrefix: qidoPrefix,
                wadoURLPrefix: wadoPrefix,
                stowURLPrefix: stowPrefix
            });
        }
    }, 100);

    let setDropFileForUploadInterval = setInterval(() => {
        if (Object.prototype.hasOwnProperty.call(window.dicomWebClient, "baseURL")) {
            clearInterval(setDropFileForUploadInterval);

            document.getElementsByTagName("BODY")[0].addEventListener("drop", (e) => {
                e.stopPropagation();
                e.preventDefault();

                if (e.dataTransfer && e.dataTransfer.items) {
                    let items = e.dataTransfer.items;

                    for (let i = 0; i < items.length; i++) {

                        let item = items[i].webkitGetAsEntry();
                        if (item) {
                            handleDirectory(item);
                        }
                    }
                }
            });

            document.getElementById("myfile").addEventListener("change", function () {
                for (let i = 0; i < this.files.length; i++) {
                    let file = this.files[i];

                    setDicomFileObj(file);
                }
            });
        }
    }, 100);

});

/**
 * Record file obj into parsed dicom list
 */
function setDicomFileObj(file) {
    let reader = new FileReader();

    reader.onload = (_file) => {
        let arrayBuffer = reader.result;

        let byteArray = new Uint8Array(arrayBuffer);


        let dataSet;

        try {

            dataSet = dicomParser.parseDicom(byteArray, {
                untilTag: "x7fe00010"
            });

            let uids = {
                studyUID: dataSet.string("x0020000d"),
                seriesUID: dataSet.string("x0020000e"),
                instanceUID: dataSet.string("x00080018")
            }

            let setDicomFileObjInterval = setInterval(() => {
                for (let imageId in getPatientbyImageID) {
                    let image = getPatientbyImageID[imageId];
                    let instanceUID = image.SopUID;
                    if (instanceUID === uids.instanceUID) {
                        clearInterval(setDicomFileObjInterval);
                        image.file = file;
                        checkDicomInstanceExistInPacsAndSetStatus(uids);
                        break;
                    }
                }

            }, 100);

        } catch (e) {
            console.error(e);
        }


    }

    reader.readAsArrayBuffer(file);

}


async function checkDicomInstanceExistInPacsAndSetStatus(uids) {

    let {
        studyUID: studyInstanceUID,
        seriesUID: seriesInstanceUID,
        instanceUID
    } = uids;

    try {
        let instancesInfo = await window.dicomWebClient.QidoRs.searchForInstances({
            studyInstanceUID,
            seriesInstanceUID,
            queryParams: {
                "00080018": instanceUID
            }
        });

        if (Array.isArray(instancesInfo)) {
            let image = getCachedImageByInstanceUID(instanceUID);
            if (instancesInfo.length === 0) {
                image.existInPACS = false;
            } else {
                image.existInPACS = true;
            }
        }

    } catch (e) {
        if (Object.prototype.hasOwnProperty.call(e, "xhr")) {
            console.log(e.xhr.status);
        }
        console.error(e);
    }
}

function hideValidationMessage() {
    let validationMessage = document.querySelector(".swal2-validation-message");
    validationMessage.style.display = "none";
}

function removeSeriesSelectElements() {
    let swalDocument = Swal.getHtmlContainer();
    let seriesSelectElements = swalDocument.querySelectorAll(".select-series");
    for (let e of seriesSelectElements) {
        e.parentElement.removeChild(e);
    }
    return true;
}

function removeInstanceSelectElements() {
    let swalDocument = Swal.getHtmlContainer();
    let seriesSelectElements =
        swalDocument.querySelectorAll(".select-instance");
    for (let e of seriesSelectElements) {
        e.parentElement.removeChild(e);
    }
    return true;
}

/**
 *
 * @param {Element} selectElement
 */
function removeOptions(selectElement) {
    let optionsLength = selectElement.options.length;
    for (let i = 0; i < optionsLength; i++) {
        selectElement.remove(i);
    }
}

function addSelectPlaceholder(selectElement, text) {
    let placeholderOption = document.createElement("option");
    placeholderOption.disabled = "";
    placeholderOption.value = "";
    placeholderOption.text = text;
    selectElement.appendChild(placeholderOption);
}

class AIService {
    /**
     *
     * @param {AiServiceOption} serviceOption
     */
    constructor(serviceOption) {
        this.serviceOption = serviceOption;
    }

    /**
     * @param {Element} selectElement
     * @type {void}
     */
    static defaultStudySelect(selectElement) {
        let urlQueryString = window.location.search;
        let searchParams = new URLSearchParams(urlQueryString);
        let studyInstanceUID =
            searchParams.get("StudyInstanceUID") ||
            searchParams.get("0020000D");
        if (studyInstanceUID) {
            let options = selectElement.options;
            for (let i = 0; i < options.length; i++) {
                let option = options[i];
                let optionValue = option.value;
                if (optionValue === studyInstanceUID) {
                    selectElement.selectedIndex = i;
                    selectElement.dispatchEvent(new Event("change"));
                }
            }
        }
    }

    static async getSupportAIService() {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            let urlObj = new URL("/ai-service", aiServiceConfig.baseUrl);
            request.open("GET", urlObj.href);
            request.responseType = "json";
            request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        let resJson = request.response;
                        return resolve(resJson);
                    } else {
                        console.error({
                            status: request.status
                        });
                        return reject(new Error("The request failed"));
                    }
                }
            };
            request.send();
        });
    }

    /**
     *
     * @type { Element }
     */
    buildServiceButtonElement() {
        let btn = document.createElement("button");
        btn.innerText = this.serviceOption.name;
        btn.classList.add("swal2-confirm");
        btn.classList.add("swal2-styled");
        btn.classList.add("btn-gray");
        btn.classList.add("btn-ai-service");
        return btn;
    }

    /**
     *
     * @type {string}
     */
    getAICallerUrl() {
        let urlObj = new URL(
            this.serviceOption.apiUrl,
            aiServiceConfig.baseUrl
        );
        return urlObj.href;
    }

    /**
     * @private
     * @param {object} uidObj
     * @param {string} uid
     * @param {"study" | "series" | "instance"} level
     */
    static setUidObjFromLevel_(uidObj, uid, level) {
        let cloneUidObj = { ...uidObj };
        if (level === "study") {
            cloneUidObj["studyInstanceUID"] = uid;
        } else if (level === "series") {
            cloneUidObj["seriesInstanceUID"] = uid;
        } else if (level === "instance") {
            cloneUidObj["sopInstanceUID"] = uid;
        }
        return cloneUidObj;
    }

    async createAIServiceComponent() {
        let selectorBuilder = new AiServiceSelectorBuilder(
            this.serviceOption.selector
        );
        selectorBuilder.build();

        let customElementsBuilder = new AiServiceCustomElementBuilder(
            this.serviceOption.customElements
        );

        let { value } = await Swal.fire({
            title: "AI Service",
            html: "<span style='color: #F0F0F0'><strong></strong></span>",
            didOpen: () => {
                let swalDocument = Swal.getHtmlContainer();
                selectorBuilder.buildedElements.forEach((buildedElement) => {
                    swalDocument.append(buildedElement.element);
                    AIService.defaultStudySelect(buildedElement.element);
                });

                customElementsBuilder.build();

                if (this.serviceOption.defaultCurrentInstance) {
                    let uidObj = GetNowUid();
                    let level = ["study", "series", "instance"];
                    let uidLevel = ["study", "series", "sop"];

                    if (uidObj) {
                        console.log(uidObj);
                        for (let i = 0; i < level.length; i++) {
                            let levelSelector = document.querySelector(`.select-${level[i]}`);
                            let levelSelectorOption = document.querySelector(`.select-${level[i]} option[value="${uidObj[uidLevel[i]]}"]`);
                            levelSelectorOption.selected = true;
                            levelSelector.dispatchEvent(new Event("change"));
                        }
                    }
                    
                }

            },
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                let reqBody = {
                    dicomUidsList: []
                };
                let uidObj = {};
                
                // Get request body's dicom uid list
                for (let buildedObj of selectorBuilder.buildedElements) {
                    if (buildedObj.level === "study") uidObj = {};

                    let selectElement = buildedObj.element;

                    if (!selectElement.value) {
                        Swal.showValidationMessage(
                            `You need to select ${buildedObj.name} UID`
                        );
                        return;
                    }
                    uidObj = AIService.setUidObjFromLevel_(
                        uidObj,
                        selectElement.value,
                        buildedObj.level
                    );
                    if (buildedObj.needPush) reqBody.dicomUidsList.push(uidObj);
                }

                // Get request body's custom params
                for (let customElementObj of customElementsBuilder.buildedElements) {
                    let paramType = customElementObj.getParamType();
                    
                    if (!Object.prototype.hasOwnProperty.call(reqBody, paramType)) {
                        reqBody[paramType] = {};
                    }

                    try {
                        reqBody[paramType][customElementObj.getRequestField()] = customElementObj.getValue();
                    } catch(e) {
                        Swal.showValidationMessage(
                            e.message
                        );
                        return;
                    }
                    
                }

                return reqBody;
            }
        });
        if (value) {

            let needUpload = Object.prototype.hasOwnProperty.call(this.serviceOption, "uploadFileWhenNotExist") && this.serviceOption.uploadFileWhenNotExist;

            if (needUpload) {
                let notExistsInstances = this.getNotExistInstances_(value.dicomUidsList);

                if (notExistsInstances.length > 0) {
                    FreezeUI();
                    for (let instanceObj of notExistsInstances) {
                        console.log(`upload not exist dicom instance ${JSON.stringify(instanceObj.uids)}`);
                        await window.dicomWebClient.StowRs.storeDicomInstance(instanceObj.obj.file);
                        instanceObj.obj.existInPACS = true;
                    }
                    UnFreezeUI();
                }
                
            }

            if (Object.prototype.hasOwnProperty.call(this.serviceOption, "customCall")) {
                this.serviceOption.customCall(this.serviceOption, this.getAICallerUrl(), value);
            } else {
                FreezeUI();
                getAIResultLabelDicom(
                    this.serviceOption,
                    this.getAICallerUrl(),
                    value
                );
            }

        }
    }

    getNotExistInstances_(dicomUidsList) {

        let notExistsInstances = [];

        for (let uids of dicomUidsList) {
            let level = this.getUidLevel_(uids);

            if (level === "instance") {
                let instanceObj = getCachedImageByInstanceUID(uids.instanceUID);

                if (instanceObj)
                    this.doPushToNotExistInstances_(notExistsInstances, uids, instanceObj);

            } else if (level === "series") {
                let instanceObjArray = getCachedImagesBySeriesUID(uids.seriesInstanceUID);

                for (let instance of instanceObjArray) {
                    if (typeof instance === "object") {
                        this.doPushToNotExistInstances_(notExistsInstances, uids, instance);
                    }
                }
            } else if (level === "study") {
                let seriesObjArray = getCachedImagesByStudyUID(uids.studyInstanceUID);
                
                for (let seriesImages of seriesObjArray) {
                    for(let instance of seriesImages) {
                        if (typeof instance === "object") {
                            this.doPushToNotExistInstances_(notExistsInstances, uids, instance);
                        }
                    }
                }
            }

        }

        return notExistsInstances;

    }

    doPushToNotExistInstances_(notExistsInstances, uids, obj) {
        if (!obj.existInPACS) {
            notExistsInstances.push({
                uids,
                obj: obj
            });
        }
        return notExistsInstances;
    }

    getUidLevel_(uid) {

        if (Object.prototype.hasOwnProperty.call(uid, "sopInstanceUID")) {
            return "instance";
        } else if (Object.prototype.hasOwnProperty.call(uid, "seriesInstanceUID")) {
            return "series";
        }
        return "study";

    }
}

class AiServiceSelectorBuilder {
    /**
     *
     * @param {SelectorConfig[]} config
     */
    constructor(config) {
        this.buildedElements = [];
        this.config = config;
    }

    /**
     * @private
     * @param {string} name
     * @param {string} level
     * @returns
     */
    createBaseSelectElement_(name, level) {
        let select = document.createElement("select");
        select.classList.add("swal2-select");
        select.classList.add(`select-${level}`);
        select.style.display = "flex";
        addSelectPlaceholder(select, `Please select the ${name} ${level}`);
        return select;
    }

    /**
     * Get the last select element in buildedElements from specific level(study, series, instance)
     * @private
     * @param {"study" | "series" | "instance"} level
     */
    getLastSelectFromLevel_(level) {
        let buildedLevelList = this.buildedElements.map((v) => v.level);
        let lastIndexSelect = buildedLevelList.lastIndexOf(level);
        if (lastIndexSelect < 0) return undefined;
        let lastSelect = this.buildedElements[lastIndexSelect].element;
        return lastSelect;
    }

    /**
     * Build the select element that can select study UID for AI service
     * @param {string} name
     * @param {boolean} needPush
     * @return {Element}
     */
    buildStudySelectElement(name, needPush) {
        let select = this.createBaseSelectElement_(name, "study");
        let pushedStudyUIDs = [];
        for(let imageId in getPatientbyImageID) {
            let image = getPatientbyImageID[imageId];
            /** @type { import("dicom-parser").DataSet } */
            let dataset = image.image.data;
            let studyUID = dataset.string("x0020000d");
            if (pushedStudyUIDs.includes(studyUID)) continue;
            pushedStudyUIDs.push(studyUID);
            let patientID = dataset.string("x00100020");
            let studyOption = document.createElement("option");
            studyOption.value = studyUID;
            studyOption.text = `${patientID} - ${studyUID}`;
            select.appendChild(studyOption);
        }


        this.buildedElements.push({
            name: name,
            level: "study",
            needPush: needPush,
            element: select
        });
        return select;
    }

    /**
     *
     * @param {string} name
     * @param {string} studyUID
     */
    buildSeriesElement(name, needPush) {
        let select = this.createBaseSelectElement_(name, "series");

        // Get parent study select element
        // *If parent study not found, create it
        let lastStudySelect = this.getLastSelectFromLevel_("study");
        if (!lastStudySelect) {
            this.buildStudySelectElement("", false);
            lastStudySelect = this.getLastSelectFromLevel_("study");
        }

        // Bind to parent study select element
        // When study UID update, remove all option and add new series UID options
        lastStudySelect.addEventListener("change", () => {
            let selectedStudyUID = lastStudySelect.value;
            hideValidationMessage();
            if (selectedStudyUID) {
                removeOptions(select);
                addSelectPlaceholder(
                    select,
                    `Please select the ${name} series`
                );
                let seriesUIDs = getCachedSeriesUIDsByStudyUID(selectedStudyUID);
                for (let seriesUID of seriesUIDs) {
                    let seriesOption = document.createElement("option");
                    seriesOption.value = seriesUID;
                    seriesOption.text = seriesUID;
                    select.appendChild(seriesOption);
                }
            }
        });

        select.addEventListener("change", function () {
            hideValidationMessage();
        });

        let swalDocument = Swal.getHtmlContainer();
        swalDocument.append(select);

        this.buildedElements.push({
            name: name,
            level: "series",
            needPush: needPush,
            element: select
        });
    }

    /**
     *
     * @param {string} name
     * @param {string} studyUID
     * @param {string} seriesUID
     */
    buildInstanceElement(name, needPush) {
        let select = this.createBaseSelectElement_(name, "instance");

        let lastSeriesSelect = this.getLastSelectFromLevel_("series");
        if (!lastSeriesSelect) {
            this.buildSeriesElement("", false);
            lastSeriesSelect = this.getLastSelectFromLevel_("series");
        }

        let lastStudySelect = this.getLastSelectFromLevel_("study");

        // Bind to parent study select element
        // When study update, remove all option and add new series UID options
        lastSeriesSelect.addEventListener("change", () => {
            let selectedStudyUID = lastStudySelect.value;
            let selectedSeriesUID = lastSeriesSelect.value;
            hideValidationMessage();
            if (selectedStudyUID && selectedSeriesUID) {
                removeOptions(select);
                addSelectPlaceholder(
                    select,
                    `Please select the ${name} instance`
                );
                let seriesDataSet = getCachedImagesBySeriesUID(selectedSeriesUID);
                for (let instance of seriesDataSet) {
                    let instanceUID = instance.image.data.string("x00080018");
                    let instanceNumber = instance.image.data.string("x00200013");
                    let instanceOption = document.createElement("option");
                    instanceOption.value = instanceUID;
                    instanceOption.text = `number: ${instanceNumber} -> ${instanceUID}`;
                    select.appendChild(instanceOption);
                }
            }
        });

        select.addEventListener("change", function () {
            hideValidationMessage();
        });

        let swalDocument = Swal.getHtmlContainer();
        swalDocument.append(select);

        this.buildedElements.push({
            name: name,
            level: "instance",
            needPush: needPush,
            element: select
        });
    }

    build() {
        for (let i = 0; i < this.config.length; i++) {
            let selectorConfig = this.config[i];
            if (selectorConfig.level === "study") {
                this.buildStudySelectElement(
                    selectorConfig.name,
                    selectorConfig["push"]
                );
            } else if (selectorConfig.level === "series") {
                this.buildSeriesElement(
                    selectorConfig.name,
                    selectorConfig["push"]
                );
            } else if (selectorConfig.level === "instance") {
                this.buildInstanceElement(
                    selectorConfig.name,
                    selectorConfig["push"]
                );
            }
        }
    }
}

function getAIResultLabelDicom(aiServiceOption, url, requestBody) {
    let oReq = new XMLHttpRequest();
    try {
        let urlObj = new URL(url);
        if (Object.prototype.hasOwnProperty.call(requestBody, "params")) {
            let params = requestBody.params;
            for (let key in params) {
                let paramValue = params[key];
                urlObj.searchParams.append(key, paramValue);
            }
        }
        oReq.open("POST", urlObj.href, true);
        oReq.setRequestHeader("Content-Type", "application/json");
        if (oauthConfig.enable) OAuth.setRequestHeader(oReq);
    } catch (err) { }
    oReq.responseType = "arraybuffer";
    oReq.onreadystatechange = async function (oEvent) {
        if (oReq.readyState == 4) {
            UnFreezeUI();
            if (oReq.status == 200) {
                let responseContentType =
                    oReq.getResponseHeader("Content-Type");
                if (responseContentType) {
                    if (responseContentType.indexOf("multipart/related") >= 0) {
                        let multipartData = dcmjsMessage.multipartDecode(
                            oReq.response
                        );
                        for (let chunkBuffer of multipartData) {
                            readAILabelDicom(
                                aiName,
                                new Uint8Array(chunkBuffer),
                                PatientMark
                            );
                        }
                        return Toast.fire({
                            icon: "success",
                            title: `${aiServiceOption.name} AI execution completed`
                        });
                    } else if (responseContentType.indexOf("application/octet-stream") >= 0 ||
                        responseContentType.indexOf("application/dicom") >= 0
                    ) {
                        readAILabelDicom(
                            aiServiceOption.name,
                            new Uint8Array(oReq.response),
                            PatientMark
                        );
                        Toast.fire({
                            icon: "success",
                            title: `${aiServiceOption.name} AI execution completed`
                        });
                    } else {
                        // parse arrarbuffer response to json
                        let unit8Response = new Uint8Array(oReq.response);
                        let decodedStr = String.fromCharCode.apply(null, unit8Response);
                        let jsonData = JSON.parse(decodedStr);

                        jsonData["requestBody"] = requestBody;
                        await aiServiceOption.postFunction(jsonData);
                    }
                }
            } else {
                Toast.fire({
                    icon: "error",
                    title: "AI Execution failure"
                });
            }
        }
    };
    oReq.send(JSON.stringify(requestBody));
}

function readAILabelDicom(aiName, byteArray, patientmark) {
    var dataSet = dicomParser.parseDicom(byteArray);
    //console.log(dataSet.elements);
    // dataSet1 = dataSet;
    // if (!dataSet.elements.x60003000) {

    // } else {
    for (var ov = 0; ov <= 28; ov += 2) {
        var ov_str = "" + ov;
        if (ov < 10) ov_str = "0" + ov;
        if (!dataSet.elements["x600" + ov + "3000"]) continue;
        try {
            var pixelData = new Uint8ClampedArray(
                dataSet.byteArray.buffer,
                dataSet.elements["x60" + ov_str + "3000"].dataOffset,
                dataSet.elements["x60" + ov_str + "3000"].length
            );
            var tempPixeldata = new Uint8ClampedArray(pixelData.length * 8);
            var tempi = 0;
            var tempnum = 0;
            for (var num of pixelData) {
                tempnum = num;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 0] = 1;
                else tempPixeldata[num * 8 + 0] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 1] = 1;
                else tempPixeldata[num * 8 + 1] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 2] = 1;
                else tempPixeldata[num * 8 + 2] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 3] = 1;
                else tempPixeldata[num * 8 + 3] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 4] = 1;
                else tempPixeldata[num * 8 + 4] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 5] = 1;
                else tempPixeldata[num * 8 + 5] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 6] = 1;
                else tempPixeldata[num * 8 + 6] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 7] = 1;
                else tempPixeldata[num * 8 + 7] = 0;
                tempi += 8;
            }
            //var tvList = ['Overlay'];
            var dcm = {};
            dcm.study = dataSet.string("x0020000d");
            dcm.series = dataSet.string("x0020000e");
            dcm.sop = dataSet.string("x00080018");
            dcm.height = dataSet.uint16("x600" + ov + "0010");
            dcm.width = dataSet.uint16("x600" + ov + "0011");
            dcm.mark = [];
            dcm.showName = "Overlay";
            dcm.hideName = dcm.showName + "x60" + ov_str + "1500";
            if (dataSet.string("x60" + ov_str + "1500")) {
                dcm.showName = dataSet.string("x60" + ov_str + "1500");
            }
            dcm.mark.push({});
            var DcmMarkLength = dcm.mark.length - 1;
            dcm.mark[DcmMarkLength].type = "Overlay";
            dcm.mark[DcmMarkLength].pixelData = tempPixeldata.slice(0);
            dcm.mark[DcmMarkLength].canvas = document.createElement("CANVAS");
            dcm.mark[DcmMarkLength].canvas.width = dcm.width;
            dcm.mark[DcmMarkLength].canvas.height = dcm.height;
            dcm.mark[DcmMarkLength].ctx =
                dcm.mark[DcmMarkLength].canvas.getContext("2d");
            var pixelData = dcm.mark[DcmMarkLength].ctx.getImageData(
                0,
                0,
                dcm.width,
                dcm.height
            );
            for (var i = 0, j = 0; i < pixelData.data.length; i += 4, j++)
                if (dcm.mark[DcmMarkLength].pixelData[j] == 1) {
                    pixelData.data[i] = 0;
                    pixelData.data[i + 1] = 0;
                    pixelData.data[i + 2] = 255;
                    pixelData.data[i + 3] = 255;
                }
            dcm.mark[DcmMarkLength].ctx.putImageData(pixelData, 0, 0);
            patientmark.push(dcm);
            refreshMark(dcm);
        } catch (ex) { }
    }
    //   }
    ////暫時取消的功能
    /*
  if (openfile && openfile == true) {
    if (dataSet.string('x00080016') == '1.2.840.10008.5.1.4.1.1.481.2') {
      LeftImg("Dose");
    }
    if (dataSet.string('x00080016') == '1.2.840.10008.5.1.4.1.1.481.3') {
      LeftImg("Struct");
    }
    if (dataSet.string('x00080016') == '1.2.840.10008.5.1.4.1.1.481.5') {
      LeftImg("Plan");
    }
  }*/
    var tvList = [];
    if (dataSet.string("x30060020")) {
        for (var i in dataSet.elements.x30060020.items) {
            if (
                dataSet.elements.x30060020.items[i].dataSet.string("x30060026")
            ) {
                tvList.push(
                    "" +
                    dataSet.elements.x30060020.items[i].dataSet.string(
                        "x30060026"
                    )
                );
            }
        }
    }

    if (dataSet.string("x00700001")) {
        var sop1;
        if (dataSet.string("x00081115")) {
            for (var ii2 in dataSet.elements.x00081115.items) {
                var x00081115DataSet =
                    dataSet.elements.x00081115.items[ii2].dataSet.elements
                        .x00081140.items;
                //console.log(x00081115DataSet.length);
                for (var s = 0; s < x00081115DataSet.length; s++) {
                    //for (var ii3 in x00081115DataSet) {
                    sop1 = x00081115DataSet[s].dataSet.string("x00081155");
                    //}

                    var tempsop = "";
                    var tempDataSet = "";
                    var GSPS_Text = "";
                    function POLYLINE_Function(tempDataSet, GSPS_Text, g) {
                        // console.log(j);
                        if (tempDataSet == "") {
                            return;
                        }
                        // for (var j in tempDataSet) {
                        if (g != undefined) var tempDataSetLengthList = [g];
                        else {
                            var tempDataSetLengthList = tempDataSet;
                            // console.log(tempDataSetLengthList.length);
                        }
                        for (
                            var j1 = 0;
                            j1 < tempDataSetLengthList.length;
                            j1++
                        ) {
                            var j = tempDataSetLengthList[j1];
                            if (g != undefined)
                                var j = tempDataSetLengthList[j1];
                            else {
                                var j = j1;
                                //console.log(j);
                            }
                            //console.log(g+","+j);
                            // if (g)console.log(j,tempDataSet[j]);
                            // {
                            if (
                                tempDataSet[j].dataSet.string("x00700023") ==
                                "POLYLINE"
                            ) {
                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});

                                var showname = "POLYLINE";
                                if (tempDataSet[j].dataSet.elements.x00700232) {
                                    var ColorSequence =
                                        tempDataSet[j].dataSet.elements
                                            .x00700232.items[0].dataSet;
                                    var color = ConvertGraphicColor(
                                        ColorSequence.uint16("x00700251", 0),
                                        ColorSequence.uint16("x00700251", 1),
                                        ColorSequence.uint16("x00700251", 2)
                                    );
                                    if (color) {
                                        dcm.color = color[0];
                                        showname = color[1];
                                    }
                                }

                                dcm.showName = showname;
                                if (GSPS_Text != "" && GSPS_Text != undefined) {
                                    dcm.showName = GSPS_Text;
                                }
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "POLYLINE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].RotationAngle =
                                    tempDataSet[j].dataSet.double("x00710230");
                                dcm.mark[DcmMarkLength].GraphicFilled =
                                    tempDataSet[j].dataSet.string("x00700024");

                                dcm.mark[DcmMarkLength].RotationPoint = [
                                    tempDataSet[j].dataSet.float(
                                        "x00710273",
                                        0
                                    ),
                                    tempDataSet[j].dataSet.float("x00710273", 1)
                                ];
                                if (GSPS_Text != "" && GSPS_Text != undefined) {
                                    dcm.mark[DcmMarkLength].GSPS_Text =
                                        GSPS_Text;
                                }
                                var xTemp16 =
                                    tempDataSet[j].dataSet.string("x00700022");

                                function getTag(tag) {
                                    var group = tag.substring(1, 5);
                                    var element = tag.substring(5, 9);
                                    var tagIndex = (
                                        "(" +
                                        group +
                                        "," +
                                        element +
                                        ")"
                                    ).toUpperCase();
                                    var attr = TAG_DICT[tagIndex];
                                    return attr;
                                }
                                var rect =
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700020"
                                        )
                                    ) *
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700021"
                                        )
                                    );
                                for (var r = 0; r < rect; r += 2) {
                                    var GraphicData = getTag("x00700022");
                                    var numX = 0,
                                        numY = 0;
                                    if (GraphicData.vr == "US") {
                                        numX = tempDataSet[j].dataSet.uint16(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.uint16(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "SS") {
                                        numX = tempDataSet[j].dataSet.int16(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.int16(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "UL") {
                                        numX = tempDataSet[j].dataSet.uint32(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.uint32(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "SL") {
                                        numX = tempDataSet[j].dataSet.int32(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.int32(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "FD") {
                                        numX = tempDataSet[j].dataSet.double(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.double(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "FL") {
                                        numX = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else {
                                        numX = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r + 1
                                        );
                                    }
                                    if (
                                        dcm.mark[DcmMarkLength].RotationAngle &&
                                        dcm.mark[DcmMarkLength].RotationPoint
                                    ) {
                                        [numX, numY] = rotatePoint(
                                            [numX, numY],
                                            -dcm.mark[DcmMarkLength]
                                                .RotationAngle,
                                            dcm.mark[DcmMarkLength]
                                                .RotationPoint
                                        );
                                    }
                                    dcm.mark[DcmMarkLength].markX.push(
                                        parseFloat(numX)
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        parseFloat(numY)
                                    );
                                }
                                patientmark.push(dcm);
                                refreshMark(dcm, false);
                                //if(dcm.mark[DcmMarkLength].GraphicFilled=='Y'){
                                //console.log(dcm);
                                // }
                            }

                            if (
                                tempDataSet[j].dataSet.string("x00700023") ==
                                "CIRCLE"
                            ) {
                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});
                                var showname = "CIRCLE";
                                if (tempDataSet[j].dataSet.elements.x00700232) {
                                    var ColorSequence =
                                        tempDataSet[j].dataSet.elements
                                            .x00700232.items[0].dataSet;
                                    var color = ConvertGraphicColor(
                                        ColorSequence.uint16("x00700251", 0),
                                        ColorSequence.uint16("x00700251", 1),
                                        ColorSequence.uint16("x00700251", 2)
                                    );
                                    if (color) {
                                        dcm.color = color[0];
                                        showname = color[1];
                                    }
                                }
                                dcm.showName = showname;
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "CIRCLE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].GraphicFilled =
                                    tempDataSet[j].dataSet.string("x00700024");
                                var xTemp16 =
                                    tempDataSet[j].dataSet.string("x00700022");
                                var rect =
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700020"
                                        )
                                    ) *
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700021"
                                        )
                                    );
                                for (var r = 0; r < rect; r += 4) {
                                    var numX = 0,
                                        numY = 0,
                                        numX2 = 0,
                                        numY2 = 0;
                                    numX = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r
                                    );
                                    numY = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r + 1
                                    );
                                    numX2 = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r + 2
                                    );
                                    numY2 = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r + 3
                                    );
                                    /*if (dcm.mark[DcmMarkLength].RotationAngle && dcm.mark[DcmMarkLength].RotationPoint) {
                    [numX, numY] = rotatePoint([numX, numY], -dcm.mark[DcmMarkLength].RotationAngle, dcm.mark[DcmMarkLength].RotationPoint);
                  }*/
                                    dcm.mark[DcmMarkLength].markX.push(
                                        parseFloat(numX)
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        parseFloat(numY)
                                    );
                                    dcm.mark[DcmMarkLength].markX.push(
                                        parseFloat(numX2)
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        parseFloat(numY2)
                                    );
                                }
                                patientmark.push(dcm);
                                refreshMark(dcm, false);
                            }
                            if (
                                tempDataSet[j].dataSet.string("x00700015") &&
                                tempDataSet[j].dataSet.string("x00700015") ==
                                "Y"
                            ) {
                                // console.log('Y');

                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});

                                var showname = "Anchor";
                                if (tempDataSet[j].dataSet.elements.x00700232) {
                                    var ColorSequence =
                                        tempDataSet[j].dataSet.elements
                                            .x00700232.items[0].dataSet;
                                    var color = ConvertGraphicColor(
                                        ColorSequence.uint16("x00700251", 0),
                                        ColorSequence.uint16("x00700251", 1),
                                        ColorSequence.uint16("x00700251", 2)
                                    );
                                    if (color) {
                                        dcm.color = color[0];
                                        showname = color[1];
                                    }
                                }

                                dcm.showName = showname;
                                if (GSPS_Text != "" && GSPS_Text != undefined) {
                                    dcm.showName = GSPS_Text;
                                }
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "POLYLINE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].markX.push(
                                    tempDataSet[j].dataSet.float(
                                        "x00700010",
                                        0
                                    ),
                                    tempDataSet[j].dataSet.float("x00700011", 0)
                                );
                                dcm.mark[DcmMarkLength].markY.push(
                                    tempDataSet[j].dataSet.float(
                                        "x00700010",
                                        1
                                    ),
                                    tempDataSet[j].dataSet.float("x00700011", 1)
                                );
                                patientmark.push(dcm);
                                refreshMark(dcm, false);
                            }

                            if (
                                !tempDataSet[j].dataSet.string("x00700023") &&
                                GSPS_Text == ""
                            ) {
                                //var xTemp10 = [tempDataSet[j].dataSet.float('x00700010', 0), tempDataSet[j].dataSet.float('x00700010', 1)];
                                //var yTemp10 = [tempDataSet[j].dataSet.float('x00700011', 0), tempDataSet[j].dataSet.float('x00700011', 1)];
                                GSPS_Text =
                                    tempDataSet[j].dataSet.string("x00700006");
                                //console.log(j+"   "+GSPS_Text);
                                if (GSPS_Text != "") {
                                    //console.log(xTemp10+"  "+yTemp10+"   "+GSPS_Text);
                                    var dcm = {};
                                    dcm.sop = sop1;
                                    dcm.mark = [];
                                    dcm.mark.push({});
                                    var showname = "TEXT";
                                    dcm.showName = showname;
                                    dcm.hideName = dcm.showName;
                                    var DcmMarkLength = dcm.mark.length - 1;
                                    dcm.mark[DcmMarkLength].type = "TEXT";
                                    dcm.mark[DcmMarkLength].markX = [];
                                    dcm.mark[DcmMarkLength].markY = [];
                                    if (
                                        GSPS_Text != "" &&
                                        GSPS_Text != undefined
                                    ) {
                                        GSPS_Text = ("" + GSPS_Text).replace(
                                            "\r\n",
                                            "\n"
                                        );
                                        dcm.mark[DcmMarkLength].GSPS_Text =
                                            GSPS_Text;
                                    }
                                    dcm.mark[DcmMarkLength].markX.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700010",
                                            0
                                        )
                                    );
                                    dcm.mark[DcmMarkLength].markX.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700011",
                                            0
                                        )
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700010",
                                            1
                                        )
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700011",
                                            1
                                        )
                                    );
                                    patientmark.push(dcm);
                                    refreshMark(dcm, false);
                                }
                            }
                            if (
                                tempDataSet[j].dataSet.string("x00700023") ==
                                "ELLIPSE"
                            ) {
                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});
                                var showname = "ELLIPSE";
                                dcm.showName = showname;
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "ELLIPSE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].GraphicFilled =
                                    tempDataSet[j].dataSet.string("x00700024");
                                var xTemp16 =
                                    tempDataSet[j].dataSet.string("x00700022");
                                var ablecheck = false;
                                for (var k2 = 0; k2 < xTemp16.length; k2 += 4) {
                                    var output1 =
                                        xTemp16[k2].charCodeAt(0).toString(2) +
                                        "";
                                    var output2 =
                                        xTemp16[k2 + 1]
                                            .charCodeAt(0)
                                            .toString(2) + "";
                                    var output3 =
                                        xTemp16[k2 + 2]
                                            .charCodeAt(0)
                                            .toString(2) + "";
                                    var output4 =
                                        xTemp16[k2 + 3]
                                            .charCodeAt(0)
                                            .toString(2) + "";
                                    var data = [
                                        parseInt(output1, 2),
                                        parseInt(output2, 2),
                                        parseInt(output3, 2),
                                        parseInt(output4, 2)
                                    ];
                                    var buf = new ArrayBuffer(4 /* * 4*/);
                                    var view = new DataView(buf);
                                    data.forEach(function (b, i) {
                                        view.setUint8(i, b, true);
                                    });
                                    var num = view.getFloat32(0, true);
                                    if (ablecheck == false) {
                                        dcm.mark[DcmMarkLength].markX.push(num);
                                    } else {
                                        dcm.mark[DcmMarkLength].markY.push(num);
                                    }
                                    ablecheck = !ablecheck;
                                }
                                patientmark.push(dcm);
                                //console.log(PatientMark);
                                refreshMark(dcm, false);
                            }
                        }
                    }

                    try {
                        for (var i in dataSet.elements.x00700001.items) {
                            for (
                                var d1 = 0;
                                d1 <
                                dataSet.elements.x00700001.items[i].dataSet
                                    .elements.x00081140.items.length;
                                d1++
                            ) {
                                var tempsop =
                                    dataSet.elements.x00700001.items[
                                        i
                                    ].dataSet.elements.x00081140.items[
                                        d1
                                    ].dataSet.string("x00081155");
                                if (tempsop == sop1) {
                                    tempDataSet =
                                        dataSet.elements.x00700001.items[i]
                                            .dataSet.elements.x00700009.items;
                                    // for (var g = 0; g < dataSet.elements.x00700001.items[i].dataSet.elements.x00700009.items.length; g++) {
                                    try {
                                        //GSPS_Text = dataSet.elements.x00700001.items[i].dataSet.elements.x00700008.items[g].dataSet.string("x00700006");
                                        POLYLINE_Function(
                                            tempDataSet,
                                            "",
                                            undefined
                                        );
                                        // alert(i+"  "+ g);
                                    } catch (ex) { }
                                    // }
                                    try {
                                        for (
                                            var g = 0;
                                            g <
                                            dataSet.elements.x00700001.items[i]
                                                .dataSet.elements.x00700008
                                                .items.length;
                                            g++
                                        ) {
                                            try {
                                                GSPS_Text =
                                                    dataSet.elements.x00700001.items[
                                                        i
                                                    ].dataSet.elements.x00700008.items[
                                                        g
                                                    ].dataSet.string(
                                                        "x00700006"
                                                    );

                                                tempDataSet =
                                                    dataSet.elements.x00700001
                                                        .items[i].dataSet
                                                        .elements.x00700008
                                                        .items;
                                                //console.log(g);
                                                POLYLINE_Function(
                                                    tempDataSet,
                                                    "",
                                                    g
                                                );
                                                // alert(i+"  "+ g);
                                            } catch (ex) { }
                                        }
                                    } catch (ex) { }

                                    //break;
                                }

                                if (tempsop != sop1) continue;
                            }
                        }
                        if (sop1) refreshMarkFromSop(sop1);
                    } catch (ex) {
                        for (var i in dataSet.elements.x00700001.items) {
                            try {
                                tempDataSet =
                                    dataSet.elements.x00700001.items[i].dataSet
                                        .elements.x00700009.items;

                                POLYLINE_Function(tempDataSet, GSPS_Text);
                            } catch (ex) {
                                console.log(GSPS_Text);
                                continue;
                            }
                        }
                        if (sop1) refreshMarkFromSop(sop1);
                    }
                }

                //  }
            }
        }
    } //

    if (dataSet.string("x30060039")) {
        for (var i in dataSet.elements.x30060039.items) {
            var colorStr = (
                "" +
                dataSet.elements.x30060039.items[i].dataSet.string("x3006002a")
            ).split("\\");
            var color;
            if (colorStr)
                color =
                    "rgb(" +
                    parseInt(colorStr[0]) +
                    ", " +
                    parseInt(colorStr[1]) +
                    ", " +
                    parseInt(colorStr[2]) +
                    ")";
            for (var j in dataSet.elements.x30060039.items[i].dataSet.elements
                .x30060040.items) {
                for (var k in dataSet.elements.x30060039.items[i].dataSet
                    .elements.x30060040.items[j].dataSet.elements.x30060016
                    .items) {
                    var dcm = {};
                    dcm.study = dataSet.string("x0020000d");
                    dcm.series = dataSet.string("x0020000e");
                    try {
                        dcm.series =
                            dataSet.elements.x30060010.items[0].dataSet.elements.x30060012.items[0].dataSet.elements.x30060014.items[0].dataSet.string(
                                "x0020000e"
                            );
                    } catch (ex) { }

                    dcm.color = color;
                    dcm.mark = [];
                    if (tvList[i]) {
                        dcm.showName = tvList[i];
                    }
                    dcm.hideName = dcm.showName;
                    dcm.mark.push({});
                    //dcm.SliceLocation=dataSet.string('x00201041');
                    dcm.sop =
                        dataSet.elements.x30060039.items[
                            i
                        ].dataSet.elements.x30060040.items[
                            j
                        ].dataSet.elements.x30060016.items[k].dataSet.string(
                            "x00081155"
                        );
                    var DcmMarkLength = dcm.mark.length - 1;
                    dcm.mark[DcmMarkLength].type = "RTSS";
                    dcm.mark[DcmMarkLength].markX = [];
                    dcm.mark[DcmMarkLength].markY = [];
                    var str0 = (
                        "" +
                        dataSet.elements.x30060039.items[
                            i
                        ].dataSet.elements.x30060040.items[j].dataSet.string(
                            "x30060050"
                        )
                    ).split("\\");
                    for (var k2 = 0; k2 < str0.length; k2 += 3) {
                        dcm.mark[DcmMarkLength].markX.push(
                            parseFloat(str0[k2])
                        );
                        dcm.mark[DcmMarkLength].markY.push(
                            parseFloat(str0[k2 + 1])
                        );
                        dcm.imagePositionZ = parseFloat(str0[k2 + 2]);
                    }
                    patientmark.push(dcm);
                    refreshMark(dcm);
                }
            }
        }
    }
    Toast.fire({
        icon: "success",
        title: `${aiName} AI execution completed`
    });
}

window.Toast = Toast;
export {
    AIService,
    AiServiceSelectorBuilder
}