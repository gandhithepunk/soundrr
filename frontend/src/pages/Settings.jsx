import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

export default function Settings() {
  const { API } = useAuth();
  const [settings, setSettings] = useState({
    lidarr_url: '', lidarr_api_key: '',
    plex_url: '', plex_token: '',
    auto_approve: 'false', allow_registration: 'true',
    app_name: 'Soundrr',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState({});
  const [testResult, setTestResult] = useState({});

  useEffect(() => {
    axios.get(`${API}/settings`).then(r => setSettings(s => ({ ...s, ...r.data }))).finally(() => setLoading(false));
  }, [API]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/settings`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const test = async (service) => {
    setTesting(t => ({ ...t, [service]: true }));
    setTestResult(r => ({ ...r, [service]: null }));
    try {
      let res;
      if (service === 'lidarr') {
        res = await axios.post(`${API}/settings/test/lidarr`, { url: settings.lidarr_url, api_key: settings.lidarr_api_key });
        setTestResult(r => ({ ...r, lidarr: { ok: true, msg: `Connected! Lidarr v${res.data.version}` } }));
      } else {
        res = await axios.post(`${API}/settings/test/plex`, { url: settings.plex_url, token: settings.plex_token });
        setTestResult(r => ({ ...r, plex: { ok: true, msg: `Connected! Server: ${res.data.friendlyName}` } }));
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Connection failed';
      setTestResult(r => ({ ...r, [service]: { ok: false, msg } }));
    } finally {
      setTesting(t => ({ ...t, [service]: false }));
    }
  };

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-sub">Configure your Soundrr instance</p>
        </div>
        <button className={`btn-primary ${saved ? 'saved' : ''}`} onClick={save} disabled={saving}>
          {saving ? <span className="spinner" /> : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>

      <div className="settings-sections">
        <section className="card settings-card">
          <h3>⚙ General</h3>
          <div className="field-group">
            <label>App Name</label>
            <input className="input" value={settings.app_name} onChange={e => set('app_name', e.target.value)} />
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Auto-approve requests</div>
              <div className="toggle-sub">Automatically send approved requests to Lidarr</div>
            </div>
            <button className={`toggle ${settings.auto_approve === 'true' ? 'on' : ''}`}
              onClick={() => set('auto_approve', settings.auto_approve === 'true' ? 'false' : 'true')}>
              <span />
            </button>
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Allow registration</div>
              <div className="toggle-sub">Let new users create accounts</div>
            </div>
            <button className={`toggle ${settings.allow_registration !== 'false' ? 'on' : ''}`}
              onClick={() => set('allow_registration', settings.allow_registration === 'false' ? 'true' : 'false')}>
              <span />
            </button>
          </div>
        </section>

        <section className="card settings-card">
          <h3>🎵 Lidarr</h3>
          <div className="field-group">
            <label>Lidarr URL</label>
            <input className="input" placeholder="http://192.168.1.100:8686" value={settings.lidarr_url}
              onChange={e => set('lidarr_url', e.target.value)} />
          </div>
          <div className="field-group">
            <label>API Key</label>
            <input className="input" type="password" placeholder="Your Lidarr API key" value={settings.lidarr_api_key}
              onChange={e => set('lidarr_api_key', e.target.value)} />
            <div className="field-hint">Found in Lidarr → Settings → General → Security</div>
          </div>
          <div className="test-row">
            <button className="btn-secondary" onClick={() => test('lidarr')} disabled={testing.lidarr}>
              {testing.lidarr ? <><span className="spinner" /> Testing…</> : 'Test Connection'}
            </button>
            {testResult.lidarr && (
              <span className={`test-result ${testResult.lidarr.ok ? 'ok' : 'fail'}`}>
                {testResult.lidarr.ok ? '✓' : '✕'} {testResult.lidarr.msg}
              </span>
            )}
          </div>
        </section>

        <section className="card settings-card">
          <h3>▶ Plex</h3>
          <div className="field-group">
            <label>Plex URL</label>
            <input className="input" placeholder="http://192.168.1.100:32400" value={settings.plex_url}
              onChange={e => set('plex_url', e.target.value)} />
          </div>
          <div className="field-group">
            <label>Plex Token</label>
            <input className="input" type="password" placeholder="Your Plex token" value={settings.plex_token}
              onChange={e => set('plex_token', e.target.value)} />
            <div className="field-hint">
              Find your token at: plex.tv/sign-in → Account → See XML → X-Plex-Token in URL
            </div>
          </div>
          <div className="test-row">
            <button className="btn-secondary" onClick={() => test('plex')} disabled={testing.plex}>
              {testing.plex ? <><span className="spinner" /> Testing…</> : 'Test Connection'}
            </button>
            {testResult.plex && (
              <span className={`test-result ${testResult.plex.ok ? 'ok' : 'fail'}`}>
                {testResult.plex.ok ? '✓' : '✕'} {testResult.plex.msg}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
