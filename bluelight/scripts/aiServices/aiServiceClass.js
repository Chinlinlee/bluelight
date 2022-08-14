/**
 * @typedef SelectorConfig
 * @property {string} name
 * @property {string} level
 */

/**
 * @typedef AiServiceOption
 * @property {string} name
 * @property {SelectorConfig[]} selector
 */

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
            let urlObj = new URL("/ai-service", ConfigLog.AIService.baseUrl);
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
            ConfigLog.AIService.baseUrl
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
            cloneUidObj["sopInstanceUid"] = uid;
        }
        return cloneUidObj;
    }

    async createAIServiceComponent() {
        let selectorBuilder = new AiServiceSelectorBuilder(
            this.serviceOption.selector
        );
        selectorBuilder.build();

        let { value } = await Swal.fire({
            title: "AI Service",
            html: "<span style='color: #F0F0F0'><strong></strong></span>",
            didOpen: () => {
                let swalDocument = Swal.getHtmlContainer();
                selectorBuilder.buildedElements.forEach((buildedElement) => {
                    swalDocument.append(buildedElement.element);
                    AIService.defaultStudySelect(buildedElement.element);
                });
            },
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                let reqBody = {
                    dicomUidsList: []
                };
                let uidObj = {};
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
                return reqBody;
            }
        });
        if (value) {
            FreezeUI();
            getAIResultLabelDicom(
                this.serviceOption.name,
                this.getAICallerUrl(),
                value
            );
        }
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
        for (let studyUID in parsedDicomList) {
            let studyDataSet = parsedDicomList[studyUID];
            let patientName = studyDataSet.PatientName;
            let studyOption = document.createElement("option");
            studyOption.value = studyUID;
            studyOption.text = `${patientName} - ${studyUID}`;
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
                let studyDataSet = parsedDicomList[selectedStudyUID];
                for (let seriesUID in studyDataSet) {
                    if (seriesUID === "PatientName") continue;
                    let seriesDataSet = studyDataSet[seriesUID];
                    let seriesOption = document.createElement("option");
                    seriesOption.value = seriesUID;
                    seriesOption.text = `${seriesDataSet.SeriesDescription} - ${seriesUID}`;
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
                let seriesDataSet = parsedDicomList[selectedStudyUID][selectedSeriesUID];
                for (let instanceUID in seriesDataSet) {
                    if (instanceUID === "SeriesDescription") continue;
                    let instanceDataSet = seriesDataSet[instanceUID];
                    let instanceOption = document.createElement("option");
                    instanceOption.value = instanceUID;
                    instanceOption.text = `number: ${instanceDataSet.InstanceNumber} -> ${instanceUID}`;
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
