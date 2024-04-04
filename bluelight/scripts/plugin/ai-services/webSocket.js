import { aiServiceConfig } from "./config.js";
import { WorkItem } from "./workItem.js";
import { WorkItemEventReport } from "./workItemEventReport.js";

export class UpsNotificationReceiver {
    /** @type { WebSocket } */
    static ws;

    constructor() { }

    static init() {
        let ws = UpsNotificationReceiver.getWebsocket();
        ws.onopen = () => {
            console.log(`connect to ups notification server success :${aiServiceConfig.upsSubUrl}`);
        }

        ws.onmessage = async (msg) => {
            let workItemEventReport = new WorkItemEventReport(JSON.parse(msg.data));
            if (workItemEventReport.eventType === 1) {
                let state = workItemEventReport.procedureStepState;
                if (state === "COMPLETED") {
                    let workItem = await WorkItem.getWorkItem(workItemEventReport.upsInstanceUid);
                    let performedProcedureSequence = workItem?.["00741216"]?.["Value"]?.[0];
                    let outputInfoSequence = performedProcedureSequence?.["00404033"]?.["Value"]?.[0];
                    if (outputInfoSequence) {
                        let outputStudyInstanceUid = outputInfoSequence?.["0020000D"]["Value"][0];
                        let outputSeriesInstanceUid = outputInfoSequence?.["0020000E"]["Value"][0];
                        let outputSopInstanceUid = outputInfoSequence?.["00081199"]["Value"][0]["00081155"]["Value"][0];

                        readDicom(window.getUrlByUids({
                            studyInstanceUID: outputStudyInstanceUid,
                            seriesInstanceUID: outputSeriesInstanceUid,
                            sopInstanceUID: outputSopInstanceUid
                        }), PatientMark, true);
                    }
                }
            }
        }

        ws.onclose = (e) => {
            console.log("websocket closed. Reconnect will be attempted in 1 second.", e.reason);
            setTimeout(() => {
                UpsNotificationReceiver.init();
            }, 1000);
        }
    }

    static getWebsocket() {
        if (!UpsNotificationReceiver.ws) {
            UpsNotificationReceiver.ws = new WebSocket(aiServiceConfig.upsSubUrl);
        }

        return UpsNotificationReceiver.ws;
    }


}