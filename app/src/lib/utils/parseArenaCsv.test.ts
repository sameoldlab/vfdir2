// SPDX-License-Identifier: MPL-2.0

import { expect, it } from 'vitest'
import { arenaCsvToObj } from './parseArenaCsv'
import csv from '$lib/dummy/arenaCsv.csv?raw'

it('returns', () => {
  expect(arenaCsvToObj(csv)).toReturn
})
