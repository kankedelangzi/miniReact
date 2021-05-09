
import {BasicStateAction, Dispatch, Dispatcher} from '../type'

export const ReactCurrentDispatcher: { current: null | Dispatcher} = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null,
};


function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;

  return (dispatcher as Dispatcher);
}



export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}