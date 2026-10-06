const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { project } = require('./helpers.cjs');

const removedModules = [
  'src/components/BekalScene', 'src/components/BekalFallback',
  'src/lib/bekal-model', 'src/lib/bekal-motion', 'src/lib/bekal-scene',
  'src/lib/crowd-model', 'src/lib/crowd-scene', 'src/lib/crowd-audio',
];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

test('retired scene experiments are absent and no runtime imports point to them', () => {
  for (const name of removedModules) {
    for (const extension of ['.ts', '.tsx']) {
      assert.equal(fs.existsSync(path.join(project, name + extension)), false, name);
    }
  }
  for (const file of sourceFiles(path.join(project, 'src'))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function check(specifier) {
      if (!specifier || !ts.isStringLiteral(specifier)) return;
      const value = specifier.text;
      const resolved = value.startsWith('@/') ? path.join(project, 'src', value.slice(2))
        : value.startsWith('.') ? path.resolve(path.dirname(file), value) : null;
      if (!resolved) return;
      const relative = path.relative(project, resolved).replaceAll(path.sep, '/').replace(/\.tsx?$/, '');
      assert.ok(!removedModules.includes(relative), `${path.relative(project, file)} imports ${value}`);
    }
    function visit(node) {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) check(node.moduleSpecifier);
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) check(node.argument.literal);
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
        || ts.isIdentifier(node.expression) && node.expression.text === 'require')) check(node.arguments[0]);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
