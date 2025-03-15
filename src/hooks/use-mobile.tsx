
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return !!isMobile
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }

    onChange()
    mql.addEventListener("change", onChange)

    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [query])

  return matches
}
