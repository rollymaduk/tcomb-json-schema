'use strict';
var validate = require('validate.js');

var t = require('tcomb');
var fcomb = require('fcomb');
var util = require('./util');

var SchemaType = t.enums.of(
  'null string number integer boolean object array',
  'SchemaType'
);

function and(f, g) {
  return f ? fcomb.and(f, g) : g;
}

var types = {
  string: function(s) {
    var constraint;
    var predicate;
    var type;
    if (s.hasOwnProperty('enum')) {
      constraint = { inclusion: s['enum'] };
      if (t.Array.is(s['enum'])) {
        type = t.enums.of(s['enum']);
      } else {
        type = t.enums(s['enum']);
      }
      return { type: type, constraint: constraint };
    }
    if (s.hasOwnProperty('minLength')) {
      predicate = and(predicate, fcomb.minLength(s.minLength));
      constraint = { minimum: s.minLength };
    }
    if (s.hasOwnProperty('maxLength')) {
      predicate = and(predicate, fcomb.maxLength(s.maxLength));
      constraint = { maximum: s.maxLength };
    }
    if (s.hasOwnProperty('pattern')) {
      var patternMatch = /^\/(.+)\/([gimuy]*)$/.exec(s.pattern);
      if (patternMatch === null) {
        predicate = and(predicate, fcomb.regexp(new RegExp(s.pattern)));
      } else {
        predicate = and(
          predicate,
          fcomb.regexp(new RegExp(patternMatch[1], patternMatch[2]))
        );
      }
      constraint = s.message
        ? { format: s.pattern, message: s.message }
        : { format: s.pattern };
    }
    if (s.hasOwnProperty('format')) {
      t.assert(
        formats.hasOwnProperty(s.format),
        '[tcomb-json-schema] Missing format ' +
          s.format +
          ', use the (format, predicate) API'
      );
      if (t.isType(formats[s.format])) {
        type = formats[s.format];
        return { type: type, constraint: constraint };
      }
      predicate = and(predicate, formats[s.format]);
    }
    type = predicate ? t.subtype(t.String, predicate) : t.String;
    return { type: type, constraint: constraint };
  },

  number: function(s) {
    var predicate;
    var constraint;
    var type;
    if (s.hasOwnProperty('minimum')) {
      predicate = s.exclusiveMinimum
        ? and(predicate, fcomb.gt(s.minimum))
        : and(predicate, fcomb.gte(s.minimum));
      constraint = s.exclusiveMinimum
        ? { greaterThan: s.minimum }
        : { greaterThanOrEqualTo: s.minimum };
    }
    if (s.hasOwnProperty('maximum')) {
      predicate = s.exclusiveMaximum
        ? and(predicate, fcomb.lt(s.maximum))
        : and(predicate, fcomb.lte(s.maximum));
      constraint = s.exclusiveMaximum
        ? { lessThan: s.maximum }
        : { lessThanOrEqualTo: s.maximum };
    }
    if (s.hasOwnProperty('integer') && s.integer) {
      predicate = and(predicate, util.isInteger);
      constraint = { onlyInteger: true };
    }
    type = predicate ? t.subtype(t.Number, predicate) : t.Number;
    return { type: type, constraint: constraint };
  },

  integer: function(s) {
    var predicate;
    var constraint;
    var type;
    if (s.hasOwnProperty('minimum')) {
      predicate = s.exclusiveMinimum
        ? and(predicate, fcomb.gt(s.minimum))
        : and(predicate, fcomb.gte(s.minimum));
      constraint = s.exclusiveMinimum
        ? { greaterThan: s.minimum }
        : { greaterThanOrEqualTo: s.minimum };
    }
    if (s.hasOwnProperty('maximum')) {
      predicate = s.exclusiveMaximum
        ? and(predicate, fcomb.lt(s.maximum))
        : and(predicate, fcomb.lte(s.maximum));
      constraint = s.exclusiveMaximum
        ? { lessThan: s.maximum }
        : { lessThanOrEqualTo: s.maximum };
    }
    type = predicate ? t.subtype(util.Int, predicate) : util.Int;
    return { type: type, constraint: constraint };
  },

  boolean: function() {
    var type = t.Boolean;
    var constraint;
    return { type: type, constraint: constraint };
  },

  object: function(s) {
    var props = {};
    var constraint = {};
    var options = {};
    var hasProperties = false;
    var type;
    var required = {};
    if (s.required) {
      s.required.forEach(function(k) {
        required[k] = true;
      });
    }
    for (var k in s.properties) {
      if (s.properties.hasOwnProperty(k)) {
        var transformed = transform(s.properties[k]);
        hasProperties = true;
        props[k] =
          required[k] || transformed.type === t.Boolean
            ? transformed.type
            : t.maybe(transformed.type);
        constraint[k] = required[k]
          ? Object.assign(transformed.constraint || {}, { presence: true })
          : transformed.constraint;
        options[k] = {
          error: function(value, path) {
            var item = {};
            var field = path[0];
            item[field] = value;
            var error = validate(item, constraint[k]);
            if (error) {
              return error[field][0];
            }
            return undefined;
          }
        };
      }
    }
    type = hasProperties ? t.struct(props, s.description) : t.Object;
    var result = {
      type: type,
      constraint: constraint,
      options: { fields: options }
    };
    return result;
  },

  array: function(s) {
    var type = t.Array;
    var constraint;
    if (s.hasOwnProperty('items')) {
      var items = s.items;
      if (t.Object.is(items)) {
        type = t.list(transform(items).type);
      } else {
        type = t.tuple(
          items.map(function(item) {
            return transform(item).type;
          })
        );
        return { type: type, constraint: constraint };
      }
    }
    var predicate;
    if (s.hasOwnProperty('minItems')) {
      predicate = and(predicate, fcomb.minLength(s.minItems));
      constraint = { length: { minimum: s.minItems } };
    }
    if (s.hasOwnProperty('maxItems')) {
      predicate = and(predicate, fcomb.maxLength(s.maxItems));
      constraint = { length: { maximum: s.maxItems } };
    }
    type = predicate ? t.subtype(type, predicate) : type;
    return { type: type, constraint: constraint };
  },

  null: function() {
    var constraint;
    var type = util.Null;
    return { type: type, constraint: constraint };
  }
};

var registerTypes = {};

function transform(s) {
  var type = s.type;
  var constraint = [];

  t.assert(t.Object.is(s));
  if (!s.hasOwnProperty('type')) {
    return { type: t.Any, constraint: undefined };
  }

  if (SchemaType.is(type)) {
    return types[type](s);
  }
  if (t.Array.is(type)) {
    type = t.union(
      type.map(function(type) {
        var result = types[type](s);
        constraint.push[result.constraint];
        return result.type;
      })
    );
    return { type: type, constraint: constraint };
  }

  if (registerTypes.hasOwnProperty(type)) {
    return registerTypes[type];
  }

  t.fail('[tcomb-json-schema] Unsupported json schema ' + t.stringify(s));
}

var formats = {};

transform.registerFormat = function registerFormat(format, predicateOrType) {
  t.assert(
    !formats.hasOwnProperty(format),
    '[tcomb-json-schema] Duplicated format ' + format
  );
  formats[format] = predicateOrType;
};

transform.resetFormats = function resetFormats() {
  formats = {};
};

transform.registerType = function registerType(typeName, type) {
  t.assert(
    !registerTypes.hasOwnProperty(typeName),
    '[tcomb-json-schema] Duplicated type ' + typeName
  );
  t.assert(
    !SchemaType.is(typeName),
    '[tcomb-json-schema] Reserved type ' + typeName
  );
  registerTypes[typeName] = type;
};

transform.resetTypes = function resetTypes() {
  registerTypes = {};
};

module.exports = transform;
