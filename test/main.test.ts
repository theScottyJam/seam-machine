import { strict as assert } from 'node:assert';
import { main } from '../src/index.js';

it('works', () => {
  assert.equal(main(), 2);
});
