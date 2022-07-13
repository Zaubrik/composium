export const columnInputTemplate = createTemplate(
  `<div class="columnInputWrapper"><labeled-controls class="columnInput"></labeled-controls><svg-button class="remover" click-event="clickedToRemove" part="remover" title="Entfernen" aria-label="Entfernen"><svg class="removerSvg" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#000000">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg></svg-button></div>`,
);
export const columnTemplate = createTemplate(`<div class="column paddingNormal">
                            <div class="columnPatternWrapper">
                              <labeled-controls class="columnPattern notDisplayed"></labeled-controls>
                            </div>
                           <div class="columnInputContainer"></div>
                           <div class="columnBigPlusContainer"></div>
                          </div>`);

export const bigPlusTemplate = createTemplate(
  `<div class="bigPlusWrapper"><svg-button role="button" class="bigPlus" click-event="clickedToAdd" title="Add another item"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#000000">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                               </svg></svg-button></div>`,
);

function createElement(kind: string) {
  return document.createElement(kind);
}

function fill(el: Element) {
  return (html: string) => {
    el.innerHTML = html;
    return el;
  };
}

function createAndFillElement(kind: string) {
  return (html: string) => fill(createElement(kind))(html);
}

function createTemplate(htmlOrArray: string[] | string): HTMLTemplateElement {
  return (Array.isArray(htmlOrArray)
    ? createAndFillElement("template")(htmlOrArray.join(""))
    : createAndFillElement("template")(htmlOrArray)) as HTMLTemplateElement;
}
