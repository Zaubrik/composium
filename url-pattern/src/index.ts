// deno-lint-ignore-file no-unused-vars
import { LabeledControls, SvgButton } from "./deps.ts";
import {
  bigPlusTemplate,
  columnInputTemplate,
  columnTemplate,
} from "./templates.ts";

const columnPatternItem = {
  kind: "input" as const,
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
    change: (event: Event) =>
      matchUrlPatternAll(event.currentTarget as HTMLInputElement),
  },
};
const columnInputItem = {
  kind: "input" as const,
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
    change: (event: Event) =>
      matchUrlPattern(event.currentTarget as HTMLInputElement),
  },
};

function cloneTemplateFragment(template: HTMLTemplateElement) {
  return template.content.cloneNode(true);
}

function getLastNode(parent: Element) {
  return (selector: string) => [...parent.querySelectorAll(selector)].pop();
}

function getShadowRootHost(node: Node) {
  const root = node.getRootNode();
  if (root instanceof ShadowRoot) {
    return root.host;
  } else {
    throw new Error("There is no ShadowRoot.");
  }
}

function appendColumn(parent: Element, hasBreak = false) {
  parent.append(cloneTemplateFragment(columnTemplate));
  const column = getLastNode(parent)(".column")!;
  const columnPattern = column.querySelector(
    ".columnPattern",
  ) as LabeledControls;
  columnPattern.items = [columnPatternItem];
  appendBigPlus(column.querySelector(".columnBigPlusContainer")!);
  if (!hasBreak) appendColumn(parent, true);
}

function appendColumnInput(parent: Element) {
  parent.append(cloneTemplateFragment(columnInputTemplate));
  const columnInputs = parent.querySelectorAll(".columnInput");
  const lastColumnInput =
    columnInputs[columnInputs.length - 1] as LabeledControls;
  lastColumnInput.items = [columnInputItem];
  getLastNode(parent)(".remover")!
    .addEventListener("clickedToRemove", removeOnClick);
}

function appendBigPlus(parent: Element) {
  parent.append(cloneTemplateFragment(bigPlusTemplate));
  parent
    .querySelector(".bigPlus")!
    .addEventListener("clickedToAdd", addOnClick);
}

function addOnClick(event: Event) {
  const column = (event.currentTarget as HTMLElement).closest(".column")!;
  const columnPattern = column.querySelector(".columnPattern")!;
  columnPattern.classList.remove("notDisplayed");
  appendColumnInput(column.querySelector(".columnInputContainer")!);
}

function removeOnClick(event: Event) {
  const bigPlusWrapper = (event.currentTarget as HTMLElement).closest(
    ".columnInputWrapper",
  )!;
  bigPlusWrapper.remove();
}

// TODO: Replace `any` with `URLPatternInput` when the type exists.
// deno-lint-ignore no-explicit-any
function getUrlPatternInput(str: string): any {
  let urlPatternInput = "";
  try {
    // deno-lint-ignore no-explicit-any
    return urlPatternInput = eval("(" + str + ")") as any;
  } catch {
    return urlPatternInput = str;
  }
}

function matchUrlPattern(inputElement: HTMLInputElement) {
  const host = getShadowRootHost(inputElement) as LabeledControls;
  const column = host.closest(".column")!;
  const columnPattern = column.querySelector(
    ".columnPattern",
  ) as LabeledControls;
  const columnPatternInputElement = columnPattern.root.querySelector(
    "input",
  ) as HTMLInputElement;
  columnPatternInputElement.setCustomValidity("");
  if (columnPattern.reportValidity() && host.reportValidity()) {
    const patternString = columnPattern.getInput().pattern;
    const pattern = getUrlPatternInput(patternString);
    const input = getUrlPatternInput(inputElement.value);
    try {
      // @ts-ignore because TS has not implemented URLPattern yet
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

function matchUrlPatternAll(patternInputElement: HTMLElement) {
  const host = getShadowRootHost(patternInputElement);
  const column = host.closest(".column")!;
  const columnInputs = [
    ...column.querySelectorAll(".columnInput"),
  ] as LabeledControls[];
  columnInputs.forEach((c) =>
    matchUrlPattern(c.root.querySelector("input") as HTMLInputElement)
  );
}

function init(container: HTMLElement) {
  appendColumn(container);
  const column = container.querySelector(".column")!;
  const columnPattern = column.querySelector(
    ".columnPattern",
  ) as LabeledControls;
  columnPattern.classList.remove("notDisplayed");
  appendColumnInput(column.querySelector(".columnInputContainer")!);
}

init(document.querySelector("#container")!);
