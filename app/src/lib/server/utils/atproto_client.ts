import { Client, simpleFetchHandler } from '@atcute/client'
import { JetstreamSubscription } from '@atcute/jetstream'

const rpc = new Client({ handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }) })
export const bskymrks = await rpc.get('app.bsky.bookmark.getBookmarks', {
  params: {

  }
})
console.log(bskymrks)

export const subscribeMrks = (wantedDids: `did:${string}:${string}`[]) => new JetstreamSubscription({
  url: [
    'wss://jetstream2.fr.hose.cam ',
    'wss://jetstream1.us-east.bsky.network',
    'wss://jetstream2.us-east.bsky.network',
    'wss://jetstream1.us-west.bsky.network',
    'wss://jetstream2.us-west.bsky.network',
  ],
  wantedDids,
  wantedCollections: [
    'at.monomarks.bookmark',
    'community.lexicon.bookmarks.bookmark',
    'network.cosmik.card',
    'network.cosmik.collection',
    'network.cosmik.collectionLink',
  ],
})
