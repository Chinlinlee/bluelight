class VestibularSchwannomaAIService {
    constructor() {
        
    }

    /**
     * 
     * @type {string}
     */
    static getAICallerUrl () {
        let urlObj = new URL("/ai-service/vestibular-schwannoma", ConfigLog.AIService.baseUrl);
        return urlObj.href;
    }

    static async createAIServiceComponent() {
        let studySelect = AIService.buildStudySelectElement();
        studySelect.onchange = function () {
            let selectedStudyUID = this.value;
            removeSeriesSelectElements();
            hideValidationMessage();
            if (selectedStudyUID) {
                VestibularSchwannomaAIService.appendSeriesSelectElement(selectedStudyUID);
            }
        };
        let { value } = await Swal.fire({
            title: "AI Service",
            html: "<span style='color: #F0F0F0'><strong>study:</strong></span>",
            didOpen: () => {
                let swalDocument = Swal.getHtmlContainer();
                swalDocument.append(studySelect);
                AIService.defaultStudySelect(studySelect);

            },
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                let swalDocument = Swal.getHtmlContainer();
                let studyUID = swalDocument.querySelector("#selectStudy").value;
                if (!studyUID) {
                    Swal.showValidationMessage(`You need to select study UID`);
                    return;
                } else {
                    let seriesT1cUID =
                        swalDocument.querySelector("#selectSeriesT1c").value;
                    let seriesT2UID =
                        swalDocument.querySelector("#selectSeriesT2").value;
                    if (!seriesT1cUID) {
                        Swal.showValidationMessage(
                            `You need to select series T1c UID`
                        );
                        return;
                    }
                    if (!seriesT2UID) {
                        Swal.showValidationMessage(
                            `You need to select series T2 UID`
                        );
                        return;
                    }
                    return {
                        studyInstanceUID: studyUID,
                        seriesInstanceUIDList: [seriesT1cUID, seriesT2UID]
                    };
                }
            }
        });
        if (value) {
            FreezeUI();
            getAIVestibularSchwannomaRTSSDicom(
                VestibularSchwannomaAIService.getAICallerUrl(),
                value
            );
        }
    }

    static appendSeriesSelectElement(studyUID) {
        let select = document.createElement("select");
        select.classList.add("swal2-select");
        select.classList.add("select-series");
        select.id = "selectSeriesT1c";
        select.style.display = "flex";
        let placeholderOption = document.createElement("option");
        placeholderOption.disabled = "";
        placeholderOption.value = "";
        placeholderOption.text = "Please select a t1c series";
        select.appendChild(placeholderOption);
    
        let studyDataSet = parsedDicomList[studyUID];
        for (let seriesUID in studyDataSet) {
            if (seriesUID === "PatientName") continue;
            let seriesDataSet = studyDataSet[seriesUID];
            let seriesOption = document.createElement("option");
            seriesOption.value = seriesUID;
            seriesOption.text = `${seriesDataSet.SeriesDescription} - ${seriesUID}`;
            select.appendChild(seriesOption);
        }
        select.onchange = function () {
            hideValidationMessage();
        };
    
        let swalDocument = Swal.getHtmlContainer();
        swalDocument.append(select);
    
        let t2SeriesSelect = select.cloneNode(true);
        t2SeriesSelect.options[0].text = "Please select a t2 series";
        t2SeriesSelect.id = "selectSeriesT2";
        swalDocument.append(t2SeriesSelect);
    }
    
}