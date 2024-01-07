
function scroll() {
    if (BL_mode == 'scroll') {
        DeleteMouseEvent();

        BlueLightMousedownList = [];
        BlueLightMousedownList.push(function (e) {
            switch (e.which) {
                case 1: MouseDownCheck = true; break;
                case 2: break;
                case 3: rightMouseDown = true; break;
                default: break;
            }
        });

        Mousemove = function (e) {
            var currX = getCurrPoint(e)[0];
            var currY = getCurrPoint(e)[1];


            if (rightMouseDown == true) scale_size(e, currX, currY);

            if (MouseDownCheck) {
                windowMouseX = GetmouseX(e);
                windowMouseY = GetmouseY(e);

                var nextBool = null;
                if (Math.abs(currY - GetViewport().originalPointY) < Math.abs(currX - GetViewport().originalPointX)) {
                    if (currX < GetViewport().originalPointX - 3) nextBool = true;
                    else if (currX > GetViewport().originalPointX + 3) nextBool = false;
                } else {
                    if (currY < GetViewport().originalPointY - 3) nextBool = true;
                    else if (currY > GetViewport().originalPointY + 3) nextBool = false;
                }

                if (nextBool != null && openLink == false) GetNewViewport().nextFrame(nextBool);
                else if (nextBool != null && openLink == true) {
                    for (var z = 0; z < Viewport_Total; z++)
                        if (!(parseInt(GetViewport(z).style.height) <= 1)) GetNewViewport(z).nextFrame(nextBool);

                }

                GetViewport().originalPointX = currX;
                GetViewport().originalPointY = currY;
            }
        }
        Mouseup = function (e) {
            var currX = getCurrPoint(e)[0];
            var currY = getCurrPoint(e)[1];
            if (openMouseTool == true && rightMouseDown == true)
                displayMark();
            MouseDownCheck = rightMouseDown = false;
            magnifierDiv.hide();

            if (openLink) displayAllRuler();
        }
        BlueLightTouchstartList = [];

        Touchmove = function (e, e2) {
            if (openDisplayMarkup && (getByid("DICOMTagsSelect").selected || getByid("AIMSelect").selected)) return;

            var currX = getCurrPoint(e)[0];
            var currY = getCurrPoint(e)[1];

            if (TouchDownCheck == true && rightTouchDown == false) {
                //if (openChangeFile == true) 
                {
                    if (Math.abs(currY - GetViewport().originalPointY) < Math.abs(currX - GetViewport().originalPointX)) {
                        if (currX < GetViewport().originalPointX - 3) {
                            GetNewViewport().nextFrame(true);
                        } else if (currX > GetViewport().originalPointX + 3) {
                            GetNewViewport().nextFrame(false);
                        }
                    } else {
                        if (currY < GetViewport().originalPointY - 3) {
                            GetNewViewport().nextFrame(true);
                        } else if (currY > GetViewport().originalPointY + 3) {
                            GetNewViewport().nextFrame(false);
                        }
                    }
                    GetViewport().originalPointX = currX;
                    GetViewport().originalPointY = currY;
                }
            }
        }
        Touchend = function (e, e2) {
            if (TouchDownCheck == true) {
                if (openAngle == 1) openAngle = 2;
                else if (openAngle == 2) openAngle = 3;
            }
            TouchDownCheck = false;
            rightTouchDown = false;

            magnifierDiv.hide();

        }
        AddMouseEvent();
    }
};


class ScrollBar {
    constructor(viewport) {
        this.viewport = viewport;
        this.total = 0;
        this.index = 0;
        this.width = 15;
        this.outerDIV = document.createElement("DIV");
        this.innerDIV = document.createElement("DIV");

        this.outerDIV.style.backgroundColor = "rgb(241,241,241)";
        this.innerDIV.style.backgroundColor = "rgb(193,193,193)";

        this.outerDIV.style.position = "absolute";
        this.innerDIV.style.position = "absolute";

        this.outerDIV.style.top = "0px";
        this.innerDIV.style.top = "0px";

        this.outerDIV.style.right = "0px";
        this.innerDIV.style.right = "0px";

        this.outerDIV.style.zIndex = "7";
        this.innerDIV.style.zIndex = "8";

        this.outerDIV.appendChild(this.innerDIV);
        this.viewport.appendChild(this.outerDIV);
        this.reflesh();
    }
    setTotal(num) {
        this.total = num;
    }
    setIndex(num) {
        this.index = num;
    }
    reflesh() {
        this.outerDIV.style.width = this.width + "px";
        this.innerDIV.style.width = this.width + "px";

        this.outerDIV.style.height = "100%";//this.viewport.clientHeight + "px";
        if (this.total <= 1) this.innerDIV.style.height = "0%";//this.viewport.clientHeight + "px";
        else {
            this.innerDIV.style.height = parseInt(100 / this.total) + "%";
            this.innerDIV.style.top = ((((this.index) / this.total) * 100)) + "%";
        }
        //避免擋到Label
        if (rightLabelPadding < this.width) rightLabelPadding = this.width + 2;
    }
}