'use strict';

import {
    HoverProvider as vsHoverProvider,
    TextDocument,
    Position,
    ProviderResult,
    Hover,
    workspace
} from "vscode";

let reg = /(['"])[^'"]*\1/;
export default class HoverProvider implements vsHoverProvider {
    provideHover(document: TextDocument, position: Position): ProviderResult<Hover> {
        let linkRange = document.getWordRangeAtPosition(position, reg);
        if (linkRange) {
            let filePath = '';
            // let filePath = util.getFilePath(document.getText(linkRange), document);
            let linkText = document.getText(linkRange);
            let workspaceFolder = workspace.getWorkspaceFolder(document.uri);
            if (filePath != null && workspaceFolder && linkText) {
                return new Hover(workspaceFolder.name + ':' + linkText);
            }
        }
        return;
    }
}