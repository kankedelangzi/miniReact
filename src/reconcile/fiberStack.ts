import { StackCursor, Fiber, Container } from '../type'

const valueStack: Array<any> = [];

let fiberStack: Array<Fiber | null>;

export const emptyContextObject = {};

let index = -1;
export declare class NoContextT {}
export const NO_CONTEXT: NoContextT = {};

export const rootInstanceStackCursor: StackCursor<
  Container | NoContextT
> = createCursor(NO_CONTEXT);

export const contextStackCursor: StackCursor<Object> = createCursor(
  emptyContextObject,
);

function push<T>(cursor: StackCursor<T>, value: T, fiber: Fiber): void {
  index++;

  valueStack[index] = cursor.current;

  cursor.current = value;
}

function createCursor<T>(defaultValue: T): StackCursor<T> {
  return {
    current: defaultValue,
  };
}
function pop<T>(cursor: StackCursor<T>, fiber: Fiber): void {
  if (index < 0) {
  
    return;
  }

 

  cursor.current = valueStack[index];

  valueStack[index] = null;
  index--;
}
export {
  createCursor,
  push,
  pop,
  // DEV only:
 
};
