//ConfigLog from  bluelight/scripts/onload.js -> function readConfigJson:341

let modalAIService;
const Toast = Swal.mixin({
    toast: true,
    position: "bottom",
    showConfirmButton: false,
    showCancelButton: false,
    allowOutsideClick: false,
    timerProgressBar: true,
    timer: 1000,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    }
});

document.addEventListener("readystatechange", function () {
    if (document.readyState === "complete") {
        let aiServiceImg = document.querySelector(".AI-SERVICE-IMG");
        aiServiceImg.onclick = aiServiceImgClick;
    }
});

function removeSeriesSelectElements() {
    let swalDocument = Swal.getHtmlContainer();
    let seriesSelectElements = swalDocument.querySelectorAll(".select-series");
    for (let e of seriesSelectElements) {
        e.parentElement.removeChild(e);
    }
    return true;
}

const aiServiceClassMap = {
    "Vestibular Schwannoma": VestibularSchwannomaAIService.createAIServiceComponent
};

async function aiServiceImgClick() {
    let supportedAIService;
    try {
        supportedAIService = await AIService.getSupportAIService();
    } catch(e) {
        console.error(e);
        Swal.fire({
            icon: "error",
            title: "The request of AI service failed, maybe AI service is not available"
        });
        return;
    }
    
    if (supportedAIService) {
        let aiServicesBtnList = [];
        for (let service of supportedAIService) {
            console.log(service.name);
            let btn = AIService.buildServiceButtonElement(service.name);
            btn.onclick = aiServiceClassMap[service.name];
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

function hideValidationMessage() {
    let validationMessage = document.querySelector(".swal2-validation-message");
    validationMessage.style.display = "none";
}

function getAIResultLabelDicom(aiName, url, requestBody) {
    let oReq = new XMLHttpRequest();
    try {
        oReq.open("POST", url, true);
        oReq.setRequestHeader("Content-Type", "application/json");
        if (oauthConfig.enable) OAuth.setRequestHeader(oReq);
    } catch (err) {}
    oReq.responseType = "arraybuffer";
    oReq.onreadystatechange = function (oEvent) {
        if (oReq.readyState == 4) {
            UnFreezeUI();
            if (oReq.status == 200) {
                readAILabelDicom(aiName, new Uint8Array(oReq.response), PatientMark);
                Toast.fire({
                    icon: "success",
                    title: `${aiName} AI execution completed`
                });
            } else {
                Toast.fire({
                    icon: "error",
                    title: "AI Execution failure"
                })
            }
        }
    };
    oReq.send(JSON.stringify(requestBody));
}


function readAILabelDicom(aiName, byteArray, patientmark) {
    var dataSet = dicomParser.parseDicom(byteArray);
    //console.log(dataSet.elements);
    // dataSet1 = dataSet;
    // if (!dataSet.elements.x60003000) {

    // } else {
    for (var ov = 0; ov <= 28; ov += 2) {
        var ov_str = "" + ov;
        if (ov < 10) ov_str = "0" + ov;
        if (!dataSet.elements["x600" + ov + "3000"]) continue;
        try {
            var pixelData = new Uint8ClampedArray(
                dataSet.byteArray.buffer,
                dataSet.elements["x60" + ov_str + "3000"].dataOffset,
                dataSet.elements["x60" + ov_str + "3000"].length
            );
            var tempPixeldata = new Uint8ClampedArray(pixelData.length * 8);
            var tempi = 0;
            var tempnum = 0;
            for (var num of pixelData) {
                tempnum = num;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 0] = 1;
                else tempPixeldata[num * 8 + 0] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 1] = 1;
                else tempPixeldata[num * 8 + 1] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 2] = 1;
                else tempPixeldata[num * 8 + 2] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 3] = 1;
                else tempPixeldata[num * 8 + 3] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 4] = 1;
                else tempPixeldata[num * 8 + 4] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 5] = 1;
                else tempPixeldata[num * 8 + 5] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 6] = 1;
                else tempPixeldata[num * 8 + 6] = 0;
                tempnum /= 2;
                if (parseInt(tempnum % 2) == 1) tempPixeldata[tempi + 7] = 1;
                else tempPixeldata[num * 8 + 7] = 0;
                tempi += 8;
            }
            //var tvList = ['Overlay'];
            var dcm = {};
            dcm.study = dataSet.string("x0020000d");
            dcm.series = dataSet.string("x0020000e");
            dcm.sop = dataSet.string("x00080018");
            dcm.height = dataSet.uint16("x600" + ov + "0010");
            dcm.width = dataSet.uint16("x600" + ov + "0011");
            dcm.mark = [];
            dcm.showName = "Overlay";
            dcm.hideName = dcm.showName + "x60" + ov_str + "1500";
            if (dataSet.string("x60" + ov_str + "1500")) {
                dcm.showName = dataSet.string("x60" + ov_str + "1500");
            }
            dcm.mark.push({});
            var DcmMarkLength = dcm.mark.length - 1;
            dcm.mark[DcmMarkLength].type = "Overlay";
            dcm.mark[DcmMarkLength].pixelData = tempPixeldata.slice(0);
            dcm.mark[DcmMarkLength].canvas = document.createElement("CANVAS");
            dcm.mark[DcmMarkLength].canvas.width = dcm.width;
            dcm.mark[DcmMarkLength].canvas.height = dcm.height;
            dcm.mark[DcmMarkLength].ctx =
                dcm.mark[DcmMarkLength].canvas.getContext("2d");
            var pixelData = dcm.mark[DcmMarkLength].ctx.getImageData(
                0,
                0,
                dcm.width,
                dcm.height
            );
            for (var i = 0, j = 0; i < pixelData.data.length; i += 4, j++)
                if (dcm.mark[DcmMarkLength].pixelData[j] == 1) {
                    pixelData.data[i] = 0;
                    pixelData.data[i + 1] = 0;
                    pixelData.data[i + 2] = 255;
                    pixelData.data[i + 3] = 255;
                }
            dcm.mark[DcmMarkLength].ctx.putImageData(pixelData, 0, 0);
            patientmark.push(dcm);
            refreshMark(dcm);
        } catch (ex) {}
    }
    //   }
    ////暫時取消的功能
    /*
  if (openfile && openfile == true) {
    if (dataSet.string('x00080016') == '1.2.840.10008.5.1.4.1.1.481.2') {
      LeftImg("Dose");
    }
    if (dataSet.string('x00080016') == '1.2.840.10008.5.1.4.1.1.481.3') {
      LeftImg("Struct");
    }
    if (dataSet.string('x00080016') == '1.2.840.10008.5.1.4.1.1.481.5') {
      LeftImg("Plan");
    }
  }*/
    var tvList = [];
    if (dataSet.string("x30060020")) {
        for (var i in dataSet.elements.x30060020.items) {
            if (
                dataSet.elements.x30060020.items[i].dataSet.string("x30060026")
            ) {
                tvList.push(
                    "" +
                        dataSet.elements.x30060020.items[i].dataSet.string(
                            "x30060026"
                        )
                );
            }
        }
    }

    if (dataSet.string("x00700001")) {
        var sop1;
        if (dataSet.string("x00081115")) {
            for (var ii2 in dataSet.elements.x00081115.items) {
                var x00081115DataSet =
                    dataSet.elements.x00081115.items[ii2].dataSet.elements
                        .x00081140.items;
                //console.log(x00081115DataSet.length);
                for (var s = 0; s < x00081115DataSet.length; s++) {
                    //for (var ii3 in x00081115DataSet) {
                    sop1 = x00081115DataSet[s].dataSet.string("x00081155");
                    //}

                    var tempsop = "";
                    var tempDataSet = "";
                    var GSPS_Text = "";
                    function POLYLINE_Function(tempDataSet, GSPS_Text, g) {
                        // console.log(j);
                        if (tempDataSet == "") {
                            return;
                        }
                        // for (var j in tempDataSet) {
                        if (g != undefined) var tempDataSetLengthList = [g];
                        else {
                            var tempDataSetLengthList = tempDataSet;
                            // console.log(tempDataSetLengthList.length);
                        }
                        for (
                            var j1 = 0;
                            j1 < tempDataSetLengthList.length;
                            j1++
                        ) {
                            var j = tempDataSetLengthList[j1];
                            if (g != undefined)
                                var j = tempDataSetLengthList[j1];
                            else {
                                var j = j1;
                                //console.log(j);
                            }
                            //console.log(g+","+j);
                            // if (g)console.log(j,tempDataSet[j]);
                            // {
                            if (
                                tempDataSet[j].dataSet.string("x00700023") ==
                                "POLYLINE"
                            ) {
                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});

                                var showname = "POLYLINE";
                                if (tempDataSet[j].dataSet.elements.x00700232) {
                                    var ColorSequence =
                                        tempDataSet[j].dataSet.elements
                                            .x00700232.items[0].dataSet;
                                    var color = ConvertGraphicColor(
                                        ColorSequence.uint16("x00700251", 0),
                                        ColorSequence.uint16("x00700251", 1),
                                        ColorSequence.uint16("x00700251", 2)
                                    );
                                    if (color) {
                                        dcm.color = color[0];
                                        showname = color[1];
                                    }
                                }

                                dcm.showName = showname;
                                if (GSPS_Text != "" && GSPS_Text != undefined) {
                                    dcm.showName = GSPS_Text;
                                }
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "POLYLINE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].RotationAngle =
                                    tempDataSet[j].dataSet.double("x00710230");
                                dcm.mark[DcmMarkLength].GraphicFilled =
                                    tempDataSet[j].dataSet.string("x00700024");

                                dcm.mark[DcmMarkLength].RotationPoint = [
                                    tempDataSet[j].dataSet.float(
                                        "x00710273",
                                        0
                                    ),
                                    tempDataSet[j].dataSet.float("x00710273", 1)
                                ];
                                if (GSPS_Text != "" && GSPS_Text != undefined) {
                                    dcm.mark[DcmMarkLength].GSPS_Text =
                                        GSPS_Text;
                                }
                                var xTemp16 =
                                    tempDataSet[j].dataSet.string("x00700022");

                                function getTag(tag) {
                                    var group = tag.substring(1, 5);
                                    var element = tag.substring(5, 9);
                                    var tagIndex = (
                                        "(" +
                                        group +
                                        "," +
                                        element +
                                        ")"
                                    ).toUpperCase();
                                    var attr = TAG_DICT[tagIndex];
                                    return attr;
                                }
                                var rect =
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700020"
                                        )
                                    ) *
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700021"
                                        )
                                    );
                                for (var r = 0; r < rect; r += 2) {
                                    var GraphicData = getTag("x00700022");
                                    var numX = 0,
                                        numY = 0;
                                    if (GraphicData.vr == "US") {
                                        numX = tempDataSet[j].dataSet.uint16(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.uint16(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "SS") {
                                        numX = tempDataSet[j].dataSet.int16(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.int16(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "UL") {
                                        numX = tempDataSet[j].dataSet.uint32(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.uint32(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "SL") {
                                        numX = tempDataSet[j].dataSet.int32(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.int32(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "FD") {
                                        numX = tempDataSet[j].dataSet.double(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.double(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else if (GraphicData.vr === "FL") {
                                        numX = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r + 1
                                        );
                                    } else {
                                        numX = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r
                                        );
                                        numY = tempDataSet[j].dataSet.float(
                                            "x00700022",
                                            r + 1
                                        );
                                    }
                                    if (
                                        dcm.mark[DcmMarkLength].RotationAngle &&
                                        dcm.mark[DcmMarkLength].RotationPoint
                                    ) {
                                        [numX, numY] = rotatePoint(
                                            [numX, numY],
                                            -dcm.mark[DcmMarkLength]
                                                .RotationAngle,
                                            dcm.mark[DcmMarkLength]
                                                .RotationPoint
                                        );
                                    }
                                    dcm.mark[DcmMarkLength].markX.push(
                                        parseFloat(numX)
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        parseFloat(numY)
                                    );
                                }
                                patientmark.push(dcm);
                                refreshMark(dcm, false);
                                //if(dcm.mark[DcmMarkLength].GraphicFilled=='Y'){
                                //console.log(dcm);
                                // }
                            }

                            if (
                                tempDataSet[j].dataSet.string("x00700023") ==
                                "CIRCLE"
                            ) {
                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});
                                var showname = "CIRCLE";
                                if (tempDataSet[j].dataSet.elements.x00700232) {
                                    var ColorSequence =
                                        tempDataSet[j].dataSet.elements
                                            .x00700232.items[0].dataSet;
                                    var color = ConvertGraphicColor(
                                        ColorSequence.uint16("x00700251", 0),
                                        ColorSequence.uint16("x00700251", 1),
                                        ColorSequence.uint16("x00700251", 2)
                                    );
                                    if (color) {
                                        dcm.color = color[0];
                                        showname = color[1];
                                    }
                                }
                                dcm.showName = showname;
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "CIRCLE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].GraphicFilled =
                                    tempDataSet[j].dataSet.string("x00700024");
                                var xTemp16 =
                                    tempDataSet[j].dataSet.string("x00700022");
                                var rect =
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700020"
                                        )
                                    ) *
                                    parseInt(
                                        tempDataSet[j].dataSet.int16(
                                            "x00700021"
                                        )
                                    );
                                for (var r = 0; r < rect; r += 4) {
                                    var numX = 0,
                                        numY = 0,
                                        numX2 = 0,
                                        numY2 = 0;
                                    numX = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r
                                    );
                                    numY = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r + 1
                                    );
                                    numX2 = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r + 2
                                    );
                                    numY2 = tempDataSet[j].dataSet.float(
                                        "x00700022",
                                        r + 3
                                    );
                                    /*if (dcm.mark[DcmMarkLength].RotationAngle && dcm.mark[DcmMarkLength].RotationPoint) {
                    [numX, numY] = rotatePoint([numX, numY], -dcm.mark[DcmMarkLength].RotationAngle, dcm.mark[DcmMarkLength].RotationPoint);
                  }*/
                                    dcm.mark[DcmMarkLength].markX.push(
                                        parseFloat(numX)
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        parseFloat(numY)
                                    );
                                    dcm.mark[DcmMarkLength].markX.push(
                                        parseFloat(numX2)
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        parseFloat(numY2)
                                    );
                                }
                                patientmark.push(dcm);
                                refreshMark(dcm, false);
                            }
                            if (
                                tempDataSet[j].dataSet.string("x00700015") &&
                                tempDataSet[j].dataSet.string("x00700015") ==
                                    "Y"
                            ) {
                                // console.log('Y');

                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});

                                var showname = "Anchor";
                                if (tempDataSet[j].dataSet.elements.x00700232) {
                                    var ColorSequence =
                                        tempDataSet[j].dataSet.elements
                                            .x00700232.items[0].dataSet;
                                    var color = ConvertGraphicColor(
                                        ColorSequence.uint16("x00700251", 0),
                                        ColorSequence.uint16("x00700251", 1),
                                        ColorSequence.uint16("x00700251", 2)
                                    );
                                    if (color) {
                                        dcm.color = color[0];
                                        showname = color[1];
                                    }
                                }

                                dcm.showName = showname;
                                if (GSPS_Text != "" && GSPS_Text != undefined) {
                                    dcm.showName = GSPS_Text;
                                }
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "POLYLINE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].markX.push(
                                    tempDataSet[j].dataSet.float(
                                        "x00700010",
                                        0
                                    ),
                                    tempDataSet[j].dataSet.float("x00700011", 0)
                                );
                                dcm.mark[DcmMarkLength].markY.push(
                                    tempDataSet[j].dataSet.float(
                                        "x00700010",
                                        1
                                    ),
                                    tempDataSet[j].dataSet.float("x00700011", 1)
                                );
                                patientmark.push(dcm);
                                refreshMark(dcm, false);
                            }

                            if (
                                !tempDataSet[j].dataSet.string("x00700023") &&
                                GSPS_Text == ""
                            ) {
                                //var xTemp10 = [tempDataSet[j].dataSet.float('x00700010', 0), tempDataSet[j].dataSet.float('x00700010', 1)];
                                //var yTemp10 = [tempDataSet[j].dataSet.float('x00700011', 0), tempDataSet[j].dataSet.float('x00700011', 1)];
                                GSPS_Text =
                                    tempDataSet[j].dataSet.string("x00700006");
                                //console.log(j+"   "+GSPS_Text);
                                if (GSPS_Text != "") {
                                    //console.log(xTemp10+"  "+yTemp10+"   "+GSPS_Text);
                                    var dcm = {};
                                    dcm.sop = sop1;
                                    dcm.mark = [];
                                    dcm.mark.push({});
                                    var showname = "TEXT";
                                    dcm.showName = showname;
                                    dcm.hideName = dcm.showName;
                                    var DcmMarkLength = dcm.mark.length - 1;
                                    dcm.mark[DcmMarkLength].type = "TEXT";
                                    dcm.mark[DcmMarkLength].markX = [];
                                    dcm.mark[DcmMarkLength].markY = [];
                                    if (
                                        GSPS_Text != "" &&
                                        GSPS_Text != undefined
                                    ) {
                                        GSPS_Text = ("" + GSPS_Text).replace(
                                            "\r\n",
                                            "\n"
                                        );
                                        dcm.mark[DcmMarkLength].GSPS_Text =
                                            GSPS_Text;
                                    }
                                    dcm.mark[DcmMarkLength].markX.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700010",
                                            0
                                        )
                                    );
                                    dcm.mark[DcmMarkLength].markX.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700011",
                                            0
                                        )
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700010",
                                            1
                                        )
                                    );
                                    dcm.mark[DcmMarkLength].markY.push(
                                        tempDataSet[j].dataSet.float(
                                            "x00700011",
                                            1
                                        )
                                    );
                                    patientmark.push(dcm);
                                    refreshMark(dcm, false);
                                }
                            }
                            if (
                                tempDataSet[j].dataSet.string("x00700023") ==
                                "ELLIPSE"
                            ) {
                                var dcm = {};
                                dcm.sop = sop1;
                                dcm.mark = [];
                                dcm.mark.push({});
                                var showname = "ELLIPSE";
                                dcm.showName = showname;
                                dcm.hideName = dcm.showName;
                                var DcmMarkLength = dcm.mark.length - 1;
                                dcm.mark[DcmMarkLength].type = "ELLIPSE";
                                dcm.mark[DcmMarkLength].markX = [];
                                dcm.mark[DcmMarkLength].markY = [];
                                dcm.mark[DcmMarkLength].GraphicFilled =
                                    tempDataSet[j].dataSet.string("x00700024");
                                var xTemp16 =
                                    tempDataSet[j].dataSet.string("x00700022");
                                var ablecheck = false;
                                for (var k2 = 0; k2 < xTemp16.length; k2 += 4) {
                                    var output1 =
                                        xTemp16[k2].charCodeAt(0).toString(2) +
                                        "";
                                    var output2 =
                                        xTemp16[k2 + 1]
                                            .charCodeAt(0)
                                            .toString(2) + "";
                                    var output3 =
                                        xTemp16[k2 + 2]
                                            .charCodeAt(0)
                                            .toString(2) + "";
                                    var output4 =
                                        xTemp16[k2 + 3]
                                            .charCodeAt(0)
                                            .toString(2) + "";
                                    var data = [
                                        parseInt(output1, 2),
                                        parseInt(output2, 2),
                                        parseInt(output3, 2),
                                        parseInt(output4, 2)
                                    ];
                                    var buf = new ArrayBuffer(4 /* * 4*/);
                                    var view = new DataView(buf);
                                    data.forEach(function (b, i) {
                                        view.setUint8(i, b, true);
                                    });
                                    var num = view.getFloat32(0, true);
                                    if (ablecheck == false) {
                                        dcm.mark[DcmMarkLength].markX.push(num);
                                    } else {
                                        dcm.mark[DcmMarkLength].markY.push(num);
                                    }
                                    ablecheck = !ablecheck;
                                }
                                patientmark.push(dcm);
                                //console.log(PatientMark);
                                refreshMark(dcm, false);
                            }
                        }
                    }

                    try {
                        for (var i in dataSet.elements.x00700001.items) {
                            for (
                                var d1 = 0;
                                d1 <
                                dataSet.elements.x00700001.items[i].dataSet
                                    .elements.x00081140.items.length;
                                d1++
                            ) {
                                var tempsop =
                                    dataSet.elements.x00700001.items[
                                        i
                                    ].dataSet.elements.x00081140.items[
                                        d1
                                    ].dataSet.string("x00081155");
                                if (tempsop == sop1) {
                                    tempDataSet =
                                        dataSet.elements.x00700001.items[i]
                                            .dataSet.elements.x00700009.items;
                                    // for (var g = 0; g < dataSet.elements.x00700001.items[i].dataSet.elements.x00700009.items.length; g++) {
                                    try {
                                        //GSPS_Text = dataSet.elements.x00700001.items[i].dataSet.elements.x00700008.items[g].dataSet.string("x00700006");
                                        POLYLINE_Function(
                                            tempDataSet,
                                            "",
                                            undefined
                                        );
                                        // alert(i+"  "+ g);
                                    } catch (ex) {}
                                    // }
                                    try {
                                        for (
                                            var g = 0;
                                            g <
                                            dataSet.elements.x00700001.items[i]
                                                .dataSet.elements.x00700008
                                                .items.length;
                                            g++
                                        ) {
                                            try {
                                                GSPS_Text =
                                                    dataSet.elements.x00700001.items[
                                                        i
                                                    ].dataSet.elements.x00700008.items[
                                                        g
                                                    ].dataSet.string(
                                                        "x00700006"
                                                    );
                                                tempDataSet =
                                                    dataSet.elements.x00700001
                                                        .items[i].dataSet
                                                        .elements.x00700008
                                                        .items;
                                                //console.log(g);
                                                POLYLINE_Function(
                                                    tempDataSet,
                                                    "",
                                                    g
                                                );
                                                // alert(i+"  "+ g);
                                            } catch (ex) {}
                                        }
                                    } catch (ex) {}

                                    //break;
                                }

                                if (tempsop != sop1) continue;
                            }
                        }
                        if (sop1) refreshMarkFromSop(sop1);
                    } catch (ex) {
                        for (var i in dataSet.elements.x00700001.items) {
                            try {
                                tempDataSet =
                                    dataSet.elements.x00700001.items[i].dataSet
                                        .elements.x00700009.items;

                                POLYLINE_Function(tempDataSet, GSPS_Text);
                            } catch (ex) {
                                console.log(GSPS_Text);
                                continue;
                            }
                        }
                        if (sop1) refreshMarkFromSop(sop1);
                    }
                }

                //  }
            }
        }
    } //

    if (dataSet.string("x30060039")) {
        for (var i in dataSet.elements.x30060039.items) {
            var colorStr = (
                "" +
                dataSet.elements.x30060039.items[i].dataSet.string("x3006002a")
            ).split("\\");
            var color;
            if (colorStr)
                color =
                    "rgb(" +
                    parseInt(colorStr[0]) +
                    ", " +
                    parseInt(colorStr[1]) +
                    ", " +
                    parseInt(colorStr[2]) +
                    ")";
            for (var j in dataSet.elements.x30060039.items[i].dataSet.elements
                .x30060040.items) {
                for (var k in dataSet.elements.x30060039.items[i].dataSet
                    .elements.x30060040.items[j].dataSet.elements.x30060016
                    .items) {
                    var dcm = {};
                    dcm.study = dataSet.string("x0020000d");
                    dcm.series = dataSet.string("x0020000e");
                    try {
                        dcm.series =
                            dataSet.elements.x30060010.items[0].dataSet.elements.x30060012.items[0].dataSet.elements.x30060014.items[0].dataSet.string(
                                "x0020000e"
                            );
                    } catch (ex) {}

                    dcm.color = color;
                    dcm.mark = [];
                    if (tvList[i]) {
                        dcm.showName = tvList[i];
                    }
                    dcm.hideName = dcm.showName;
                    dcm.mark.push({});
                    //dcm.SliceLocation=dataSet.string('x00201041');
                    dcm.sop =
                        dataSet.elements.x30060039.items[
                            i
                        ].dataSet.elements.x30060040.items[
                            j
                        ].dataSet.elements.x30060016.items[k].dataSet.string(
                            "x00081155"
                        );
                    var DcmMarkLength = dcm.mark.length - 1;
                    dcm.mark[DcmMarkLength].type = "RTSS";
                    dcm.mark[DcmMarkLength].markX = [];
                    dcm.mark[DcmMarkLength].markY = [];
                    var str0 = (
                        "" +
                        dataSet.elements.x30060039.items[
                            i
                        ].dataSet.elements.x30060040.items[j].dataSet.string(
                            "x30060050"
                        )
                    ).split("\\");
                    for (var k2 = 0; k2 < str0.length; k2 += 3) {
                        dcm.mark[DcmMarkLength].markX.push(
                            parseFloat(str0[k2])
                        );
                        dcm.mark[DcmMarkLength].markY.push(
                            parseFloat(str0[k2 + 1])
                        );
                        dcm.imagePositionZ = parseFloat(str0[k2 + 2]);
                    }
                    patientmark.push(dcm);
                    refreshMark(dcm);
                }
            }
        }
    }
    Toast.fire({
        icon: "success",
        title: `${aiName} AI execution completed`
    });
}
