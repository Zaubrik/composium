import {
  bigPlusTemplate,
  columnInputTemplate,
  columnTemplate,
} from "./templates.js";
import {
  cloneTemplateFragment,
  getLastNode,
  getShadowRootHost,
} from "./deps.js";

/**
 * @typedef {import("./deps.js").LabeledControls} LabeledControls
 * @typedef {import("./deps.js").SvgButton} SvgButton
 */

const columnPatternItem = {
  kind: /** @type {const} */ ("input"),
  id: "pattern",
  label: "URL Pattern",
  attr: {
    placeholder: '{ pathname: "/books/{:id}" }',
    minlength: "1",
    maxlength: "500",
    required: "",
    title:
      "The pattern that will be used for matching. This can either be a USVString, or an object providing patterns for each URL part individually. The object members can be any of protocol, username, password, hostname, port, pathname, search, hash, or baseURL. Omitted parts in the object will be treated as wildcards (*).",
  },
  listeners: {
    /** @param {Event} event */
    change: (event) =>
      matchUrlPatternAll(
        /** @type {HTMLInputElement} */ (event.currentTarget),
      ),
  },
};
const columnInputItem = {
  kind: /** @type {const} */ ("input"),
  label: "Input",
  id: "url",
  isVisuallyHidden: true,
  attr: {
    placeholder: "https://example.com/books/123",
    minlength: "1",
    maxlength: "500",
    required: "",
    title:
      "The URL or URL parts to match against. This can either be a USVString, or an object providing the individual URL parts.",
  },
  listeners: {
    /** @param {Event} event */
    change: (event) =>
      matchUrlPatternAll(
        /** @type {HTMLInputElement} */ (event.currentTarget),
      ),
  },
};

/**
 * @param {Element} parent
 * @param {boolean} [hasBreak=false]
 */
function appendColumn(parent, hasBreak = false) {
  parent.append(cloneTemplateFragment(columnTemplate));
  const column = /** @type{Element}*/ (getLastNode(parent)(".column"));
  const columnPattern =
    /** @type{LabeledControls}*/ (column.querySelector(".columnPattern"));
  columnPattern.items = [columnPatternItem];
  appendBigPlus(
    /** @type{Element}*/ (column.querySelector(".columnBigPlusContainer")),
  );
  if (!hasBreak) appendColumn(parent, true);
}

/**
 * @param {Element} parent
 */
function appendColumnInput(parent) {
  parent.append(cloneTemplateFragment(columnInputTemplate));
  const columnInputs = parent.querySelectorAll(".columnInput");
  const lastColumnInput =
    /** @type{LabeledControls}*/ (columnInputs[columnInputs.length - 1]);
  lastColumnInput.items = [columnInputItem];
  /** @type{Node}*/ (getLastNode(parent)(".remover"))
    .addEventListener("clickedToRemove", removeOnClick);
}

/**
 * @param {Element} parent
 */
function appendBigPlus(parent) {
  parent.append(cloneTemplateFragment(bigPlusTemplate));
  /** @type{Element}*/ (parent
    .querySelector(".bigPlus"))
    .addEventListener("clickedToAdd", addOnClick);
}

/**
 * @param {Event} event
 */
function addOnClick(event) {
  const column =
    /** @type{Element}*/ (/** @type{HTMLElement}*/ (event.currentTarget)
      .closest(".column"));
  const columnPattern =
    /** @type{Element}*/ (column.querySelector(".columnPattern"));
  columnPattern.classList.remove("notDisplayed");
  appendColumnInput(
    /** @type{Element}*/ (column.querySelector(".columnInputContainer")),
  );
}

/**
 * @param {Event} event
 */
function removeOnClick(event) {
  const bigPlusWrapper =
    /** @type{Element}*/ (/** @type{HTMLElement}*/ (event.currentTarget)
      .closest(
        ".columnInputWrapper",
      ));
  bigPlusWrapper.remove();
}

/**
 * @param {string} str
 * @returns {URLPatternInput}
 */
function getUrlPatternInput(str) {
  try {
    return /** @type{URLPatternInput}*/ (eval("(" + str + ")"));
  } catch {
    return str;
  }
}

/**
 * @param {HTMLInputElement} inputElement
 */
function matchUrlPattern(inputElement) {
  const host = /** @type{LabeledControls}*/ (getShadowRootHost(inputElement));
  const column = /** @type{Element}*/ (host.closest(".column"));
  const columnPattern = /** @type{LabeledControls}*/ (column.querySelector(
    ".columnPattern",
  ));
  const columnPatternInputElement =
    /** @type{HTMLInputElement}*/ (columnPattern.root.querySelector(
      "input",
    ));
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
    } catch {
      columnPatternInputElement.setCustomValidity("Your input is invalid.");
      columnPattern.reportValidity();
    }
  }
}

/**
 * @param {HTMLElement} patternInputElement
 */
function matchUrlPatternAll(patternInputElement) {
  const host = getShadowRootHost(patternInputElement);
  const column = /** @type{Element}*/ (host.closest(".column"));
  const columnInputs = /** @type{LabeledControls[]}*/ ([
    ...column.querySelectorAll(".columnInput"),
  ]);
  columnInputs.forEach((c) =>
    matchUrlPattern(
      /** @type{HTMLInputElement}*/ (c.root.querySelector("input")),
    )
  );
}

/**
 * @param {HTMLElement} container
 */
function init(container) {
  appendColumn(container);
  const column = /** @type{Element}*/ (container.querySelector(".column"));
  const columnPattern = /** @type{LabeledControls}*/ (column.querySelector(
    ".columnPattern",
  ));
  columnPattern.classList.remove("notDisplayed");
  appendColumnInput(
    /** @type{Element}*/ (column.querySelector(".columnInputContainer")),
  );
}

init(/** @type{HTMLElement}*/ (document.querySelector("#container")));
