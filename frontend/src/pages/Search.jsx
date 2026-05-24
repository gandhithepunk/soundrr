import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Search.css';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export default function Search() {
  const { API } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('artist');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState({});
  const [requested, setRequested] = useState({});
  const [error, setError] = useState('');

  const search = useCallback(debounce(async (q, t) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/lidarr/${t}`, { params: { q } });
      setResults(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed — is Lidarr configured?');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 500), [API]);

  const handleInput = (e) => {
    setQuery(e.target.value);
    search(e.target.value, type);
  };

  const handleTypeChange = (t) => {
    setType(t);
    if (query) search(query, t);
  };

  const request = async (item) => {
    const key = item.foreignArtistId || item.foreignAlbumId;
    setRequesting(r => ({ ...r, [key]: true }));
    try {
      const payload = type === 'artist' ? {
        type: 'artist',
        artist_name: item.artistName,
        artist_mbid: item.foreignArtistId,
        cover_url: item.images?.find(i => i.coverType === 'cover')?.url || item.images?.[0]?.url,
        lidarr_data: item,
      } : {
        type: 'album',
        artist_name: item.artist?.artistName || 'Unknown Artist',
        album_name: item.title,
        artist_mbid: item.artist?.foreignArtistId,
        album_mbid: item.foreignAlbumId,
        cover_url: item.images?.find(i => i.coverType === 'cover')?.url || item.images?.[0]?.url,
        lidarr_data: item,
      };
      await axios.post(`${API}/requests`, payload);
      setRequested(r => ({ ...r, [key]: true }));
    } catch (err) {
      const msg = err.response?.data?.error || 'Request failed';
      alert(msg);
    } finally {
      setRequesting(r => ({ ...r, [key]: false }));
    }
  };

  return (
    <div className="search-page fade-in">
      <h2 className="page-title">Search Music</h2>
      <p className="page-sub">Find artists or albums to add to your collection</p>

      <div className="search-bar-row">
        <div className="type-toggle">
          <button className={type === 'artist' ? 'active' : ''} onClick={() => handleTypeChange('artist')}>Artists</button>
          <button className={type === 'album' ? 'active' : ''} onClick={() => handleTypeChange('album')}>Albums</button>
        </div>
        <div className="search-input-wrap">
          <span className="search-icon">⊕</span>
          <input
            className="input search-input"
            placeholder={`Search for ${type}s…`}
            value={query}
            onChange={handleInput}
            autoFocus
          />
          {loading && <div className="spinner search-spinner" />}
        </div>
      </div>

      {error && <div className="search-error">{error}</div>}

      {results.length > 0 && (
        <div className="results-grid">
          {results.map(item => {
            const key = item.foreignArtistId || item.foreignAlbumId;
            const name = item.artistName || item.title;
            const sub = type === 'album' ? item.artist?.artistName : item.genres?.join(', ');
            const cover = item.images?.find(i => i.coverType === 'cover')?.url || item.images?.[0]?.url;
            const year = item.releaseDate?.split('-')?.[0];
            const isRequested = requested[key];
            const isRequesting = requesting[key];

            return (
              <div key={key} className="result-card">
                <div className="result-cover">
                  {cover ? <img src={cover} alt={name} /> : <div className="result-cover-placeholder">♪</div>}
                  {year && <div className="result-year">{year}</div>}
                </div>
                <div className="result-info">
                  <div className="result-name">{name}</div>
                  {sub && <div className="result-sub">{sub}</div>}
                  {item.statistics && (
                    <div className="result-stats">
                      {item.statistics.albumCount} albums · {item.statistics.trackCount || '?'} tracks
                    </div>
                  )}
                </div>
                <button
                  className={`result-btn ${isRequested ? 'done' : ''}`}
                  onClick={() => !isRequested && request(item)}
                  disabled={isRequesting || isRequested}
                >
                  {isRequested ? '✓ Requested' : isRequesting ? <span className="spinner" /> : '+ Request'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && results.length === 0 && query && !error && (
        <div className="no-results">
          <span>⊘</span>
          <p>No results for "{query}"</p>
        </div>
      )}

      {!query && (
        <div className="search-empty">
          <div className="search-empty-icon">♫</div>
          <h3>Search for music</h3>
          <p>Type an artist name or album title to get started</p>
        </div>
      )}
    </div>
  );
}
