import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

/**
 * 대회 목록 조회
 * @param {Object} params - { year, month, type }
 * @returns {Promise<Object>}
 */
export async function getCompetitions(params = {}) {
    const queryParams = [];
    
    if (params.year) queryParams.push(`year=${params.year}`);
    if (params.month) queryParams.push(`month=${params.month}`);
    if (params.type && params.type !== 'all') queryParams.push(`type=${params.type}`);
    
    const paramsString = queryParams.join('&');
    
    return await request({
        method: METHOD.GET,
        url: `/api/competitions`,
        params: paramsString
    });
}

