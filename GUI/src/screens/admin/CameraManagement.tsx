import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import Sidebar from '../../components/common/Sidebar';
import { Camera } from '../../types/camera';
import './CameraManagement.css';

// YouTube video IDs mapped to each Supabase camera
const CAM_VIDEO_IDS: Record<string, string> = {
  'CAM-001-RUH': 'butK9aqBY1E',
  'CAM-002-RUH': 'x396CVeU74Q',
  'CAM-003-RUH': 'IVa59mpPJTg',
  'CAM-004-RUH': 'Sd9ZD8Vt8tQ',
  'CAM-005-RUH': 'KpZ8vteYNOw',
};

const EMBED = (id: string) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${id}`;

const CameraManagement: React.FC = () => {
  const { cameras, isLoadingCameras } = useSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [_showAddModal, setShowAddModal] = useState(false);
  const [expandedCamera, setExpandedCamera] = useState<Camera | null>(null);

  const filteredCameras = cameras.filter(camera =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCameras = cameras.filter(c => c.status === 'online').length;
  const offlineCameras = cameras.filter(c => c.status === 'offline').length;

  return (
    <div className="camera-management-layout">
      <Sidebar userRole="admin" />
      
      <main className="camera-management-main">
        <div className="camera-container">
          {/* Header */}
          <header className="camera-header">
            <div>
              <h1>Camera Management</h1>
              <p>Monitor and configure surveillance infrastructure</p>
            </div>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>
              <span className="material-symbols-outlined">add</span>
              <span>Add Camera</span>
            </button>
          </header>

          {/* Stats */}
          <div className="camera-stats">
            <div className="stat-card-small">
              <span className="material-symbols-outlined stat-icon-large success">videocam</span>
              <div className="stat-content">
                <p className="stat-value-small">{onlineCameras}</p>
                <p className="stat-label-small">Online Cameras</p>
              </div>
            </div>
            <div className="stat-card-small">
              <span className="material-symbols-outlined stat-icon-large warning">videocam_off</span>
              <div className="stat-content">
                <p className="stat-value-small">{offlineCameras}</p>
                <p className="stat-label-small">Offline Cameras</p>
              </div>
            </div>
            <div className="stat-card-small">
              <span className="material-symbols-outlined stat-icon-large">grid_view</span>
              <div className="stat-content">
                <p className="stat-value-small">{cameras.length}</p>
                <p className="stat-label-small">Total Cameras</p>
              </div>
            </div>
          </div>

          {/* Camera List Card */}
          <div className="camera-list-card">
            <div className="list-header">
              <h2>Active Cameras</h2>
              <div className="search-box-small">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Search cameras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Camera Grid */}
            <div className="camera-grid">
              {isLoadingCameras ? (
                <div className="loading-container" style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem',
                  gap: '1rem'
                }}>
                  <div className="loading-spinner" style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(158, 238, 43, 0.2)',
                    borderTop: '4px solid #9dee2b',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ color: '#a8a8a8' }}>Loading camera feeds...</p>
                </div>
              ) : filteredCameras.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#a8a8a8'
                }}>
                  No cameras found
                </div>
              ) : (
                filteredCameras.map((camera) => (
                <div key={camera.id} className="camera-item">
                  <div className="camera-item-header">
                    <span className="material-symbols-outlined filled">videocam</span>
                    <span className={`camera-status ${camera.status}`}>
                      {camera.status}
                    </span>
                  </div>

                  {/* Live Feed Preview */}
                  <div
                    className="camera-preview-container"
                    onClick={() => setExpandedCamera(expandedCamera?.id === camera.id ? null : camera)}
                    title="Click to expand"
                  >
                    {camera.status === 'online' && CAM_VIDEO_IDS[camera.id] ? (
                      <iframe
                        className="camera-preview-video"
                        src={EMBED(CAM_VIDEO_IDS[camera.id])}
                        loading="lazy"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    ) : camera.status === 'online' ? (
                      <div className="camera-preview-placeholder">
                        <span className="material-symbols-outlined">live_tv</span>
                        <span className="preview-text">Live Stream</span>
                      </div>
                    ) : (
                      <div className="camera-preview-placeholder offline">
                        <span className="material-symbols-outlined">videocam_off</span>
                        <span className="preview-text">Offline</span>
                      </div>
                    )}
                  </div>

                  <div className="camera-item-body">
                    <h3 className="camera-name">{camera.name}</h3>
                    <p className="camera-location">
                      <span className="material-symbols-outlined">location_on</span>
                      <span>{camera.location}</span>
                    </p>
                    <p className="camera-id">ID: {camera.id}</p>

                    <div className="camera-actions">
                      <button
                        className="btn-icon"
                        onClick={() => setExpandedCamera(expandedCamera?.id === camera.id ? null : camera)}
                        title="Expand Feed"
                      >
                        <span className="material-symbols-outlined">
                          {expandedCamera?.id === camera.id ? 'close_fullscreen' : 'fullscreen'}
                        </span>
                      </button>
                      <button className="btn-icon" title="Edit Camera">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="btn-icon delete" title="Delete Camera">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Expanded CCTV Feed Modal */}
      {expandedCamera && (
        <div className="cctv-modal-backdrop" onClick={() => setExpandedCamera(null)}>
          <div className="cctv-modal-box" onClick={e => e.stopPropagation()}>
            <div className="cctv-modal-header">
              <div>
                <span className="cctv-modal-id">{expandedCamera.id}</span>
                <h2 className="cctv-modal-name">{expandedCamera.name}</h2>
                <p className="cctv-modal-location">{expandedCamera.location}</p>
              </div>
              <button className="cctv-modal-close" onClick={() => setExpandedCamera(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="cctv-modal-feed">
              {CAM_VIDEO_IDS[expandedCamera.id] ? (
                <iframe
                  src={EMBED(CAM_VIDEO_IDS[expandedCamera.id])}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ position: 'absolute', top: '-10%', left: '-2px', width: 'calc(100% + 4px)', height: '120%', border: 'none' }}
                />
              ) : (
                <div className="camera-preview-placeholder" style={{ position: 'absolute', inset: 0 }}>
                  <span className="material-symbols-outlined">live_tv</span>
                  <span className="preview-text">No stream available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraManagement;
