import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents } from '../../context/IncidentContext';
import { useNotification } from '../../context/NotificationContext';
import { generateIncidentReport } from '../../services/pdfService';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import MapView from '../../components/common/MapView';
import './IncidentDetails.css';

const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents } = useIncidents();
  const { showSuccess, showError } = useNotification();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const incident = incidents.find(i => i.id === id);

  const handleGeneratePDF = () => {
    if (!incident) return;
    
    setIsGeneratingPDF(true);
    
    try {
      generateIncidentReport(incident);
      showSuccess('PDF report generated successfully!');
    } catch (error) {
      showError('Failed to generate PDF report. Please try again.');
    } finally {
      setTimeout(() => setIsGeneratingPDF(false), 1000);
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

  return (
    <div className="incident-details-layout">
      <Sidebar userRole="responder" />
      
      <main className="incident-details-main">
        <div className="incident-container">
          {/* Header */}
          <header className="incident-header">
            <div>
              <button className="back-button" onClick={() => navigate('/responder/dashboard')}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="incident-title">Accident Details</h1>
              <p className="incident-subtitle">
                Case ID: <span className="case-id-highlight">{incident.caseId}</span>
              </p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
              >
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
                    height="300px"
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
                </div>

                {/* Related Incidents Horizontal Scroll */}
                <div className="related-incidents">
                  <div className="related-incident-card active">
                    <p className="related-id">{incident.caseId}</p>
                    <p className="related-location">{incident.location.split(',')[0]}</p>
                    <p className="related-desc">Multi-vehicle collision.</p>
                    <div className="related-footer">
                      <StatusBadge label={incident.severity} severity={incident.severity as any} />
                      <span className="related-time">2 min ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="summary-grid">
                <div className="detail-card glass-panel">
                  <h3 className="card-title">Event Summary</h3>
                  <p className="summary-text">{incident.aiSummary}</p>
                </div>

                <div className="detail-card glass-panel">
                  <h3 className="card-title">Agency Specific Info</h3>
                  <ul className="agency-list">
                    <li className="agency-item">
                      <span className="material-symbols-outlined agency-icon fire">local_fire_department</span>
                      <div>
                        <span className="agency-label">Fire Dept:</span>
                        <p className="agency-text">Report of smoke from one vehicle. Prepare for potential extrication.</p>
                      </div>
                    </li>
                    <li className="agency-item">
                      <span className="material-symbols-outlined agency-icon police">local_police</span>
                      <div>
                        <span className="agency-label">Police:</span>
                        <p className="agency-text">Road requires immediate traffic control. Multiple lanes blocked.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Accident Evidence Photos */}
              <div className="detail-card glass-panel">
                <h3 className="card-title">
                  <span className="material-symbols-outlined">camera_alt</span>
                  Accident Evidence Photos
                </h3>
                <div className="image-gallery">
                  {incident.photos.slice(0, 3).map((photo, idx) => (
                    <div key={photo.id} className="gallery-item">
                      <img src={photo.uri} alt={`Accident evidence ${idx + 1}`} className="gallery-image" />
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
            </div>

            {/* Right Column - Action Log */}
            <div className="incident-right">
              <div className="detail-card glass-panel action-log-card">
                <h3 className="card-title">Action Log</h3>
                <div className="action-log">
                  {incident.actionLog.map((log, idx) => (
                    <div key={idx} className="log-entry">
                      <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="log-action">{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IncidentDetails;
