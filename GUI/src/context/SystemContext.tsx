import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { SystemHealth, AuditLogEntry } from '../types/system'
import { Camera } from '../types/camera'
import { getSystemHealth } from '../services/dataService'

interface SystemContextType {
  systemHealth: SystemHealth | null
  cameras: Camera[]
  auditLog: AuditLogEntry[]
  refreshSystemHealth: () => void
  refreshCameras: () => Promise<void>
  refreshAuditLog: () => Promise<void>
}

const SystemContext = createContext<SystemContextType | undefined>(undefined)

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [cameras, setCameras] = useState<Camera[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])

  const refreshSystemHealth = () => {
    const health = getSystemHealth(cameras)
    setSystemHealth(health)
  }

  const refreshCameras = async () => {
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
