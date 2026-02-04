import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { is } from "@atcute/lexicons";
import { NetworkCosmikCard } from "$lib/services/atlex";

export const load: PageServerLoad = async ({ params, parent }) => {
  const data = await parent()
  if (!data.user || data.service !== 'atproto') return
  const { did, pds } = data.user
  console.log(`${pds}xrpc/com.atproto.repo.getRecord?repo=${did}&collection=${params.type}&rkey=${params.key}`)
  const res = await fetch(`${pds}xrpc/com.atproto.repo.getRecord?repo=${did}&collection=${params.type}&rkey=${params.key}`)
  if (!res.ok) {
    try {
      const error = await res.json()
      return { error }
    } catch (err) {
      error(res.status, res.statusText)
    }
  }

  const record = await res.json()
  if (!('uri' in record && 'cid' in record && 'value' in record)) error(400, JSON.stringify({
    message: 'invalid response',
    record
  }))
  if (is(NetworkCosmikCard.mainSchema, record.value)) {
    console.log('cosmik card')
    return { record, knownCard: true }
  } else {
    console.error('unknown record')
    return { record, knownCard: false }
  }
}
