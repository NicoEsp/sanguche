import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Se lee en el primer render: arrancar en false hacía que en un celular el
// primer frame pintara el sidebar de escritorio y recién después el menú móvil.
const matchesMobile = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(matchesMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
