import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return React.useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(QUERY)
      mql.addEventListener("change", notify)
      return () => mql.removeEventListener("change", notify)
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
