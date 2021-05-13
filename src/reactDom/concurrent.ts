import { ConcurrentRoot, Container, RootOptions, RootType } from "../type";
import { createRootImpl } from "./create";

// function ReactDOMRoot(container: Container, options: void | RootOptions) {
//   this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
// }
class ReactDOMRoot {
  _internalRoot
  render: any
  unmount: any
  constructor(container: Container, options: void | RootOptions) {
    this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
  }
}
export function createRoot(
  container: Container,
  options?: RootOptions,
): RootType {
  
 
  return new ReactDOMRoot(container, options);
}

