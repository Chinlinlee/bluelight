
//代表正在使用測量工具
var openMeasure = false;

//紀錄測量工具座標
var Measure_Point1 = [0, 0];
var Measure_Point2 = [0, 0];

var Measure_now_choose = null;
var Measure_previous_choose = null;
function measure() {
    if (BL_mode == 'measure') {
        DeleteMouseEvent();
        cancelTools();
        openMeasure = true;
        set_BL_model.onchange = function () {
            displayMark();
            openMeasure = false;
            set_BL_model.onchange = function () { return 0; };
        }

        BlueLightMousedownList = [];
        BlueLightMousedownList.push(function (e) {
            measure_pounch(rotateCalculation(e)[0], rotateCalculation(e)[1]);
            Measure_previous_choose = null;
            if (!Measure_now_choose) {
                var MeasureMark = new BlueLightMark();

                MeasureMark.setQRLevels(GetViewport().QRLevels);
                MeasureMark.color = "#FF0000";
                MeasureMark.hideName = MeasureMark.showName = "ruler";
                MeasureMark.type = "MeasureRuler";

                Measure_previous_choose = MeasureMark;
                PatientMark.push(MeasureMark);
            }
            Measure_Point1 = Measure_Point2 = rotateCalculation(e);
            displayAllMark();
        });

        BlueLightMousemoveList = [];
        BlueLightMousemoveList.push(function (e) {
            if (rightMouseDown) scale_size(e, originalPoint_X, originalPoint_Y);
            let angle2point = rotateCalculation(e);
            if (MouseDownCheck) {
                Measure_Point2 = angle2point;
                if (Measure_now_choose) {
                    Measure_now_choose.pointArray[Measure_now_choose.order].x = angle2point[0];
                    Measure_now_choose.pointArray[Measure_now_choose.order].y = angle2point[1];
                    Measure_now_choose.dcm.Text = getMeasurelValueBy2Point(Measure_now_choose.pointArray);
                    refreshMark(Measure_now_choose.dcm);
                } else if (Measure_previous_choose) {
                    var MeasureMark = Measure_previous_choose;

                    MeasureMark.pointArray = [];
                    MeasureMark.setPoint2D(Measure_Point1[0], Measure_Point1[1]);
                    MeasureMark.setPoint2D(Measure_Point2[0], Measure_Point2[1]);

                    MeasureMark.Text = getMeasurelValue(e);
                    refreshMark(MeasureMark);
                    displayAllMark();
                }
            }
        });

        BlueLightMouseupList = [];
        BlueLightMouseupList.push(function (e) {
            let angle2point = rotateCalculation(e);
            Measure_Point2 = angle2point;

            if (Measure_now_choose) {
                Measure_now_choose.pointArray[Measure_now_choose.order].x = angle2point[0];
                Measure_now_choose.pointArray[Measure_now_choose.order].y = angle2point[1];
                Measure_now_choose.dcm.Text = getMeasurelValueBy2Point(Measure_now_choose.pointArray);
                refreshMark(Measure_now_choose.dcm);
            }
            else if (Measure_previous_choose) {
                var MeasureMark = Measure_previous_choose;

                MeasureMark.pointArray = [];
                MeasureMark.setPoint2D(Measure_Point1[0], Measure_Point1[1]);
                MeasureMark.setPoint2D(Measure_Point2[0], Measure_Point2[1]);

                MeasureMark.Text = getMeasurelValue(e);
                refreshMark(MeasureMark);
                //Graphic_now_choose = { reference: dcm };
                //Measure_previous_choose = dcm;
            }
            if (Measure_now_choose) Measure_previous_choose = Measure_now_choose;
            Measure_now_choose = null;
            displayAllMark();

            if (openMouseTool == true && rightMouseDown == true) displayMark();

            if (openLink) displayAllRuler();
        });

        BlueLightTouchstartList = [];
        BlueLightTouchstartList.push(function (e, e2) {
            measure_pounch(rotateCalculation(e)[0], rotateCalculation(e)[1]);
            Measure_previous_choose = null;
            if (!Measure_now_choose) {
                var MeasureMark = new BlueLightMark();

                MeasureMark.setQRLevels(GetViewport().QRLevels);
                MeasureMark.color = "#FF0000";
                MeasureMark.hideName = MeasureMark.showName = "ruler";
                MeasureMark.type = "MeasureRuler";

                Measure_previous_choose = MeasureMark;
                PatientMark.push(MeasureMark);
            }
            Measure_Point1 = Measure_Point2 = rotateCalculation(e);
            displayAllMark();
        });

        BlueLightTouchmoveList = [];
        BlueLightTouchmoveList.push(function (e, e2) {
            if (rightTouchDown) scale_size(e, originalPoint_X, originalPoint_Y);
            let angle2point = rotateCalculation(e);
            if (TouchDownCheck) {
                Measure_Point2 = angle2point;
                if (Measure_now_choose) {
                    Measure_now_choose.pointArray[Measure_now_choose.order].x = angle2point[0];
                    Measure_now_choose.pointArray[Measure_now_choose.order].y = angle2point[1];
                    Measure_now_choose.dcm.Text = getMeasurelValueBy2Point(Measure_now_choose.pointArray);
                    refreshMark(Measure_now_choose.dcm);
                } else if (Measure_previous_choose) {
                    var MeasureMark = Measure_previous_choose;

                    MeasureMark.pointArray = [];
                    MeasureMark.setPoint2D(Measure_Point1[0], Measure_Point1[1]);
                    MeasureMark.setPoint2D(Measure_Point2[0], Measure_Point2[1]);

                    MeasureMark.Text = getMeasurelValue(e);
                    refreshMark(MeasureMark);
                    displayAllMark();
                }
            }
        });

        BlueLightTouchendList = [];
        BlueLightTouchendList.push(function (e, e2) {
            //let angle2point = rotateCalculation(e);
            //Measure_Point2 = angle2point;
            
            if (Measure_now_choose) {
                Measure_now_choose.pointArray[Measure_now_choose.order].x = angle2point[0];
                Measure_now_choose.pointArray[Measure_now_choose.order].y = angle2point[1];
                Measure_now_choose.dcm.Text = getMeasurelValueBy2Point(Measure_now_choose.pointArray);
                refreshMark(Measure_now_choose.dcm);
            }
            else if (Measure_previous_choose) {
                /*var MeasureMark = Measure_previous_choose;

                MeasureMark.pointArray = [];
                MeasureMark.setPoint2D(Measure_Point1[0], Measure_Point1[1]);
                MeasureMark.setPoint2D(Measure_Point2[0], Measure_Point2[1]);

                MeasureMark.Text = getMeasurelValue(e);
                refreshMark(MeasureMark);*/
                //Graphic_now_choose = { reference: dcm };
                //Measure_previous_choose = dcm;
            }
            if (Measure_now_choose) Measure_previous_choose = Measure_now_choose;
            Measure_now_choose = null;
            displayAllMark();

            if (openMouseTool == true && rightMouseDown == true) displayMark();

            if (openLink) displayAllRuler();
        });
        
        AddMouseEvent();
    }
}

function measure_pounch(currX, currY) {
    let block_size = getMarkSize(GetViewportMark(), false) * 4;
    for (var n = 0; n < PatientMark.length; n++) {
        if (PatientMark[n].sop == GetViewport().sop) {
            if (PatientMark[n].type == "MeasureRuler") {
                var tempMark = PatientMark[n].pointArray;

                var x1 = parseInt(tempMark[0].x), y1 = parseInt(tempMark[0].y);
                if (currY + block_size >= y1 && currY - block_size <= y1 && currX + block_size >= x1 && currX - block_size <= x1) {
                    Measure_now_choose = { dcm: PatientMark[n], pointArray: PatientMark[n].pointArray, order: 0 };
                }

                var x2 = parseInt(tempMark[1].x), y2 = parseInt(tempMark[1].y);
                if (currY + block_size >= y2 && currY - block_size <= y2 && currX + block_size >= x2 && currX - block_size <= x2) {
                    Measure_now_choose = { dcm: PatientMark[n], pointArray: PatientMark[n].pointArray, order: 1 };
                }
                /*if (currY + block_size >= y1 && currX + block_size >= x1 / 2 + x2 / 2 && currY < y1 + block_size && currX < x1 / 2 + x2 / 2 + block_size) {

                }*/
            }
        }
    }
}

function getMeasurelValueBy2Point(pointArray) {
    var value = parseInt(Math.sqrt(
        Math.pow(pointArray[0].x / GetViewport().transform.PixelSpacingX - pointArray[1].x / GetViewport().transform.PixelSpacingX, 2) +
        Math.pow(pointArray[0].y / GetViewport().transform.PixelSpacingY - pointArray[1].y / GetViewport().transform.PixelSpacingY, 2), 2)) +
        "mm";
    return value;
}

function getMeasurelValue(e) {
    var value = parseInt(Math.sqrt(
        Math.pow(Measure_Point2[0] / GetViewport().transform.PixelSpacingX - Measure_Point1[0] / GetViewport().transform.PixelSpacingX, 2) +
        Math.pow(Measure_Point2[1] / GetViewport().transform.PixelSpacingY - Measure_Point1[1] / GetViewport().transform.PixelSpacingY, 2), 2)) +
        "mm";
    return value;
}

window.addEventListener('keydown', (KeyboardKeys) => {
    var key = KeyboardKeys.which

    if ((BL_mode == 'measure') && Measure_previous_choose && (key === 46 || key === 110)) {
        PatientMark.splice(PatientMark.indexOf(Measure_previous_choose.dcm), 1);
        displayMark();
        Measure_previous_choose = null;
        refreshMarkFromSop(GetViewport().sop);
    }
    Measure_previous_choose = null;
});

function drawMeasureRuler(obj) {
    try {
        var canvas = obj.canvas, Mark = obj.Mark;
        if (!Mark) return;
        if (!Mark || Mark.type != "MeasureRuler" || Mark.pointArray.length < 2) return;
        var ctx = canvas.getContext("2d");
        ctx.globalAlpha = (parseFloat(getByid('markAlphaText').value) / 100);
        setMarkColor(ctx);
        if (Mark.color) ctx.strokeStyle = ctx.fillStyle = "" + Mark.color;

        ctx.beginPath();
        var x1 = Mark.pointArray[0].x * 1, y1 = Mark.pointArray[0].y * 1;
        var x2 = Mark.pointArray[1].x * 1, y2 = Mark.pointArray[1].y * 1;

        if (Mark.RotationAngle && Mark.RotationPoint) {
            [x1, y1] = rotatePoint([x1, y1], Mark.RotationAngle, Mark.RotationPoint);
            [x2, y2] = rotatePoint([x2, y2], Mark.RotationAngle, Mark.RotationPoint);
        }

        var tempAlpha2 = ctx.globalAlpha;
        ctx.globalAlpha = 1.0;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = tempAlpha2;
        ctx.closePath();

        var tempAlpha2 = ctx.globalAlpha;
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "#00FF00";
        ctx.fillStyle = "#00FF00";
        ctx.beginPath();
        ctx.arc(Mark.pointArray[0].x, Mark.pointArray[0].y, 3, 0, 2 * Math.PI);
        ctx.arc(Mark.lastMark.x, Mark.lastMark.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();

        if (Mark.Text) {
            ctx.beginPath();
            ctx.font = "" + (22) + "px Arial";
            ctx.fillStyle = "#FF0000";
            ctx.fillText("" + Mark.Text, Mark.lastMark.x, Mark.lastMark.y);
            ctx.closePath();
        }
        ctx.globalAlpha = tempAlpha2;
    } catch (ex) { console.log(ex) }

}
PLUGIN.PushMarkList(drawMeasureRuler);