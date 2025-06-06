import { fetchJson } from  './fetch'
import { stringify } from 'query-string';

const provider = (apiUrl, httpClient = fetchJson) => ({

    get: (resource, params) => {
        const url = params?.id != null ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${resource}`;
        return httpClient(url).then(({ json }) => ({
            data: json,
        }))
    },

    getSimpleList: (resource, params) => {
        const url = params?.id != null ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${resource}`;
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
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json,
            total: json.total != null ? json.total : json.length || 0
        }));
    },

    getOne: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
            data: json,
        })),

    getMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;
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
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json,
            total: json.total != null ? json.total : json.length || 0
        }));
    },

    update: (resource, params) => {
        const url = params?.id != null ? `${apiUrl}/${resource}/${params.id}` : `${apiUrl}/${resource}`;
        return httpClient(url, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    updateMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },

    create: (resource, params) =>
        httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: { ...params.data, id: json.id },
        })),

    /*
    delete: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json })),
    */
    delete: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
    }).then(({ json }) => ({ data: { "id": params.id} })),    

    deleteMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'DELETE',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },

    getGeometry: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.feature_id}/geometry`).then(({ json }) => ({
            data: json,
        })),

    saveGeometry: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.feature_id}/geometry`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: { ...params.data, id: json.id },
        })),

    getDocuments: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.resource_id}/docs`).then(({ json }) => ({
            data: json,
        })),
        
    getDocument: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/docs/${params.id}`).then(({ json }) => ({
            data: json,
        })),
        
    createDocument: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.resource_id}/docs`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json })),
        
    updateDocument: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/docs/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json })),
        
    deleteDocument: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/docs/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: { "id": params.id} })),
    
});


export default provider;