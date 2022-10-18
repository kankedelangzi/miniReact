import  { FiberRoot } from '../type'

const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;
export function checkForNestedUpdates() {
  // nextedUpdateCount是在renderRootSync 中执行自增操作的，目前不考虑
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;
    throw new Error('调用栈溢出')
  }
}




