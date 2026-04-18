import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import Sidebar from '../../components/common/Sidebar';
import VideoModal from '../../components/common/VideoModal';
import { Camera } from '../../types/camera';
import './CameraManagement.css';

const CameraManagement: React.FC = () => {
  const { cameras, isLoadingCameras } = useSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [_showAddModal, setShowAddModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Real-time API simulator: Force the browser to grab the latest 10-second traffic clip 
  // from the DOT servers every 5 minutes by updating a cache-busting timestamp
  const [videoTimestamp, setVideoTimestamp] = useState(Date.now());

  useEffect(() => {
    // Refresh the DOT video feeds every 5 minutes (300000ms)
    // Traffic cameras typically record a new clip every 5 minutes
    const interval = setInterval(() => {
      setVideoTimestamp(Date.now());
      console.log('Fetching latest live traffic clips from DOT servers...');
    }, 300000); 
    
    return () => clearInterval(interval);
  }, []);

  const handleViewCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setShowVideoModal(true);
  };

  const handleCloseVideo = () => {
    setShowVideoModal(false);
    setSelectedCamera(null);
  };

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

                  {/* Live Video Preview */}
                  <div 
                    className="camera-preview-container"
                    onClick={() => handleViewCamera(camera)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view full screen"
                  >
                    {camera.status === 'online' && camera.videoUrl ? (
                      // Check if it's an embeddable URL (YouTube, Skyline Webcams, or Google Drive)
                      (camera.videoUrl.includes('youtube.com/embed') || 
                       camera.videoUrl.includes('youtu.be') ||
                       camera.videoUrl.includes('skylinewebcams.com') ||
                       (camera.videoUrl.includes('drive.google.com') && camera.videoUrl.includes('/preview'))) ? (
                        <iframe
                          className="camera-preview-video"
                          src={camera.videoUrl}
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                        />
                      ) : (
                        <video 
                          key={`${camera.id}-${videoTimestamp}`}
                          className="camera-preview-video"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          src={`${camera.videoUrl}?t=${videoTimestamp}`}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      )
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
                    {camera.status === 'online' && (
                      <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span>LIVE</span>
                      </div>
                    )}
                    <div className="preview-overlay">
                      <span className="material-symbols-outlined">fullscreen</span>
                    </div>
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
                        onClick={() => handleViewCamera(camera)}
                        title="View Full Screen"
                      >
                        <span className="material-symbols-outlined">fullscreen</span>
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

      {/* Video Modal */}
      {selectedCamera && (
        <VideoModal
          isOpen={showVideoModal}
          onClose={handleCloseVideo}
          cameraName={selectedCamera.name}
          cameraId={selectedCamera.id}
          videoUrl={selectedCamera.videoUrl}
          status={selectedCamera.status}
        />
      )}
    </div>
  );
};

export default CameraManagement;
