import * as vscode from 'vscode';

export async function showWorkspacePicker(title: string): Promise<vscode.Uri | undefined> {
    if (vscode.workspace.workspaceFolders?.length === 0) {
        return Promise.resolve(undefined);
    }

    if (vscode.workspace.workspaceFolders?.length === 1) {
        return Promise.resolve(vscode.workspace.workspaceFolders[0].uri);
    }

    return new Promise(resolve => {
        const workspacePick = vscode.window.createQuickPick();
        workspacePick.title = title;
        workspacePick.items = vscode.workspace.workspaceFolders
            ?.map(folder => ({ label: folder.uri.fsPath })) || [];

        const disposables: vscode.Disposable[] = [];
        disposables.push(workspacePick.onDidAccept(() => {
            const fsPath = workspacePick.selectedItems[0].label;
            disposables.forEach(disposable => disposable.dispose());
            workspacePick.dispose();
            
            resolve(vscode.workspace.workspaceFolders?.filter(folder => folder.uri.fsPath === fsPath)[0].uri);
        }));

        disposables.push(workspacePick.onDidHide(() => {
            disposables.forEach(disposable => disposable.dispose());
            workspacePick.dispose();
            resolve(undefined);
        }));

        workspacePick.show();
    });
}
