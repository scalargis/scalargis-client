import { core } from '../AppContext';
import { getAppApiUrl, getBackofficeBaseUrl } from '../core/utils';

let sessionProbe = null;

/** Returns the backoffice route of the current page, with its query. */
function currentRoute() {
    const base = new URL(getBackofficeBaseUrl(), window.location.origin).pathname;
    const path = window.location.pathname.startsWith(base)
        ? '/' + window.location.pathname.slice(base.length)
        : '/';
    return path + window.location.search;
}

/** Asks the account route if the token is dead, and on a 401 clears the session and opens the login form. */
export function checkSession(token) {
    if (!token || core.getLoggedUser()?.token !== token) return Promise.resolve(true);
    if (!sessionProbe) {
        sessionProbe = fetch(getAppApiUrl() + '/security/account', { headers: { 'X-API-KEY': token } })
            .then(res => {
                if (res.status !== 401) return true;
                if (core.getLoggedUser()?.token === token) {
                    core.store.dispatch(core.actions.session_clear());
                    window.location.assign(getBackofficeBaseUrl() + 'login?redirect=' + encodeURIComponent(currentRoute()));
                }
                return false;
            })
            .catch(() => true)
            .finally(() => { sessionProbe = null; });
    }
    return sessionProbe;
}

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
            if (status === 401 && requestHeaders.has('X-API-KEY')) {
                checkSession(requestHeaders.get('X-API-KEY'));
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