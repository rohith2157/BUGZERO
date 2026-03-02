// API client for AutonomousQA Gateway

const API_BASE = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('aq_token');
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        localStorage.removeItem('aq_token');
        localStorage.removeItem('aq_user');
        window.location.href = '/';
        throw new Error('Unauthorized');
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return data;
}

// Auth
export const auth = {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
    refresh: () => request('/auth/refresh', { method: 'POST' }),
};

// Tests
export const tests = {
    create: (data) => request('/tests', { method: 'POST', body: JSON.stringify(data) }),
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/tests${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/tests/${encodeURIComponent(id)}`),
    cancel: (id) => request(`/tests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    pages: (id) => request(`/tests/${encodeURIComponent(id)}/pages`),
    compliance: (id) => request(`/tests/${encodeURIComponent(id)}/compliance`),
    performance: (id) => request(`/tests/${encodeURIComponent(id)}/performance`),
};

// Playbooks
export const playbooks = {
    list: () => request('/playbooks'),
    create: (data) => request('/playbooks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/playbooks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/playbooks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Settings
export const settings = {
    team: () => request('/settings/team'),
    updateProfile: (data) => request('/settings/profile', { method: 'PUT', body: JSON.stringify(data) }),
    apiKeys: () => request('/settings/api-keys'),
    createApiKey: (data) => request('/settings/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    revokeApiKey: (id) => request(`/settings/api-keys/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    notifications: () => request('/settings/notifications'),
};

export default { auth, tests, playbooks, settings };
