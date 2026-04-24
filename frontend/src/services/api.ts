import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';

function resolveBaseUrl() {
  // 1) allow override via app config (app.json -> extra -> backendUrl)
  const extra = (Constants.manifest && (Constants.manifest as any).extra) || (Constants.manifest2 && (Constants.manifest2 as any).extra);
  if (extra && extra.backendUrl) {
    return extra.backendUrl;
  }

  // 2) when running in Expo local dev, use the packager host IP
  const debuggerHost = (Constants.manifest && (Constants.manifest as any).debuggerHost) || (Constants.manifest2 && (Constants.manifest2 as any).debuggerHost);
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000`;
  }

  // 3) fallback to localhost
  return 'http://192.168.1.66:3000';
}

const baseUrl = resolveBaseUrl();
console.log('[api] baseURL ->', baseUrl);

const api: AxiosInstance = axios.create({
  baseURL: baseUrl,
});

export const setAuthToken = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
