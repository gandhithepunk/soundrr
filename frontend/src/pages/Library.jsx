import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Library.css';

export default function Library() {
  const { API } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [activeLib, setActiveLib] = useState(null);
  const [recent, setRecent] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('recent');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/plex/libraries`)
      .then(r => {
        setLibraries(r.data);
        if (r.data.length > 0) setActiveLib(r.data[0].key);
      })
      .catch(err => setError(err.response?.data?.error || 'Plex not configured or unreachable'))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    if (!activeLib) return;
    setLoading(true);
    Promise.allSettled([
      axios.get(`${API}/plex/recent`, { params: { section: activeLib, limit: 24 } }),
      axios.get(`${API}/plex/artists`, { params: { section: activeLib } }),
    ]).then(([r, a]) => {
      if (r.status === 'fulfilled') setRecent(r.value.data || []);
      if (a.status === 'fulfilled') setArtists(a.value.data || []);
    }).finally(() => setLoading(false));
  }, [activeLib, API]);

  const getThumb = (item) => {
    if (!item.thumb) return null;
    const plexUrl = localStorage.getItem('plex_url');
    const plexToken = localStorage.getItem('plex_token');
    return plexUrl ? `${plexUrl}${item.thumb}?X-Plex-Token=${plexToken}` : null;
  };

  const items = tab === 'recent' ? recent : artists;

  return (
    <div className="library-page fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Plex Library</h2>
          <p className="page-sub">Your music collection</p>
        </div>
        {libraries.length > 1 && (
          <select className="input library-select" value={activeLib || ''} onChange={e => setActiveLib(e.target.value)}>
            {libraries.map(l => <option key={l.key} value={l.key}>{l.title}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div className="search-error">
          {error} — Go to <a href="/settings" style={{color:'var(--accent)'}}>Settings</a> to configure Plex.
        </div>
      )}

      {!error && (
        <>
          <div className="filter-tabs" style={{marginBottom:20}}>
            <button className={`filter-tab ${tab === 'recent' ? 'active' : ''}`} onClick={() => setTab('recent')}>
              Recently Added
            </button>
            <button className={`filter-tab ${tab === 'artists' ? 'active' : ''}`} onClick={() => setTab('artists')}>
              Artists <span className="filter-count">{artists.length}</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state"><span>▶</span><p>No content found in this library</p></div>
          ) : (
            <div className="library-grid">
              {items.map((item, i) => (
                <div key={i} className="lib-card">
                  <div className="lib-cover">
                    {getThumb(item)
                      ? <img src={getThumb(item)} alt={item.title} loading="lazy" />
                      : <div className="lib-cover-placeholder">♪</div>
                    }
                  </div>
                  <div className="lib-info">
                    <div className="lib-title">{item.title}</div>
                    {item.parentTitle && <div className="lib-sub">{item.parentTitle}</div>}
                    {item.year && <div className="lib-year">{item.year}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
