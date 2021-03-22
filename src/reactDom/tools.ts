import { FiberRoot, HostComponent}  from '../type/index'
export function getPublicInstance(instance: Element) {
  return instance;
}

export function getPublicRootInstance(container: FiberRoot) {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}