import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import Sidebar from '../../components/common/Sidebar';
import CctvFeed from '../../components/common/CctvFeed';
import { Camera } from '../../types/camera';
import './CameraManagement.css';

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

                  {/* CCTV Feed Preview */}
                  <div
                    className="camera-preview-container"
                    onClick={() => setExpandedCamera(expandedCamera?.id === camera.id ? null : camera)}
                    style={{ cursor: 'pointer' }}
                    title="Click to expand"
                  >
                    <CctvFeed
                      cameraId={camera.id}
                      location={camera.location}
                      status={camera.status}
                    />
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
              <CctvFeed
                cameraId={expandedCamera.id}
                location={expandedCamera.location}
                status={expandedCamera.status}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraManagement;
