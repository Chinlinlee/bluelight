
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
    var ctx = canvas.getContext("2d");
    ctx.globalAlpha = (parseFloat(getByid('markAlphaText').value) / 100);
    setMarkColor(ctx);
    if (Mark.color && getByid("AutoColorSelect") && getByid("AutoColorSelect").selected) ctx.strokeStyle = ctx.fillStyle = "" + Mark.color;
    ctx.save();
    setMarkFlip(ctx);
    var tempAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 1.0;

    ctx.moveTo(Math.ceil((Mark.pointArray[0].x)), Math.ceil((Mark.pointArray[0].y)));
    ctx.beginPath();
    for (var o = 1; o < Mark.pointArray.length; o++) {
        var x1 = Math.ceil((Mark.pointArray[o].x));
        var y1 = Math.ceil((Mark.pointArray[o].y));
        ctx.lineTo(x1, y1);
        //ctx.globalAlpha = (parseFloat(getByid('markAlphaText').value) / 100);
    }
    ctx.lineTo(Math.ceil((Mark.pointArray[0].x)), Math.ceil((Mark.pointArray[0].y)));

    ctx.stroke();
    ctx.closePath();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    if (Mark.Text) {
        ctx.beginPath();
        var n = 22;
        ctx.translate(Mark.lastMark.x, Mark.lastMark.y);
        ctx.scale(viewport.HorizontalFlip == true ? -1 : 1, viewport.VerticalFlip == true ? -1 : 1);
        if (viewport && !isNaN(viewport.scale) && viewport.scale < 1) n /= viewport.scale;
        ctx.font = "" + (n) + "px Arial";
        ctx.fillStyle = "#FF0000";
        ctx.fillText("" + Mark.Text, 0, 0);
        ctx.closePath();
    }
    ctx.globalAlpha = tempAlpha;
    ctx.restore();
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
