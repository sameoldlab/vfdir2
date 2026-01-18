import createClient from 'openapi-fetch'
import type { paths } from './schema'

export const arenaClient = createClient<paths>({ baseUrl: 'https://api.are.na' })
