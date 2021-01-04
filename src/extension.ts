import * as vscode from "vscode";
import fetch from "node-fetch";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.poetryVscode",
    () => {
      vscode.window.showInformationMessage("poetry-vscode is active");
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
