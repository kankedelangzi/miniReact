import { Namespaces } from "../type/constant";


// SVG temp container for IE lacking innerHTML
let reusableSVGContainer: any;

/**
 * Create a function which has 'unsafe' privileges (required by windows8 apps)
 */
const createMicrosoftUnsafeLocalFunction = function(func: (...args: any[]) => any) {
   return func;
};
/**
 * Set the innerHTML property of a node
 *
 * @param {DOMElement} node
 * @param {string} html
 * @internal
 */
export const setInnerHTML = createMicrosoftUnsafeLocalFunction(function(
  node: Element,
  html: {valueOf(): {  toString(): string} },
): void {
  if (node.namespaceURI === Namespaces.svg) {
    
    if (!('innerHTML' in node)) {
      // IE does not have innerHTML for SVG nodes, so instead we inject the
      // new markup in a temp node and then move the child nodes across into
      // the target node
      reusableSVGContainer =
        reusableSVGContainer || document.createElement('div');
      reusableSVGContainer.innerHTML =
        '<svg>' + html.valueOf().toString() + '</svg>';
      const svgNode = reusableSVGContainer.firstChild;
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
      while (svgNode.firstChild) {
        node.appendChild(svgNode.firstChild);
      }
      return;
    }
  }
  node.innerHTML = (html as any);
});

