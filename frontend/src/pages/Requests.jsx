import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Requests.css';

export default function Requests() {
  const { API, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(`${API}/requests`);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [API]);

  const approve = async (id, item) => {
    try {
      await axios.patch(`${API}/requests/${id}/approve`, { lidarr_data: item._lidarr_data });
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error || 'Failed to approve'); }
  };

  const reject = async (id) => {
    if (!window.confirm('Reject this request?')) return;
    await axios.patch(`${API}/requests/${id}/reject`);
    fetchRequests();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    await axios.delete(`${API}/requests/${id}`);
    fetchRequests();
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="requests-page fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">{user?.role === 'admin' ? 'All Requests' : 'My Requests'}</h2>
          <p className="page-sub">{requests.length} total requests</p>
        </div>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="filter-count">
              {f === 'all' ? requests.length : requests.filter(r => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><span>♫</span><p>No requests found</p></div>
      ) : (
        <div className="requests-list">
          {filtered.map(req => (
            <div key={req.id} className="request-item">
              {req.cover_url
                ? <img src={req.cover_url} alt="" className="req-cover" />
                : <div className="req-cover placeholder">♪</div>
              }
              <div className="req-info">
                <div className="req-title">{req.album_name || req.artist_name}</div>
                {req.album_name && <div className="req-sub">{req.artist_name}</div>}
                <div className="req-meta">
                  <span className={`badge badge-${req.type === 'artist' ? 'available' : 'approved'}`}>{req.type}</span>
                  {req.username && <span className="req-user">by {req.username}</span>}
                  <span className="req-date">{new Date(req.requested_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="req-actions">
                <span className={`badge badge-${req.status}`}>{req.status}</span>
                {user?.role === 'admin' && req.status === 'pending' && (
                  <>
                    <button className="btn-approve" onClick={() => approve(req.id, req)}>Approve</button>
                    <button className="btn-reject" onClick={() => reject(req.id)}>Reject</button>
                  </>
                )}
                {user?.role === 'admin' && (
                  <button className="btn-delete" onClick={() => remove(req.id)} title="Delete">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
