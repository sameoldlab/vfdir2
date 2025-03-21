// SPDX-License-Identifier: MPL-2.0

import type { ParamMatcher } from '@sveltejs/kit';
import { ULID_REGEX } from 'ulidx';


export const match: ParamMatcher = (param) => ULID_REGEX.test(param) 
