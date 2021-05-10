
import { Container, ELEMENT_NODE, DOCUMENT_NODE} from "../type";
export function clearContainer(container: Container): void {
  if (container.nodeType === ELEMENT_NODE) {
    (container as Element).textContent = '';
  } else if (container.nodeType === DOCUMENT_NODE) {
    const body = container.body;
    if (body != null) {
      body.textContent = '';
    }
  }
}
