export class PterodactylAPI {
  constructor(domain, plta, pltc) {
    this.domain = domain.replace(/\/$/, '');
    this.plta = plta;
    this.pltc = pltc;
  }

  async request(path, method = 'GET', body = null, useClient = false) {
    const token = useClient ? this.pltc : this.plta;
    const prefix = useClient ? '/api/client' : '/api/application';
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.domain}${prefix}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || `PTerro error ${res.status}`);
    return data;
  }

  async getNodes() { return this.request('/nodes'); }
  async getAllocations(nodeId) { return this.request(`/nodes/${nodeId}/allocations?per_page=100`); }
  async getNests() { return this.request('/nests'); }
  async getEggs(nestId) { return this.request(`/nests/${nestId}/eggs`); }

  async createUser(email, username, firstName, lastName) {
    return this.request('/users', 'POST', {
      email, username, first_name: firstName, last_name: lastName, password: this.genPassword()
    });
  }

  async createServer({ name, description, userId, eggId, nestId, nodeId, allocationId, memory, disk, cpu }) {
    return this.request('/servers', 'POST', {
      name, description, user: userId, egg: eggId, nest: nestId, docker_image: 'ghcr.io/pterodactyl/yolks:ubuntu_20.04',
      startup: 'bash', environment: {}, allocation: { default: allocationId },
      limits: { memory, disk, cpu, swap: 0, io: 500, threads: null },
      feature_limits: { databases: 0, allocations: 1, backups: 0 }
    });
  }

  async clientServers() { return this.request('/servers', 'GET', null, true); }
  async clientServerResources(serverId) { return this.request(`/servers/${serverId}/resources`, 'GET', null, true); }
  async clientServerDetails(serverId) { return this.request(`/servers/${serverId}`, 'GET', null, true); }

  genPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pass = '';
    for (let i = 0; i < 16; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }
}
