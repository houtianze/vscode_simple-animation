'use strict'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
const parseDuration = require('parse-duration')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    //console.log('SimpleAnimation is now active!')

    let simpleAnimation = new SimpleAnimation()
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    /*
    let cmdDisposable = vscode.commands.registerCommand('extension.toggleAnimation', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!')
    })

    context.subscriptions.push(cmdDisposable)
    */
    context.subscriptions.push(simpleAnimation)
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class SimpleAnimation {
    // consts
    private DelayThresholdInMs = 500 // reduce setDecorations() frequency

    // settings
    private enabled: boolean
    private showDurationInMs: number
    private changeColor: boolean

    private editor: vscode.TextEditor = null
    private disposable: vscode.Disposable = null
    private configSubscriptions: vscode.Disposable[] = null
    private lastMoveTime = 0
    private lastCursorPosition = new vscode.Position(0, 0)
    private currentHue = 0

    constructor() {
        vscode.workspace.onDidChangeConfiguration(this.changeConfig, this, this.configSubscriptions)
        this.changeConfig()
    }

    dispose() {
        if (this.disposable) {
            this.disposable.dispose()
            this.disposable = null
        }
        if (this.configSubscriptions) {
            this.configSubscriptions.forEach((disposable: vscode.Disposable) => {
                disposable.dispose()
            })
        }
    }

    private changeConfig() {
        let config = vscode.workspace.getConfiguration('simpleAnimation')
        this.enabled = config.get<boolean>('enabled', true)
        this.showDurationInMs = parseDuration(config.get<string>('showDuration', '500ms'))
        this.changeColor = config.get<boolean>('changeColor', true)
        if (this.enabled) {
            if (!this.disposable) {
                // subscribe to selection change and editor activation events
                let subscriptions: vscode.Disposable[] = []
                vscode.window.onDidChangeActiveTextEditor(this.updateEditor, this, subscriptions)
                vscode.window.onDidChangeTextEditorSelection(this.onCursorMoved, this, subscriptions)
                //vscode.workspace.onDidChangeTextDocument(this.onCursorMoved, this, subscriptions)
                this.disposable = vscode.Disposable.from(...subscriptions)
            }
        } else {
            if (this.disposable) {
                this.disposable.dispose()
                this.disposable = null
            }
        }
    }

    private updateEditor(e: vscode.TextEditor) {
        this.editor = e
    }

    private onCursorMoved() {
        //console.log('--', this.editor.selection.active.line, this.editor.selection.active.character)
        var now = Date.now()
        if (now - this.lastMoveTime < this.DelayThresholdInMs) {
            return
        }
        var decoOption = {
            textDecoration: `none;font-weight: bold`,
            light: {},
            dark: {}
        }
        if (this.changeColor) {
            var h = Math.round(Math.random() * 360)
            var s = Math.round(Math.random() * 100)
            var lr = Math.random()
            var ll = lr * 50
            var ld = lr * 50 + 50
            decoOption.light = {
                color: `hsl(${h},${s}%,${ll}%)`
            }
            decoOption.dark = {
                color: `hsl(${h},${s}%,${ld}%)`
            }
        }
        var deco = vscode.window.createTextEditorDecorationType(decoOption)
        let curPos = this.editor.selection.active
        let startPos = this.lastCursorPosition
        let endPos = new vscode.Position(curPos.line, curPos.character + 1)
        //console.log('start:', startPos.line, startPos.character)
        //console.log('end  :', endPos.line, endPos.character)
        let cursel = new vscode.Selection(startPos, endPos)
        let selections = [cursel]
        this.editor.setDecorations(deco, selections)
        setTimeout(function(
            thisarg: SimpleAnimation,
            dec: vscode.TextEditorDecorationType,
            sels: vscode.Selection[]) {
            if (thisarg.editor) {
                thisarg.editor.setDecorations(dec, [])
            }
            dec.dispose()
        }, this.showDurationInMs, this, deco, selections)
        this.lastMoveTime = now
        this.lastCursorPosition = new vscode.Position(endPos.line, endPos.character)
    }
}