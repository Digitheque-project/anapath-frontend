'use client'
// Repris du dossier patient du Bloc (Anesthesie-Reanimation_frontend) — lecture seule
// dans l'anapath : la session et les appels passent par le relais /api/passerelle.

import { useMemo } from 'react'
import { useSession } from '@/dossier/lib/clinical-auth/use-session'
import { isActionAllowed, checkPermissions, type ACTION_GATES } from '@/dossier/lib/clinical-auth/permissions'

export interface UsePermissionsResult {
  permissions: string[]
  has: (permission: string) => boolean
  hasAny: (...permissions: string[]) => boolean
  hasAll: (...permissions: string[]) => boolean
  canDo: (resource: string, action: string) => boolean
  check: (required: string[], mode?: 'any' | 'all') => boolean
}

// Équivalent de front-clinique/src/hooks/use-permissions.ts (canAccess/serviceCode omis :
// pas de menu multi-services à filtrer dans blocope-front, cf. use-session.ts).
export function usePermissions(): UsePermissionsResult {
  const session = useSession()

  return useMemo(() => {
    const permissions = session.permissions
    return {
      permissions,
      has: (permission) => session.hasPermission(permission),
      hasAny: (...perms) => session.hasAnyPermission(...perms),
      hasAll: (...perms) => session.hasAllPermissions(...perms),
      canDo: (resource, action) =>
        isActionAllowed(resource as keyof typeof ACTION_GATES, action, permissions),
      check: (required, mode = 'any') => checkPermissions(permissions, required, mode),
    }
  }, [session])
}
