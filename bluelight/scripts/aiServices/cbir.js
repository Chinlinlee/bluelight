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
 * @param {Object} Uids
 * @param {string} Uids.studyInstanceUID
 * @param {string} Uids.seriesInstanceUID
 * @param {string} Uids.sopInstanceUID
 */
window.cbir.onDoubleClickDoc = (Uids) => {
    let url = "";
    if (ConfigLog.WADO.WADOType == "URI") {
        url =
            ConfigLog.WADO.https +
            "://" +
            ConfigLog.WADO.hostname +
            ":" +
            ConfigLog.WADO.PORT +
            "/" +
            ConfigLog.WADO.service +
            "?requestType=WADO&" +
            "studyUID=" +
            Uids.studyInstanceUID +
            "&seriesUID=" +
            Uids.seriesInstanceUID +
            "&objectUID=" +
            Uids.sopInstanceUID +
            "&contentType=" +
            "application/dicom";
    } else if (ConfigLog.WADO.WADOType == "RS") {
        url =
            ConfigLog.WADO.https +
            "://" +
            ConfigLog.WADO.hostname +
            ":" +
            ConfigLog.WADO.PORT +
            "/" +
            ConfigLog.WADO.service +
            "/studies/" +
            Uids.studyInstanceUID +
            "/series/" +
            Uids.seriesInstanceUID +
            "/instances/" +
            Uids.sopInstanceUID;
    }

    if (ConfigLog.WADO.WADOType == "URI") loadAndViewImage(`wadouri:${url}`, 1);
    else if (ConfigLog.WADO.WADOType == "RS") wadorsLoader(url);

    toggleCbirBody();
};

window.cbir.showQueryImage = (data) => {
    let qImageData = data["requestBody"]["dicomUidsList"];
    if (typeof qImageData === "object") {
        if (qImageData.length > 0) {
            qImageData = qImageData.pop();
        }
    }

    let queryInstanceUrl =
        ConfigLog.WADO.https +
        "://" +
        ConfigLog.WADO.hostname +
        ":" +
        ConfigLog.WADO.PORT +
        "/" +
        ConfigLog.WADO.service +
        "?requestType=WADO&" +
        "studyUID=" +
        qImageData.studyInstanceUID +
        "&seriesUID=" +
        qImageData.seriesInstanceUID +
        "&objectUID=" +
        qImageData.sopInstanceUID +
        "&contentType=" +
        "application/dicom";

    window.cbir.loadAndViewQueryImage(`wadouri:${queryInstanceUrl}`);
};

window.cbir.showSimilarityImages = async (data) => {
    window.cbir.clearSimilarityImage();

    let similarityDocs = data.data;
    let row = 0;

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
            let instanceUrl =
                ConfigLog.WADO.https +
                "://" +
                ConfigLog.WADO.hostname +
                ":" +
                ConfigLog.WADO.PORT +
                "/" +
                ConfigLog.WADO.service +
                "?requestType=WADO&" +
                "studyUID=" +
                studyInstanceUID +
                "&seriesUID=" +
                seriesInstanceUID +
                "&objectUID=" +
                sopInstanceUID +
                "&contentType=" +
                "application/dicom";

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
