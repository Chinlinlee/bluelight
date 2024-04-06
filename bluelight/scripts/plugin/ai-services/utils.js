export function getCachedImageByInstanceUID(id) {
    for (let imageId in window.getPatientbyImageID) {
        let image = window.getPatientbyImageID[imageId];
        let imageInstanceUID = image.SopUID;
        if (imageInstanceUID === id) {
            return image;
        }
    }

    return undefined;
}

/**
 * 
 * @param {string} id Study Instance UID
 */
export function getCachedImagesByStudyUID(id) {
    let images = [];
    for (let imageId in window.getPatientbyImageID) {
        let image = window.getPatientbyImageID[imageId];
        let dataset = image.image.data;
        let imageStudyUID = dataset.string("x0020000d");
        if (imageStudyUID === id) {
            images.push(image);
        }
    }
    return images;
}

/**
 * 
 * @param {string} id Study Instance UID
 */
export function getCachedImagesBySeriesUID(id) {
    let images = [];
    for (let imageId in window.getPatientbyImageID) {
        let image = window.getPatientbyImageID[imageId];
        let dataset = image.image.data;
        let imageSeriesUID = dataset.string("x0020000e");
        if (imageSeriesUID === id) {
            images.push(image);
        }
    }

    return images;
}

export function getCachedSeriesUIDsByStudyUID(id) {
    let seriesUIDs = [];
    for (let imageId in window.getPatientbyImageID) {
        let image = window.getPatientbyImageID[imageId];
        let dataset = image.image.data;
        let imageStudyUID = dataset.string("x0020000d");
        if (imageStudyUID === id) {
            let seriesUID = dataset.string("x0020000e");
            if (!seriesUIDs.includes(seriesUID))
                seriesUIDs.push(seriesUID);
        }
    }
    return seriesUIDs;
}

export function getFormattedDateTimeNow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}.${milliseconds}`;
}
