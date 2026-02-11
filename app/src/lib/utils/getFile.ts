// SPDX-License-Identifier: MPL-2.0

import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import type { Action } from 'svelte/action'
import { media } from '$lib/data/maps.svelte'
import { browser } from '$app/environment'
import type { DbPool } from '$lib/database/connectionPool.svelte'
import { ulid } from 'ulidx'
let cacheDir: FileSystemDirectoryHandle = null
let opfs_available = false
let pool = null as unknown as DbPool

if (!cacheDir && browser) {
  navigator.storage.getDirectory().then(async (fsdh: FileSystemDirectoryHandle) => {
    cacheDir = await fsdh.getDirectoryHandle('cache', { create: true })
    opfs_available = true
    return cacheDir
  }).catch(err => {
    if (err instanceof DOMException) opfs_available = false
    else throw err
  })
}

const cacheFile = async (filename: string) => {
  const res = await fetch(filename)
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)

  // Write data to file handle and chunks array
  const handle = await cacheDir.getFileHandle(`tmp_${ulid()}`, {
    create: true
  })
  const writableStream = await handle.createWritable()
  const chunks: number[][] = []
  const transform = new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk)
      controller.enqueue(chunk)
    }
  })
  await res.body?.pipeThrough(transform).pipeTo(writableStream)

  // Generate CID from chunks array 
  const bytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, 0x55, hash)

  // move file to final location. update reference in database
  handle.move(cid.toString())
  const { record } = await import('$lib/database/events')
  pool.exec((tx) => {
    console.log({ cid: cid.toString(), key: filename })
    return record(tx, { type: 'save', data: { url: cid.toString(), key: filename }, objectId: `blob:${filename}` })
  })
  return cid.toString()
}

const getFileFromCid = async (filename: string, cDir = cacheDir) => {
  try {

    const handle = await cDir.getFileHandle(filename)
    const file = await handle.getFile()
    return URL.createObjectURL(file)
  } catch (err) {
    console.error(err, `from ${filename}: ${filename.length}`)
  }
}

const load = async (el: HTMLImageElement | HTMLVideoElement, src: string) => {
  console.log('cache miss')
  const cached = await cacheFile(src)
  console.log({ media_ts: cached })
  media.set(src, cached)
  el.src = src
}

let observer: IntersectionObserver | null = null
const getObserver = () => {
  if (!observer) observer = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      let el = entry.target as HTMLImageElement | HTMLVideoElement
      el.dataset.src && load(el, el.dataset.src)
      observer.unobserve(el)
    }
  }, {
    rootMargin: '0% 0% 100% 0%',
    threshold: 0
  })
  return observer
}

export const handleFile: Action<HTMLImageElement | HTMLVideoElement, { src: string, pool: DbPool }> = (el, { src, pool: _pool }) => {
  if (!opfs_available) {
    el.loading = 'lazy'
    el.src = src
    return
  }

  pool = pool ?? _pool
  const observer = getObserver()
  let url: string | null = null

  const file = media.get(src)
  if (file && file.length) getFileFromCid(file)
    .then(_url => {
      url = _url
      el.src = url
    })
  else observer.observe(el)


  return {
    destroy() {
      observer.unobserve(el)
      url && URL.revokeObjectURL(url)
    }
  }
}
