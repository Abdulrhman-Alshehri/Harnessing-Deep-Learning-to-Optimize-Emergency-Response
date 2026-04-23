import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import CctvFeed from '../../components/common/CctvFeed';
import './CamerasScreen.css';

interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
}

const DEFAULT_CAMERAS: Camera[] = [
  { id: 'CAM-001', name: 'Camera 01', location: 'Al-Madinah Road — North Junction', status: 'online' },
  { id: 'CAM-002', name: 'Camera 02', location: 'King Fahd Road — Central', status: 'online' },
  { id: 'CAM-003', name: 'Camera 03', location: 'Northern Ring Road — Exit 7', status: 'online' },
  { id: 'CAM-004', name: 'Camera 04', location: 'Eastern Ring Road — Km 14', status: 'online' },
  { id: 'CAM-005', name: 'Camera 05', location: 'Highway 65 — South Gate', status: 'online' },
  { id: 'CAM-006', name: 'Camera 06', location: 'Al-Uruba Road — Intersection', status: 'online' },
];

const CamerasScreen: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });
  const [formError, setFormError] = useState('');

  const expandedCamera = cameras.find(c => c.id === expanded);
  const onlineCameras = cameras.filter(c => c.status === 'online');
  const offlineCameras = cameras.filter(c => c.status === 'offline');

  const handleAddCamera = () => {
    setFormError('');
    if (!form.name.trim() || !form.location.trim()) {
      setFormError('All fields are required.');
      return;
    }
    const nextNum = cameras.length + 1;
    setCameras(prev => [...prev, {
      id: `CAM-${String(nextNum).padStart(3, '0')}`,
      name: form.name.trim(),
      location: form.location.trim(),
      status: 'online',
    }]);
    setForm({ name: '', location: '' });
    setShowModal(false);
  };

  const handleRemoveCamera = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    if (expanded === id) setExpanded(null);
  };

  return (
    <div className="cameras-layout">
      <Sidebar userRole="responder" />

      <main className="cameras-main">
        <header className="cameras-header">
          <div>
            <h1 className="cameras-title">Live Camera Feeds</h1>
            <p className="cameras-subtitle">Real-time CCTV monitoring — {onlineCameras.length} cameras online</p>
          </div>
          <div className="cameras-header-right">
            <span className="cam-stat online">
              <span className="status-dot" />
              {onlineCameras.length} Online
            </span>
            <span className="cam-stat offline">
              <span className="status-dot offline-dot" />
              {offlineCameras.length} Offline
            </span>
            <button className="add-camera-btn" onClick={() => setShowModal(true)}>
              <span className="material-symbols-outlined">add</span>
              Add Camera
            </button>
          </div>
        </header>

        {/* Add Camera Modal */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-box glass-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Add Camera</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Camera Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Camera 07"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. King Abdullah Road — Exit 3"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  />
                </div>
                {formError && <p className="form-error">{formError}</p>}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-confirm" onClick={handleAddCamera}>
                  <span className="material-symbols-outlined">videocam</span>
                  Add Camera
                </button>
              </div>
            </div>
          </div>
        )}

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
              <CctvFeed
                cameraId={expandedCamera.id}
                location={expandedCamera.location}
                status={expandedCamera.status}
              />
            </div>
          </div>
        )}

        {/* Camera grid */}
        <div className={`cameras-grid ${expanded ? 'cameras-grid-mini' : ''}`}>
          {cameras.map(camera => (
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
                <div className="card-actions">
                  <button
                    className="expand-btn"
                    onClick={() => setExpanded(expanded === camera.id ? null : camera.id)}
                    title="Expand"
                  >
                    <span className="material-symbols-outlined">
                      {expanded === camera.id ? 'close_fullscreen' : 'open_in_full'}
                    </span>
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveCamera(camera.id)}
                    title="Remove camera"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>

              <div className="camera-embed">
                <CctvFeed
                  cameraId={camera.id}
                  location={camera.location}
                  status={camera.status}
                />
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
