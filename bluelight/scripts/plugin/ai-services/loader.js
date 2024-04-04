/**
 * @author Chin-Lin Lee <a5566qq2581@gmail.com>
 * ConfigLog from bluelight/scripts/onload.js -> function readConfigJson:341
 * 
 * Init every ai services
 * When click ai service icon, display window of AI models selector
 */

import {
    AIService
} from "./ai-service.class.js";

import {
    aiServiceConfig
} from "./config.js";
import { UpsNotificationReceiver } from "./webSocket.js"

let checkReadyInterval = setInterval(() => {
    if (document.readyState === "complete") {
        // load custom css for cbir
        let cssLink = document.createElement("link");
        cssLink.href = "../css/ai-service.css";
        cssLink.type = "text/css";
        cssLink.rel = "stylesheet";
        document.getElementsByTagName("head")[0].appendChild(cssLink);

        let sweetalert2CssLink = document.createElement("link");
        sweetalert2CssLink.href = "../scripts/external/sweetalert2/sweetalert2.dark.min.css";
        sweetalert2CssLink.type = "text/css";
        sweetalert2CssLink.rel = "stylesheet";
        document.getElementsByTagName("head")[0].appendChild(sweetalert2CssLink);

        let span = document.createElement("span");
        span.innerHTML = `<img class="img AI-SERVICE-IMG pointer" alt="ai service" id="aiServiceImg" src="../image/icon/black/ai-service.png" width="50" height="50" onmouseover="onElementOver(this)" onmouseleave="onElementLeave();">`;
        document.getElementById("icon-list").appendChild(span);

        let aiServiceImg = document.querySelector(".AI-SERVICE-IMG");
        aiServiceImg.onclick = aiServiceImgClick;

        initAiServices();
        UpsNotificationReceiver.init();

        clearInterval(checkReadyInterval);
    }
}, 250);

async function aiServiceImgClick() {

    let aiServicesBtnList = [];
    for (let serviceOption of aiServiceConfig.services) {
        let aiService = new AIService(serviceOption);
        let btn = aiService.buildServiceButtonElement();
        btn.onclick = aiService.createAIServiceComponent.bind(aiService);
        aiServicesBtnList.push(btn);
    }
    let { value } = await Swal.fire({
        title: "AI Service",
        html: "<div></div>",
        didOpen: () => {
            let swalDocument = Swal.getHtmlContainer();
            swalDocument.style.display = "flex";
            for (let btn of aiServicesBtnList) {
                swalDocument.append(btn);
            }
        }
    });
}

function initAiServices() {
    //init services
    for (let serviceOption of aiServiceConfig.services) {
        if (Object.prototype.hasOwnProperty.call(serviceOption, "init")) {

            if (typeof serviceOption.init === "function") {
                console.log(`init ${serviceOption.name}`);
                serviceOption.init();
            }
        }
    }

    window.FreezeUI = function (message="loading...") {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            didOpen: () => {
                Swal.showLoading()
                const b = Swal.getHtmlContainer().querySelector('b')
            },
        }).then((result) => {
            /* Read more about handling dismissals below */
            if (result.dismiss === Swal.DismissReason.timer) {
                console.log('I was closed by the timer')
            }
        });
    };

    window.UnFreezeUI = function () {
        Swal.close();
    };
}


/**
 * @typedef Uids
 * @property {string} studyInstanceUID
 * @property {string} seriesInstanceUID
 * @property {string} sopInstanceUID
 */

/**
 *
 * @param {Uids} uids
 */
window.getUrlByUids = (uids) => {
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
            uids.studyInstanceUID +
            "&seriesUID=" +
            uids.seriesInstanceUID +
            "&objectUID=" +
            uids.sopInstanceUID +
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
            uids.studyInstanceUID +
            "/series/" +
            uids.seriesInstanceUID +
            "/instances/" +
            uids.sopInstanceUID;
    }

    return url;

}

window.changeToSpecificInstance = (instanceUID) => {
    let index;
    let waitIndexExist = setInterval(() => {
        index = SearchUid2Index(instanceUID);

        if (index) {
            clearInterval(waitIndexExist);

            let list = sortInstance(instanceUID);

            let instance = list.find( v=> v.SopUID === instanceUID);

            console.log(instance);
            loadAndViewImage(instance.imageId, viewportNumber);
        }

    }, 25);
}