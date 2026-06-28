import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getProductsByCategory,
  getAllProducts,
  getProductById,
} from './repository'

const app = new Hono()

app.use('/*', cors())

app.get('/', (c) =>
  c.json({
    name: 'Wyze products API',
    source: 'MySQL',
    endpoints: [
      'GET /api/cameras',
      'GET /api/plans',
      'GET /api/sensors',
      'GET /api/protection',
      'GET /api/products',
      'GET /api/products/:id',
    ],
  }),
)

app.get('/api/cameras', async (c) => c.json(await getProductsByCategory('cameras')))

app.get('/api/plans', async (c) => c.json(await getProductsByCategory('plans')))

app.get('/api/sensors', async (c) => c.json(await getProductsByCategory('sensors')))

app.get('/api/protection', async (c) =>
  c.json(await getProductsByCategory('protection')),
)

app.get('/api/products', async (c) => c.json(await getAllProducts()))

app.get('/api/products/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const product = Number.isFinite(id) ? await getProductById(id) : undefined
  if (!product) return c.json({ error: 'Product not found' }, 404)
  return c.json(product)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Wyze products API running at http://localhost:${info.port}`)
})
