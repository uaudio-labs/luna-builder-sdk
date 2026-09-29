import { describe, expect, it } from 'vitest';
import { appendParams, correlationId, decodeMessage, encodePayload, encodeRequest, float, FloatLiteral } from '../../src/wire/codec';

describe('codec', () => {
  it('encodes a get with parameters in the text form the engine parses', () => {
    expect(encodeRequest('get', '/sessions', { properties: '0', ua_id: 'r1' })).toBe('get /sessions?properties=0&ua_id=r1');
  });

  it('appends to an existing query string', () => {
    expect(appendParams('/a?x=1', { y: '2' })).toBe('/a?x=1&y=2');
    expect(appendParams('/a', {})).toBe('/a');
    expect(appendParams('/a', undefined)).toBe('/a');
  });

  it('encodes payloads as JSON so strings stay distinguishable from numbers', () => {
    expect(encodePayload('1234')).toBe('"1234"');
    expect(encodePayload(1234)).toBe('1234');
    expect(encodePayload(true)).toBe('true');
    expect(encodePayload({ name: 'Vocal' })).toBe('{"name":"Vocal"}');
    expect(encodePayload(undefined)).toBe('');
  });

  it('encodes set and post with a space before the payload', () => {
    expect(encodeRequest('set', '/s/playing', { ua_id: 'r2' }, true)).toBe('set /s/playing?ua_id=r2 true');
    expect(encodeRequest('post', '/s/new_track', undefined, { name: 'A' })).toBe('post /s/new_track {"name":"A"}');
  });

  it('decodes a reply and keeps the fields the client needs', () => {
    const m = decodeMessage('{"path":"/x","data":1,"parameters":{"ua_id":"r1"},"operation":"added","error":"nope","cmd":"update"}');
    expect(m).toEqual({ path: '/x', data: 1, parameters: { ua_id: 'r1' }, operation: 'added', error: 'nope', cmd: 'update' });
  });

  it('tolerates a JSON header, a trailing NUL and garbage', () => {
    expect(decodeMessage('JSON\0\0\0\0{"path":"/x","data":2}\0')).toEqual({ path: '/x', data: 2 });
    expect(decodeMessage('not json')).toBeUndefined();
    expect(decodeMessage('[1,2]')).toBeUndefined();
    expect(decodeMessage('{"data":1}')).toBeUndefined();
    expect(decodeMessage('')).toBeUndefined();
  });

  it('accepts url in place of path', () => {
    expect(decodeMessage('{"url":"/y"}')?.path).toBe('/y');
  });

  it('reads the echoed correlation id as a string even if retyped', () => {
    expect(correlationId({ path: '/x', parameters: { ua_id: 'r7' } }, 'ua_id')).toBe('r7');
    expect(correlationId({ path: '/x', parameters: { ua_id: 7 } }, 'ua_id')).toBe('7');
    expect(correlationId({ path: '/x' }, 'ua_id')).toBeUndefined();
  });
  it('writes a FloatLiteral as a float literal, whole numbers included (fact 82)', () => {
    expect(encodePayload({ values: [{ location: 0, value: float(-6) }, { location: 1, value: float(-6.5) }] })).toBe('{"values":[{"location":0,"value":-6.0},{"location":1,"value":-6.5}]}');
    expect(encodePayload(float(0))).toBe('0.0');
    expect(encodePayload([float(1e21), float(-0.000001)])).toBe('[1e+21,-0.000001]');
    expect(JSON.parse(encodePayload({ v: float(3) }))).toEqual({ v: 3 });
  });

  it('leaves plain numbers and look-alike strings alone', () => {
    expect(encodePayload({ n: -6, s: '\u0001float1:5' })).toBe(JSON.stringify({ n: -6, s: '\u0001float1:5' }));
    expect(encodePayload({ s: 'x', f: float(2) })).toBe('{"s":"x","f":2.0}');
  });

  it('refuses a non-finite float and does not double-wrap', () => {
    expect(() => float(Number.NaN)).toThrow(TypeError);
    const f = float(2);
    expect(float(f)).toBe(f);
    expect(f).toBeInstanceOf(FloatLiteral);
  });
});
