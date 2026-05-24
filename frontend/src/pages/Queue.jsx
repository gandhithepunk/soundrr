import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Queue.css';

export default function Queue() {
  const { API } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = async () => {
    try {
      const { data } = await axios.get(`${API}/lidarr/queue`);
      setQueue(data?.records || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load queue — is Lidarr configured?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [API]);

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    return `${(bytes / 1e6).toFixed(0)} MB`;
  };

  const getProgress = (item) => {
    if (!item.size) return 0;
    return Math.round(((item.size - (item.sizeleft || 0)) / item.size) * 100);
  };

  return (
    <div className="queue-page fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Download Queue</h2>
          <p className="page-sub">{queue.length} items · auto-refreshes every 15s</p>
        </div>
        <button className="btn-secondary" onClick={fetchQueue}>↻ Refresh</button>
      </div>

      {error && <div className="search-error">{error}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : queue.length === 0 ? (
        <div className="empty-state"><span>↓</span><p>Nothing in the download queue</p></div>
      ) : (
        <div className="queue-full-list">
          {queue.map((item, i) => {
            const progress = getProgress(item);
            return (
              <div key={i} className="queue-full-item">
                <div className="qf-main">
                  <div className="qf-title">{item.title}</div>
                  <div className="qf-artist">{item.artist?.artistName}</div>
                  <div className="qf-meta">
                    <span className="qf-protocol">{item.protocol}</span>
                    <span className="qf-size">{formatSize(item.size)}</span>
                    {item.indexer && <span className="qf-indexer">{item.indexer}</span>}
                  </div>
                </div>
                <div className="qf-right">
                  <div className="qf-status-text">{item.status}</div>
                  <div className="qf-progress-wrap">
                    <div className="qf-progress-bar">
                      <div className="qf-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="qf-pct">{progress}%</span>
                  </div>
                  {item.timeleft && <div className="qf-eta">{item.timeleft} remaining</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
