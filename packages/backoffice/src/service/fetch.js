import Cookies from 'universal-cookie';

class HttpError extends Error {
  constructor(message, status,body = null) {
      super(message);
      Object.setPrototypeOf(this, HttpError.prototype);
      this.name = this.constructor.name;
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
      const cookies = new Cookies();
      const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'scalargis_webgis';
      const logged = cookies.get(cookieAuthName);
      if (logged && logged.token) {
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