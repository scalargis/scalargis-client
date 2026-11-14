/** Uploads a vector file, loads the GeoJSON that the server returns, and rejects with a readable error on failure. */
export function uploadVectorFile(props, t, file, ext, errorMessage) {
  const { core, viewer, data, setLoading, patchData, beginLoad, Models, fastFetch } = props;
  const { isUrlAppOrigin } = Models.Utils;
  const endpoint = viewer.upload_url || core.UPLOAD_URL;
  const invalidResponse = t("invalidResponse", "Não foi possível obter uma resposta válida.");
  const isCurrent = beginLoad();
  const crs = data.crs;

  const upload = new FormData();
  upload.append('files', file);
  upload.append('ext', ext);

  let originalUrl = null;
  setLoading(true);
  return fastFetch(endpoint, { method: 'POST', body: upload }, 8000)
    .then(res => {
      if (!res || typeof res.json !== 'function') throw new Error(invalidResponse);
      return res.json().catch(() => null);
    })
    .then(res => {
      if (!res || !res.Success || !res.Data || !res.Data.url) throw new Error(errorMessage);
      originalUrl = core.API_URL + res.Data.url;
      const url = isUrlAppOrigin(originalUrl) ? originalUrl : core.MAP_PROXY_URL + encodeURIComponent(originalUrl);
      return fetch(url);
    })
    .then(res => {
      if (!res.ok) throw new Error(invalidResponse);
      return res.json();
    })
    .then(json => {
      const dataitems = Models.OWSModel.convertGeoJSON2Themes(json, originalUrl, file.name, crs);
      if (!dataitems || !dataitems.length) throw new Error(errorMessage);
      if (isCurrent()) patchData({ dataitems });
    })
    .catch(error => {
      if (isCurrent()) throw error;
    })
    .finally(() => {
      if (isCurrent()) setLoading(false);
    });
}
