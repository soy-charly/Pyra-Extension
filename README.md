# Zenvik Language for VS Code

<p align="center">
  <img src="./icon.png" alt="Zenvik logo" width="180">
</p>

The extension recognizes `.zenvik` files, provides TextMate syntax highlighting, snippets for functions/branches/loops/collections, built-in and local-function completion, hover documentation, function signature help, `#` line comments, automatic delimiter pairs, brace indentation, and three commands:

- **Zenvik: Compile File** — compiles the active file beside its source.
- **Zenvik: Check File** — runs the compiler's syntax/semantic-only mode.
- **Zenvik: Run Executable** — opens a picker to run a compiled executable in the integrated terminal.

The `.zenvik` language contribution registers [`icons/Zenvik-Logo.svg`](./icons/Zenvik-Logo.svg) as its icon for both light and dark themes. No file-icon theme configuration is required.

Set `zenvikLanguage.compilerPath` to the compiler executable if `zenvik` is not available on `PATH`. Compiler source diagnostics are published to VS Code's Problems panel. Completion, hover, and signature help use the built-ins and top-level function definitions in the current file; variable completion is inferred from simple assignments, loop variables, and function parameters. These features do not require an LSP server.

Package and install from the repository root:

```sh
npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository
code --install-extension ./zenvik-language-0.1.0.vsix
```

The extension package includes the language icon, so the `.zenvik` icon is available when the extension is installed.

The compiler currently does not implement interpolated strings, so the grammar does not highlight them as a language feature. Cross-file navigation, type inference, and real-time diagnostics from an LSP server are not implemented.
