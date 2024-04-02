export function getCachedImageByInstanceUID(id) {
    for(let imageId in window.getPatientbyImageID) {
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
    for(let imageId in window.getPatientbyImageID) {
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
    for(let imageId in window.getPatientbyImageID) {
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
    for(let imageId in window.getPatientbyImageID) {
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