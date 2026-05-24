const axios = require('axios');
const { getDb } = require('../db/database');

function getPlexConfig() {
  const db = getDb();
  const url = db.prepare("SELECT value FROM settings WHERE key = 'plex_url'").get()?.value;
  const token = db.prepare("SELECT value FROM settings WHERE key = 'plex_token'").get()?.value;
  if (!url || !token) throw new Error('Plex not configured');
  return { url: url.replace(/\/$/, ''), token };
}

async function getMusicLibraries() {
  const config = getPlexConfig();
  const { data } = await axios.get(`${config.url}/library/sections`, {
    headers: { 'X-Plex-Token': config.token, Accept: 'application/json' },
    timeout: 8000,
  });
  const sections = data?.MediaContainer?.Directory || [];
  return sections.filter(s => s.type === 'artist');
}

async function getArtists(sectionKey) {
  const config = getPlexConfig();
  const { data } = await axios.get(`${config.url}/library/sections/${sectionKey}/all`, {
    headers: { 'X-Plex-Token': config.token, Accept: 'application/json' },
    params: { type: 8 },
    timeout: 10000,
  });
  return data?.MediaContainer?.Metadata || [];
}

async function getRecentlyAdded(sectionKey, limit = 20) {
  const config = getPlexConfig();
  const { data } = await axios.get(`${config.url}/library/sections/${sectionKey}/recentlyAdded`, {
    headers: { 'X-Plex-Token': config.token, Accept: 'application/json' },
    params: { limit },
    timeout: 10000,
  });
  return data?.MediaContainer?.Metadata || [];
}

async function searchPlex(query) {
  const config = getPlexConfig();
  const { data } = await axios.get(`${config.url}/search`, {
    headers: { 'X-Plex-Token': config.token, Accept: 'application/json' },
    params: { query, limit: 20 },
    timeout: 8000,
  });
  const results = data?.MediaContainer?.Metadata || [];
  return results.filter(r => ['artist', 'album', 'track'].includes(r.type));
}

async function getThumbUrl(thumbPath) {
  const config = getPlexConfig();
  return `${config.url}${thumbPath}?X-Plex-Token=${config.token}`;
}

async function testConnection(url, token) {
  const { data } = await axios.get(`${url.replace(/\/$/, '')}/identity`, {
    headers: { 'X-Plex-Token': token, Accept: 'application/json' },
    timeout: 5000,
  });
  return data?.MediaContainer;
}

module.exports = { getMusicLibraries, getArtists, getRecentlyAdded, searchPlex, getThumbUrl, testConnection };
