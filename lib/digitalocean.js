export class DigitalOceanAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.base = 'https://api.digitalocean.com/v2';
  }

  async request(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.base}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `DO error ${res.status}`);
    return data;
  }

  async listDroplets() { return this.request('/droplets'); }

  async createDroplet({ name, region = 'sgp1', size = 's-1vcpu-1gb', image = 'ubuntu-22-04-x64' }) {
    const password = this.genPassword();
    const data = await this.request('/droplets', 'POST', {
      name, region, size, image,
      ssh_keys: [], backups: false, ipv6: true, monitoring: false,
      tags: ['babeh-store'], user_data: `#cloud-config\npassword: ${password}\nchpasswd:\n  expire: false\nssh_pwauth: true`
    });
    return { ...data, root_password: password };
  }

  async getDroplet(id) { return this.request(`/droplets/${id}`); }

  genPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 16; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }
}
