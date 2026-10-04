import { core } from '../../AppContext';

/*
export interface Options extends RequestInit {
    user?: {
        authenticated?: boolean;
        token?: string;
    };
}
*/

class HttpError extends Error {
  constructor(message, status,body = null) {
      super(message);
      Object.setPrototypeOf(this, HttpError.prototype);
      this.name = this.constructor.name;
      this.status = status;
      this.message = message;
      this.body = body;
      if (typeof Error.captureStackTrace === 'function') {
          Error.captureStackTrace(this, this.constructor);
      } else {
          this.stack = new Error(message).stack;
      }
      this.stack = new Error().stack;
  }
}

//export default HttpError;

const inflight = new Map();

/** GETs a url once for all callers that ask while it is in flight. Resolves to { status, json }. */
export const fetchShared = (url, options = {}) => {
    const key = url + '|' + (options.headers?.['X-API-KEY'] || '');
    if (inflight.has(key)) return inflight.get(key);
    const request = fetch(url, options)
        .then(res => res.json().catch(() => null).then(json => ({ status: res.status, json })))
        .finally(() => inflight.delete(key));
    inflight.set(key, request);
    return request;
};

export const createHeadersFromOptions = (options) => {

    const requestHeaders = (options.headers ||
        new Headers({
            Accept: 'application/json',
        }));
    if (
        !requestHeaders.has('Content-Type') &&
        !(options && (!options.method || options.method === 'GET')) &&
        !(options && options.body && options.body instanceof FormData)
    ) {
        requestHeaders.set('Content-Type', 'application/json');
    }
    if (options.user && options.user.authenticated && options.user.token) {
        requestHeaders.set('X-API-KEY', options.user.token);
    } else {
     const logged = core.getLoggedUser();
      if (logged?.token) {
        requestHeaders.set('X-API-KEY', logged.token);
      }
    }

    return requestHeaders;
};

export const fetchAll = (url, options = {}, responseType = 'auto') => {
    const requestHeaders = createHeadersFromOptions(options);

    return fetch(url, { ...options, headers: requestHeaders })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type") || '';

            if (responseType === 'auto') {
                if (contentType.includes("application/json")) {
                    return response.json();
                } else if (contentType.includes("text/")) {
                    return response.text();
                } else if (contentType.includes("application/octet-stream") ||
                            contentType.includes("audio/") || contentType.includes("video/")) {
                    return response.arrayBuffer();
                } else if (contentType.includes("multipart/form-data")) {
                    return response.formData();
                } else {
                    return response.blob();
                }
            } else {
                switch (responseType) {
                    case 'json': return response.json();
                    case 'text': return response.text();
                    case 'blob': return response.blob();
                    case 'arrayBuffer': return response.arrayBuffer();
                    case 'formData': return response.formData();
                    default: throw new Error(`Unsupported responseType: ${responseType}`);
                }
            }
            //return Promise.resolve({ status, headers, body, json });
        });
};

export const fetchJson = (url, options = {}) => {
    const requestHeaders = createHeadersFromOptions(options);

    return fetch(url, { ...options, headers: requestHeaders })
        .then(response =>
            response.text().then(text => ({
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                body: text,
            }))
        )
        .then(({ status, statusText, headers, body }) => {
            let json;
            try {
                json = JSON.parse(body);
            } catch (e) {
                // not json, no big deal
            }
            if (status < 200 || status >= 300) {
                return Promise.reject(
                    new HttpError(
                        (json && json.message) || statusText,
                        status,
                        json
                    )
                );
            }
            return Promise.resolve({ status, headers, body, json });
        });
};

//export const queryParameters = stringify;

const isValidObject = value => {
    if (!value) {
        return false;
    }

    const isArray = Array.isArray(value);
    const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(value);
    const isObject =
        Object.prototype.toString.call(value) === '[object Object]';
    const hasKeys = !!Object.keys(value).length;

    return !isArray && !isBuffer && isObject && hasKeys;
};

export const flattenObject = (value, path = []) => {
    if (isValidObject(value)) {
        return Object.assign(
            {},
            ...Object.keys(value).map(key =>
                flattenObject(value[key], path.concat([key]))
            )
        );
    } else {
        return path.length ? { [path.join('.')]: value } : value;
    }
};