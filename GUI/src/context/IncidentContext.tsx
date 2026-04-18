import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Incident } from '../types/incident'

interface IncidentContextType {
  incidents: Incident[]
  activeIncidents: Incident[]
  loading: boolean
  getIncident: (id: string) => Incident | undefined
  acknowledgeIncident: (id: string, userId: string, userName: string) => Promise<void>
  updateIncidentStatus: (id: string, status: Incident['status']) => Promise<void>
  addCollaborationMessage: (incidentId: string, user: string, agency: string, message: string) => Promise<void>
  refreshIncidents: () => Promise<void>
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined)

// Map flat Supabase rows into the nested Incident type
const mapRowToIncident = (row: Record<string, unknown>): Incident => ({
  id: row.id as string,
  caseId: row.case_id as string,
  location: row.location as string,
  coordinates: {
    latitude: (row.lat as number),
    longitude: (row.lng as number),
  },
  time: new Date(row.time as string),
  severity: row.severity as Incident['severity'],
  status: row.status as Incident['status'],
  aiSummary: row.ai_summary as string,
  agencySpecificInfo: row.agency_specific_info as string | undefined,
  estimatedInjuries: row.estimated_injuries as number | undefined,
  confidence: row.confidence as Incident['confidence'],
  weather: row.weather as Incident['weather'] | undefined,
  traffic: row.traffic as string | undefined,
  photos: ((row.incident_photos as Record<string, unknown>[]) ?? []).map((p) => ({
    id: p.id as string,
    uri: p.uri as string,
    timestamp: new Date(p.timestamp as string),
    verified: p.verified as boolean,
  })),
  actionLog: ((row.action_logs as Record<string, unknown>[]) ?? []).map((a) => ({
    timestamp: new Date(a.timestamp as string),
    user: a.user_name as string,
    action: a.action as string,
    ipAddress: a.ip_address as string | undefined,
  })),
  dispatchedUnits: ((row.dispatched_units as Record<string, unknown>[]) ?? []).map((u) => ({
    id: u.id as string,
    name: u.name as string,
    agency: u.agency as string,
    status: u.status as 'dispatched' | 'en_route' | 'on_scene' | 'cleared',
    dispatchedAt: new Date(u.dispatched_at as string),
    onSceneAt: u.on_scene_at ? new Date(u.on_scene_at as string) : undefined,
    clearedAt: u.cleared_at ? new Date(u.cleared_at as string) : undefined,
  })),
  collaborationLog: ((row.collaboration_messages as Record<string, unknown>[]) ?? []).map((m) => ({
    id: m.id as string,
    timestamp: new Date(m.timestamp as string),
    user: m.user_name as string,
    agency: m.agency as string,
    message: m.message as string,
  })),
})

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  const refreshIncidents = async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_photos (*),
        action_logs (*),
        dispatched_units (*),
        collaboration_messages (*)
      `)
      .order('time', { ascending: false })

    if (error) {
      console.error('Failed to fetch incidents:', error.message)
      setLoading(false)
      return
    }

    setIncidents((data ?? []).map(mapRowToIncident))
    setLoading(false)
  }

  useEffect(() => {
    refreshIncidents()

    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, refreshIncidents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_photos' }, refreshIncidents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_logs' }, refreshIncidents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatched_units' }, refreshIncidents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaboration_messages' }, refreshIncidents)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const activeIncidents = incidents.filter(
    (incident) => incident.status !== 'closed' && incident.status !== 'scene_cleared'
  )

  const getIncident = (id: string) => incidents.find((inc) => inc.id === id)

  const acknowledgeIncident = async (id: string, _userId: string, userName: string) => {
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ status: 'acknowledged' })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to acknowledge incident:', updateError.message)
      return
    }

    await supabase.from('action_logs').insert({
      incident_id: id,
      timestamp: new Date().toISOString(),
      user_name: userName,
      action: `Alert accepted by ${userName}`,
    })

    await refreshIncidents()
  }

  const updateIncidentStatus = async (id: string, status: Incident['status']) => {
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update incident status:', updateError.message)
      return
    }

    await supabase.from('action_logs').insert({
      incident_id: id,
      timestamp: new Date().toISOString(),
      user_name: 'System',
      action: `Status updated to ${status}`,
    })

    await refreshIncidents()
  }

  const addCollaborationMessage = async (
    incidentId: string,
    user: string,
    agency: string,
    message: string
  ) => {
    const { error } = await supabase.from('collaboration_messages').insert({
      incident_id: incidentId,
      timestamp: new Date().toISOString(),
      user_name: user,
      agency,
      message,
    })

    if (error) {
      console.error('Failed to send collaboration message:', error.message)
      return
    }

    await refreshIncidents()
  }

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        activeIncidents,
        loading,
        getIncident,
        acknowledgeIncident,
        updateIncidentStatus,
        addCollaborationMessage,
        refreshIncidents,
      }}
    >
      {children}
    </IncidentContext.Provider>
  )
}

export const useIncidents = () => {
  const context = useContext(IncidentContext)
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider')
  }
  return context
}
