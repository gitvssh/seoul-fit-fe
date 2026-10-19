import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const DATA_PATTERNS = ['src/shared/i18n/messages/*.ts', 'app/about/_components/about-content.ts'];

function dataExpression(node) {
  if (ts.isLiteralExpression(node) || ts.isIdentifier(node)) return true;
  if (
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
      node.kind
    )
  )
    return true;
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    return dataExpression(node.expression);
  if (ts.isPrefixUnaryExpression(node))
    return (
      [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(node.operator) &&
      ts.isNumericLiteral(node.operand)
    );
  if (ts.isPropertyAccessExpression(node)) return dataExpression(node.expression);
  if (ts.isTemplateExpression(node))
    return node.templateSpans.every(span => dataExpression(span.expression));
  if (ts.isArrayLiteralExpression(node)) return node.elements.every(dataExpression);
  if (ts.isObjectLiteralExpression(node))
    return node.properties.every(
      property =>
        (ts.isPropertyAssignment(property) &&
          !ts.isComputedPropertyName(property.name) &&
          dataExpression(property.initializer)) ||
        (ts.isShorthandPropertyAssignment(property) && !property.objectAssignmentInitializer)
    );
  return false;
}

export function isDataModule(source, filename = 'catalog.ts') {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  if (tree.parseDiagnostics.length) return false;
  return tree.statements.every(statement => {
    if (ts.isImportDeclaration(statement)) return Boolean(statement.importClause);
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return true;
    if (ts.isExportDeclaration(statement)) return !statement.moduleSpecifier;
    if (ts.isExportAssignment(statement)) return dataExpression(statement.expression);
    if (
      !ts.isVariableStatement(statement) ||
      !(statement.declarationList.flags & ts.NodeFlags.Const)
    )
      return false;
    return statement.declarationList.declarations.every(
      declaration =>
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        dataExpression(declaration.initializer)
    );
  });
}

export function validateScope(root) {
  const properties = new Map(
    fs
      .readFileSync(path.join(root, 'sonar-project.properties'), 'utf8')
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
  const declared = properties.get('sonar.cpd.exclusions')?.split(',').sort();
  if (JSON.stringify(declared) !== JSON.stringify([...DATA_PATTERNS].sort()))
    throw new Error('Duplication scope must match the reviewed data-only paths');
  const directory = path.join(root, 'src/shared/i18n/messages');
  const files = fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.ts'))
    .map(name => path.join(directory, name));
  files.push(path.join(root, DATA_PATTERNS[1]));
  if (files.length < 2) throw new Error('No translation data was checked');
  for (const file of files) {
    if (!isDataModule(fs.readFileSync(file, 'utf8'), file))
      throw new Error(
        `Executable logic is forbidden in duplication-exempt data: ${path.relative(root, file)}`
      );
  }
  return files.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log(`Sonar data-only scope verified: ${validateScope(process.cwd())} files`);
}
