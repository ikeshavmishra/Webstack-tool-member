import { useContext } from 'react'
import { AuthContext } from './AuthContext.jsx'

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return context
}

export { useAuth }
