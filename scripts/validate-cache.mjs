import fs from 'node:fs'
import path from 'node:path'

const cacheDir = path.join(process.cwd(), 'public', 'cache')
const files = fs.readdirSync(cacheDir).filter(file => file.endsWith('.json')).sort()

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function validateNode(node, file, location) {
  assert(node && typeof node === 'object', `${file}: ${location} must be an object`)
  assert(typeof node.name === 'string' && node.name.trim(), `${file}: ${location}.name is required`)

  if ('toolId' in node) {
    assert(node.toolId === null || typeof node.toolId === 'string', `${file}: ${location}.toolId must be null or string`)
  }

  if ('feasibility' in node) {
    assert(typeof node.feasibility === 'number', `${file}: ${location}.feasibility must be a number`)
  }

  if (node.children !== undefined) {
    assert(Array.isArray(node.children), `${file}: ${location}.children must be an array`)
    node.children.forEach((child, index) => validateNode(child, file, `${location}.children[${index}]`))
  }
}

for (const file of files) {
  const fullPath = path.join(cacheDir, file)
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'))

  assert(data.source === 'golden-cache', `${file}: source must be "golden-cache"`)
  validateNode(data.root, file, 'root')
  console.log(`${file} valid`)
}

console.log(`${files.length} cache files valid`)
