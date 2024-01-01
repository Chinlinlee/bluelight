function CreateViewportSettings() {
    var obj = {};
    obj.invert = false;
    obj.HorizontalFlip = false;
    obj.VerticalFlip = false;

    obj.windowCenter = null;
    obj.windowWidth = null;

    obj.transform = null;
    obj.drawMark = true;
    obj.play = false;

    obj.enable = true;
    obj.lockRender = false;

    obj.DicomTagsList = [];
    return obj;
}

class BlueLightViewPort {
    constructor(index, init = true) {
        if (init) this.initViewport(index);
    }

    initViewport(index) {
        var div = document.createElement("DIV");
        div.id = "MyDicomDiv" + index;
        div.viewportNum = index;
        div.className = "MyDicomDiv";
        document.getElementsByClassName("container")[0].appendChild(div);
        this.div = div;
        this.index = index;
        this.QRLevel = "series";
        this.content = {};
        //this.dcm = null;
        this.initViewportOption(div, index);
        this.initLeftRule(div, index);
        this.initDownRule(div, index);
        this.initLabelWC(div, index);
        this.initLabelLT(div, index);
        this.initLabelRT(div, index);
        this.initLabelRB(div, index);
        this.initLabelXY(div, index);
        this.initScrollBar(div, index);
    }

    initViewportOption(div, index) {
        //this.Settings = CreateViewportSettings();
        this.invert = false;
        this.HorizontalFlip = false;
        this.VerticalFlip = false;
        this.rotate = 0;

        this.windowCenter = null;
        this.windowWidth = null;

        this.transform = {};
        this.drawMark = true;
        this.play = false;

        this.enable = true;
        this.lockRender = false;
        this.cine = false;

        div.newMousePointX = 0;
        div.newMousePointY = 0;
        //div.openMark = true;
        //div.openInvert = false;

        div.enable = true;
        div.lockRender = false;
        //div.openDisplayMarkup = false;
        div.DicomTagsList = [];
        this.initViewportCanvas(div, index);
    }
    get enable() { return this.div.enable };
    get width() { return this.content.image ? this.content.image.width : undefined };
    get height() { return this.content.image ? this.content.image.height : undefined };
    get lockRender() { return this.div.lockRender };
    set enable(v) { this.div.enable = v };
    set lockRender(v) { this.div.lockRender = v };

    get study() { if (this.tags) return this.tags.StudyInstanceUID };
    get series() { if (this.tags) return this.tags.SeriesInstanceUID };
    get sop() { if (this.tags) return this.tags.SOPInstanceUID };
    get InstanceNumber() { return this.div.InstanceNumber };
    get framesNumber() { return this.div.framesNumber };
    get imageId() { return this.div.imageId };
    get tags() { return this.DicomTagsList; }

    set study(v) { this.div.study = v };
    set series(v) { this.div.series = v };
    set sop(v) { this.div.sop = v };
    set InstanceNumber(v) { this.div.InstanceNumber = v };
    set framesNumber(v) { this.div.framesNumber = v };
    set imageId(v) { this.div.imageId = v };
    initViewportCanvas(div, index) {
        //一般的Canvas
        var dicmCanvas = document.createElement("CANVAS");
        dicmCanvas.className = "DicomCanvas";
        div.appendChild(dicmCanvas);
        this.canvas = dicmCanvas;
        //只要取得canvas()就能快速取得該Viewport的影像
        div.canvas = function () {
            if (!this.getElementsByClassName("DicomCanvas")[0]) return null;
            else return this.getElementsByClassName("DicomCanvas")[0];
        }
        div.ctx = function () {
            if (!this.getElementsByClassName("DicomCanvas")[0]) return null;
            else return this.getElementsByClassName("DicomCanvas")[0].getContext("2d");
        }

        //標記Canvas
        var MarkCanvas = document.createElement("CANVAS");
        MarkCanvas.id = "MarkCanvas" + index;
        div.appendChild(MarkCanvas);
        this.MarkCanvas = MarkCanvas;
    }

    get ctx() { return this.canvas.getContext("2d"); }

    initLeftRule(div, index) {
        var leftRule = document.createElement("CANVAS");
        leftRule.className = "leftRule";
        leftRule.style = "z-index:30;position:absolute;left:110px;";
        leftRule.height = 500;
        leftRule.width = 10;
        this.leftRule = div.leftRule = leftRule;
        div.appendChild(leftRule);
    }

    initDownRule(div, index) {
        var downRule = document.createElement("CANVAS");
        downRule.className = "downRule";
        downRule.style = "z-index:30;position:absolute;bottom:15px;left:100px;";
        downRule.height = 10;
        this.downRule = div.downRule = downRule;
        div.appendChild(downRule);
    }

    initLabelWC(div, index) {
        var labelWC = document.createElement("LABEL");
        labelWC.className = "labelWC innerLabel";
        labelWC.style = "position:absolute;left:115px;bottom:30px;color: white;z-index: 10;-webkit-user-select: none; ";
        this.labelWC = div.labelWC = labelWC;
        div.appendChild(labelWC);
    }
    initLabelLT(div, index) {
        var labelLT = document.createElement("LABEL");
        labelLT.className = "labelLT innerLabel";
        labelLT.style = "position:absolute;left:115px;top:10px;color: white;z-index: 10;-webkit-user-select: none; ";
        this.labelLT = div.labelLT = labelLT;
        div.appendChild(labelLT);
    }
    initLabelRT(div, index) {
        var labelRT = document.createElement("LABEL");
        labelRT.className = "labelRT innerLabel";
        labelRT.style = "position:absolute;right:20px;top:10px;color: white;z-index: 10;-webkit-user-select: none;text-align:right;";
        this.labelRT = div.labelRT = labelRT;
        div.appendChild(labelRT);
    }
    initLabelRB(div, index) {
        var labelRB = document.createElement("LABEL");
        labelRB.className = "labelRB innerLabel";
        labelRB.style = "position:absolute;right:20px;bottom:20px;color: white;z-index: 10;-webkit-user-select: none;text-align:right;";
        this.labelRB = div.labelRB = labelRB;
        div.appendChild(labelRB);
    }
    initLabelXY(div, index) {
        var labelXY = document.createElement("LABEL");
        labelXY.className = "labelXY innerLabel";
        labelXY.style = "position:absolute;left:115px;bottom:10px;color: white;z-index: 10;-webkit-user-select: none;";
        labelXY.innerText = "X: " + 0 + " Y: " + 0;
        this.labelXY = div.labelXY = labelXY;
        div.appendChild(labelXY);
    }
    initScrollBar(div, index) {
        div.ScrollBar = new ScrollBar(div);//增加右側卷軸
    }

    get QRLevels() {
        return {
            study: this.study,
            series: this.series,
            sop: this.sop
        };
    }
    nextFrame(invert = false) {
        if (this.QRLevel == "series" && this.tags) {
            var Sop = Patient.getNextSopByQRLevelsAndInstanceNumber(this.QRLevels, this.tags.InstanceNumber, invert);
            if (Sop != undefined) setSopToViewport(Sop, this.index);//loadAndViewImage(Sop.imageId, this.index);
        } else if (this.QRLevel == "frames" && this.framesNumber != undefined) {
            var framsNumber = Patient.getNextFrameByQRLevelsAndFrameNumber(this.QRLevels, this.framesNumber, invert);
            if (framsNumber != undefined) setSopToViewport(this.sop, this.index, framsNumber);//loadAndViewImage(this.imageId, this.index, framsNumber);
        }
    }

    reloadImg() {
        if (this.study == undefined) return;
        var Sop = Patient.getSopByQRLevels(this.QRLevels);
        if (Sop.pdf) displayPDF(Sop.pdf);
        else setSopToViewport(Sop, this.index);//loadAndViewImage(Sop.imageId, this.index);
    }

    reloadFirstImg() {
        if (this.study == undefined) return;
        var Sop = Patient.getSopByQRLevels(this.QRLevels);
        if (Sop.pdf) displayPDF(Sop.pdf);
        else setSopToViewport(Patient.getFirstSopByQRLevels(this.QRLevels), this.index, 0);//loadAndViewImage(Patient.getFirstSopByQRLevels(this.QRLevels).imageId, this.index);
    }

    loadFirstImgBySeries(series) {
        var Series = Patient.findSeries(series);
        var Sop = Series.Sop[0];
        if (Sop.pdf) displayPDF(Sop.pdf);
        else setSopToViewport(Sop, this.index, 0);//loadAndViewImage(Sop.imageId, this.index);
    }

    loadFirstImgBySop(sop) {
        var Sop = Patient.findSop(sop);
        if (Sop.pdf) displayPDF(Sop.pdf);
        else setSopToViewport(Sop, this.index, 0);//loadAndViewImage(Sop.imageId, this.index);
    }
}

function GetViewport(num) {
    if (!num) {
        if (num === 0) {
            return getByid("MyDicomDiv" + (0 + 0));
        }
        return getByid("MyDicomDiv" + (viewportNumber + 0));
    }
    return getByid("MyDicomDiv" + (num + 0));
}

function GetNewViewport(num) {
    if (!num) {
        if (num === 0) {
            return ViewPortList[0];
        }
        return ViewPortList[viewportNumber];
    }
    return ViewPortList[num];
}

function SetAllViewport(key, value) {
    if (!key) return;
    for (var i = 0; i < Viewport_Total; i++) {
        GetNewViewport(i)[key] = value;
    }
}

function GetViewportMark(num) {
    if (!num) {
        if (num === 0) {
            return getByid("MarkCanvas" + (0 - 0));
        }
        return getByid("MarkCanvas" + (viewportNumber - 0));
    }
    return getByid("MarkCanvas" + (num - 0));
}

//function refleshCanvas(DicomCanvas, image, viewport, pixelData) {
function refleshCanvas(viewport) {
    var canvas = viewport.canvas;
    var image = viewport.content.image;
    var pixelData = viewport.content.pixelData;
    if (!image) return;
    canvas.width = image.width;
    canvas.height = image.height
    var ctx = canvas.getContext("2d");
    var imgData = ctx.createImageData(image.width, image.height);
    //預先填充不透明度為255
    new Uint32Array(imgData.data.buffer).fill(0xFF000000);

    if (viewport.series && viewport.series != image.data.string("x0020000e"))
        viewport.windowCenter = viewport.windowWidth = null;

    if ((image.data.elements.x00281050 == undefined || image.data.elements.x00281051 == undefined)) {
        var max = -99999999999, min = 99999999999;
        if (image.MinPixel == undefined || image.MaxPixel == undefined || (image.MinPixel == 0 && image.MaxPixel == 0)) {
            for (var i = 0; i < pixelData.length; i++) {
                if (pixelData[i] > max) max = pixelData[i];
                if (pixelData[i] < min) min = pixelData[i];
            }
            image.MinPixel = min; image.MaxPixel = max;
        }
        min = image.MinPixel; max = image.MaxPixel;
        if (min != max && min != undefined && max != undefined) {
            const diff = (1 / (max - min)) * 255;
            const data = imgData.data;
            if (image.color == true) {
                for (var i = data.length; i >= 0; i -= 4) {
                    data[i + 0] = parseInt(pixelData[i] * diff);
                    data[i + 1] = parseInt(pixelData[i + 1] * diff);
                    data[i + 2] = parseInt(pixelData[i + 2] * diff);
                }
            } else {
                for (var i = data.length, j = data.length / 4; i >= 0; i -= 4, j--) {
                    data[i + 0] = data[i + 1] = data[i + 2] = parseInt(pixelData[j] * diff);
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
    } else {
        var windowCenter = viewport.windowCenter ? viewport.windowCenter : image.windowCenter;
        var windowWidth = viewport.windowWidth ? viewport.windowWidth : image.windowWidth;
        var high = windowCenter + (windowWidth / 2);
        var low = windowCenter - (windowWidth / 2);
        var intercept = image.intercept;
        if (CheckNull(intercept)) intercept = 0;
        var slope = image.slope;
        if (CheckNull(slope)) slope = 1;

        //未最佳化之版本
        /*if (image.color == true) {
            for (var i = imgData.data.length; i >=0 ; i -= 4) {
                imgData.data[i + 0] = parseInt(((pixelData[i] * slope - low + intercept) / (high - low)) * 255);
                imgData.data[i + 1] = parseInt(((pixelData[i + 1] * slope - low + intercept) / (high - low)) * 255);
                imgData.data[i + 2] = parseInt(((pixelData[i + 2] * slope - low + intercept) / (high - low)) * 255);
                imgData.data[i + 3] = 255;
            }
        } else {
            for (var i = imgData.data.length, j = imgData.data.length/4; i>=0 ; i -= 4, j--) {
                imgData.data[i + 0] = imgData.data[i + 1] = imgData.data[i + 2] = parseInt(((pixelData[j] * slope - low + intercept) / (high - low)) * 255);
                imgData.data[i + 3] = 255;
            }
        }*/
        var multiplication = 255 / ((high - low)) * slope;
        var addition = (- low + intercept) / (high - low) * 255;
        const data = imgData.data;
        if (image.color == true) {
            for (var i = data.length; i >= 0; i -= 4) {
                data[i + 0] = pixelData[i] * multiplication + addition;
                data[i + 1] = pixelData[i + 1] * multiplication + addition;
                data[i + 2] = pixelData[i + 2] * multiplication + addition;
            }
        } else {
            for (var i = data.length, j = data.length / 4; i >= 0; i -= 4, j--) {
                data[i + 0] = data[i + 1] = data[i + 2] = pixelData[j] * multiplication + addition;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    var shouldReDraw = false;
    ctx.save();
    /*if (CheckNull(viewport.transform.imageOrientationX) == false && CheckNull(viewport.transform.imageOrientationY) == false && CheckNull(viewport.transform.imageOrientationZ) == false) {
        ctx.setTransform(new DOMMatrix(
            [viewport.transform.imageOrientationX, -viewport.transform.imageOrientationX2, 0, viewport.transform.imagePositionX * viewport.transform.PixelSpacingX,
            -viewport.transform.imageOrientationY, viewport.transform.imageOrientationY2, 0, viewport.transform.imagePositionY * viewport.transform.PixelSpacingY,
            viewport.transform.imageOrientationZ, viewport.transform.imageOrientationZ2, 0, viewport.transform.imagePositionZ,
                0, 0, 0, 1
            ]
        ));
        shouldReDraw = true;
    }*/

    var invert = ((image.invert != true && viewport.invert == true) || (image.invert == true && viewport.invert == false));
    if (invert == true) shouldReDraw = ctx.filter = "invert()";
    if (viewport.HorizontalFlip == true || viewport.VerticalFlip == true) {
        ctx.transform(
            viewport.HorizontalFlip ? -1 : 1, 0, // set the direction of x axis
            0, viewport.VerticalFlip ? -1 : 1,   // set the direction of y axis
            (viewport.HorizontalFlip ? image.width : 0), // set the x origin
            (viewport.VerticalFlip ? image.height : 0)   // set the y origin
        );
        shouldReDraw = true;
    }

    if (shouldReDraw != false) {
        ctx.drawImage(cloneCanvas(canvas), 0, 0);
    }
    ctx.restore();

    //setTransform(viewport.index);
    //GetViewportMark(viewport.index).style = canvas.style.cssText;
}

function cloneCanvas(canvas) {
    var newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width, newCanvas.height = canvas.height;
    newCanvas.getContext('2d').drawImage(canvas, 0, 0);
    return newCanvas;
}