const fs = require('fs');
const path = require('path');
const dir = path.join('apps', 'api', 'src', 'routes');
const files = fs.readdirSync(dir);
files.forEach(f => {
  if(!f.endsWith('.ts')) return;
  let content = fs.readFileSync(path.join(dir, f), 'utf-8');
  content = content.replace(/async \(request: FastifyRequest, reply: FastifyReply\)/g, 'async (request: any, reply: any)');
  content = content.replace(/async \(request: FastifyRequest<[^>]+>, reply: FastifyReply\)/g, 'async (request: any, reply: any)');
  fs.writeFileSync(path.join(dir, f), content);
});
