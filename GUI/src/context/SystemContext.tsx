import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { SystemHealth, AuditLogEntry } from '../types/system'
import { Camera } from '../types/camera'
feat/supabase-auth-and-database
import { getSystemHealth } from '../services/dataService'
=======
import { getSystemHealth, getAuditLog, mockCameras } from '../services/dataService'
import { getDriveCameras, hasDriveCameras } from '../services/driveCameras'
main

interface SystemContextType {
  systemHealth: SystemHealth | null
  cameras: Camera[]
  auditLog: AuditLogEntry[]
  refreshSystemHealth: () => void
feat/supabase-auth-and-database
  refreshCameras: () => Promise<void>
  refreshAuditLog: () => Promise<void>
=======
  refreshCameras: () => void
  refreshAuditLog: () => void
  isLoadingCameras: boolean
main
}

const SystemContext = createContext<SystemContextType | undefined>(undefined)

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [cameras, setCameras] = useState<Camera[]>(mockCameras) // Start with mock data
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [isLoadingCameras, setIsLoadingCameras] = useState(false)

feat/supabase-auth-and-database
=======
  useEffect(() => {
    refreshSystemHealth()
    refreshCameras()
    refreshAuditLog()
    
    const interval = setInterval(() => {
      refreshSystemHealth()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

main
  const refreshSystemHealth = () => {
    // System health reflects backend AI engine state — served by the backend team
    const health = getSystemHealth(cameras)
    setSystemHealth(health)
  }

  const refreshCameras = async () => {
feat/supabase-auth-and-database
    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch cameras:', error.message)
      return
    }

    const mapped: Camera[] = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      streamUrl: c.stream_url,
      status: c.status,
      coordinates: { latitude: c.lat, longitude: c.lng },
      protocol: c.protocol ?? undefined,
      username: c.username ?? undefined,
      port: c.port ?? undefined,
      path: c.path ?? undefined,
    }))

    setCameras(mapped)
=======
    setIsLoadingCameras(true)
    try {
      // Check if Google Drive videos are configured
      if (hasDriveCameras()) {
        console.log('📹 Loading cameras from Google Drive videos...')
        const driveCams = getDriveCameras()
        setCameras(driveCams)
      } else {
        console.log('📹 Using demo camera feeds (configure Google Drive in driveCameras.ts)')
        setCameras(mockCameras)
      }
    } finally {
      setIsLoadingCameras(false)
    }
main
  }

  const refreshAuditLog = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch audit log:', error.message)
      return
    }

    const mapped: AuditLogEntry[] = (data ?? []).map((entry) => ({
      id: entry.id,
      timestamp: new Date(entry.timestamp),
      user: entry.user_name,
      ipAddress: entry.ip_address,
      action: entry.action,
    }))

    setAuditLog(mapped)
  }

  useEffect(() => {
    const init = async () => {
      await refreshCameras()
      await refreshAuditLog()
      refreshSystemHealth()
    }

    init()

    const interval = setInterval(async () => {
      await refreshCameras()
      refreshSystemHealth()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Re-compute system health whenever cameras change
  useEffect(() => {
    if (cameras.length > 0) refreshSystemHealth()
  }, [cameras])

  return (
    <SystemContext.Provider
      value={{
        systemHealth,
        cameras,
        auditLog,
        refreshSystemHealth,
        refreshCameras,
        refreshAuditLog,
        isLoadingCameras,
      }}
    >
      {children}
    </SystemContext.Provider>
  )
}

export const useSystem = () => {
  const context = useContext(SystemContext)
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider')
  }
  return context
}
