class GitHubApi {
  constructor(token, fetcher = fetch) {
    if (!token) throw new Error('Defina GH_TOKEN ou GITHUB_TOKEN; nunca grave o token em arquivo.');
    this.token = token;
    this.fetcher = fetcher;
  }

  async request(method, path, body) {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Caminho GitHub inválido.');
    const response = await this.fetcher('https://api.github.com' + path, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
      headers: {
        authorization: 'Bearer ' + this.token,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'x-github-api-version': '2026-03-10',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const error = new Error(`GitHub ${response.status}: ${method} ${path}`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? undefined : response.json();
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }

  async all(path, field) {
    const result = [];
    for (let page = 1; page <= 100; page++) {
      const data = await this.get(path + (path.includes('?') ? '&' : '?') + `per_page=100&page=${page}`);
      const rows = field ? data[field] : data;
      if (!Array.isArray(rows)) throw new Error('Resposta GitHub sem lista: ' + path);
      result.push(...rows);
      if (rows.length < 100) return result;
    }
    throw new Error('Paginação GitHub excedeu o limite: ' + path);
  }
}
module.exports = { GitHubApi };
