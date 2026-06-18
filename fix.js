const fs = require('fs');
const path = require('path');
const dir = path.join('apps', 'api', 'src', 'routes');
const files = fs.readdirSync(dir);
files.forEach(f => {
  if(!f.endsWith('.ts')) return;
  let content = fs.readFileSync(path.join(dir, f), 'utf-8');
  content = content.replace(/fastify\.(get|post|patch|delete|put)\(([\s\S]*?)async \(request: FastifyRequest<\{ Params: \{ ([^:]+): string \} \}>/g, 'fastify.$1<{ Params: { $3: string } }>($2async (request: FastifyRequest');
  fs.writeFileSync(path.join(dir, f), content);
});
