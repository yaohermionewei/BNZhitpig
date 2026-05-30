const INTERACTIVE_KEYBOARD_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "summary",
  "[contenteditable='true']",
  "[contenteditable='']",
  "[role='button']",
  "[role='link']",
].join(",");

export function isInteractiveKeyboardTarget(target) {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest(INTERACTIVE_KEYBOARD_SELECTOR));
}
