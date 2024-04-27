import * as vec from './vec.js'
import * as perspective from './perspective.js'
import * as matrix from './matrix.js'
import * as quat from './quat.js'

const clamp = {clamp: (val, min, max) => Math.max(min, Math.min(max, val))};

export default Object.assign({}, vec, perspective, matrix, quat, clamp);
