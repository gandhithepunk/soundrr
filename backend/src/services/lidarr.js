const axios = require('axios');
const { getDb } = require('../db/database');

function getLidarrConfig() {
  const db = getDb();
  const url = db.prepare("SELECT value FROM settings WHERE key = 'lidarr_url'").get()?.value;
  const key = db.prepare("SELECT value FROM settings WHERE key = 'lidarr_api_key'").get()?.value;
  if (!url || !key) throw new Error('Lidarr not configured');
  return { url: url.replace(/\/$/, ''), key };
}

function lidarrApi(config) {
  return axios.create({
    baseURL: `${config.url}/api/v1`,
    headers: { 'X-Api-Key': config.key },
    timeout: 10000,
  });
}

async function searchArtist(query) {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/artist/lookup', { params: { term: query } });
  return data;
}

async function searchAlbum(query) {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/album/lookup', { params: { term: query } });
  return data;
}

async function addArtist(artistData, qualityProfileId, rootFolderPath, metadataProfileId) {
  const config = getLidarrConfig();
  const api = lidarrApi(config);

  // Get quality profiles if not provided
  if (!qualityProfileId) {
    const { data: profiles } = await api.get('/qualityprofile');
    qualityProfileId = profiles[0]?.id || 1;
  }
  if (!rootFolderPath) {
    const { data: folders } = await api.get('/rootfolder');
    rootFolderPath = folders[0]?.path || '/music';
  }
  if (!metadataProfileId) {
    const { data: profiles } = await api.get('/metadataprofile');
    metadataProfileId = profiles[0]?.id || 1;
  }

  const payload = {
    artistName: artistData.artistName,
    foreignArtistId: artistData.foreignArtistId,
    qualityProfileId,
    metadataProfileId,
    rootFolderPath,
    monitored: true,
    addOptions: { monitor: 'all', searchForMissingAlbums: true },
    images: artistData.images || [],
    links: artistData.links || [],
    genres: artistData.genres || [],
    ratings: artistData.ratings || {},
    statistics: {},
    tags: [],
  };

  const { data } = await api.post('/artist', payload);
  return data;
}

async function addAlbum(albumData) {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.post('/album', {
    foreignAlbumId: albumData.foreignAlbumId,
    monitored: true,
    addOptions: { searchForNewAlbum: true },
  });
  return data;
}

async function getQueue() {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/queue', { params: { pageSize: 50 } });
  return data;
}

async function getArtists() {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/artist');
  return data;
}

async function getAlbums(artistId) {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const params = artistId ? { artistId } : {};
  const { data } = await api.get('/album', { params });
  return data;
}

async function getRootFolders() {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/rootfolder');
  return data;
}

async function getQualityProfiles() {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/qualityprofile');
  return data;
}

async function getMetadataProfiles() {
  const config = getLidarrConfig();
  const api = lidarrApi(config);
  const { data } = await api.get('/metadataprofile');
  return data;
}

async function testConnection(url, apiKey) {
  const api = axios.create({
    baseURL: `${url.replace(/\/$/, '')}/api/v1`,
    headers: { 'X-Api-Key': apiKey },
    timeout: 5000,
  });
  const { data } = await api.get('/system/status');
  return data;
}

module.exports = {
  searchArtist, searchAlbum, addArtist, addAlbum,
  getQueue, getArtists, getAlbums, getRootFolders,
  getQualityProfiles, getMetadataProfiles, testConnection
};
