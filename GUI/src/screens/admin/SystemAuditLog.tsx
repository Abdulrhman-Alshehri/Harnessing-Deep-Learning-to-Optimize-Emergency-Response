import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import './SystemAuditLog.css';

interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  ipAddress: string;
}

const SystemAuditLog: React.FC = () => {
  const [searchQuery] = useState('');

  // Mock audit data
  const auditEntries: AuditEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      user: 'admin@system.gov',
      action: 'Created new camera: CAM-042',
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      user: 'admin@system.gov',
      action: 'Updated user permissions for responder@hospital.gov',
      ipAddress: '192.168.1.100'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      user: 'system',
      action: 'System backup completed successfully',
      ipAddress: '127.0.0.1'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      user: 'admin@system.gov',
      action: 'Deleted camera: CAM-021',
      ipAddress: '192.168.1.100'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      user: 'responder@hospital.gov',
      action: 'Acknowledged incident ER-20240521-0012',
      ipAddress: '192.168.1.105'
    }
  ];

  const filteredEntries = auditEntries.filter(entry =>
    entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="audit-layout">
      <Sidebar userRole="admin" />
      
      <main className="audit-main">
        <div className="audit-container">
          {/* Header */}
          <header className="audit-header">
            <div>
              <h1>System Audit Log</h1>
              <p>Complete chronological record of system activities</p>
            </div>
            <button className="btn-export">
              <span className="material-symbols-outlined">download</span>
              <span>Export Log</span>
            </button>
          </header>

          {/* Filters */}
          <div className="audit-filters">
            <select className="filter-select">
              <option>Date Range</option>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
            <select className="filter-select">
              <option>By User</option>
              <option>admin@system.gov</option>
              <option>responder@hospital.gov</option>
              <option>system</option>
            </select>
            <select className="filter-select">
              <option>Action Type</option>
              <option>Camera Actions</option>
              <option>User Actions</option>
              <option>System Actions</option>
            </select>
          </div>

          {/* Audit Log */}
          <div className="audit-log-container">
            <div className="audit-log">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="log-item">
                  <div className="timestamp-cell">
                    {entry.timestamp.toLocaleString()}
                  </div>
                  <div className="user-cell">
                    <span className="material-symbols-outlined user-icon">person</span>
                    <span>{entry.user}</span>
                  </div>
                  <div className="action-cell">
                    {entry.action}
                  </div>
                  <div className="ip-cell">
                    {entry.ipAddress}
                  </div>
                </div>
              ))}
            </div>

            {filteredEntries.length === 0 && (
              <div className="empty-audit">
                <span className="material-symbols-outlined">history</span>
                <p>No audit entries found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemAuditLog;
