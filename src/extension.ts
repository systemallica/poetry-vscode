import * as vscode from "vscode";
import fetch from "node-fetch";
import util = require("util");
import path = require("path");
const exec = util.promisify(require("child_process").exec);

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
          const installed = await getInstalledVersion(name, document.uri.path);
          const latest = await getPypiVersion(name);
          contents = [
            `Package: ${name} - Installed: ${installed} - Latest: ${latest}`,
          ];
        }
        return {
          contents: contents,
        };
      },
    }
  );
}

async function getInstalledVersion(
  name: string,
  filepath: string
): Promise<string> {
  const cwd = path.dirname(filepath);
  // TODO: get pip from currently activated venv
  const pipPath = path.join(cwd, ".venv/bin/pip");
  let version = "not installed";
  try {
    const { stdout, _ } = await exec(`${pipPath} show ${name}`, {
      cwd: `${cwd}`,
    });
    version = stdout.split("\n")[1].replace("Version: ", "");
  } catch (e) {
    console.error(e);
  }
  return version;
}

async function getPypiVersion(name: string): Promise<string> {
  const response = await fetch(`https://pypi.org/pypi/${name}/json`);
  const json = await response.json();
  return json["info"]["version"];
}
