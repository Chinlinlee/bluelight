
var openMeasureIrregular = false;

var MeasureIrregular_previous_choose = null;

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

onloadFunction.push2Last(function () {
    getByid("IrregularRuler").onclick = function () {
        if (this.enable == false) return;
        set_BL_model('Irregular');
        MeasureIrregular();
        drawBorder(getByid("openMeasureImg"));
        hideAllDrawer();
    }
});
