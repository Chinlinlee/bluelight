//ConfigLog from  bluelight/scripts/onload.js -> function readConfigJson:341
import {
    AIService,
    AiServiceSelectorBuilder
} from "./aiServices/aiServiceClass.js";

import {
    aiServiceConfig
} from "./aiServices/config.js"

document.addEventListener("readystatechange", function () {
    if (document.readyState === "complete") {
        let aiServiceImg = document.querySelector(".AI-SERVICE-IMG");
        aiServiceImg.onclick = aiServiceImgClick;
    }
});

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

(()=> {
    //init services
    for (let serviceOption of aiServiceConfig.services) {
        if (Object.prototype.hasOwnProperty.call(serviceOption, "init")) {

            if (typeof serviceOption.init === "function") {
                console.log(`init ${serviceOption.name}`);
                serviceOption.init();
            }
        }
    }
          
})();
