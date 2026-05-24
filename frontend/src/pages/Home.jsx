import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API}/requests`),
      axios.get(`${API}/lidarr/queue`),
    ]).then(([r, q]) => {
      if (r.status === 'fulfilled') setRequests(r.value.data || []);
      if (q.status === 'fulfilled') setQueue(q.value.data?.records || []);
    }).finally(() => setLoading(false));
  }, [API]);

  const recent = requests.slice(0, 5);
  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="home fade-in">
      <div className="home-header">
        <div>
          <h2 className="page-title">Welcome back, {user?.username}</h2>
          <p className="page-sub">Your music request dashboard</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/search')}>
          + New Request
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{requests.length}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value warning">{pending}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-value success">{approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value accent">{queue.length}</div>
          <div className="stat-label">Downloading</div>
        </div>
      </div>

      <div className="home-grid">
        <section className="card">
          <div className="section-header">
            <h3>Recent Requests</h3>
            <button className="btn-ghost" onClick={() => navigate('/requests')}>View all →</button>
          </div>
          {loading ? (
            <div className="loading-row"><div className="spinner" /></div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <span>♫</span>
              <p>No requests yet. <button className="link-btn" onClick={() => navigate('/search')}>Search for music</button></p>
            </div>
          ) : (
            <div className="request-list">
              {recent.map(r => (
                <div key={r.id} className="request-row">
                  {r.cover_url && <img src={r.cover_url} alt="" className="request-thumb" />}
                  {!r.cover_url && <div className="request-thumb placeholder">♪</div>}
                  <div className="request-info">
                    <div className="request-name">{r.album_name || r.artist_name}</div>
                    {r.album_name && <div className="request-artist">{r.artist_name}</div>}
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <h3>Download Queue</h3>
            <button className="btn-ghost" onClick={() => navigate('/queue')}>View all →</button>
          </div>
          {loading ? (
            <div className="loading-row"><div className="spinner" /></div>
          ) : queue.length === 0 ? (
            <div className="empty-state">
              <span>↓</span>
              <p>Nothing downloading right now</p>
            </div>
          ) : (
            <div className="queue-list">
              {queue.slice(0, 5).map((item, i) => (
                <div key={i} className="queue-row">
                  <div className="queue-info">
                    <div className="queue-title">{item.title}</div>
                    <div className="queue-artist">{item.artist?.artistName}</div>
                  </div>
                  <div className="queue-right">
                    {item.size > 0 && (
                      <div className="queue-progress-bar">
                        <div className="queue-progress-fill"
                          style={{ width: `${Math.round(((item.size - (item.sizeleft || 0)) / item.size) * 100)}%` }} />
                      </div>
                    )}
                    <div className="queue-status">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
