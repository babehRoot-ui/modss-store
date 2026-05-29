/**
 * Pterodactyl API Integration
 * Menggunakan PLTA (Application API Key) untuk operasi admin
 * dan PLTC (Client API Key) untuk operasi client
 */

export async function pteroRequest(domain, apiKey, endpoint, options = {}) {
  const url = `${domain.replace(/\/$/, '')}/api${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.detail || `Pterodactyl API Error: ${res.status}`);
  }
  return data;
}

// Ambil daftar server (pakai PLTC - Client Token)
export async function getPterodactylServers(domain, clientToken) {
  return pteroRequest(domain, clientToken, '/client');
}

// Ambil detail server tertentu
export async function getServerDetails(domain, clientToken, serverId) {
  return pteroRequest(domain, clientToken, `/client/servers/${serverId}`);
}

// Ambil resource usage server
export async function getServerResources(domain, clientToken, serverId) {
  return pteroRequest(domain, clientToken, `/client/servers/${serverId}/resources`);
}

// Ambil daftar nest (game categories) - pakai PLTA
export async function getNests(domain, plta) {
  return pteroRequest(domain, plta, '/application/nests');
}

// Ambil daftar eggs dari nest - pakai PLTA
export async function getEggs(domain, plta, nestId) {
  return pteroRequest(domain, plta, `/application/nests/${nestId}/eggs`);
}

// Ambil daftar locations - pakai PLTA
export async function getLocations(domain, plta) {
  return pteroRequest(domain, plta, '/application/locations');
}

// Ambil daftar nodes - pakai PLTA
export async function getNodes(domain, plta) {
  return pteroRequest(domain, plta, '/application/nodes');
}

// Create server - pakai PLTA
export async function createPterodactylServer(domain, plta, serverData) {
  return pteroRequest(domain, plta, '/application/servers', {
    method: 'POST',
    body: JSON.stringify(serverData),
  });
}

// Generate random password
function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// Create user di Pterodactyl - pakai PLTA
export async function createPterodactylUser(domain, plta, email, username) {
  return pteroRequest(domain, plta, '/application/users', {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      username: username,
      first_name: username,
      last_name: 'Customer',
      password: generatePassword(),
      root_admin: false,
    }),
  });
}

// Full flow: create user + create server + return credentials
export async function provisionPanelServer({ domain, plta, pltc, customerEmail, customerName, eggId, nestId, nodeId, memory, disk, cpu }) {
  // 1. Buat user
  const user = await createPterodactylUser(domain, plta, customerEmail, customerName);

  // 2. Buat server
  const server = await createPterodactylServer(domain, plta, {
    name: `${customerName}-Server`,
    description: `Server untuk ${customerName}`,
    user: user.attributes.id,
    egg: eggId,
    docker_image: 'ghcr.io/pterodactyl/yolks:ubuntu_20.04',
    startup: 'bash',
    limits: {
      memory: memory || 1024,
      swap: 0,
      disk: disk || 10240,
      io: 500,
      cpu: cpu || 100,
    },
    feature_limits: {
      databases: 2,
      backups: 1,
      allocations: 1,
    },
    deploy: {
      locations: [nodeId || 1],
      dedicated_ip: false,
      port_range: [],
    },
  });

  return {
    user: user.attributes,
    server: server.attributes,
    panel_url: domain,
    username: user.attributes.username,
    email: user.attributes.email,
    server_id: server.attributes.identifier,
  };
}
