import { fetchJson } from './fetch';

const provider = (apiUrl, httpClient = fetchJson) => ({

    getSimpleList: (resource) => {
        const url = resource ? `${apiUrl}/${resource}` : `${apiUrl}`;
        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json
        }));
    },

    getSimple: (resource, params) => {
        const parsed = new URLSearchParams(params);
        const qstring = parsed.toString();
        const url = resource ? `${apiUrl}/${resource}?${qstring}` : `${apiUrl}?${qstring}`;
        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json
        }));
    },

    getList: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            page: page,
            per_page: perPage,
            filter: JSON.stringify(params.filter),
        };
        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();
        const url = resource ? `${apiUrl}/${resource}?${qstring}` : `${apiUrl}?${qstring}`;
        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json,
            total: json.total != null ? json.total : json.length || 0
        }));
    },

    getOne: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${params.id}`;
        return httpClient(url).then(({ json }) => ({
            data: json,
        }));
    },

    getMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();
        const url = resource ? `${apiUrl}/${resource}?${qstring}` : `${apiUrl}?${qstring}`;
        return httpClient(url).then(({ json }) => ({
            data: json.items || json,
            total: json.total != null ? json.total : json.length || 0
        }));
    },

    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            page: page,
            per_page: perPage,
            filter: JSON.stringify({
                ...params.filter,
                [params.target]: params.id,
            }),
        };
        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();
        const url = resource ? `${apiUrl}/${resource}?${qstring}` : `${apiUrl}?${qstring}`;
        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json,
            total: json.total != null ? json.total : json.length || 0
        }));
    },

    update: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${params.id}`;
        return httpClient(url, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    updateMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();
        const url = resource ? `${apiUrl}/${resource}?${qstring}` : `${apiUrl}?${qstring}`;
        return httpClient(url, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },


    submit: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}` : `${apiUrl}`;
        return httpClient(url, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },


    create: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}` : `${apiUrl}`;
        return httpClient(url, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: { ...params.data, id: json.id },
        }))
    },

    
    delete: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${params.id}`;
        return httpClient(url, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: { "id": params.id } }))
    },

    deleteFullResp: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${params.id}`;
        return httpClient(url, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json }))
    },
    
    deleteMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();
        const url = resource ? `${apiUrl}/${resource}?${qstring}` : `${apiUrl}?${qstring}`;
        return httpClient(url, {
            method: 'DELETE',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },

    getGeometry: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.feature_id}/geometry` : `${apiUrl}/${params.feature_id}/geometry`;
        return httpClient(url).then(({ json }) => ({
            data: json,
        }));
    },

    saveGeometry: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.feature_id}/geometry` : `${apiUrl}/${params.feature_id}/geometry`;
        return httpClient(url, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: { ...params.data, id: json.id },
        }));
    },

    getDocuments: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.resource_id}/docs` : `${apiUrl}/${params.resource_id}/docs`;
        return httpClient(url).then(({ json }) => ({
            data: json,
        }));
    },

    getDocument: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/docs/${params.id}` : `${apiUrl}/docs/${params.id}`;
        return httpClient(url).then(({ json }) => ({
            data: json,
        }));
    },

    createDocument: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/${params.resource_id}/docs` : `${apiUrl}/${params.resource_id}/docs`;
        return httpClient(url, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    updateDocument: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/docs/${params.id}` : `${apiUrl}/docs/${params.id}`;
        return httpClient(url, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    deleteDocument: (resource, params) => {
        const url = resource ? `${apiUrl}/${resource}/docs/${params.id}` : `${apiUrl}/docs/${params.id}`;
        return httpClient(url, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: { "id": params.id } }))
    },
});


export default provider;