
/**
 * @param {string} elementType
 * @param {object} obj 
 * @param {string} propertyName 
 */
function checkRequiredProperty(elementType, obj, propertyName) {

    // Check nested property
    if (propertyName.includes(".")) {

        let path = propertyName.split(".");
        for (let i = 0; i < path.length; i++) {
            if (!obj || Object.prototype.hasOwnProperty.call(obj, path[i])) {
                throw new Error(`"The custom ${elementType} miss \`${propertyName}\` attribute"`)
            }
            obj = obj[path[i]];
        }

    } else {

        if (!Object.prototype.hasOwnProperty.call(obj, propertyName)) {
            throw new Error(`"The custom ${elementType} miss \`${propertyName}\` attribute"`);
        }

    }
}


class BaseCustomElement {
    constructor(elementConfig) {
        this.elementConfig = elementConfig;
        this.element = {};
        this.appendElement = {};
        this.requiredProperties = [];
        this.type = "base";
    }

    checkRequiredProperties_() {
        for (let i = 0; i < this.requiredProperties.length; i++) {
            checkRequiredProperty(this.type, this.elementConfig, this.requiredProperties[i]);
        }
    }

    getValue() {
        return this.element.checked;
    }

    /**
     * form data or query parameter
     */
    getParamType() {
        if (Object.prototype.hasOwnProperty.call(this.elementConfig, "formData")) {
            return "formData";
        }
        return "params";
    }

    getRequestField() {
        let paramType = this.getParamType();

        if (paramType === "params") {
            return this.elementConfig.params.name;
        }
    }

    createElement() { }

    addElementClass_(element, classNameInConfig) {
        if (Object.prototype.hasOwnProperty.call(this.elementConfig, classNameInConfig)) {
            let classArray = this.elementConfig[classNameInConfig].split(" ");
            element.classList.add(...classArray);
        }
    }
}


class AiServiceCheckBox extends BaseCustomElement {
    constructor(elementConfig) {
        super(elementConfig);

        this.requiredProperties = [
            "displayText",
            "id"
        ]
        this.type = "checkbox";
        this.checkRequiredProperties_();
    }

    createElement() {

        let labelElement = document.createElement("label");

        labelElement.innerText = this.elementConfig.displayText;
        this.addElementClass_(labelElement, "labelClass");

        let checkElement = document.createElement("input");
        checkElement.type = "checkbox";

        if (Object.prototype.hasOwnProperty.call(this.elementConfig, "checked")) {
            checkElement.checked = this.elementConfig.checked;
        }

        checkElement.id = this.elementConfig.id;
        this.addElementClass_(checkElement, "checkboxClass");

        labelElement.htmlFor = checkElement.id;
        labelElement.appendChild(checkElement);

        this.element = checkElement;

        this.appendElement = labelElement;
    }
}

class RadioProperty extends BaseCustomElement {
    /**
     * @param {object} radioConfig
     * @param {string} radioConfig.displayText 
     * @param {string} radioConfig.value
     * @param {string} radioConfig.labelClass
     * @param {string} radioConfig.radioClass
     */
    constructor(radioConfig) {
        super(radioConfig);
        this.radioConfig = radioConfig;
        this.requiredProperties = [
            "displayText",
            "value"
        ];
        this.type = "radio element (radioConfig.radios)";

        this.checkRequiredProperties_();
    }

    createElement() {

        let labelElement = document.createElement("label");

        labelElement.innerText = this.radioConfig.displayText;
        this.addElementClass_(labelElement, "labelClass");

        let radioElement = document.createElement("input");
        radioElement.type = "radio";
        radioElement.value = this.radioConfig.value;

        if (Object.prototype.hasOwnProperty.call(this.radioConfig, "checked")) {
            radioElement.checked = this.radioConfig.checked;
        }

        radioElement.id = this.radioConfig.id;
        this.addElementClass_(radioElement, "radioClass");

        labelElement.htmlFor = radioElement.id;
        labelElement.appendChild(radioElement);

        this.element = radioElement;

        this.appendElement = labelElement;
    }
}

class AiServiceRadio extends BaseCustomElement {
    constructor(elementConfig) {
        super(elementConfig);

        this.requiredProperties = [
            "title",
            "radioGroupName",
            "radios"
        ];
        this.type = "radio";
        this.checkRequiredProperties_();
    }

    /**
     * @private
     * @return {Element}
     */
    getFieldsetElement_() {
        let fieldsetElement = document.createElement("fieldset");
        this.addElementClass_(fieldsetElement, "fieldsetClass");

        let legend = document.createElement("legend");

        legend.innerText = this.elementConfig.title;

        fieldsetElement.appendChild(legend);

        return fieldsetElement;
    }

    getValue() {
        let radioGroup = document.getElementsByName(this.elementConfig.radioGroupName);
        let checkedRadio = Array.from(radioGroup).find(v => v.checked);
        if (!checkedRadio) {
            throw new Error(`need to select ${this.elementConfig.radioGroupName}`);
        }
        return checkedRadio.value;
    }

    createElement() {
        let fieldsetElement = this.getFieldsetElement_();

        for (let radioConfig of this.elementConfig.radios) {
            let radio = new RadioProperty(radioConfig);
            radio.createElement();
            radio.element.name = this.elementConfig.radioGroupName;

            fieldsetElement.appendChild(radio.appendElement);
        }

        this.element = fieldsetElement;

        this.appendElement = fieldsetElement;
    }
}

const elementClassMap = {
    "checkbox": AiServiceCheckBox,
    "radio": AiServiceRadio,
    "text": undefined,
    "select": undefined
};

class AiServiceCustomElementBuilder {
    constructor(config) {
        this.config = config;
        this.buildedElements = [];
    }


    build() {
        if (!this.config) return;

        for (let elementConfig of this.config) {
            let elementObj = new elementClassMap[elementConfig.type](elementConfig);

            // Append custom element
            elementObj.createElement();
            let swalDocument = Swal.getHtmlContainer();
            swalDocument.append(elementObj.appendElement);

            this.buildedElements.push(elementObj);
        }
    }

}

export {
    AiServiceCustomElementBuilder
};