import { fetchJson } from  './fetch'
//import queryString from 'query-string';

const provider = (apiUrl, httpClient = fetchJson) => ({

    getSimpleList: (resource) => {
        const url = `${apiUrl}/${resource}`;
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
        const url = `${apiUrl}/${resource}?${qstring}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json,
            //total: parseInt(headers.get('content-range').split('/').pop(), 10),
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

        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();
        const url = `${apiUrl}/${resource}?${qstring}`;

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
        const url = `${apiUrl}/${resource}?${qstring}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.items || json,
            //total: parseInt(headers.get('content-range').split('/').pop(), 10),
            total: json.total != null ? json.total : json.length || 0
        }));
    },

    update: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json })),

    updateMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };

        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();

        return httpClient(`${apiUrl}/${resource}?${qstring}`, {
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

        const parsed = new URLSearchParams(query);
        const qstring = parsed.toString();

        return httpClient(`${apiUrl}/${resource}?${qstring}`, {
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