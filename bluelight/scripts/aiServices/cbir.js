window.cbir = {};

function createCbirHtml() {
    let template = `
    <div class="cbir-body-overlay"></div>
    <div class="cbir-real-body">
        <h2 class="cbir-title">CBIR Results</h2>
        <div class="q-image-body">
            <div class="q-image" id="q-image">

            </div>
            <label>query image</label>
        </div>

        <div class="similarity-images">

            <div class="row row-0">
            </div>

            <div class="row row-1">
            </div>

            <div class="row row-2">
            </div>
        
        </div>

        <nav class="pagination-container">
            <button class="pagination-button" id="cbir-prev-button" aria-label="Previous page" title="Previous page">
            &lt;
            </button>

            <button class="pagination-button" id="cbir-next-button" aria-label="Next page" title="Next page">
            &gt;
            </button>
        </nav>

    </div>
    `;
    let body = document.querySelector("body");
    body.insertAdjacentHTML("beforeend", template);

    window.cbir.currentPage = 1;
    window.cbir.nextButton = document.getElementById("cbir-next-button");
    window.cbir.prevButton = document.getElementById("cbir-prev-button");

    window.cbir.prevButton.addEventListener("click", () => {
        window.cbir.changePage(window.cbir.currentPage - 1);
    });

    window.cbir.nextButton.addEventListener("click", () => {
        window.cbir.changePage(window.cbir.currentPage + 1);
    });

    window.cbir.handlePageButtonsStatus();
}

function toggleCbirBody() {
    let cbirBodyOverlay = document.querySelector(".cbir-body-overlay");
    cbirBodyOverlay.classList.toggle("active");
    let cbirRealBody = document.querySelector(".cbir-real-body");
    cbirRealBody.classList.toggle("active");
}


window.cbir.loadAndViewQueryImage = (url) => {
    let qImageElement = document.querySelector(".q-image-body .q-image");
    cornerstone.enable(qImageElement);

    cornerstone
        .loadImage(url)
        .then((image) => {
            let viewport = cornerstone.getDefaultViewportForImage(
                qImageElement,
                image
            );
            cornerstone.displayImage(qImageElement, image, viewport);
        })
        .catch((e) => {
            console.error(e);
        });
};

window.cbir.loadAndViewHitImages = (url, element) => {
    cornerstone.enable(element);

    cornerstone
        .loadImage(url)
        .then((image) => {
            let viewport = cornerstone.getDefaultViewportForImage(
                element,
                image
            );
            cornerstone.displayImage(element, image, viewport);
        })
        .catch((e) => {
            console.error(e);
        });
};

window.cbir.clearSimilarityImage = () => {
    let rows = document.querySelectorAll(".similarity-images .row");
    rows.forEach((row) => {
        while (row.firstChild) {
            row.removeChild(row.firstChild);
        }
    });
};

window.cbir.toggleCbirBody = toggleCbirBody;

/**
 * 
 * @param {Uids} uids 
 */
window.cbir.getStudyRT = async (uids) => {

    //Get All instances in series
    let rtStudiesInfo = await window.dicomWebClient.QidoRs.searchForSeries({
        studyInstanceUID: uids.studyInstanceUID,
        queryParams: {
            Modality: "RTSTRUCT"
        }
    });

    for (let rtStudy of rtStudiesInfo) {

        let rtInstances = await window.dicomWebClient.QidoRs.searchForInstances({
            studyInstanceUID: rtStudy["0020000D"].Value[0],
            seriesInstanceUID: rtStudy["0020000E"].Value[0]
        });

        for (let rtInstance of rtInstances) {
            let studyInstanceUID = rtInstance["0020000D"].Value[0];
            let seriesInstanceUID = rtInstance["0020000E"].Value[0];
            let sopInstanceUID = rtInstance["00080018"].Value[0];
    
            let retrievalInstanceUrl = window.dicomWebClient.getInstanceUrlByBlueLightConfigWadoMode({
                studyInstanceUID,
                seriesInstanceUID,
                sopInstanceUID
            });
        
            readDicom(retrievalInstanceUrl, PatientMark, true);
        }

    }

};

/**
 *
 * @param {Uids} uids
 */
window.cbir.onDoubleClickDoc = async (uids) => {
    console.log("selected similarity DICOM uids", uids);

    //Get All instances in series
    let instancesInfo = await window.dicomWebClient.QidoRs.searchForInstances({
        studyInstanceUID: uids.studyInstanceUID,
        seriesInstanceUID: uids.seriesInstanceUID
    });

    let uidsList = [];

    FreezeUI();

    try {
        
        for(let instanceInfo of instancesInfo) {
            let studyInstanceUID = instanceInfo["0020000D"].Value[0];
            let seriesInstanceUID = instanceInfo["0020000E"].Value[0];
            let sopInstanceUID = instanceInfo["00080018"].Value[0];
    
            let retrievalInstanceUrl = "";
            if (ConfigLog.WADO.WADOType == "URI") {
    
                retrievalInstanceUrl = window.dicomWebClient.WadoURI.getInstanceUrl({
                    studyInstanceUID,
                    seriesInstanceUID,
                    sopInstanceUID
                });
    
                loadAndViewImage(`wadouri:${retrievalInstanceUrl}`, 1);
    
            } else if (ConfigLog.WADO.WADOType == "RS") {
    
                retrievalInstanceUrl = window.dicomWebClient.WadoRs.getInstanceUrl({
                    studyInstanceUID,
                    seriesInstanceUID,
                    sopInstanceUID
                });
    
                wadorsLoader(retrievalInstanceUrl);
    
            }
    
            uidsList.push({
                studyInstanceUID,
                seriesInstanceUID,
                sopInstanceUID
            });
        }
    
        await window.cbir.getStudyRT(uids);
        window.cbir.changeDisplayDicomAfterSeriesLoaded(uidsList, uids.sopInstanceUID);
    
        toggleCbirBody();

        UnFreezeUI();

    } catch(e) {
        console.error(e);
        UnFreezeUI();
    }

};

/**
 * @param {Uids[]} uidsList
 */
window.cbir.changeDisplayDicomAfterSeriesLoaded = (uidsList, sopInstanceUID)=> {

    let completeInstanceList = [];
    
    let checkCompleteInterval = setInterval(() => {
        for (let uids of uidsList) {
            let parsedDicom = window.parsedDicomList[uids.studyInstanceUID] &&
                              window.parsedDicomList[uids.studyInstanceUID][uids.seriesInstanceUID] &&
                              window.parsedDicomList[uids.studyInstanceUID][uids.seriesInstanceUID][uids.sopInstanceUID];
    
            if (parsedDicom && !completeInstanceList.includes(uids.sopInstanceUID)) {
                completeInstanceList.push(uids.sopInstanceUID);
            }

        }
        
        if (completeInstanceList.length === uidsList.length) {
            console.log("load series complete", uidsList[0].seriesInstanceUID);
            changeToSpecificInstance(sopInstanceUID);
            clearInterval(checkCompleteInterval);
        }
        
    }, 100);
    
};

/**
 * Show query image on top of CBIR side panel
 * @param {Object} data CBIR response data
 */
window.cbir.showQueryImage = (data) => {
    let qImageData = data["requestBody"]["dicomUidsList"];
    if (typeof qImageData === "object") {
        if (qImageData.length > 0) {
            qImageData = qImageData.pop();
        }
    }
    
    let queryInstanceUrl = window.dicomWebClient.getInstanceUrlByBlueLightConfigWadoMode({
        studyInstanceUID: qImageData.studyInstanceUID,
        seriesInstanceUID: qImageData.seriesInstanceUID,
        sopInstanceUID: qImageData.sopInstanceUID
    });

    window.cbir.loadAndViewQueryImage(`wadouri:${queryInstanceUrl}`);
};

/**
 * Show replied similarity images on CBIR side panel
 * @param {Object} data 
 */
window.cbir.showSimilarityImages = async (data) => {
    window.cbir.clearSimilarityImage();

    let similarityDocs = data.data;
    let row = 0;

    if (!similarityDocs) {
        Toast.fire({
            icon: "error",
            title: "AI Execution failure, or there is no similarity image"
        });
        return;
    }

    for (let i = 0; i < similarityDocs.length; i++) {
        let doc = similarityDocs[i];
        let { studyInstanceUID, seriesInstanceUID, sopInstanceUID } = doc;

        let instancesInSeries =
            await window.dicomWebClient.QidoRs.searchForInstances(doc);
        if (typeof instancesInSeries !== "object") instancesInSeries = [];

        let isInstanceExists = instancesInSeries.find(
            (v) => v["00080018"]["Value"][0] === sopInstanceUID
        );
        if (isInstanceExists) {
            let instanceUrl = getUrlByUids({
                studyInstanceUID,
                seriesInstanceUID,
                sopInstanceUID
            });

            let rowElement = document.querySelector(
                `.similarity-images .row.row-${row}`
            );

            let imageBodyElement = document.createElement("div");
            imageBodyElement.classList.add("similarity-img-body");

            let imageElement = document.createElement("div");
            imageElement.classList.add("similarity-img");
            imageElement.addEventListener("dblclick", () => {
                window.cbir.onDoubleClickDoc(doc);
            });

            // Create popup image button
            let imagePopupBtn = document.createElement("button");
            imagePopupBtn.classList.add("btn");
            let imagePopupIcon = document.createElement("span");
            imagePopupIcon.classList.add("popup");
            imagePopupBtn.appendChild(imagePopupIcon);
            imagePopupBtn.addEventListener("click", () => {
                let sourceCanvas = imageElement.firstChild;
                let imageUrl = sourceCanvas.toDataURL();

                Swal.fire({
                    width: "75%",
                    imageUrl: imageUrl,
                    imageWidth: "480px"
                });
            });

            imageBodyElement.appendChild(imageElement);

            let imageLabel = document.createElement("label");
            imageLabel.innerText = `top-${(window.cbir.currentPage - 1) * 10 + i + 1}\r\nscore: ${doc.similarity_score
                }`;

            rowElement.appendChild(imageBodyElement);

            window.cbir.loadAndViewHitImages(
                `wadouri:${instanceUrl}`,
                imageElement
            );

            imageBodyElement.appendChild(imageLabel);
            imageBodyElement.appendChild(imagePopupBtn);
        }

        // 3 images of every row
        if ((i + 1) % 4 === 0 && i != 0) row += 1;
    }
};

const disableButton = (button) => {
    button.classList.add("disabled");
    button.setAttribute("disabled", true);
};

const enableButton = (button) => {
    button.classList.remove("disabled");
    button.removeAttribute("disabled");
};

window.cbir.handlePageButtonsStatus = () => {
    if (window.cbir.currentPage === 1) {
        disableButton(window.cbir.prevButton);
    } else {
        enableButton(window.cbir.prevButton);
    }
};

window.cbir.changePage = (pageNumber) => {
    window.cbir.currentPage = pageNumber;

    window.cbir.handlePageButtonsStatus();
    console.log(window.cbir.currentQueryData)
    window.cbir.currentQueryData["params"] = {};
    window.cbir.currentQueryData["params"]["page"] = window.cbir.currentPage;
    window.cbir.getAIResult(null, window.cbir.callUrl, window.cbir.currentQueryData, true);
};

/**
 * Get CBIR results and display CBIR panel
 * @param {Object} aiServiceOption 
 * @param {string} url 
 * @param {Object} requestBody 
 * @param {boolean} isPageChange If false, call function of display CBIR panel, otherwise no change
 */
window.cbir.getAIResult = (aiServiceOption, url, requestBody, isPageChange = false) => {
    FreezeUI();
    let oReq = new XMLHttpRequest();
    try {
        oReq.open("POST", url, true);
        oReq.setRequestHeader("Content-Type", "application/json");
        if (oauthConfig.enable) OAuth.setRequestHeader(oReq);
    } catch (err) { }
    oReq.responseType = "json";
    oReq.onreadystatechange = async function (oEvent) {
        if (oReq.readyState == 4) {
            if (oReq.status == 200) {
                let jsonData = oReq.response;
                window.cbir.currentQueryData = JSON.parse(JSON.stringify(requestBody));
                window.cbir.callUrl = url;

                jsonData["requestBody"] = requestBody;
                window.cbir.showQueryImage(jsonData);
                await window.cbir.showSimilarityImages(jsonData);
                if (!isPageChange) window.cbir.toggleCbirBody();
                UnFreezeUI();
            } else {
                UnFreezeUI();
                Toast.fire({
                    icon: "error",
                    title: "AI Execution failure"
                });
            }
        }
    };
    oReq.send(JSON.stringify(requestBody));
}

function initCbir() {
    console.log("load cbir component");
    // load custom css for cbir
    let cbirCssLink = document.createElement("link");
    cbirCssLink.href = "../css/cbir.css";
    cbirCssLink.type = "text/css";
    cbirCssLink.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(cbirCssLink);

    createCbirHtml();
    let cbirImg = document.querySelector(".cbir-img");
    cbirImg.addEventListener("click", toggleCbirBody);

    let cbirBodyOverlay = document.querySelector(".cbir-body-overlay");
    cbirBodyOverlay.addEventListener("click", toggleCbirBody);
}

(() => {
    if (document.readyState === "complete") {
        initCbir();
    } else {
        document.addEventListener("readystatechange", (e) => {
            initCbir();
        });
    }
})();
