const babel = require('@babel/core');
const linkerPluginPath = require.resolve('@angular/compiler-cli/linker/babel');

const angularPackages = [
  '@angular',
  '@angular-devkit',
  'rxjs',
  'tslib',
  'zone.js',
];

/**
 * Custom loader to process Angular libraries with the Angular Linker
 */
module.exports = async function angularLinkerLoader(source, sourceMap) {
  const callback = this.async();
  const resourcePath = this.resourcePath;
  
  // Check if the file is from an Angular-related package
  const isAngularPackage = angularPackages.some(
    (pkg) => resourcePath.includes(`/node_modules/${pkg}/`)
  );
  
  if (!isAngularPackage) {
    callback(null, source, sourceMap);
    return;
  }

  try {
    const result = await babel.transformAsync(source, {
      babelrc: false,
      configFile: false,
      filename: resourcePath,
      inputSourceMap: sourceMap,
      plugins: [[linkerPluginPath, { jitMode: false }]],
      compact: false,
      sourceMaps: true,
    });

    callback(null, result.code, result.map);
  } catch (error) {
    console.error(`Angular Linker error for ${resourcePath}:`, error.message);
    callback(null, source, sourceMap);
  }
};
