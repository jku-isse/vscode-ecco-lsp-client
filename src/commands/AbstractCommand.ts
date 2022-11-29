import { Disposable } from "vscode-languageclient";
import * as vscode from 'vscode';
import logger from "../logger";

export default abstract class AbstractCommand {
    private command: string;

    constructor (command: string) {
        this.command = command;
    }

    public registerCommand(): Disposable {
        return vscode.commands.registerCommand(this.command, async () => {
            logger.info(`Invoke command ${this.command}`);
            await this.runCommand();
        });
    }

    protected abstract runCommand(): Thenable<void>;
}
