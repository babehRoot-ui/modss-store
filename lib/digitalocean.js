const DO_BASE = 'https://api.digitalocean.com/v2';

async function doRequest(apiKey, endpoint, options = {}) {
  const res = await fetch(`${DO_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `DigitalOcean API Error: ${res.status}`);
  }
  return data;
}

export async function listDroplets(apiKey) {
  return doRequest(apiKey, '/droplets');
}

export async function createDroplet(apiKey, { name, region, size, image, sshKeys }) {
  const body = {
    name: name,
    region: region || 'sgp1',
    size: size || 's-1vcpu-1gb',
    image: image || 'ubuntu-22-04-x64',
    ssh_keys: sshKeys || [],
    backups: false,
    ipv6: true,
    monitoring: true,
    tags: ['babeh-store'],
  };

  const data = await doRequest(apiKey, '/droplets', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
}

export async function getDroplet(apiKey, dropletId) {
  return doRequest(apiKey, `/droplets/${dropletId}`);
}

export async function listRegions(apiKey) {
  return doRequest(apiKey, '/regions');
}

export async function listSizes(apiKey) {
  return doRequest(apiKey, '/sizes');
}

export async function deleteDroplet(apiKey, dropletId) {
  return doRequest(apiKey, `/droplets/${dropletId}`, { method: 'DELETE' });
}
