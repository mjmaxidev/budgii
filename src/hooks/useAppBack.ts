import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resolveBackPath } from '@/utils/navigation'

/** Navigate to the logical parent screen for the current route. */
export function useAppBack() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    navigate(resolveBackPath(location.pathname, location.state))
  }, [location.pathname, location.state, navigate])
}
