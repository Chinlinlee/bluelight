import { aiServiceConfig } from "./config.js";

export class UpsNotificationReceiver {
    /** @type { WebSocket } */
    static ws;

    constructor() {}

    static init() {
        let ws = UpsNotificationReceiver.getWebsocket();
        ws.onopen = () => {
            console.log(`connect to ups notification server success :${aiServiceConfig.upsSubUrl}`);
        }

        ws.onmessage = (msg) => {
            console.log("message", msg.data);
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