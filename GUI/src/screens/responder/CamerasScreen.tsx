import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import './CamerasScreen.css';

interface Camera {
  id: string;
  name: string;
  location: string;
  videoId: string;
  status: 'online' | 'offline';
}

const CAMERAS: Camera[] = [
  { id: 'CAM-001', name: 'Camera 01', location: 'Al-Madinah Road — North Junction', videoId: 'butK9aqBY1E', status: 'online' },
  { id: 'CAM-002', name: 'Camera 02', location: 'King Fahd Road — Central', videoId: 'IVa59mpPJTg', status: 'online' },
  { id: 'CAM-003', name: 'Camera 03', location: 'Northern Ring Road — Exit 7', videoId: 'x396CVeU74Q', status: 'online' },
  { id: 'CAM-004', name: 'Camera 04', location: 'Eastern Ring Road — Km 14', videoId: 'Sd9ZD8Vt8tQ', status: 'online' },
  { id: 'CAM-005', name: 'Camera 05', location: 'Highway 65 — South Gate', videoId: 'KpZ8vteYNOw', status: 'online' },
  { id: 'CAM-006', name: 'Camera 06', location: 'Al-Uruba Road — Intersection', videoId: 'OElMxy6wYxY', status: 'online' },
];

const CamerasScreen: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const expandedCamera = CAMERAS.find(c => c.id === expanded);

  return (
    <div className="cameras-layout">
      <Sidebar userRole="responder" />

      <main className="cameras-main">
        <header className="cameras-header">
          <div>
            <h1 className="cameras-title">Live Camera Feeds</h1>
            <p className="cameras-subtitle">Real-time CCTV monitoring — {CAMERAS.filter(c => c.status === 'online').length} cameras online</p>
          </div>
          <div className="cameras-stats">
            <span className="cam-stat online">
              <span className="status-dot" />
              {CAMERAS.filter(c => c.status === 'online').length} Online
            </span>
            <span className="cam-stat offline">
              <span className="status-dot offline-dot" />
              {CAMERAS.filter(c => c.status === 'offline').length} Offline
            </span>
          </div>
        </header>

        {/* Expanded view */}
        {expanded && expandedCamera && (
          <div className="camera-expanded glass-panel">
            <div className="expanded-header">
              <div>
                <span className="cam-id">{expandedCamera.id}</span>
                <h2 className="expanded-name">{expandedCamera.name}</h2>
                <p className="expanded-location">{expandedCamera.location}</p>
              </div>
              <button className="close-btn" onClick={() => setExpanded(null)}>
                <span className="material-symbols-outlined">close_fullscreen</span>
                Close
              </button>
            </div>
            <div className="expanded-embed">
              <iframe
                src={`https://www.youtube.com/embed/${expandedCamera.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${expandedCamera.videoId}&playsinline=1`}
                title={expandedCamera.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Camera grid */}
        <div className={`cameras-grid ${expanded ? 'cameras-grid-mini' : ''}`}>
          {CAMERAS.map(camera => (
            <div
              key={camera.id}
              className={`camera-card glass-panel ${expanded === camera.id ? 'card-active' : ''}`}
            >
              <div className="camera-card-header">
                <div className="camera-meta">
                  <span className="cam-id">{camera.id}</span>
                  <span className={`cam-status-badge ${camera.status}`}>
                    <span className="status-dot" />
                    {camera.status === 'online' ? 'Live' : 'Offline'}
                  </span>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => setExpanded(expanded === camera.id ? null : camera.id)}
                  title="Expand"
                >
                  <span className="material-symbols-outlined">
                    {expanded === camera.id ? 'close_fullscreen' : 'open_in_full'}
                  </span>
                </button>
              </div>

              <div className="camera-embed">
                {camera.status === 'online' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${camera.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${camera.videoId}&playsinline=1`}
                    title={camera.name}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="offline-placeholder">
                    <span className="material-symbols-outlined">videocam_off</span>
                    <p>Feed unavailable</p>
                  </div>
                )}
              </div>

              <div className="camera-card-footer">
                <span className="material-symbols-outlined footer-icon">location_on</span>
                <span className="camera-location">{camera.location}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CamerasScreen;
