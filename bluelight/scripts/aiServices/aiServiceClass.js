class AIService {
    constructor() {}

    /**
     * Build the select element that can select study UID for AI service
     * @return {Element}
     */
    static buildStudySelectElement() {
        let select = document.createElement("select");
        select.classList.add("swal2-select");
        select.style.display = "flex";
        select.id = "selectStudy";
        let placeholderOption = document.createElement("option");
        placeholderOption.disabled = "";
        placeholderOption.value = "";
        placeholderOption.text = "Please select a study";
        select.appendChild(placeholderOption);
        for (let studyUID in parsedDicomList) {
            let studyDataSet = parsedDicomList[studyUID];
            let patientName = studyDataSet.PatientName;
            let studyOption = document.createElement("option");
            studyOption.value = studyUID;
            studyOption.text = `${patientName} - ${studyUID}`;
            select.appendChild(studyOption);
        }
        return select;
    }

    /**
     * @param {Element} selectElement
     * @type {void}
     */
    static defaultStudySelect(selectElement) {
        let urlQueryString = window.location.search;
        let searchParams = new URLSearchParams(urlQueryString);
        let studyInstanceUID =
            searchParams.get("StudyInstanceUID") || searchParams.get("0020000D");
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
            request.onreadystatechange = function() {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        let resJson  = request.response;
                        return resolve(resJson);
                    } else {
                        console.error({
                            status: request.status,
                        });
                        return reject(new Error("The request failed"));
                    }
                }
            }
            request.send();
        });
    }

    /**
     * 
     * @param { string } aiName 
     * @type { Element }
     */
    static buildServiceButtonElement(aiName) {
        let btn = document.createElement("button");
        btn.innerText = aiName;
        btn.classList.add("swal2-confirm");
        btn.classList.add("swal2-styled");
        btn.classList.add("btn-gray");
        btn.classList.add("btn-ai-service");
        return btn;
    }

}
