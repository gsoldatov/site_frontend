import { useCallback, useEffect, useRef } from "react"


/**
 * Returns a function, which returns a boolean indicating if component is mounted.
 * https://www.benmvp.com/blog/handling-async-react-component-effects-after-unmount/
 */
export const useMountedState = (): () => boolean => {
    const mountedRef = useRef(false);
    const isMounted = useCallback(() => mountedRef.current, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    return isMounted;
};
