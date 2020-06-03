'use strict';

import { workspace, TextDocument, Uri, Range, Position, TextLine} from 'vscode';
import * as fs from "fs";
import * as path from "path";

/**
 * 递归判断并获取项目目录
 * @param dir 当前目录
 * @param fileName 文件完整地址
 */
export function getProDir(dir: string, fileName: string): string {
    // 终止条件, 如果目录下没有my文件夹则当前目录为项目目录
    if (!fs.existsSync(path.join(dir, 'my'))) {
        return dir;
    }
    // 获取文件所在下一级目录
    let prefixDir = path.dirname(fileName).replace(dir + path.sep, '');
    let nextDir = prefixDir.indexOf(path.sep) !== -1 ? prefixDir.substring(0, prefixDir.indexOf(path.sep)) : prefixDir;
    // 递归执行
    return getProDir(path.join(dir, nextDir), fileName);
}

/**
 * 获取L文件路径
 * @param text
 * @param document
 */
export function getLFilePath(
    document: TextDocument, text: string
): {name: string, filePath: string, fileUri: Uri} | null {
    let dir = workspace.getWorkspaceFolder(document.uri);
    if (dir) {
        let proDir: string;
        proDir = getProDir(dir.uri.fsPath, document.fileName);
        if (proDir) {
            // 优先查找MY下的library目录
            let filePath: string | null;
            filePath = findFileExists([
                path.join(proDir, '..', 'my', 'library', text + '.class.php'),
                path.join(proDir, 'library', text + '.class.php'),
            ]);
            if (filePath) {
                return {
                    "name": text,
                    "filePath": filePath,
                    "fileUri": Uri.file(filePath),
                }
            }
        }
    }

    return null;
}

/**
 * 获取DBService文件路径
 * @param document
 * @param module
 * @param controller
 * @param action
 */
export function getDBFilePath(
    document: TextDocument, module: string, controller: string, action: string
): {name: string, filePath: string, fileUri: Uri} | null  {
    let dir = workspace.getWorkspaceFolder(document.uri);
    if (dir) {
        let proDir: string;
        proDir = getProDir(dir.uri.fsPath, document.fileName);
        if (proDir) {
            // 优先查找项目下的library目录
            let filePath: string | null;
            filePath = findFileExists([
                path.join(
                    proDir,
                    '..',
                    'dataservice',
                    'apps',
                    module.toLowerCase(),
                    'controller',
                    controller + 'Controller.php'
                )
            ]);
            if (filePath) {
                return {
                    "name": [module, controller, action].join('.'),
                    "filePath": filePath,
                    "fileUri": Uri.file(filePath),
                }
            }
        }
    }
    return null;
}

/**
 * 从文件组中查找首个文件存在的文件名
 * @param fileNames 文件的完整地址
 */
export function findFileExists(fileNames: Array<string>): string | null {
    for (let i = 0; i < fileNames.length; i++) {
        if (fs.existsSync(fileNames[i])) {
            return fileNames[i];
        }
    }
    return null;
}

export function getLineNumber(text: string, path: string): number {
    let lineNum:number = 0;
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        let lines = content.split("\n");
        lines.some(line => {
            lineNum++;
            if (line.toLowerCase().includes('function ' + text.toLowerCase() + '(')) {
                return true;
            }
        });
    }

    return lineNum;
}

/**
 * Get range coordinates of matching text
 * @param line 
 * @param matchText 
 * @param startIndex 
 */
export function getLinkRange(line: TextLine, matchText: string, startIndex: number): Range {
    // 解决行多个符合值导致范围错误问题
    let text = line.text.substring(startIndex);
    let start = new Position(line.lineNumber, text.indexOf(matchText) + startIndex);
    let end = start.translate(0, matchText.length);
    return new Range(start, end)
}


/**
 * Parsing regular matching text
 * @param matchStr 
 */
export function parseLFuncMathStr(matchStr: string): {library: string, func: string, param: string}  {
    let LInfo = { 
        'library': '',
        'func': '',
        'param': '',
    }

    if (matchStr === '') {
        return LInfo;
    }

    // 用->符分割
    let arr = matchStr.split('->');
    let before = arr[0];
    let after = arr.length >= 2 ? arr[1] : '';

    // 获取library
    let matchRes = before.match(/L\(('|")(.*?)('|")/g);
    if (matchRes) {
        let match = matchRes[0];
        LInfo.library = match.substring(3, match.length - 1)
    }

    // 获取func
    matchRes = after.match(/(.*?)\(/g);
    if (matchRes) {
        let match = matchRes[0];
        LInfo.func = match.substring(0, match.length - 1)
    }

    // 获取params
    if (LInfo.library === 'DBService') {
        matchRes = after.match(/api\(('|")(.*?)('|")/g);
        if (matchRes) {
            let match = matchRes[0];
            LInfo.param = match.substring(5, match.length - 1)
        }
    }
    return LInfo;
}
