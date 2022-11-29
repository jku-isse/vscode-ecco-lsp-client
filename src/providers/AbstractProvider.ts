import { Disposable } from "vscode-languageclient";

export default interface AbstractProvider {
    registerProvider(): Disposable;
}