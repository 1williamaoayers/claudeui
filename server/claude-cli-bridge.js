import { spawn } from 'child_process';
import crossSpawn from 'cross-spawn';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Use cross-spawn on Windows for better command execution
const spawnFunction = process.platform === 'win32' ? crossSpawn : spawn;

let activeClaudeProcesses = new Map(); // Track active processes by session ID

async function queryClaudeCLI(command, options = {}, ws) {
    return new Promise(async (resolve, reject) => {
        const { sessionId, projectPath, cwd, model, toolsSettings, skipPermissions } = options;
        let capturedSessionId = sessionId;
        let sessionCreatedSent = false;
        let messageBuffer = '';

        // Build Claude CLI command
        // Use the global 'claude' command
        const args = [];

        if (command && command.trim()) {
            args.push(command);
        }

        // Using simple command mode for now as it's more robust for custom backends
        // If you need more complex session management, we'd use interactive mode but that's harder to parse

        const workingDir = cwd || projectPath || process.cwd();

        console.log('Spawning Claude CLI:', 'claude', args.join(' '));

        // Set up environment inheriting everything
        const env = { ...process.env };

        const claudeProcess = spawnFunction('claude', args, {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env
        });

        const processKey = sessionId || Date.now().toString();
        activeClaudeProcesses.set(processKey, claudeProcess);

        claudeProcess.stdout.on('data', (data) => {
            const output = data.toString();
            // console.log('📤 Claude CLI stdout:', output);

            // Clean up ANSI and specific Claude CLI artifacts for the UI
            const cleanOutput = output.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');

            if (cleanOutput.trim()) {
                ws.send({
                    type: 'claude-response',
                    data: {
                        type: 'content_block_delta',
                        delta: {
                            type: 'text_delta',
                            text: cleanOutput
                        }
                    },
                    sessionId: capturedSessionId || sessionId || null
                });
            }
        });

        claudeProcess.stderr.on('data', (data) => {
            const errorOutput = data.toString();
            console.error('Claude CLI stderr:', errorOutput);
            // We don't always want to send stderr as error to UI as it might contain progress/info
        });

        claudeProcess.on('close', (code) => {
            console.log(`Claude CLI process exited with code ${code}`);
            activeClaudeProcesses.delete(processKey);

            ws.send({
                type: 'claude-complete',
                sessionId: capturedSessionId || sessionId || null,
                exitCode: code
            });

            resolve();
        });

        claudeProcess.on('error', (error) => {
            console.error('Claude CLI process error:', error);
            activeClaudeProcesses.delete(processKey);
            ws.send({
                type: 'claude-error',
                error: error.message,
                sessionId: capturedSessionId || sessionId || null
            });
            reject(error);
        });

        // End stdin to prevent hanging if it waits for input
        claudeProcess.stdin.end();
    });
}

function abortClaudeCLISession(sessionId) {
    const process = activeClaudeProcesses.get(sessionId);
    if (process) {
        process.kill('SIGTERM');
        activeClaudeProcesses.delete(sessionId);
        return true;
    }
    return false;
}

export {
    queryClaudeCLI,
    abortClaudeCLISession
};
