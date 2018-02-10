'use strict';

var assert = require('assert');
var t = require('tcomb');
var transform = require('../index');
var util = require('../util');

var Str = t.Str;
var Num = t.Num;
var Bool = t.Bool;
var Obj = t.Obj;
var Arr = t.Arr;
var Any = t.Any;
var Dat = t.Date;
var getKind = function(type) {
  return type.meta.kind;
};

//
// setup
//

var ok = function(x) {
  assert.strictEqual(true, x);
};
var ko = function(x) {
  assert.strictEqual(false, x);
};
var eq = assert.strictEqual;

describe('transform', function() {
  it('should transform an empty schema', function() {
    eq(transform({}).type, Any);
  });

  describe('string schema', function() {
    it('should transform a simple schema', function() {
      eq(transform({ type: 'string' }).type, Str);
    });

    it('should handle enum', function() {
      var Type = transform({
        type: 'string',
        enum: ['Street', 'Avenue', 'Boulevard']
      }).type;
      eq(getKind(Type), 'enums');
      eq(Type.is('a'), false);
      eq(Type.is('Street'), true);
    });

    it.skip('should return error message for enum', function() {
      var options = transform({
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: ['Street', 'Avenue', 'Boulevard']
          },
          title: {
            type: 'string',
            minLength:3
          }
        },
        required: ['name','title']
      }).constraint;
      eq(options, 'enums');
    });

    it('should handle enum objects', function() {
      var Type = transform({
        type: 'string',
        enum: { st: 'Street', ave: 'Avenue', blvd: 'Boulevard' }
      }).type;
      eq(getKind(Type), 'enums');
      eq(Type.is('a'), false);
      eq(Type.is('st'), true);
    });

    it('should handle minLength', function() {
      var Type = transform({
        type: 'string',
        minLength: 2
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Str);
      eq(Type.meta.predicate('a'), false);
      eq(Type.meta.predicate('aa'), true);
    });

    it('should handle maxLength', function() {
      var Type = transform({
        type: 'string',
        maxLength: 2
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Str);
      eq(Type.meta.predicate('aa'), true);
      eq(Type.meta.predicate('aaa'), false);
    });

    it('should handle pattern', function() {
      var Type = transform({
        type: 'string',
        pattern: '^h'
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Str);
      eq(Type.meta.predicate('hello'), true);
      eq(Type.meta.predicate('aaa'), false);
    });

    it('should handle pattern as regex literal', function() {
      var Type = transform({
        type: 'string',
        pattern: '/^H/i'
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Str);
      eq(Type.meta.predicate('hello'), true);
      eq(Type.meta.predicate('aaa'), false);
    });
  });

  describe('number schema', function() {
    it('should transform a simple schema', function() {
      eq(transform({ type: 'number' }).type, Num);
    });

    it('should handle minimum', function() {
      var Type = transform({
        type: 'number',
        minimum: 2
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Num);
      eq(Type.meta.predicate(1), false);
      eq(Type.meta.predicate(2), true);
      eq(Type.meta.predicate(3), true);
    });

    it('should handle exclusiveMinimum', function() {
      var Type = transform({
        type: 'number',
        minimum: 2,
        exclusiveMinimum: true
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Num);
      eq(Type.meta.predicate(1), false);
      eq(Type.meta.predicate(2), false);
      eq(Type.meta.predicate(3), true);
    });

    it('should handle maximum', function() {
      var Type = transform({
        type: 'number',
        maximum: 2
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Num);
      eq(Type.meta.predicate(1), true);
      eq(Type.meta.predicate(2), true);
      eq(Type.meta.predicate(3), false);
    });

    it('should handle exclusiveMaximum', function() {
      var Type = transform({
        type: 'number',
        maximum: 2,
        exclusiveMaximum: true
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Num);
      eq(Type.meta.predicate(1), true);
      eq(Type.meta.predicate(2), false);
      eq(Type.meta.predicate(3), false);
    });

    it('should handle integer', function() {
      var Type = transform({
        type: 'number',
        integer: true
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Num);
      eq(Type.meta.predicate(1), true);
      eq(Type.meta.predicate(1.1), false);
    });
  });

  describe('integer schema', function() {
    it('should transform a simple schema', function() {
      var Type = transform({
        type: 'integer'
      }).type;
      ok(Type === util.Int);
      eq(Type.is(1), true);
      eq(Type.is(1.1), false);
    });

    it('should handle minimum', function() {
      var Type = transform({
        type: 'integer',
        minimum: 2
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, util.Int);
      eq(Type.meta.predicate(1), false);
      eq(Type.meta.predicate(2), true);
      eq(Type.meta.predicate(3), true);
    });

    it('should handle exclusiveMinimum', function() {
      var Type = transform({
        type: 'integer',
        minimum: 2,
        exclusiveMinimum: true
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, util.Int);
      eq(Type.meta.predicate(1), false);
      eq(Type.meta.predicate(2), false);
      eq(Type.meta.predicate(3), true);
    });

    it('should handle maximum', function() {
      var Type = transform({
        type: 'integer',
        maximum: 2
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, util.Int);
      eq(Type.meta.predicate(1), true);
      eq(Type.meta.predicate(2), true);
      eq(Type.meta.predicate(3), false);
    });

    it('should handle exclusiveMaximum', function() {
      var Type = transform({
        type: 'integer',
        maximum: 2,
        exclusiveMaximum: true
      }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, util.Int);
      eq(Type.meta.predicate(1), true);
      eq(Type.meta.predicate(2), false);
      eq(Type.meta.predicate(3), false);
    });
  });

  it('should transform a null schema', function() {
    var Type = transform({ type: 'null' }).type;
    ok(Type === util.Null);
    ok(Type.is(null));
    ko(Type.is(undefined));
    ko(Type.is('a'));
  });

  it('should transform a boolean schema', function() {
    eq(transform({ type: 'boolean' }).type, Bool);
  });

  describe('object schema', function() {
    it('should transform a simple schema', function() {
      eq(transform({ type: 'object' }).type, Obj);
    });

    it('should handle optional properties', function() {
      var Type = transform({
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'number' }
        }
      }).type;
      var a = Type.meta.props.a;
      var b = Type.meta.props.b;
      eq(getKind(a), 'maybe');
      ok(a.meta.type === Str);
      eq(getKind(b), 'maybe');
      ok(b.meta.type === Num);
    });

    it('should handle required properties', function() {
      var Type = transform({
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'number' }
        },
        required: ['a']
      }).type;
      var a = Type.meta.props.a;
      var b = Type.meta.props.b;
      eq(getKind(a), 'irreducible');
      ok(a === Str);
      eq(getKind(b), 'maybe');
      ok(b.meta.type === Num);
    });
  });

  describe('array schema', function() {
    it('should transform a simple schema', function() {
      eq(transform({ type: 'array' }).type, Arr);
    });

    it('should handle minItems', function() {
      var Type = transform({ type: 'array', minItems: 1 }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Arr);
      eq(Type.meta.predicate([]), false);
      eq(Type.meta.predicate(['a']), true);
    });

    it('should handle maxItems', function() {
      var Type = transform({ type: 'array', maxItems: 2 }).type;
      eq(getKind(Type), 'subtype');
      eq(Type.meta.type, Arr);
      eq(Type.meta.predicate(['a', 'b']), true);
      eq(Type.meta.predicate(['a', 'b', 'c']), false);
    });

    it('should handle list items', function() {
      var Type = transform({
        type: 'array',
        items: {
          type: 'number'
        }
      }).type;
      eq(getKind(Type), 'list');
      ok(Type.meta.type === Num);
    });

    it('should handle minItems with list items', function() {
      var Type = transform({
        type: 'array',
        minItems: 2,
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          },
          required: ['name']
        }
      }).type;
      eq(getKind(Type), 'subtype');
      eq(getKind(Type.meta.type), 'list');
      eq(getKind(Type.meta.type.meta.type), 'struct');
      eq(Type.meta.predicate([]), false);
      eq(Type.meta.predicate([{ name: 'name 1' }]), false);
      eq(Type.meta.predicate([{ name: 'name 1' }, { name: 'name 2' }]), true);
      eq(
        Type.meta.predicate([
          { name: 'name 1' },
          { name: 'name 2' },
          { name: 'name 3' }
        ]),
        true
      );
    });

    it('should handle maxItems with list items', function() {
      var Type = transform({
        type: 'array',
        maxItems: 2,
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          },
          required: ['name']
        }
      }).type;
      eq(getKind(Type), 'subtype');
      eq(getKind(Type.meta.type), 'list');
      eq(getKind(Type.meta.type.meta.type), 'struct');
      eq(Type.meta.predicate([]), true);
      eq(Type.meta.predicate([{ name: 'name 1' }]), true);
      eq(Type.meta.predicate([{ name: 'name 1' }, { name: 'name 2' }]), true);
      eq(
        Type.meta.predicate([
          { name: 'name 1' },
          { name: 'name 2' },
          { name: 'name 3' }
        ]),
        false
      );
    });

    it('should handle tuple items', function() {
      var Type = transform({
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }]
      }).type;
      eq(getKind(Type), 'tuple');
      ok(Type.meta.types[0] === Str);
      ok(Type.meta.types[1] === Num);
    });
  });

  it('should handle unions', function() {
    var Type = transform({ type: ['number', 'string'] }).type;
    eq(getKind(Type), 'union');
    ok(Type.meta.types[0] === Num);
    ok(Type.meta.types[1] === Str);
  });

  describe('registerFormat', function() {
    function isEmail(x) {
      return /(.)+@(.)+/.test(x);
    }

    transform.registerFormat('email', isEmail);

    it('should throw if duplicated formats are registered', function() {
      assert.throws(
        function() {
          transform.registerFormat('email', isEmail);
        },
        function(err) {
          if (
            err instanceof Error &&
            err.message ===
              '[tcomb] [tcomb-json-schema] Duplicated format email'
          ) {
            return true;
          }
        }
      );
    });

    it('should throw if unknown formats are used', function() {
      assert.throws(
        function() {
          transform({
            type: 'string',
            format: 'unknown'
          });
        },
        function(err) {
          if (
            err instanceof Error &&
            err.message ===
              '[tcomb] [tcomb-json-schema] Missing format unknown, use the (format, predicate) API'
          ) {
            return true;
          }
        }
      );
    });

    it('should handle format property', function() {
      var Type = transform({
        type: 'string',
        format: 'email'
      }).type;
      eq(getKind(Type), 'subtype');
      ok(Type.meta.type === Str);
      ok(Type.meta.predicate === isEmail);
      ok(Type.is('a@b'));
      ko(Type.is(''));
    });
  });

  describe('date format', function() {
    transform.registerFormat('date', Dat);

    it('should throw if duplicated formats are registered', function() {
      assert.throws(
        function() {
          transform.registerFormat('date', Dat);
        },
        function(err) {
          if (
            err instanceof Error &&
            err.message === '[tcomb] [tcomb-json-schema] Duplicated format date'
          ) {
            return true;
          }
        }
      );
    });

    it('should handle date', function() {
      var Type = transform({
        type: 'string',
        format: 'date',
        default: '',
        description: 'Date of your departure'
      }).type;
      eq(getKind(Type), 'irreducible');
      ok(Type === Dat);
      ok(Type.is(new Date('2000-10-23')));
      ko(Type.is('2000.10.23'));
    });
  });

  describe('registerType', function() {
    var Str10 = t.subtype(
      t.Str,
      function(s) {
        return s.length <= 10;
      },
      'Str10'
    );

    transform.registerType('string10', Str10);

    it('should throw if duplicated types are registered', function() {
      assert.throws(
        function() {
          transform.registerType('string10', Str10);
        },
        function(err) {
          if (
            err instanceof Error &&
            err.message ===
              '[tcomb] [tcomb-json-schema] Duplicated type string10'
          ) {
            return true;
          }
        }
      );
    });

    it('should throw if a reserved type is register', function() {
      assert.throws(
        function() {
          transform.registerType('string', Str10);
        },
        function(err) {
          if (
            err instanceof Error &&
            err.message === '[tcomb] [tcomb-json-schema] Reserved type string'
          ) {
            return true;
          }
        }
      );
    });

    it('should handle type property', function() {
      var Type = transform({
        type: 'string10'
      });
      eq(getKind(Type), 'subtype');
      ok(Type.meta.type === Str);
      ok(Type.is('abcdefghij'));
      ko(Type.is('abcdefghijk'));
    });
  });
});
