'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    Range,
    Uri
} from "vscode"

import * as util from '../util';

// MY_L调用正则
// 匹配如下情况, xxx用单引号或双引号包围
// L(xxx)->xxx(xxx, xxx)
// L(xxx)->xxx(xxx)
// L(xxx)->xxx(xxx
// L(xxx)->xxx()
// L(xxx, xxx)
// L(xxx)
let MY_L_REG = /L\(('|")(.*?)('|")(\)->(.*?)\(('|"|)(.*?)(,|\)|$)|,(.*?)\)|\)|)/g;

export default class LinkProvider implements vsDocumentLinkProvider {
    /**
     * provideDocumentLinks
     */
    public provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
        let documentLinks = [];
        var index = 0;
        let linesCount = document.lineCount;

        while (index < linesCount) {
            let line = document.lineAt(index);
            let result = line.text.match(MY_L_REG);
            if (result !== null) {
                for (let item of result) {
                    let matchIndex = line.text.indexOf(item);
                    let LInfo = util.parseLFuncMathStr(item);
                    let file = null;
                    // 为library名称添加链接
                    let library = LInfo.library;
                    if (library) {
                        file = util.getLFilePath(document, library);
                        if (file) {
                            let range = util.getLinkRange(line, library, matchIndex);
                            let link = new MyLink(range, file.fileUri, file.filePath, library, '')
                            documentLinks.push(link);
                        }
                    }
                    // 为func名称添加链接
                    let func = LInfo.func;
                    if (library && func && file) {
                        let range = util.getLinkRange(line, func, matchIndex);
                        documentLinks.push(new MyLink(range, file.fileUri, file.filePath, library, func));
                    }
                    // 为dbservice api参数添加链接
                    let param = LInfo.param;
                    if (library && func && file && library === 'DBService' && param !== '') {
                        let paramsArr = param.split('.');
                        if (paramsArr.length === 3) {
                            let module = paramsArr[0];
                            let controller = paramsArr[1];
                            let action = paramsArr[2];
                            file = util.getDBFilePath(document, module, controller, action);
                            if (file) {
                                let range = util.getLinkRange(line, param, matchIndex);
                                documentLinks.push(new MyLink(range, file.fileUri, file.filePath, controller, action));
                            }
                        }
                    }
                }
            }
            index++;
        }
        return documentLinks;
    }

    /**
     * resolveDocumentLink
     */
    public resolveDocumentLink(link: MyLink): ProviderResult<DocumentLink> {
        let path = link.filePath;
        let lineNum = 0;
        if (link.funcName) {
            lineNum = util.getLineNumber(link.funcName, link.filePath);
        }
        path += "#" + lineNum;
        link.target = Uri.parse("file:" + path);
        return link;
    }
}


export class MyLink extends DocumentLink {
    filePath: string;
    fileName: string;
    funcName: string;
    constructor(range: Range, target: Uri, filePath: string, fileName: string, funcName: string) {
      super(range);
      this.filePath = filePath;
      this.fileName = fileName;
      this.funcName = funcName;
    }
}
