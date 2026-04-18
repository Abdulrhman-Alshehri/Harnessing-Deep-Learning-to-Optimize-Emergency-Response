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

const DEFAULT_CAMERAS: Camera[] = [
  { id: 'CAM-001', name: 'Camera 01', location: 'Al-Madinah Road — North Junction', videoId: 'butK9aqBY1E', status: 'online' },
  { id: 'CAM-002', name: 'Camera 02', location: 'King Fahd Road — Central', videoId: 'IVa59mpPJTg', status: 'online' },
  { id: 'CAM-003', name: 'Camera 03', location: 'Northern Ring Road — Exit 7', videoId: 'x396CVeU74Q', status: 'online' },
  { id: 'CAM-004', name: 'Camera 04', location: 'Eastern Ring Road — Km 14', videoId: 'Sd9ZD8Vt8tQ', status: 'online' },
  { id: 'CAM-005', name: 'Camera 05', location: 'Highway 65 — South Gate', videoId: 'KpZ8vteYNOw', status: 'online' },
  { id: 'CAM-006', name: 'Camera 06', location: 'Al-Uruba Road — Intersection', videoId: 'OElMxy6wYxY', status: 'online' },
];

const extractVideoId = (input: string): string => {
  // Already a bare ID (e.g. "butK9aqBY1E")
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  try {
    const url = new URL(input.trim());
    // youtu.be/ID
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0];
    // youtube.com/live/ID or /embed/ID or /watch?v=ID
    const v = url.searchParams.get('v');
    if (v) return v;
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1].split('?')[0];
  } catch {
    return input.trim();
  }
};

const EMBED_PARAMS = 'autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1';

const CamerasScreen: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', url: '' });
  const [formError, setFormError] = useState('');

  const expandedCamera = cameras.find(c => c.id === expanded);
  const onlineCameras = cameras.filter(c => c.status === 'online');
  const offlineCameras = cameras.filter(c => c.status === 'offline');

  const handleAddCamera = () => {
    setFormError('');
    if (!form.name.trim() || !form.location.trim() || !form.url.trim()) {
      setFormError('All fields are required.');
      return;
    }
    const videoId = extractVideoId(form.url);
    if (!videoId || videoId.length < 5) {
      setFormError('Could not extract a valid YouTube video ID from that URL.');
      return;
    }
    const nextNum = cameras.length + 1;
    const newCam: Camera = {
      id: `CAM-${String(nextNum).padStart(3, '0')}`,
      name: form.name.trim(),
      location: form.location.trim(),
      videoId,
      status: 'online',
    };
    setCameras(prev => [...prev, newCam]);
    setForm({ name: '', location: '', url: '' });
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
                <div className="form-group">
                  <label className="form-label">YouTube Live URL or Video ID</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="https://www.youtube.com/live/... or video ID"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
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
              <iframe
                src={`https://www.youtube.com/embed/${expandedCamera.videoId}?${EMBED_PARAMS}&loop=1&playlist=${expandedCamera.videoId}`}
                title={expandedCamera.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
                {camera.status === 'online' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${camera.videoId}?${EMBED_PARAMS}&loop=1&playlist=${camera.videoId}`}
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
