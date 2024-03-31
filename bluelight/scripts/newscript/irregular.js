
var openMeasureIrregular = false;
var openArrowRuler = false;
var Arrow_Point1 = [0, 0];
var Arrow_Point2 = [0, 0];
var ArrowRule_previous_choose = null;
var MeasureIrregular_previous_choose = null;

var openTextAnnotation = false;
function MeasureIrregular() {
    if (BL_mode == 'Irregular') {
        DeleteMouseEvent();
        cancelTools();
        openMeasureIrregular = true;

        set_BL_model.onchange = function () {
            displayMark();
            openMeasureIrregular = false;
            set_BL_model.onchange = function () { return 0; };
        }

        BlueLightMousedownList = [];
        BlueLightMousedownList.push(function (e) {
            var MeasureMark = new BlueLightMark();
            let angle2point = rotateCalculation(e, true);
            MeasureMark.setQRLevels(GetViewport().QRLevels);
            MeasureMark.color = "#FFFFFF";
            MeasureMark.hideName = MeasureMark.showName = "ruler";
            MeasureMark.type = "IrregularRuler";
            MeasureMark.pointArray = [];
            MeasureMark.setPoint2D(angle2point[0], angle2point[1]);
            MeasureMark.setPoint2D(angle2point[0], angle2point[1]);
            MeasureIrregular_previous_choose = MeasureMark;
            PatientMark.push(MeasureMark);
            refreshMark(MeasureMark);
            displayAllMark();
        });

        BlueLightMousemoveList = [];
        BlueLightMousemoveList.push(function (e) {
            if (rightMouseDown) scale_size(e, originalPoint_X, originalPoint_Y);
            let angle2point = rotateCalculation(e, true);
            if (MouseDownCheck && MeasureIrregular_previous_choose) {
                MeasureIrregular_previous_choose.setPoint2D(angle2point[0], angle2point[1]);
                var vector = [];
                for (var o = 0; o < MeasureIrregular_previous_choose.pointArray.length; o++) {
                    vector.push({ x: MeasureIrregular_previous_choose.pointArray[o].x, y: MeasureIrregular_previous_choose.pointArray[o].y });
                }
                MeasureIrregular_previous_choose.Text = parseInt(shoelaceFormula(vector) / (GetViewport().transform.PixelSpacingX * GetViewport().transform.PixelSpacingY)) + "mm²";

                refreshMark(MeasureIrregular_previous_choose);
                displayAllMark();
            }
        });

        BlueLightMouseupList = [];
        BlueLightMouseupList.push(function (e) {
            if (MeasureIrregular_previous_choose) MeasureIrregular_previous_choose = null;
            displayMark();
        });

        AddMouseEvent();
    }

    if (BL_mode == 'TextAnnotation') {
        DeleteMouseEvent();
        cancelTools();
        openTextAnnotation = true;

        set_BL_model.onchange = function () {
            displayMark();
            openTextAnnotation = false;
            getByid("span_TextAnnotation").style.display = "none";
            set_BL_model.onchange = function () { return 0; };
        }

        getByid("span_TextAnnotation").style.display = "";
        BlueLightMousedownList = [];
        BlueLightMousemoveList = [];
        BlueLightMousemoveList.push(function (e) {
            if (rightMouseDown) scale_size(e, originalPoint_X, originalPoint_Y);
        });
        BlueLightMouseupList = [];
        BlueLightMouseupList.push(function (e) {
            if (!getByid('text_TextAnnotation').value || getByid('text_TextAnnotation').value == "") return;
            if (MouseDownCheck) {
                var MeasureMark = new BlueLightMark();
                let angle2point = rotateCalculation(e, true);
                MeasureMark.setQRLevels(GetViewport().QRLevels);
                MeasureMark.color = "#FF0000";
                MeasureMark.hideName = MeasureMark.showName = "ruler";
                MeasureMark.type = "TextAnnotation";
                MeasureMark.Text = getByid('text_TextAnnotation').value;
                MeasureMark.pointArray = [];
                MeasureMark.setPoint2D(angle2point[0], angle2point[1]);
                PatientMark.push(MeasureMark);
                refreshMark(MeasureMark);
            }
            displayAllMark();
            displayMark();
        });
        AddMouseEvent();
    }

    if (BL_mode == 'ArrowRuler') {
        DeleteMouseEvent();
        cancelTools();
        openArrowRuler = true;
        set_BL_model.onchange = function () {
            displayMark();
            openArrowRuler = false;
            set_BL_model.onchange = function () { return 0; };
        }

        BlueLightMousedownList = [];
        BlueLightMousedownList.push(function (e) {
            if (MouseDownCheck) {
                Arrow_Point1 = Arrow_Point2 = rotateCalculation(e, true);
                var MeasureMark = new BlueLightMark();

                MeasureMark.setQRLevels(GetViewport().QRLevels);
                MeasureMark.color = "#FF0000";
                MeasureMark.hideName = MeasureMark.showName = "ruler";
                MeasureMark.type = "ArrowRuler";

                ArrowRule_previous_choose = MeasureMark;
                PatientMark.push(MeasureMark);
                displayAllMark();
            }
        });

        BlueLightMousemoveList = [];
        BlueLightMousemoveList.push(function (e) {
            if (rightMouseDown) scale_size(e, originalPoint_X, originalPoint_Y);
            let angle2point = rotateCalculation(e, true);
            if (MouseDownCheck) {
                Arrow_Point2 = angle2point;
                if (ArrowRule_previous_choose) {
                    var MeasureMark = ArrowRule_previous_choose;
                    MeasureMark.pointArray = [];
                    MeasureMark.setPoint2D(Arrow_Point1[0], Arrow_Point1[1]);
                    MeasureMark.setPoint2D(Arrow_Point2[0], Arrow_Point2[1]);
                    refreshMark(MeasureMark);
                }
            }
            displayAllMark();
        });

        BlueLightMouseupList = [];
        BlueLightMouseupList.push(function (e) {
            let angle2point = rotateCalculation(e, true);
            Arrow_Point2 = angle2point;

            if (ArrowRule_previous_choose) {
                var MeasureMark = ArrowRule_previous_choose;
                MeasureMark.pointArray = [];
                MeasureMark.setPoint2D(Arrow_Point1[0], Arrow_Point1[1]);
                MeasureMark.setPoint2D(Arrow_Point2[0], Arrow_Point2[1]);
                refreshMark(MeasureMark);
            }

            ArrowRule_previous_choose = null;
            displayAllMark();

            if (openMouseTool == true && rightMouseDown == true) displayMark();
        });
        AddMouseEvent();
    }
}

/*getByid("IrregularRuler").onclick = function () {
    if (this.enable == false) return;
    set_BL_model('Irregular');
    MeasureIrregular();

    drawBorder(this);
}*/
//HTMLICON.cancelBorderList.push(getByid("IrregularRuler"));

const shoelaceFormula = (vertices) => {
    const length = vertices.length;
    var area = vertices.reduce((sum, vertice, i, array) => {
        const afterIndex = i + 1 >= length ? 0 : i + 1;
        const bforeIndex = i - 1 < 0 ? length - 1 : i - 1;
        return sum + vertice.x * (array[afterIndex].y - array[bforeIndex].y);
    }, 0);
    return Math.abs(area) / 2;
};

function drawIrregularRuler(obj) {
    var canvas = obj.canvas, Mark = obj.Mark, viewport = obj.viewport;
    if (!Mark) return;
    if (!Mark || Mark.type != "IrregularRuler" || Mark.pointArray.length < 2) return;

    var ctx = canvas.getContext("2d"), color = null;
    try {
        if (Mark.color && getByid("AutoColorSelect") && getByid("AutoColorSelect").selected) color = Mark.color;
        viewport.drawClosedInterval(ctx, viewport, Mark.pointArray, [color, color], [1.0, 0.3]);
    } catch (ex) { }

    if (Mark.Text) viewport.drawText(ctx, viewport, Mark.lastMark, Mark.Text, 22, "#FF0000", alpha = 1.0);
}
PLUGIN.PushMarkList(drawIrregularRuler);

function drawTextAnnotatoin(obj) {
    var canvas = obj.canvas, Mark = obj.Mark, viewport = obj.viewport;
    if (!Mark) return;
    if (!Mark || Mark.type != "TextAnnotation") return;

    var ctx = canvas.getContext("2d"), color = null;
    try {
        if (Mark.Text) viewport.drawText(ctx, viewport, Mark.pointArray[0], Mark.Text, 22, "#FF0000", alpha = 1.0);
    } catch (ex) { }
}
PLUGIN.PushMarkList(drawTextAnnotatoin);

function drawArrowRule(obj) {
    try {
        var canvas = obj.canvas, Mark = obj.Mark, viewport = obj.viewport;
        if (!Mark) return;
        if (!Mark || Mark.type != "ArrowRuler" || Mark.pointArray.length < 2) return;
        var ctx = canvas.getContext("2d");

        var x1 = Mark.pointArray[0].x * 1, y1 = Mark.pointArray[0].y * 1;
        var x2 = Mark.pointArray[1].x * 1, y2 = Mark.pointArray[1].y * 1;
        viewport.drawLine(ctx, viewport, new Point2D(x1, y1), new Point2D(x2, y2), Mark.color, 1.0);
        var L = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2), 2);
        var VDist = viewport.width + viewport.height;
        L = L < VDist / 100 ? VDist / 100 : L > VDist / 40 ? VDist / 40 : L;
        var a = Math.atan2((y2 - y1), (x2 - x1));
        var x3 = x2 - L * Math.cos(a + 30 * Math.PI / 180);
        var y3 = y2 - L * Math.sin(a + 30 * Math.PI / 180);
        var x4 = x2 - L * Math.cos(a - 30 * Math.PI / 180);
        var y4 = y2 - L * Math.sin(a - 30 * Math.PI / 180);
        viewport.drawLine(ctx, viewport, new Point2D(x3, y3), new Point2D(x2, y2), Mark.color, 1.0);
        viewport.drawLine(ctx, viewport, new Point2D(x4, y4), new Point2D(x2, y2), Mark.color, 1.0);
    } catch (ex) { console.log(ex) }
}
PLUGIN.PushMarkList(drawArrowRule);

onloadFunction.push2Last(function () {
    getByid("IrregularRuler").onclick = function () {
        if (this.enable == false) return;
        set_BL_model('Irregular');
        MeasureIrregular();
        drawBorder(getByid("openMeasureImg"));
        hideAllDrawer();
    }

    getByid("TextAnnotation").onclick = function () {
        if (this.enable == false) return;
        set_BL_model('TextAnnotation');
        MeasureIrregular();
        drawBorder(getByid("openMeasureImg"));
        hideAllDrawer();
    }

    getByid("ArrowRuler").onclick = function () {
        if (this.enable == false) return;
        set_BL_model('ArrowRuler');
        MeasureIrregular();
        drawBorder(getByid("openMeasureImg"));
        hideAllDrawer();
    }
});
