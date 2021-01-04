import * as vscode from "vscode";
import fetch from "node-fetch";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "extension.poetryVscode",
    () => {
      // Display a message box to the user
      vscode.window.showInformationMessage("poetry-vscode activated!");
    }
  );

  context.subscriptions.push(disposable);

  // Display a text box on hover inside pyproject.toml files
  vscode.languages.registerHoverProvider(
    { pattern: "**/pyproject.toml" },
    {
      async provideHover(document, position, token) {
        const line = document.lineAt(position.line);
        let contents = [line.text];
        // Matches a semver package(i.e: django = "^3.1.0")
        const re = /^([\w-]+) = "(?:[<>^])?(?:<=)?(?:>=)?([0-9]+)\.([0-9]+)(\.([0-9]+))?(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?"$/i;
        if (line.text.match(re)) {
          const split = line.text.split(" ");
          const name = split[0];
          const version = split[2].replace(/[<>=^"']*/gi, "");
          const latest = await getPypiVersion(name);
          // TODO: get installed version
          contents = [
            `Package: ${name} - Installed: ${version} - Latest: ${latest}`,
          ];
        }
        return {
          contents: contents,
        };
      },
    }
  );
}

async function getPypiVersion(name: string): Promise<string> {
  const response = await fetch(`https://pypi.org/pypi/${name}/json`);
  const json = await response.json();
  return json["info"]["version"];
}
