import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { encode, code } from 'multiformats/codecs/json'

export const hashObject = (obj: object) => {
	const digest = sha256.digest(encode(obj))
	if (!('then' in digest)) return CID.create(1, code, digest).toString()
	return digest.then((d) => CID.create(1, code, d).toString())
}
