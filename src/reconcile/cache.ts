import {  ReactContext, REACT_CONTEXT_TYPE, Cache} from "../type";
import { enableCache } from "../type/constant";
export const CacheContext: ReactContext<Cache> | null= enableCache
  ? {
      $$typeof: REACT_CONTEXT_TYPE,
      // We don't use Consumer/Provider for Cache components. So we'll cheat.
      Consumer: (null as any),
      Provider: (null as any),
      _calculateChangedBits: null as any,
      // We'll initialize these at the root.
      _currentValue: (null as any),
      _currentValue2: (null as any),
      _threadCount: 0,
    }
  : (null);