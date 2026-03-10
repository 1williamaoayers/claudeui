import { spawn } from 'child_process';
import crossSpawn from 'cross-spawn';
import { promises as fs } from 'fs';
import path from 'path';
import { credentialsDb } from './database/db.js';

// Use cross-spawn on Windows for better command execution
const spawnFunction = process.platform === 'win32' ? crossSpawn : spawn;

let activeClaudeProcesses = new Map(); // Track active processes by session ID

async function queryClaudeCLI(command, options = {}, ws, user) {
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

        // [CUSTOM] Use the selected model if specified
        if (model) {
            console.log(`[DYNAMIC] Using model: ${model}`);
            args.push('--model', model);
        }

        console.log('Spawning Claude CLI:', 'claude', args.join(' '));

        // Set up environment inheriting everything
        const env = { ...process.env };

        // [CUSTOM] Inject dynamic configuration from database if available
        if (user && user.id) {
            const PROVIDER_TYPE = 'claude_proxy_config';
            const dbBaseUrl = credentialsDb.getActiveCredential(user.id, PROVIDER_TYPE);
            // Note: getActiveCredential returns the single most recent active value. 
            // In our route we save both base_url and api_key as separate entries in credentialsDb?
            // Wait, I need to fetch them by name. 
            // Let's refine the DB fetch logic to be more specific.

            const creds = credentialsDb.getCredentials(user.id, PROVIDER_TYPE);
            const baseUrl = creds.find(c => c.credential_name === 'base_url' && c.is_active)?.credential_value;
            const apiKey = creds.find(c => c.credential_name === 'api_key' && c.is_active)?.credential_value;

            if (baseUrl) {
                console.log(`[DYNAMIC] Overriding ANTHROPIC_BASE_URL: ${baseUrl}`);
                env.ANTHROPIC_BASE_URL = baseUrl;
            }
            if (apiKey) {
                console.log(`[DYNAMIC] Overriding ANTHROPIC_AUTH_TOKEN: (active)`);
                env.ANTHROPIC_AUTH_TOKEN = apiKey;
            }
        }

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

function isClaudeCLISessionActive(sessionId) {
    return activeClaudeProcesses.has(sessionId);
}

function abortClaudeCLISession(sessionId) {
    if (!sessionId) return false;
    const process = activeClaudeProcesses.get(sessionId);
    if (process) {
        console.log(`[INFO] Aborting CLI process for session: ${sessionId}`);
        process.kill('SIGTERM');
        activeClaudeProcesses.delete(sessionId);
        return true;
    }
    return false;
}

export {
    queryClaudeCLI,
    abortClaudeCLISession,
    isClaudeCLISessionActive
};
