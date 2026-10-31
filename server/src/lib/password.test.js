// Password policy boundary checks shared by account workflows (PS-1, PS-3, PS-5).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordSchema } from './password.js';
import { validatePassword } from '../../../client/src/lib/password.js';
for (const [name, value, valid] of [
  ['no digit is required', 'Strong@abc', true],
  ['eight characters are insufficient', 'Short@Aa', false],
  ['nine characters are sufficient', 'Strong@ab', true],
  ['uppercase is required', 'strong@abc', false],
  ['lowercase is required', 'STRONG@ABC', false],
  ['a space is not a special character', 'Strong abc', false],
  ['a backslash is a special character', 'Strong' + String.fromCharCode(92) + 'abc', true],
  ['bcrypt boundary is measured in UTF-8 bytes', 'Aa!' + String.fromCharCode(233).repeat(35), false],
  ['72 ASCII bytes are accepted', 'Aa!' + 'x'.repeat(69), true],
  ['73 ASCII bytes are rejected', 'Aa!' + 'x'.repeat(70), false],
])
  test(name, () => {
    const result = passwordSchema.safeParse(value);
    assert.equal(result.success, valid);
    assert.equal(validatePassword(value), result.success ? '' : result.error.issues[0].message);
  });
test('all failed rules have separate messages', () => {
  const result = passwordSchema.safeParse('a');
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message.split(String.fromCharCode(10)).length, 3);
});
