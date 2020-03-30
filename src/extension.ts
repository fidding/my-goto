// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { languages, ExtensionContext, workspace, window } from 'vscode';
// import HoverProvider from './providers/hoverProvider';
import LinkProvider from './providers/linkProvider';
import * as fs from "fs";
import * as path from "path";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	
	// 当前工作空间同级或上级有my框架激活插件
	if (workspace.rootPath === undefined ||
		(
			!fs.existsSync(path.join(workspace.rootPath, 'my')) &&
			!fs.existsSync(path.join(workspace.rootPath, '..', 'my'))
		)
	) {
		window.showInformationMessage('my-goto: 扩展不可用,当前工作空间同级或上级没有my框架!');
		return null;
	}

	console.log('Congratulations, your extension "my-goto" is now active!');

	let link = languages.registerDocumentLinkProvider(['php'], new LinkProvider());
	context.subscriptions.push(link);

	// hover事件
	// let hover = languages.registerHoverProvider(['php'], new HoverProvider());
	// context.subscriptions.push(hover);
}

// this method is called when your extension is deactivated
export function deactivate() {}