//ConfigLog from  bluelight/scripts/onload.js -> function readConfigJson:341
import {
    AIService,
    AiServiceSelectorBuilder
} from "./aiServices/aiServiceClass.js";

document.addEventListener("readystatechange", function () {
    if (document.readyState === "complete") {
        let aiServiceImg = document.querySelector(".AI-SERVICE-IMG");
        aiServiceImg.onclick = aiServiceImgClick;
    }
});

async function aiServiceImgClick() {
    let supportedAIService;
    try {
        supportedAIService = await AIService.getSupportAIService();
    } catch (e) {
        console.error(e);
        Swal.fire({
            icon: "error",
            title: "The request of AI service failed, maybe AI service is not available"
        });
        return;
    }

    if (supportedAIService) {
        let aiServicesBtnList = [];
        for (let serviceOption of ConfigLog.AIService["services"]) {
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
}
