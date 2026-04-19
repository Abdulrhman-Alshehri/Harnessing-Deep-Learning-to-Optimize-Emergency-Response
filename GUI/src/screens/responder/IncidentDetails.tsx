import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { generateIncidentReport } from '../../services/pdfService';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import MapView from '../../components/common/MapView';
import { IncidentStatus } from '../../types/incident';
import './IncidentDetails.css';

const UNIT_STATUS_LABEL: Record<string, string> = {
  dispatched: 'Dispatched',
  en_route: 'En Route',
  on_scene: 'On Scene',
  cleared: 'Cleared',
};

const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, acknowledgeIncident, updateIncidentStatus } = useIncidents();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const incident = incidents.find(i => i.id === id);

  const handleGeneratePDF = () => {
    if (!incident) return;
    setIsGeneratingPDF(true);
    try {
      generateIncidentReport(incident);
      showSuccess('PDF report generated successfully!');
    } catch {
      showError('Failed to generate PDF report. Please try again.');
    } finally {
      setTimeout(() => setIsGeneratingPDF(false), 1000);
    }
  };

  const handleAcknowledge = async () => {
    if (!incident || !user) return;
    setIsActing(true);
    try {
      await acknowledgeIncident(incident.id, user.id, user.name);
      showSuccess('Incident acknowledged.');
    } catch {
      showError('Failed to acknowledge incident.');
    } finally {
      setIsActing(false);
    }
  };

  const handleStatusUpdate = async (status: IncidentStatus) => {
    if (!incident) return;
    setIsActing(true);
    try {
      await updateIncidentStatus(incident.id, status);
      showSuccess(`Status updated to ${status.replace('_', ' ')}.`);
    } catch {
      showError('Failed to update status.');
    } finally {
      setIsActing(false);
    }
  };

  if (!incident) {
    return (
      <div className="incident-details-layout">
        <Sidebar userRole="responder" />
        <main className="incident-details-main">
          <div className="not-found">
            <h1>Incident Not Found</h1>
            <button className="btn btn-primary" onClick={() => navigate('/responder/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const nextStatuses: IncidentStatus[] = (() => {
    switch (incident.status) {
      case 'new': return ['acknowledged', 'closed'];
      case 'acknowledged': return ['on_scene', 'closed'];
      case 'on_scene': return ['scene_cleared', 'closed'];
      case 'scene_cleared': return ['closed'];
      default: return [];
    }
  })();

  return (
    <div className="incident-details-layout">
      <Sidebar userRole="responder" />

      <main className="incident-details-main">
        <div className="incident-container">
          {/* Header */}
          <header className="incident-header">
            {/* Row 1: back navigation */}
            <div className="header-nav-row">
              <button className="back-button" onClick={() => navigate('/responder/dashboard')}>
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Dashboard
              </button>
            </div>
            {/* Row 2: title + action buttons */}
            <div className="header-main-row">
              <div className="header-title-block">
                <h1 className="incident-title">Accident Details</h1>
                <p className="incident-subtitle">
                  Case ID: <span className="case-id-highlight">{incident.caseId}</span>
                </p>
              </div>
              <div className="header-actions">
                {incident.status === 'new' && (
                  <button className="btn btn-primary" onClick={handleAcknowledge} disabled={isActing}>
                    <span className="material-symbols-outlined">check_circle</span>
                    Acknowledge
                  </button>
                )}
                {nextStatuses.filter(s => s !== 'closed' && s !== 'acknowledged').map(status => (
                  <button
                    key={status}
                    className="btn btn-outline"
                    onClick={() => handleStatusUpdate(status)}
                    disabled={isActing}
                  >
                    {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
                <button className="btn btn-secondary" onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? (
                    <>
                      <span className="material-symbols-outlined spinning">sync</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">print</span>
                      Generate PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Main Grid */}
          <div className="incident-grid">
            {/* Left Column */}
            <div className="incident-left">
              {/* Location Card */}
              <div className="detail-card glass-panel">
                <h3 className="card-title">Location</h3>
                <div className="map-embed">
                  <MapView
                    center={[incident.coordinates.latitude, incident.coordinates.longitude]}
                    zoom={15}
                    markers={[{
                      id: incident.id,
                      position: [incident.coordinates.latitude, incident.coordinates.longitude],
                      severity: incident.severity === 'high' ? 'critical' :
                                incident.severity === 'moderate' ? 'high' : 'medium' as any,
                      title: incident.caseId,
                      description: incident.location
                    }]}
                    height="280px"
                  />
                </div>
                <div className="location-details">
                  <div className="detail-row">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{incident.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Time of Incident</span>
                    <span className="detail-value">{new Date(incident.time).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <StatusBadge label={incident.status.replace('_', ' ')} severity={
                      incident.status === 'new' ? 'critical' :
                      incident.status === 'acknowledged' ? 'high' : 'medium' as any
                    } />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">AI Confidence</span>
                    <span className={`confidence-badge confidence-${incident.confidence}`}>
                      {incident.confidence.charAt(0).toUpperCase() + incident.confidence.slice(1)}
                    </span>
                  </div>
                  {incident.estimatedInjuries !== undefined && (
                    <div className="detail-row">
                      <span className="detail-label">Estimated Injuries</span>
                      <span className="detail-value">{incident.estimatedInjuries}</span>
                    </div>
                  )}
                  {incident.weather && (
                    <div className="detail-row">
                      <span className="detail-label">Weather</span>
                      <span className="detail-value">
                        {incident.weather.condition}, {incident.weather.temperature}°C — visibility {incident.weather.visibility}
                      </span>
                    </div>
                  )}
                  {incident.traffic && (
                    <div className="detail-row">
                      <span className="detail-label">Traffic</span>
                      <span className="detail-value">{incident.traffic}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary + Agency Grid */}
              <div className="summary-grid">
                <div className="detail-card glass-panel">
                  <h3 className="card-title">Event Summary</h3>
                  <p className="summary-text">{incident.aiSummary}</p>
                </div>

                <div className="detail-card glass-panel">
                  <h3 className="card-title">Agency Specific Info</h3>
                  {incident.agencySpecificInfo ? (
                    <p className="summary-text">{incident.agencySpecificInfo}</p>
                  ) : (
                    <p className="empty-text">No agency-specific information available.</p>
                  )}
                </div>
              </div>

              {/* Evidence Photos — only shown when photos exist */}
              {incident.photos.length > 0 && (
                <div className="detail-card glass-panel">
                  <h3 className="card-title">
                    <span className="material-symbols-outlined">camera_alt</span>
                    Accident Evidence Photos
                  </h3>
                  <div className="image-gallery">
                    {incident.photos.slice(0, 3).map((photo, idx) => (
                      <div key={photo.id} className="gallery-item">
                        <img src={photo.uri} alt={`Evidence ${idx + 1}`} className="gallery-image" />
                        <div className="gallery-overlay">
                          <span className="material-symbols-outlined">zoom_in</span>
                        </div>
                      </div>
                    ))}
                    {incident.photos.length > 3 && (
                      <div className="gallery-more">
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                        <p>+{incident.photos.length - 3} more</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="incident-right">
              {/* Action Log */}
              <div className="detail-card glass-panel">
                <h3 className="card-title">Action Log</h3>
                <div className="action-log">
                  {incident.actionLog.length === 0 && (
                    <p className="empty-text">No actions recorded yet.</p>
                  )}
                  {incident.actionLog.map((log, idx) => (
                    <div key={idx} className="log-entry">
                      <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="log-user">{log.user}</span>
                      <span className="log-action">{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatched Units */}
              <div className="detail-card glass-panel">
                <h3 className="card-title">
                  <span className="material-symbols-outlined">local_shipping</span>
                  Dispatched Units
                </h3>
                {incident.dispatchedUnits.length === 0 ? (
                  <p className="empty-text">No units dispatched yet.</p>
                ) : (
                  <div className="units-list">
                    {incident.dispatchedUnits.map(unit => (
                      <div key={unit.id} className="unit-item">
                        <div className="unit-header">
                          <span className="unit-name">{unit.name}</span>
                          <span className={`unit-status unit-status-${unit.status}`}>
                            {UNIT_STATUS_LABEL[unit.status] ?? unit.status}
                          </span>
                        </div>
                        <span className="unit-agency">{unit.agency}</span>
                        <span className="unit-time">
                          Dispatched {new Date(unit.dispatchedAt).toLocaleTimeString()}
                          {unit.onSceneAt && ` · On scene ${new Date(unit.onSceneAt).toLocaleTimeString()}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Collaboration Log */}
              <div className="detail-card glass-panel">
                <h3 className="card-title">
                  <span className="material-symbols-outlined">forum</span>
                  Inter-Agency Messages
                </h3>
                {incident.collaborationLog.length === 0 ? (
                  <p className="empty-text">No messages yet.</p>
                ) : (
                  <div className="collab-log">
                    {incident.collaborationLog.map(msg => (
                      <div key={msg.id} className="collab-message">
                        <div className="collab-meta">
                          <span className="collab-user">{msg.user}</span>
                          <span className="collab-agency">{msg.agency}</span>
                          <span className="collab-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="collab-text">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IncidentDetails;
