// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function convertDashToCamel(str) {
    return str.replace(/-([a-z0-9])/g, (g)=>g[1].toUpperCase());
}
function convertCamelToDash(str) {
    return str.replace(/([a-zA-Z0-9])(?=[A-Z])/g, "$1-").toLowerCase();
}
function createTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template;
}
function stringify(input) {
    return typeof input === "string" ? input : typeof input === "number" ? input.toString() : "";
}
function isString(input) {
    return typeof input === "string";
}
function isNull(input) {
    return input === null;
}
function isTrue(input) {
    return input === true;
}
function isObject(obj) {
    return obj !== null && typeof obj === "object" && Array.isArray(obj) === false;
}
function isHtmlElement(input) {
    return input instanceof HTMLElement;
}
class ShadowError extends Error {
    constructor(message){
        super(message);
        this.name = this.constructor.name;
    }
}
class Shadow extends HTMLElement {
    _renderCounter = 0;
    _waitingList = new Set();
    _accessorsStore = new Map();
    _updateCustomEvent = new CustomEvent("_updated");
    _propertiesAndOptions;
    _dynamicCssStore = [];
    _isConnected = false;
    _isPaused = false;
    root;
    dom = {
        id: {},
        class: {}
    };
    initUrl = null;
    get _isReady() {
        return this._isConnected === true && this._isPaused === false && this._waitingList.size === 0;
    }
    constructor(options = {
        mode: "open"
    }){
        super();
        this.root = this.attachShadow(options);
        this._propertiesAndOptions = this.__propertiesAndOptions || [];
        if (this.firstUpdated) {
            this.addEventListener("_updated", this.firstUpdated, {
                once: true
            });
        }
        if (this.updated) {
            this.addEventListener("_updated", this.updated);
        }
    }
    connectedCallback() {
        this.init(this._propertiesAndOptions);
    }
    init(propertiesAndOptions) {
        propertiesAndOptions.forEach(this._makePropertyAccessible);
        this._isConnected = true;
        if (isTrue(this._isReady)) {
            this._actuallyRender();
        }
    }
    _makePropertyAccessible = ({ property , reflect =true , render =true , wait =false , assert =false  })=>{
        if (isTrue(wait)) {
            this._waitingList.add(property);
        } else if (isTrue(assert) && !this[property]) {
            throw new ShadowError(`The property ${property} must have a truthy value.`);
        }
        this._accessorsStore.set(property, this[property]);
        if (isTrue(reflect)) {
            this._updateAttribute(property, this[property]);
        }
        Object.defineProperty(this, property, {
            get: ()=>this._accessorsStore.get(property),
            set: (value)=>{
                if (isTrue(assert) && !value) {
                    throw new ShadowError(`The property '${property}' must have a truthy value.`);
                }
                this._accessorsStore.set(property, value);
                if (isTrue(wait)) {
                    this._waitingList.delete(property);
                }
                if (isTrue(reflect)) {
                    this._updateAttribute(property, value);
                }
                if (isTrue(render) && isTrue(this._isReady)) {
                    this._actuallyRender();
                }
            }
        });
    };
    _updateAttribute(property, value) {
        const attributeName = convertCamelToDash(property);
        const attributeValue = this.getAttribute(attributeName);
        if (attributeValue !== value) {
            if (isNull(value)) return this.removeAttribute(attributeName);
            else {
                if (isString(value)) {
                    this.setAttribute(attributeName, value);
                } else {
                    const jsonValue = JSON.stringify(value);
                    if (jsonValue === undefined) {
                        throw new ShadowError(`Only JSON values can be reflected in attributes but received ` + `the value '${value}' for '${property}'.`);
                    }
                    if (attributeValue !== jsonValue) {
                        this.setAttribute(attributeName, jsonValue);
                    }
                }
            }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) {
            return undefined;
        } else if (name === "init-url" && isString(newValue)) {
            this._isPaused = true;
            this.update(name, newValue);
            this._fetchJsonAndUpdate(newValue).then(()=>{
                this._isPaused = false;
                if (isTrue(this._isReady)) {
                    this._actuallyRender();
                }
            });
        } else {
            return this.update(name, newValue);
        }
    }
    _fetchJsonAndUpdate(urlOrPath) {
        return fetch(new URL(urlOrPath, location.href).href).then((res)=>{
            if (isTrue(res.ok)) {
                return res.json().then((data)=>Object.entries(data).forEach(([property, value])=>this[property] = value));
            } else {
                throw new ShadowError(`Received status code ${res.status} instead of 200-299 range.`);
            }
        }).catch((err)=>{
            throw new ShadowError(err.message);
        });
    }
    update(name, value) {
        const property = convertDashToCamel(name);
        if (property in this) {
            if (this[property] !== value && JSON.stringify(this[property]) !== value) {
                try {
                    this[property] = isNull(value) ? value : JSON.parse(value);
                } catch  {
                    this[property] = value;
                }
            }
        } else {
            throw new ShadowError(`The property '${property}' does not exist on '${this.constructor.name}'.`);
        }
    }
    addCss(ruleSet, render = true) {
        this._dynamicCssStore.push(createTemplate(`<style>${ruleSet}</style>`));
        if (isTrue(render) && isTrue(this._isReady)) this._actuallyRender();
    }
    _createFragment(...inputArray) {
        const documentFragment = document.createDocumentFragment();
        inputArray.flat(2).forEach((input)=>{
            if (isObject(input) && input.element instanceof Element) {
                const { element , collection  } = input;
                documentFragment.appendChild(element);
                collection.forEach((item)=>this._processCollection(item));
            } else if (isString(input)) {
                documentFragment.appendChild(createTemplate(input).content.cloneNode(true));
            } else {
                documentFragment.appendChild(document.createTextNode(stringify(input)));
            }
        });
        return documentFragment;
    }
    _processCollection({ target , queries , eventsAndListeners  }) {
        if (isHtmlElement(target)) {
            queries.forEach(({ kind , selector  })=>kind === "id" ? this.dom.id[selector] = target : this.dom.class[selector] ? this.dom.class[selector].push(target) : this.dom.class[selector] = [
                    target
                ]);
        }
        eventsAndListeners.forEach(({ event , listener  })=>target.addEventListener(event, listener.bind(this)));
    }
    _actuallyRender() {
        if (this._renderCounter > 0) {
            this.dom.id = {};
            this.dom.class = {};
        }
        while(this.root.firstChild){
            this.root.removeChild(this.root.firstChild);
        }
        this.constructor.styles.forEach((template)=>this.root.append(template.content.cloneNode(true)));
        const fragment = this._createFragment(this.render());
        if (this._dynamicCssStore.length > 0) {
            this._dynamicCssStore.forEach((styleTemplate)=>this.root.append(styleTemplate.content.cloneNode(true)));
        }
        this.root.prepend(fragment);
        this.dispatchEvent(this._updateCustomEvent);
        this._renderCounter++;
    }
    render() {
        return "";
    }
    static styles = [];
    static is;
}
function __default(n) {
    for(var l, e, s = arguments, t = 1, r = "", u = "", a = [
        0
    ], c = function(n) {
        1 === t && (n || (r = r.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? a.push(n ? s[n] : r) : 3 === t && (n || r) ? (a[1] = n ? s[n] : r, t = 2) : 2 === t && "..." === r && n ? a[2] = Object.assign(a[2] || {}, s[n]) : 2 === t && r && !n ? (a[2] = a[2] || {})[r] = !0 : t >= 5 && (5 === t ? ((a[2] = a[2] || {})[e] = n ? r ? r + s[n] : s[n] : r, t = 6) : (n || r) && (a[2][e] += n ? r + s[n] : r)), r = "";
    }, h = 0; h < n.length; h++){
        h && (1 === t && c(), c(h));
        for(var i = 0; i < n[h].length; i++)l = n[h][i], 1 === t ? "<" === l ? (c(), a = [
            a,
            "",
            null
        ], t = 3) : r += l : 4 === t ? "--" === r && ">" === l ? (t = 1, r = "") : r = l + r[0] : u ? l === u ? u = "" : r += l : '"' === l || "'" === l ? u = l : ">" === l ? (c(), t = 1) : t && ("=" === l ? (t = 5, e = r, r = "") : "/" === l && (t < 5 || ">" === n[h][i + 1]) ? (c(), 3 === t && (a = a[0]), t = a, (a = a[0]).push(this.apply(null, t.slice(1))), t = 0) : " " === l || "\t" === l || "\n" === l || "\r" === l ? (c(), t = 2) : r += l), 3 === t && "!--" === r && (t = 4, a = a[0]);
    }
    return c(), a.length > 2 ? a.slice(1) : a[1];
}
const SVG_NS = "http://www.w3.org/2000/svg";
function isArrayOfListeners(input) {
    return input.every((i)=>typeof i === "function");
}
function isSpecialKey(input) {
    return input === "id" || input === "class";
}
function isHReturn(input) {
    return isObject(input) && input.element instanceof Element;
}
function h(type, props, ...children) {
    const eventsAndListeners = [];
    const queries = [];
    const collection = [];
    const element = type === "svg" ? document.createElementNS(SVG_NS, "svg") : document.createElement(type);
    for(const key in props){
        if (typeof props[key] === "function") {
            eventsAndListeners.push({
                event: key,
                listener: props[key]
            });
        } else if (Array.isArray(props[key]) && isArrayOfListeners(props[key])) {
            props[key].forEach((listener)=>eventsAndListeners.push({
                    event: key,
                    listener
                }));
        } else if (key[0] === "@") {
            const idOrClass = key.slice(1);
            if (isSpecialKey(idOrClass)) {
                queries.push({
                    kind: idOrClass,
                    selector: props[key].replace(/ .*/, "")
                });
                element.setAttribute(idOrClass, props[key]);
            }
        } else if (props[key] === true) {
            element.setAttribute(key, "");
        } else if (typeof props[key] === "object" && props[key] !== null) {
            element.setAttribute(key, JSON.stringify(props[key]));
        } else if (typeof props[key] === "string") {
            element.setAttribute(key, props[key]);
        } else if (props[key] === null || props[key] === false || props[key] === undefined) {
            element.removeAttribute(key);
        }
    }
    if (type === "svg") {
        element.innerHTML = children.flat(2).reduce((acc, child)=>{
            return acc + (isHReturn(child) ? child.element.outerHTML : stringify(child));
        }, "");
    } else {
        for (const child of children.flat(2)){
            if (isHReturn(child)) {
                collection.push(...child.collection);
                element.appendChild(child.element);
            } else {
                const str = stringify(child);
                if (str) element.appendChild(document.createTextNode(str));
            }
        }
    }
    if (queries.length || eventsAndListeners.length) {
        collection.push({
            target: element,
            queries,
            eventsAndListeners
        });
    }
    return {
        element,
        collection
    };
}
const html = __default.bind(h);
function css(strings, ...values) {
    const cssTemplates = [];
    cssTemplates.push(createTemplate(`<style>${values.reduce((acc, value, i)=>{
        if (value instanceof HTMLTemplateElement) {
            cssTemplates.push(value);
            return acc + strings[i + 1];
        } else if (Array.isArray(value)) {
            value.forEach((el)=>cssTemplates.push(el));
            return acc + strings[i + 1];
        } else {
            return acc + value + strings[i + 1];
        }
    }, strings[0])}</style>`));
    return cssTemplates;
}
function customElement(tagName) {
    return (clazz)=>{
        Object.defineProperty(clazz, "is", {
            value: tagName
        });
        window.customElements.define(tagName, clazz);
        return clazz;
    };
}
function property({ reflect =true , render =true , wait =false , assert =false  } = {}) {
    return (protoOrDescriptor, name)=>{
        if (protoOrDescriptor.constructor.observedAttributes === undefined) {
            protoOrDescriptor.constructor.observedAttributes = [];
        }
        if (reflect === true) {
            protoOrDescriptor.constructor.observedAttributes.push(convertCamelToDash(name));
        }
        if (protoOrDescriptor.__propertiesAndOptions === undefined) {
            Object.defineProperty(protoOrDescriptor, "__propertiesAndOptions", {
                enumerable: false,
                configurable: true,
                writable: false,
                value: []
            });
        }
        protoOrDescriptor.__propertiesAndOptions.push({
            property: name,
            reflect,
            render,
            wait,
            assert
        });
    };
}
function changeInlineStyles(element, [property, value]) {
    if (property.slice(0, 2) === "--" && element.style.getPropertyValue(property) !== value) {
        element.style.setProperty(property, value);
    } else if (element.style[property] !== value) {
        element.style[property] = value;
    }
}
function changeCss(styles, ...elements) {
    Object.entries(styles).forEach((entry)=>elements.forEach((element)=>changeInlineStyles(element, entry)));
}
function dispatchCustomEvent(eventName, element, { bubbles =true , composed =true , detail =null  } = {}) {
    return element.dispatchEvent(new CustomEvent(eventName, {
        bubbles,
        composed,
        detail: detail === null ? {
            id: element.id
        } : detail
    }));
}
var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const readingMethods = new Set([
    "readAsBinaryString",
    "readAsDataURL",
    "readAsText", 
]);
function changeSelectColor(event) {
    changeCss({
        color: "inherit"
    }, event.target);
}
function validFileType(file, fileType) {
    return fileType.split(",").map((s)=>s.trim()).includes(file.type);
}
let LabeledControls = class LabeledControls extends Shadow {
    inputFile = null;
    items = [];
    static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      color: var(--labeledControlsColor, var(--neutralVeryDark, #425466));
      --labeledControlsInputBackground: #f6f9fc;
      --labeledControlsPlaceholderColor: #8898aa;
      line-height: 25px;
      font-size: 17.5px;
    }
    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    .group {
      display: flex;
      flex-direction: column;
    }
    .group ~ .group {
      margin-top: 2px;
    }
    .group:not(:last-of-type) {
      margin-bottom: 2px;
    }

    @media (max-width: 640px) {
      .group:first-of-type label {
        padding-top: 0;
      }
    }

    .multi {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .multi label {
      width: 100%;
    }

    .multi input {
      max-width: 48.5%;
    }
    .multi input:last-of-type {
      margin-left: 3%;
    }

    .colorInherit {
      color: inherit !important;
    }

    label {
      display: block;
      padding-top: 8px;
      color: var(--labeledControlsLabelColor, inherit);
      font-size: var(--labeledControlsFontSize, 14px);
      font-weight: var(--labeledControlsLabelFontWeight, 500);
      text-align: start;
    }

    input,
    textarea,
    select {
      display: block;
      font: inherit;
      font-size: var(--labeledControlsFontSize, inherit);
      font-weight: var(--labeledControlsInputFontWeight, 400);
      color: var(--labeledControlsInputColor, inherit);
      padding: var(--labeledControlsInputPadding, 5px 20px 8px 13px);
      outline: none;
      box-shadow: var(--labeledControlsInputBoxShadow, none);
      border: none;
      border-radius: 6px;
      margin-left: auto;
      margin-right: 0;
      width: var(--labeledControlsInputWidthS, 100%);
      max-width: var(--labeledControlsInputMaxWidthS, 100%);
      height: var(--labeledControlsInputHeightS, auto);
      transition: background-color 0.1s ease-in, color 0.1s ease-in;
      background: var(--labeledControlsInputBackground);
      /** remove the blue background button on click  */
      -webkit-tap-highlight-color: transparent;
    }

    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible {
      box-shadow: var(
        --labeledControlsFocusVisibleBoxShadow,
        0 0 0 1px #e4effa
      );
      background: var(--labeledControlsFocusVisibleBackground, transparent);
    }
    input:focus-visible,
    textarea:focus-visible {
      color: var(
        --labeledControlsFocusVisibleColor,
        var(--labeledControlsPlaceholderColor)
      );
    }

    input {
      accent-color: var(--labeledControlsInputAccentColor, var(--accentColor));
    }

    textarea {
      min-height: 90px;
    }

    option {
      padding: 0;
      margin: 0;
      width: 100%;
    }

    select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23424770' fill-rule='evenodd' d='M573.888889,46.3409091 C573.444444,45.8863636 572.777778,45.8863636 572.333333,46.3409091 C571.888889,46.7954545 571.888889,47.4772727 572.333333,47.9318182 L575.333333,51 L572.333333,54.0681818 C571.888889,54.5227273 571.888889,55.2045455 572.333333,55.6590909 C572.555556,55.8863636 572.888889,56 573.111111,56 C573.444444,56 573.666667,55.8863636 573.888889,55.6590909 L577.666667,51.7954545 C578.111111,51.3409091 578.111111,50.6590909 577.666667,50.2045455 L573.888889,46.3409091 Z' transform='rotate(90 314 -258)'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-size: 10px 6px;
      background-position-x: calc(100% - 22px);
      background-position-y: 16px;
      color: var(--selectFirstColor, var(--labeledControlsPlaceholderColor));
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--labeledControlsPlaceholderColor);
      /** https://stackoverflow.com/questions/19621306/css-placeholder-text-color-on-firefox */
      opacity: 1;
    }

    .group *:disabled {
      cursor: not-allowed;
    }

    input[type="button"] {
      cursor: pointer;
    }

    input[type="checkbox"] {
      width: 26px;
      height: 24px;
      cursor: pointer;
    }

    input[type="date"] {
      color: var(--labeledControlsPlaceholderColor);
    }

    input::-webkit-calendar-picker-indicator {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 24 24"><path fill="%23424770" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>');
    }

    input[type="color"] {
      cursor: pointer;
    }
    input::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    input::-webkit-color-swatch {
      border: none;
      box-shadow: 0px 0px 0px 1px #adbdcc;
      border-radius: 6px;
    }
    input::-moz-color-swatch {
      border: none;
      box-shadow: 0px 0px 0px 1px #adbdcc;
      border-radius: 6px;
    }

    input[type="file"] {
      cursor: pointer;
    }

    input::file-selector-button {
      display: none;
    }

    .visuallyHidden {
      border: 0;
      clip: rect(0 0 0 0);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: 0;
      position: absolute;
      width: 1px;
    }

    @media (min-width: 640px) {
      .group {
        flex-direction: row;
      }
      .group ~ .group {
        margin-top: 8px;
      }
      .multi {
        flex-wrap: nowrap;
      }
      .multi label {
        width: auto;
      }
      .multi input,
      .multi select {
        max-width: 33.8%;
      }
      .multi input:last-of-type,
      .multi select:last-of-type {
        margin-left: 1.4%;
      }
      label {
        margin-right: 16px;
        padding: var(--labeledControlsLabelPadding, 5px 0 8px);
        font-size: inherit;
      }
      input,
      textarea,
      select {
        max-width: var(--labeledControlsInputMaxWidthM, 69%);
        width: var(--labeledControlsInputWidthM, 100%);
      }
      textarea {
        min-height: 140px;
      }
    }
  `;
    createLabeledControls({ kind , id , label , attr ={} , options =[] , isVisuallyHidden , hasFirstSelectedDisabled  }) {
        return kind === "input" ? html` <label
            for="${id}"
            class="inputLabel${isVisuallyHidden ? " visuallyHidden" : ""}"
            part="label ${id + "Label"}"
            >${label}</label
          >
          <input
            id="${id}"
            @class="control"
            name="${id}"
            ...${attr}
            part="input ${id}"
          />` : kind === "textarea" ? html`<label
            for="${id}"
            class="textareaLabel${isVisuallyHidden ? " visuallyHidden" : ""}"
            part="label ${id + "Label"}"
            >${label}</label
          >
          <textarea
            id="${id}"
            name="${id}"
            @class="control"
            ...${attr}
            part="textarea ${id}"
          />` : kind === "select" ? html`<label
            for="${id}"
            class="selectLabel${isVisuallyHidden ? " visuallyHidden" : ""}"
            part="label ${id + "Label"}"
            >${label}</label
          >
          <select
            id="${id}"
            @class="control"
            name="${id}"
            ...${attr}
            part="select ${id}"
            change="${changeSelectColor}"
          >
            ${options.map(({ data , attr ={}  }, i)=>hasFirstSelectedDisabled ? i === 0 ? html`<option
                      ...${{
                selected: "",
                disabled: "",
                ...attr
            }}
                      part="option"
                    >
                      ${data}
                    </option>` : html`<option ...${attr} part="option">${data}</option>` : html`<option ...${attr} part="option">${data}</option>`)}
          </select>` : "";
    }
    render() {
        return this.items.map((itemOrArray)=>Array.isArray(itemOrArray) ? html`<div class="group multi" part="group">
            ${itemOrArray.map(this.createLabeledControls)}
          </div>` : html`<div class="group" part="group">
            ${this.createLabeledControls(itemOrArray)}
          </div>`);
    }
    updated() {
        this.root.querySelectorAll('input[type="date"]').forEach((el)=>el.addEventListener("change", changeSelectColor));
        this.root.querySelectorAll('input[type="file"]').forEach((el)=>el.addEventListener("change", (event)=>this.handleFileSelection(event)));
        this.dom.class["control"].forEach((control, i)=>{
            const flattedItems = this.items.flat(1);
            const itemListeners = flattedItems[i].listeners;
            if (itemListeners) {
                Object.entries(itemListeners).forEach(([ev, listener])=>{
                    control.addEventListener(ev, listener);
                });
            }
        });
    }
    handleFileSelection(event) {
        const inputElement = event.currentTarget;
        const files = inputElement.files;
        if (!files || !files?.length) throw Error("No file!");
        const file = files.item(0);
        const fileType = inputElement.getAttribute("file-type");
        const readingMethod = inputElement.getAttribute("reading-method");
        const reader = new FileReader();
        if (typeof fileType === "string" && !validFileType(file, fileType)) {
            inputElement.setCustomValidity(`Must be ${fileType}`);
        } else {
            inputElement.setCustomValidity("");
        }
        if (typeof readingMethod === "string") {
            if (!readingMethods.has(readingMethod)) {
                throw new Error("Invalid readingMethod.");
            }
            reader[readingMethod](file);
        } else {
            reader.readAsDataURL(file);
        }
        reader.addEventListener("load", (event)=>{
            this.inputFile = reader.result;
        });
    }
    getInput() {
        return Object.fromEntries(this.dom.class["control"].map((el)=>[
                el.id,
                el.getAttribute("type") === "image" ? el.getAttribute("src") || "" : el.getAttribute("type") === "file" ? this.inputFile || "" : el.value.trim(), 
            ]));
    }
    getFormData() {
        const form = document.createElement("form");
        this.dom.class["control"].forEach((c)=>{
            form.append(c.cloneNode(true));
        });
        return new FormData(form);
    }
    reportValidity() {
        return this.dom.class["control"].every((el)=>el.reportValidity());
    }
    reset() {
        const inputsAndTextareas = this.dom.class["control"];
        const selects = [
            ...this.root.querySelectorAll("select"), 
        ];
        inputsAndTextareas.forEach((el)=>el.value = "");
        selects.forEach((el)=>el.selectedIndex = 0);
    }
};
__decorate([
    property({
        reflect: false,
        wait: true
    })
], LabeledControls.prototype, "items", void 0);
LabeledControls = __decorate([
    customElement("labeled-controls")
], LabeledControls);
var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let NiceForm = class NiceForm extends Shadow {
    items = [];
    submit = [];
    attr = {};
    resource = null;
    fetchOptions = {};
    static styles = css`
    :host {
      padding: 16px;
      display: inline-block;
      box-sizing: border-box;
      border-radius: 8px;
      width: var(--niceFormWidthS, 100%);
      max-width: 100%;
      cursor: default;
      overflow-wrap: anywhere;
      color: var(--niceFormColor, inherit);
      --niceFormInputBackgroundColor: #f6f9fc;
      --niceFormPlaceholderColor: #8898aa;
    }
    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    #submit-container {
      display: flex;
      flex-direction: column;
    }
    .submit {
      font: inherit;
      font-size: 16px;
      font-weight: 600;
      height: 36px;
      letter-spacing: 0.375px;
      text-transform: uppercase;
      background: var(--niceFormSubmitBackground);
      color: var(--niceFormSubmitColor);
      border: var(--niceFormSubmitBorder, 1.7px solid var(--primaryDark));
      border-radius: 4px;
      padding: var(--niceFormSubmitPaddingS, 0 13.5px);
      margin: var(--niceFormSubmitMargin, 16px 0 0 auto);
      cursor: pointer;
      transition: 150ms cubic-bezier(0.215, 0.61, 0.355, 1);
      transition-property: all;
      max-width: var(--niceFormSubmitMaxWidth, 100%);
      min-width: initial;
      width: auto;
    }
    .submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1),
        0 3px 6px rgba(0, 0, 0, 0.08);
    }
    .submit:focus-visible {
      box-shadow: var(
        --niceFormFocusBoxShadow,
        var(--focusBoxShadow, 0 0 0 1.4pt #00d4ff)
      );
      border-radius: 6px;
      outline: none;
    }

    .message {
      display: none;
      font-size: var(--messageFontSize, 17.5px);
    }
    #submitMessage {
      color: var(--niceFormSubmitMessageColor, darkgreen);
    }
    #submitErrorMessage {
      color: var(--niceFormSubmitErrorMessageColor, darkred);
    }

    .waiting {
      cursor: wait !important;
    }

    ::slotted(*) {
      text-align: center;
      margin-top: 32px;
      border-radius: 4px;
      font-size: 16px;
    }

    @media (min-width: 640px) {
      :host {
        width: var(--niceFormWidthM, 50%);
        padding: 16px 18px 20px 24px;
      }

      #submit-container {
        flex-direction: row;
      }

      .submit {
        height: 40px;
        font-size: 17.5px;
        padding: var(--niceFormSubmitPaddingL, 0 14px);
      }
      .message {
        margin-right: 16px;
      }

      ::slotted(*) {
        font-size: inherit;
      }
    }
  `;
    render() {
        return html`
      <form @id="formId" ...${this.attr}>
        <labeled-controls @id="controls" part="controls"></labeled-controls>
        ${this.submit.map(({ id , attr  })=>html`<div id="submit-container">
              <p @id="submitMessage" class="message"></p>
              <p @id="submitErrorMessage" class="message"></p>
              <input
                part="submit"
                click=${this.handleButtonClick}
                name="${id}"
                type="submit"
                id="${id}"
                @class="submit"
                ...${attr}
              />
            </div>`)}
      </form>
      <slot></slot>
    `;
    }
    reset() {
        this.dom.id["controls"].reset();
    }
    getInput() {
        return this.dom.id["controls"].getInput();
    }
    wait() {
        this.dom.class["submit"].forEach((button)=>{
            button.classList.add("waiting");
            button.setAttribute("disabled", "disabled");
        });
    }
    finish() {
        this.dom.class["submit"].forEach((button)=>{
            button.classList.remove("waiting");
            button.removeAttribute("disabled");
        });
    }
    handleButtonClick(event) {
        event.preventDefault();
        if (this.dom.id["controls"].reportValidity()) {
            const data = this.dom.id["controls"].getInput();
            if (this.resource) {
                const handleFechtError = ()=>{
                    setTimeout(()=>{
                        changeCss({
                            display: "block"
                        }, this.dom.id["submitMessage"]);
                    }, 50);
                };
                this.wait();
                fetch(this.resource, {
                    ...this.fetchOptions.requestInit || {},
                    method: "POST",
                    body: JSON.stringify({
                        ...data
                    }, null, 2)
                }).then((res)=>{
                    if (!res.ok) {
                        this.reset();
                        changeCss({
                            display: "block"
                        }, this.dom.id["submitErrorMessage"]);
                        throw new Error(`Received status code ${res.status} instead of 200-299 range.`);
                    } else {
                        handleFechtError();
                    }
                }).catch(handleFechtError).finally(()=>{
                    this.finish();
                });
            } else {
                this.dispatchEvent(new CustomEvent("niceFormSubmitted", {
                    detail: data,
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }
    updated() {
        this.dom.id["controls"].items = this.items;
        if (this.fetchOptions.submitMessage) {
            this.dom.id["submitMessage"].innerHTML = this.fetchOptions.submitMessage;
        }
        if (this.fetchOptions.submitErrorMessage) {
            this.dom.id["submitErrorMessage"].innerHTML = this.fetchOptions.submitErrorMessage;
        }
    }
};
__decorate([
    property({
        wait: true,
        reflect: false
    })
], NiceForm.prototype, "items", void 0);
__decorate([
    property({
        wait: true,
        reflect: false
    })
], NiceForm.prototype, "submit", void 0);
__decorate([
    property({
        reflect: false
    })
], NiceForm.prototype, "attr", void 0);
__decorate([
    property()
], NiceForm.prototype, "resource", void 0);
__decorate([
    property({
        reflect: false
    })
], NiceForm.prototype, "fetchOptions", void 0);
NiceForm = __decorate([
    customElement("nice-form")
], NiceForm);
var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let SvgButton = class SvgButton extends Shadow {
    attr = {};
    src = null;
    clickEvent = null;
    constructor(){
        super({
            mode: "open",
            delegatesFocus: true
        });
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("keydown", (event)=>{
            if (event.key === "Enter") {
                this.root.querySelector("div").click();
                event.preventDefault();
            }
        });
        if (this.clickEvent) this.addEventListener("click", this.dispatch);
    }
    disconnectedCallback() {
        if (this.clickEvent) this.removeEventListener("click", this.dispatch);
    }
    dispatch() {
        dispatchCustomEvent(this.clickEvent, this);
    }
    static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      cursor: pointer;
      outline: none;
      border-radius: 4px;
      transition: 150ms cubic-bezier(0.215, 0.61, 0.355, 1);
      transition-property: all;
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    :host(:focus-visible) {
      box-shadow: var(--focusBoxShadow);
    }

    div {
      outline: none;
    }

    img,
    ::slotted(svg) {
      display: block;
      margin: auto;
      width: var(--svgButtonWidth, 24px);
      height: var(--svgButtonHeight, 24px);
      filter: var(--svgButtonFilter);
      transition: 150ms cubic-bezier(0.215, 0.61, 0.355, 1);
      transition-property: all;
    }
  `;
    render() {
        return this.innerHTML ? html`<div tabindex="0" aria-label="Click"><slot></slot></div>` : html`<div tabindex="0" aria-label="Click">
        ${this.src ? html`<img part="img" src="${this.src}" ...${this.attr}/>` : html`<img part="img" ...${this.attr}/>`} 
        </div>`;
    }
};
__decorate([
    property()
], SvgButton.prototype, "attr", void 0);
__decorate([
    property()
], SvgButton.prototype, "src", void 0);
__decorate([
    property()
], SvgButton.prototype, "clickEvent", void 0);
SvgButton = __decorate([
    customElement("svg-button")
], SvgButton);
const columnInputTemplate = createTemplate(`<div class="columnInputWrapper"><labeled-controls class="columnInput"></labeled-controls><svg-button class="remover" click-event="clickedToRemove" part="remover" title="Entfernen" aria-label="Entfernen"><svg class="removerSvg" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#000000">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg></svg-button></div>`);
const columnTemplate = createTemplate(`<div class="column paddingNormal">
                            <div class="columnPatternWrapper">
                              <labeled-controls class="columnPattern notDisplayed"></labeled-controls>
                            </div>
                           <div class="columnInputContainer"></div>
                           <div class="columnBigPlusContainer"></div>
                          </div>`);
const bigPlusTemplate = createTemplate(`<div class="bigPlusWrapper"><svg-button role="button" class="bigPlus" click-event="clickedToAdd" title="Add another item"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#000000">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                               </svg></svg-button></div>`);
function createElement(kind) {
    return document.createElement(kind);
}
function fill(el) {
    return (html)=>{
        el.innerHTML = html;
        return el;
    };
}
function createAndFillElement(kind) {
    return (html)=>fill(createElement(kind))(html);
}
function createTemplate(htmlOrArray) {
    return Array.isArray(htmlOrArray) ? createAndFillElement("template")(htmlOrArray.join("")) : createAndFillElement("template")(htmlOrArray);
}
const columnPatternItem = {
    kind: "input",
    id: "pattern",
    label: "URL Pattern",
    attr: {
        placeholder: '{ pathname: "/books/{:id}" }',
        minlength: "1",
        maxlength: "500",
        required: "",
        title: "The pattern that will be used for matching. This can either be a USVString, or an object providing patterns for each URL part individually. The object members can be any of protocol, username, password, hostname, port, pathname, search, hash, or baseURL. Omitted parts in the object will be treated as wildcards (*)."
    },
    listeners: {
        change: (event)=>matchUrlPatternAll(event.currentTarget)
    }
};
const columnInputItem = {
    kind: "input",
    label: "Input",
    id: "url",
    isVisuallyHidden: true,
    attr: {
        placeholder: "https://example.com/books/123",
        minlength: "1",
        maxlength: "500",
        required: "",
        title: "The URL or URL parts to match against. This can either be a USVString, or an object providing the individual URL parts."
    },
    listeners: {
        change: (event)=>matchUrlPattern(event.currentTarget)
    }
};
function cloneTemplateFragment(template) {
    return template.content.cloneNode(true);
}
function getLastNode(parent) {
    return (selector)=>[
            ...parent.querySelectorAll(selector)
        ].pop();
}
function getShadowRootHost(node) {
    const root = node.getRootNode();
    if (root instanceof ShadowRoot) {
        return root.host;
    } else {
        throw new Error("There is no ShadowRoot.");
    }
}
function appendColumn(parent, hasBreak = false) {
    parent.append(cloneTemplateFragment(columnTemplate));
    const column = getLastNode(parent)(".column");
    const columnPattern = column.querySelector(".columnPattern");
    columnPattern.items = [
        columnPatternItem
    ];
    appendBigPlus(column.querySelector(".columnBigPlusContainer"));
    if (!hasBreak) appendColumn(parent, true);
}
function appendColumnInput(parent) {
    parent.append(cloneTemplateFragment(columnInputTemplate));
    const columnInputs = parent.querySelectorAll(".columnInput");
    const lastColumnInput = columnInputs[columnInputs.length - 1];
    lastColumnInput.items = [
        columnInputItem
    ];
    getLastNode(parent)(".remover").addEventListener("clickedToRemove", removeOnClick);
}
function appendBigPlus(parent) {
    parent.append(cloneTemplateFragment(bigPlusTemplate));
    parent.querySelector(".bigPlus").addEventListener("clickedToAdd", addOnClick);
}
function addOnClick(event) {
    const column = event.currentTarget.closest(".column");
    const columnPattern = column.querySelector(".columnPattern");
    columnPattern.classList.remove("notDisplayed");
    appendColumnInput(column.querySelector(".columnInputContainer"));
}
function removeOnClick(event) {
    const bigPlusWrapper = event.currentTarget.closest(".columnInputWrapper");
    bigPlusWrapper.remove();
}
function getUrlPatternInput(str) {
    let urlPatternInput = "";
    try {
        return urlPatternInput = eval("(" + str + ")");
    } catch  {
        return str;
    }
}
function matchUrlPattern(inputElement) {
    const host = getShadowRootHost(inputElement);
    const column = host.closest(".column");
    const columnPattern = column.querySelector(".columnPattern");
    const columnPatternInputElement = columnPattern.root.querySelector("input");
    columnPatternInputElement.setCustomValidity("");
    if (columnPattern.reportValidity() && host.reportValidity()) {
        const patternString = columnPattern.getInput().pattern;
        const pattern = getUrlPatternInput(patternString);
        const input = getUrlPatternInput(inputElement.value);
        try {
            const urlPattern = new URLPattern(pattern);
            const match = urlPattern.exec(input);
            inputElement.title = JSON.stringify(match, null, 4);
            if (match) {
                host.classList.remove("miss");
                host.classList.add("match");
            } else {
                host.classList.remove("match");
                host.classList.add("miss");
            }
        } catch  {
            columnPatternInputElement.setCustomValidity("Your input is invalid.");
            columnPattern.reportValidity();
        }
    }
}
function matchUrlPatternAll(patternInputElement) {
    const host = getShadowRootHost(patternInputElement);
    const column = host.closest(".column");
    const columnInputs = [
        ...column.querySelectorAll(".columnInput"), 
    ];
    columnInputs.forEach((c)=>matchUrlPattern(c.root.querySelector("input")));
}
function init(container) {
    appendColumn(container);
    const column = container.querySelector(".column");
    const columnPattern = column.querySelector(".columnPattern");
    columnPattern.classList.remove("notDisplayed");
    appendColumnInput(column.querySelector(".columnInputContainer"));
}
init(document.querySelector("#container"));

