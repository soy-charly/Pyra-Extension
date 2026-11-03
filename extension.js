const { execFile } = require("node:child_process");
const path = require("node:path");
const vscode = require("vscode");
const { registerLanguageFeatures } = require("./language-features");

const diagnostics = vscode.languages.createDiagnosticCollection("zenvik");
let output;

function activeSource() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== "zenvik") {
    void vscode.window.showErrorMessage("Open a .zenvik file first.");
    return undefined;
  }
  return editor.document.uri.fsPath;
}

function compilerPath() {
  return vscode.workspace.getConfiguration("zenvikLanguage").get("compilerPath", "zenvik");
}

function updateDiagnostics(file, text) {
  const uri = vscode.Uri.file(file);
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^(.*):(\d+):(\d+):\s*(error|warning):\s*(.*)$/.exec(line);
    if (!match || path.resolve(match[1]) !== path.resolve(file)) continue;
    const position = new vscode.Position(Number(match[2]) - 1, Number(match[3]) - 1);
    const range = new vscode.Range(position, position.translate(0, 1));
    entries.push(new vscode.Diagnostic(
      range,
      match[5],
      match[4] === "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
    ));
  }
  diagnostics.set(uri, entries);
}

function invokeCompiler(file, args) {
  return new Promise((resolve) => {
    execFile(
      compilerPath(),
      args,
      { cwd: path.dirname(file), windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const text = `${stdout}${stderr}`;
        updateDiagnostics(file, text);
        resolve({ error, text });
      }
    );
  });
}

async function checkFile() {
  const file = activeSource();
  if (!file) return;
  const { error, text } = await invokeCompiler(file, ["-fsyntax-only", file]);
  if (error) {
    await vscode.window.showErrorMessage("Zenvik check failed. See Problems or the Zenvik output channel.");
    output.appendLine(text);
    output.show(true);
  } else {
    await vscode.window.showInformationMessage("Zenvik check succeeded.");
  }
}

async function compileFile() {
  const file = activeSource();
  if (!file) return;
  const executableName = path.basename(file, path.extname(file)) + (process.platform === "win32" ? ".exe" : "");
  const executable = path.join(path.dirname(file), executableName);
  const { error, text } = await invokeCompiler(file, ["-o", executable, file]);
  if (error) {
    output.appendLine(text);
    output.show(true);
    await vscode.window.showErrorMessage("Zenvik compilation failed. See Problems or the Zenvik output channel.");
  } else {
    await vscode.window.showInformationMessage(`Compiled ${path.basename(executable)}.`);
  }
}

async function runExecutable() {
  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    openLabel: "Run executable"
  });
  if (!selected || selected.length === 0) return;
  const executable = selected[0].fsPath;
  const terminal = vscode.window.createTerminal({
    name: `Zenvik: ${path.basename(executable)}`,
    shellPath: executable,
    cwd: path.dirname(executable)
  });
  terminal.show();
}

function activate(context) {
  output = vscode.window.createOutputChannel("Zenvik");
  registerLanguageFeatures(vscode, context);
  context.subscriptions.push(
    diagnostics,
    output,
    vscode.commands.registerCommand("zenvik.compileFile", compileFile),
    vscode.commands.registerCommand("zenvik.runExecutable", runExecutable),
    vscode.commands.registerCommand("zenvik.checkFile", checkFile)
  );
}

function deactivate() {
  diagnostics.dispose();
  if (output) output.dispose();
}

module.exports = { activate, deactivate };
