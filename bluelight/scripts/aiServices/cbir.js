window.dicomWebClient = {};

function createCbirHtml() {
    let template = `
    <div class="cbir-body-overlay"></div>
    <div class="cbir-real-body">

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

    </div>
    `;
    let body = document.querySelector("body");
    body.insertAdjacentHTML("beforeend", template);
}

function toggleCbirBody() {
    let cbirBodyOverlay = document.querySelector(".cbir-body-overlay");
    cbirBodyOverlay.classList.toggle("active");
    let cbirRealBody = document.querySelector(".cbir-real-body");
    cbirRealBody.classList.toggle("active");
}

document.addEventListener("readystatechange", (e) => {
    if (document.readyState === "complete") {
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

        import("../aiServices/dicomweb-client.js").then((module) => {
            let schema = ConfigLog["QIDO"].https;
            let baseUrl = `${schema}://${ConfigLog["QIDO"].hostname}`;
            let qidoPrefix = ConfigLog["QIDO"].service;
            let wadoPrefix = ConfigLog["WADO"].service;

            window.dicomWebClient = new module.DicomWebClient({
                url: baseUrl,
                qidoURLPrefix: qidoPrefix,
                wadoURLPrefix: wadoPrefix
            });
        });
    }
});
window.cbir = {};
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

window.cbir.showSimilarityImages = async (data) => {
    window.cbir.clearSimilarityImage();

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

    window.cbir.loadAndViewQueryImage(
        `wadouri:${queryInstanceUrl}`
    );
    

    let similarityDocs = data.data;
    let row = 0;

    for (let i = 0 ; i < similarityDocs.length; i++) {
        let doc = similarityDocs[i];
        let {
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID
        } = doc;

        let instancesInSeries =
            await window.dicomWebClient.QidoRs.searchForInstances(
                doc
            );
        if (typeof instancesInSeries !== "object")
            instancesInSeries = [];

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

            let rowElement = document.querySelector(`.similarity-images .row.row-${row}`);

            let imageBodyElement = document.createElement("div");
            imageBodyElement.classList.add("similarity-img-body");

            let imageElement = document.createElement("div");
            imageElement.classList.add("similarity-img");
            imageElement.addEventListener("dblclick", ()=> {
                window.cbir.onDoubleClickDoc(doc);
            });
            imageBodyElement.appendChild(imageElement);

            let imageLabel = document.createElement("label");
            imageLabel.innerText = `top-${i+1}\r\nscore: ${doc.similarity_score}`;

            rowElement.appendChild(imageBodyElement);

            window.cbir.loadAndViewHitImages(`wadouri:${instanceUrl}`, imageElement);

            imageBodyElement.appendChild(imageLabel);
            
        }

        if ( (i+1) % 4 === 0 && i !=0 ) row +=1;
    }

    window.cbir.toggleCbirBody();
}
