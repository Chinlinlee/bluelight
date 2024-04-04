export class WorkItemEventReport {
    #dicomJson;
    constructor(dicomJson) {
        this.#dicomJson = dicomJson;
    }

    get procedureStepState() {
        return this.#dicomJson?.["00741000"]?.["Value"]?.[0];
    }

    get eventType() {
        return this.#dicomJson?.["00001002"]?.["Value"]?.[0];
    }

    get upsInstanceUid() {
        return this.#dicomJson?.["00001000"]?.["Value"]?.[0];
    }
}