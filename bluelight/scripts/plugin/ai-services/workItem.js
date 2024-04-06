import { aiServiceConfig } from "./config.js";
import { getFormattedDateTimeNow } from "./utils.js";

export class WorkItem {
    constructor() {}

    static async createWorkItem(workItem) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            let workItemUrl = `${aiServiceConfig.upsUrl}/workitems`;
            request.open("POST", workItemUrl, true);
            request.setRequestHeader("Content-type", "application/json");
            request.responseType = "json";
            request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200 || request.status === 201) {
                        let resJson = request.response;
                        return resolve(resJson);
                    } else {
                        console.error({
                            status: request.status
                        });
                        return reject(new Error("The request failed."));
                    }
                }
            };
            request.send(JSON.stringify(workItem));
        });
    }

    static getAiOrchestrationWorkItem(aiModelName, dicomUidsList) {
        let workItemTemplate = {
            "0020000D": {
                "vr": "UI",
                "Value": [
                    `${dicomUidsList[0].studyInstanceUID}`
                ]
            },
            "00741000": {
                "vr": "CS",
                "Value": [
                    "SCHEDULED"
                ]
            },
            "00741200": {
                "Value": [
                    "MEDIUM"
                ],
                "vr": "CS"
            },
            "00741204": {
                "vr": "LO",
                "Value": [
                    `${aiModelName}`
                ]
            },
            "00404021": {
                "vr": "SQ",
                "Value": []
            },
            "00404041": {
                "vr": "CS",
                "Value": [
                    "READY"
                ]
            },
            "00404005": {
                "vr": "DT",
                "Value": [
                    `${getFormattedDateTimeNow()}`
                ]
            },
            "00404070": {
                "vr": "SQ",
                "Value": [
                    {
                        "00404072": {
                            "vr": "SQ",
                            "Value": [
                                {
                                    "00404073": {
                                        "vr": "UR",
                                        "Value": [
                                            `${window.dicomWebClient.stowURL}/studies`
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        };
    
        for(let hierarchyUid of dicomUidsList) {
            workItemTemplate["00404021"]["Value"].push({
                "0040E020": {
                    "vr": "CS",
                    "Value": [
                        "DICOM"
                    ]
                },
                "0020000D": {
                    "vr": "UI",
                    "Value": [
                        `${hierarchyUid.studyInstanceUID}`
                    ]
                },
                "0020000E": {
                    "vr": "UI",
                    "Value": [
                        `${hierarchyUid.seriesInstanceUID || "Unknown"}`
                    ]
                },
                "00081199": {
                    "vr": "SQ",
                    "Value": [
                        {
                            "00081155": {
                                "vr": "UI",
                                "Value": [
                                    `${hierarchyUid.sopInstanceUID || "Unknown"}`
                                ]
                            }
                        }
                    ]
                },
                "0040E025": {
                    "vr": "SQ",
                    "Value": [
                        {
                            "00081190": {
                                "vr": "UR",
                                "Value": [
                                    `${window.dicomWebClient.WadoRs.getPartialUrl({
                                        studyInstanceUID: hierarchyUid.studyInstanceUID,
                                        seriesInstanceUID: hierarchyUid.seriesInstanceUID,
                                        sopInstanceUID: hierarchyUid.sopInstanceUID
                                    })}`
                                ]
                            }
                        }
                    ]
                }
            });
        }
    
        return workItemTemplate;
    }

    static async getWorkItem(upsInstanceUid) {
        let fetchWorkItemRes = await fetch(`${aiServiceConfig.upsUrl}/workitems/${upsInstanceUid}`, {
            method: "GET",
            headers: {
                "accept": "application/dicom+json",
            }
        });
        if (fetchWorkItemRes.status === 200) {
            /** @type { any[] } */
            let workItem = await fetchWorkItemRes.json();
            return workItem?.[0];
        } else {
            throw new Error("The request failed.");
        }
    }
}