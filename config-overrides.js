const path = require("path");
const { override, babelInclude, addBabelPreset } = require("customize-cra");

module.exports = function (config, env) {
  return Object.assign(
    config,
    override(
      babelInclude([
        /* transpile (converting to es5) code in src/ and shared component library */
        path.resolve("src"),
        path.resolve("node_modules/shared-react-components"),
      ]),
      addBabelPreset("@emotion/babel-preset-css-prop")
    )(config, env)
  );
};
