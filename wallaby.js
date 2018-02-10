module.exports = function(wallaby) {
  return {
    files: ['index.js', 'util.js'],

    env: {
      type: 'node'
    },

    tests: ['test/test.js']
    // for node.js tests you need to set env property as well
    // https://wallabyjs.com/docs/integration/node.html
  };
};
