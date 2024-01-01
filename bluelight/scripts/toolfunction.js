function CreateUid(UidClass) {
    var Uid = "2.16.886.119.102568.9.";
    var date = new Date();
    Uid += date.getFullYear() + "." + (date.getMonth() + 1) + "." + (date.getDate()) + ".";
    Uid += (date.getHours() + 1) + "." + (date.getMinutes()) + "." +
        (date.getSeconds()) + "." + (date.getMilliseconds()) + ".";
    Uid += securePassword(1, 99999, 1) + ".";
    Uid += securePassword(1, 99, 1) + ".";
    Uid += securePassword(1, 9999, 1) + ".";
    if (UidClass == 0 || UidClass == 'study') Uid += securePassword(1, 2, 1);
    else if (UidClass == 1 || UidClass == 'series') Uid += securePassword(3, 4, 1);
    else if (UidClass == 2 || UidClass == 'sop') Uid += securePassword(5, 6, 1);
    else Uid += securePassword(7, 8, 1);
    if (Uid.length % 2 != 0) Uid += 0;
    return Uid;
}

function CreateSecurePassword() {
    var Uid = "xml_";
    var date = new Date();
    Uid += date.getFullYear() + "y" + (date.getMonth() + 1) + "m" + (date.getDate()) + "d";
    Uid += (date.getHours() + 1) + "h" + (date.getMinutes()) + "mm" +
        (date.getSeconds()) + "ss" + (date.getMilliseconds()) + "mmm";

    Uid += securePassword(1, 999, 1) + "b";
    Uid += securePassword(1, 999, 1) + "l";
    return Uid;
}

function securePassword(min, max, step) {
    if (!step) step = 1;
    var len = ((max - min) / step) + 1;
    var number = Math.floor((window.crypto.getRandomValues(new Uint32Array(1))[0] / (4294967295)) * (len)) * step + min;
    if (number < min) number = min;
    if (number > max) number = max;
    return number;
}

function random(min, max, step) {
    if (!step) step = 1;
    var len = ((max - min) / step) + 1;
    var number = Math.floor(Math.random() * (len)) * step + min;
    if (number < min) number = min;
    if (number > max) number = max;
    return number;
}

function SortArrayByElem(arr, str) {
    return arr.sort((a, b) => a[str] - b[str]);
}

function invertDisplayById(id) {
    if (!id && !getByid(id)) return;
    if (getByid(id).style.display == "none") getByid(id).style.display = "";
    else getByid(id).style.display = "none";
}

function getCurrPoint(e) {
    var canvas = GetNewViewport().canvas
    if (!canvas) return [0, 0];
    var currX = parseFloat(parseFloat((e.pageX - canvas.getBoundingClientRect().left /* - newMousePointX[viewportNumber]*/ - 0)) * (GetNewViewport().width / parseFloat(canvas.style.width)));
    var currY = parseFloat(parseFloat((e.pageY - canvas.getBoundingClientRect().top /*- newMousePointY[viewportNumber] */ - 0)) * (GetNewViewport().height / parseFloat(canvas.style.height)));
    return [currX, currY];
}

function Css(element, style, value) {
    if (value == null) return element.style[style];
    else return element.style[style] = value;
}

function Fpx(value) {
    return parseFloat(value) + "px";
}

function getByid(str) {
    return document.getElementById(str);
}

function getClass(str) {
    return document.getElementsByClassName(str);
}

function log(value){
    console.log(value);
}

function CheckNull(str) {
    if (str == undefined || str == null) return true;
    return false;
}

function Null2Empty(str) {
    if (str == undefined || str == null) str = "";
    return str;
}

function getViewprtStretchSize(width, height, element) {
    var wi = (parseFloat(element.clientWidth) - (bordersize * 2)) / parseFloat(width);
    var he = (parseFloat(element.clientHeight) - (bordersize * 2)) / parseFloat(height);
    var small = he < wi ? he : wi;
    return [width * small, height * small];
}

function getViewportFixSize(width, height, row, col) {
    while (width > window.innerWidth - 100 - (bordersize * 2) && width >= 10) width -= 5;
    while (height > window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2) && height >= 10) height -= 5;
    return [width / col, height / row];
}

function getStretchSize(width, height, element) {
    if (width > window.innerWidth || height > window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2)) {
        while (width > window.innerWidth || height > window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2)) {
            width *= 0.99;
            height *= 0.99;
            if (width < 10 || height < 10) break;
        }
        /* var wi = parseFloat(width) / window.innerWidth;
        var he = parseFloat(height) / (window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2));
        var wi_he = wi > he ? wi : he;
        height *= wi_he;
        width *= wi_he; */
    } else {
        if (window.innerWidth > window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2)) {
            var he = (window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2)) / parseFloat(height);
            height *= he;
            width *= he;

        }
        /*while (!width < window.innerWidth || !height < window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2)) {
            width *= 1.1;
            height *= 1.1;
            if (width > window.innerWidth || height > window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2)) break;
        }*/
    }
    return [width, height];
}

function getFixSize(width, height, element) {
    while (width > window.innerWidth - 100 - (bordersize * 2) && width >= 10) width -= 5;
    while (height > window.innerHeight - document.getElementsByClassName("container")[0].offsetTop - (bordersize * 2) && height >= 10) height -= 5;
    return [width, height];
}

function GetmouseX(evt) {
    if (evt.pageX) return (evt.pageX);
    else if (evt.clientX)
        return (evt.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft));
    else return null;
}

function GetmouseY(evt) {
    if (evt.pageY) return evt.pageY;
    else if (evt.clientY)
        return evt.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
    else return null;
}

function SearchUid2Index(sop) {
    for (var i = 0; i < Patient.StudyAmount; i++) {
        for (var j = 0; j < Patient.Study[i].SeriesAmount; j++) {
            for (var l = 0; l < Patient.Study[i].Series[j].SopAmount; l++) {
                if (Patient.Study[i].Series[j].Sop[l].SopUID == sop) {
                    return [i, j, l]
                }
            }
        }
    }
}

function sortInstance(sop) {
    let index = SearchUid2Index(sop);
    let i = index[0],
        j = index[1],
        k = index[2];
    if (Patient.Study[i].Series[j].Sop[k].SopUID == sop) {
        var list = [];
        var Onum = parseInt(Patient.Study[i].Series[j].Sop[k].InstanceNumber);
        for (var l = 0; l < Patient.Study[i].Series[j].Sop.length; l++) {
            list.push(Patient.Study[i].Series[j].Sop[l]);
        }
        for (var m = 0; m < list.length; m++) {
            for (var n = 0; n < list.length; n++) {
                if (parseInt(list[m].InstanceNumber) < parseInt(list[n].InstanceNumber)) {
                    var tempUID = list[m];
                    list[m] = list[n];
                    list[n] = tempUID;
                }

            }
        }
        return list;
    }
}

function rotateCalculation(e) {
    var canvas = GetNewViewport().canvas;
    if (!canvas) return [0, 0];
    let cx = (GetNewViewport().width / 2);
    let cy = (GetNewViewport().height / 2);
    canvas.style.transform = "translate(" + Fpx(GetViewport().newMousePointX) + "," + Fpx(GetViewport().newMousePointY) + ")";
    let currX11 = (e.pageX - canvas.getBoundingClientRect().left - 0) *
        (GetNewViewport().width / parseFloat(canvas.style.width));
    let currY11 = (e.pageY - canvas.getBoundingClientRect().top - 0) *
        (GetNewViewport().height / parseFloat(canvas.style.height));
    canvas.style.transform = "translate(" + Fpx(GetViewport().newMousePointX) + "," + Fpx(GetViewport().newMousePointY) + ")rotate(" + GetNewViewport().rotate + "deg)";
    let radians = GetNewViewport().rotate * (Math.PI / 180),
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (currX11 - cx)) + (sin * (currY11 - cy)) + cx,
        ny = (cos * (currY11 - cy)) - (sin * (currX11 - cx)) + cy;
    currX11 = nx;
    currY11 = ny;
    return [currX11, currY11];
}
/*function rotateCalculation(e) {
    var canvas = GetNewViewport().canvas;
    if (!canvas) return [0, 0];
    let cx = (GetNewViewport().width / 2);
    let cy = (GetNewViewport().height / 2);
    canvas.style.transform = "translate(" + Fpx(GetViewport().newMousePointX) + "," + Fpx(GetViewport().newMousePointY) + ") scaleX(" + (GetNewViewport().HorizontalFlip ? -1 : 1) + ") scaleY(" + (GetNewViewport().VerticalFlip ? -1 : 1) + ")";
    let currX11 = (e.pageX - canvas.getBoundingClientRect().left - 0) *
        (GetNewViewport().width / parseFloat(canvas.style.width));
    let currY11 = (e.pageY - canvas.getBoundingClientRect().top - 0) *
        (GetNewViewport().height / parseFloat(canvas.style.height));
    canvas.style.transform = "translate(" + Fpx(GetViewport().newMousePointX) + "," + Fpx(GetViewport().newMousePointY) + ") scaleX(" + (GetNewViewport().HorizontalFlip ? -1 : 1) + ") scaleY(" + (GetNewViewport().VerticalFlip ? -1 : 1) + ") " + "rotate(" + GetNewViewport().rotate + "deg)";
    let radians = GetNewViewport().rotate * (Math.PI / 180),
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (currX11 - cx)) + (sin * (currY11 - cy)) + cx,
        ny = (cos * (currY11 - cy)) - (sin * (currX11 - cx)) + cy;
    currX11 = nx;
    currY11 = ny;
    return [currX11, currY11];
}*/
function rotatePoint(point, RotationAngle, RotationPoint) {
    let cx = RotationPoint[0];
    let cy = RotationPoint[1];
    currX = point[0];
    currY = point[1];
    let radians = RotationAngle * (Math.PI / 180),
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (currX - cx)) + (sin * (currY - cy)) + cx,
        ny = (cos * (currY - cy)) - (sin * (currX - cx)) + cy;
    currX = nx;
    currY = ny;
    return [currX, currY];
}

function jump2UpOrEnd(number, choose) {

    var SopList = Patient.findSeries(GetNewViewport().series);
    var min = 99999999, max = -9999999;
    for (var l = 0; l < SopList.SopAmount; l++) {
        var instance = parseInt(SopList.Sop[l].InstanceNumber);
        if (instance < min) min = instance;
        else if (instance > max) max = instance;
    }

    if (choose == 'up') number = min;
    else if (choose == 'end') number = max;
    else {
        if (number > max) number = max;
        if (number < min) number = min;
    }

    for (var l = 0; l < SopList.SopAmount; l++) {
        if (parseInt(SopList.Sop[l].InstanceNumber) == number) {
            setSopToViewport(SopList.Sop[l].SopUID);
            //loadAndViewImage(Patient.findSop(SopList.Sop[l].SopUID).imageId);
            break;
        }
    }
}

function jump2Mark(showName) {
    for (var n = 0; n < PatientMark.length; n++) {
        if (PatientMark[n].series == GetNewViewport().series) {
            if (PatientMark[n].showName == showName) {
                for (var m = 0; m < PatientMark[n].mark.length; m++) {
                    if (checkMarkEnabled(GetNewViewport().series, PatientMark[n]) == 0) continue;
                    else {
                        setSopToViewport(PatientMark[n].sop);
                        //loadAndViewImage(Patient.findSop(PatientMark[n].sop).imageId);
                        return;
                    }
                }
            }
        }
    }
}

function checkMarkEnabled(seriesUID, Mark) {
    var mark = leftLayout.getCheckboxBySeriesAndHideName(seriesUID, Mark.hideName);
    if (mark && mark.checked) return 1;
    else return 0;
}

function refreshMark(dcm, refresh) {
    if (refresh == false) return;
    leftLayout.refleshMarkWithSeries(dcm.series);
    displayAllMark()
}

function refreshMarkFromSop(sop) {
    leftLayout.refleshMarkWithSeries(Patient.findSeriesBySop(sop).SeriesUID);
    displayAllMark()
}

function getDistance(x, y) {
    return Math.sqrt(x * x + y * y);
}

function getRotationPoint(mark, middle) {
    var Max_X = -999999,
        Max_Y = -999999,
        Min_X = 999999,
        Min_Y = 999999;
    for (var o = 0; o < mark.markX.length; o += 1) {
        if (parseInt(mark.markX[o]) >= Max_X) Max_X = parseInt(mark.markX[o]);
        if (parseInt(mark.markX[o]) <= Min_X) Min_X = parseInt(mark.markX[o]);
    }
    for (var o = 0; o < mark.markY.length; o += 1) {
        if (parseInt(mark.markY[o]) >= Max_Y) Max_Y = parseInt(mark.markY[o]);
        if (parseInt(mark.markY[o]) <= Min_Y) Min_Y = parseInt(mark.markY[o]);
    }
    if (middle == true) return [(Max_X + Min_X) / 2, (Max_Y + Min_Y) / 2];
    return [Max_X, Min_X, Max_Y, Min_Y];
}

function ConvertGraphicColor(r, g, b) {
    var str = "" + r + "\\" + g + "\\" + b;
    if (str == "0\\32896\\32896") return ["#000000", "T7"];
    else if (str == "0\\32896\\33153") return ["#0000FF", "T8"];
    else if (str == "393\\32998\\32947") return ["#844200", "T9"];
    else if (str == "0\\33153\\33153") return ["#00FFFF", "T10"];
    else if (str == "0\\33153\\32896") return ["#00FF00", "T11"];
    else if (str == "655\\32896\\33153") return ["#FF00FF", "T12"];
    else if (str == "655\\33025\\32896") return ["#FFA500", "L1"];
    else if (str == "328\\32896\\33025") return ["#663399", "L2"];
    else if (str == "655\\32896\\32896") return ["#FF0000", "L3"];
    else if (str == "655\\33153\\32896") return ["#FFFF00", "L4"];
    else if (str == "655\\33153\\33153") return ["#FFFFFF", "L5"];
    else return undefined;
}

function SetGraphicColor(str) {
    if (str == "#000000") return "0\\32896\\32896";
    else if (str == "#0000FF") return "0\\32896\\33153";
    else if (str == "#844200") return "393\\32998\\32947";
    else if (str == "#00FFFF") return "0\\33153\\33153";
    else if (str == "#00FF00") return "0\\33153\\32896";
    else if (str == "#FF00FF") return "655\\32896\\33153";
    else if (str == "#FFA500") return "655\\33025\\32896";
    else if (str == "#663399") return "328\\32896\\33025";
    else if (str == "#FF0000") return "655\\32896\\32896";
    else if (str == "#FFFF00") return "655\\33153\\32896";
    else if (str == "#FFFFFF") return "655\\33153\\33153";
    else return "0\\32896\\33153";
}

function equal_TOL(a, b, tolerance) {
    if (tolerance === undefined) tolerance = 1;
    if (Math.abs(a - b) <= tolerance) return true;
    return false;
}