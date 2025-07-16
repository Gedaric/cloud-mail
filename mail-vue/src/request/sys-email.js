import http from '@/axios/index.js';

export function sysEmailList(params) {
    return http.get('/sysEmail/list', {params: {...params}})
}

export function sysEmailDelete(emailIds) {
    return http.delete('/sysEmail/delete?emailIds=' + emailIds)
}
