import express from 'express';
import { credentialsDb } from '../database/db.js';

const router = express.Router();

const PROVIDER_TYPE = 'claude_proxy_config';

// Get Claude API settings
router.get('/claude', async (req, res) => {
    try {
        const creds = credentialsDb.getCredentials(req.user.id, PROVIDER_TYPE);

        const baseUrl = creds.find(c => c.credential_name === 'base_url')?.is_active ?
            creds.find(c => c.credential_name === 'base_url') : null;
        const apiKey = creds.find(c => c.credential_name === 'api_key')?.is_active ?
            creds.find(c => c.credential_name === 'api_key') : null;

        res.json({
            baseUrl: baseUrl ? { id: baseUrl.id, name: baseUrl.credential_name, value: baseUrl.credential_value, active: true } : null,
            apiKey: apiKey ? { id: apiKey.id, name: apiKey.credential_name, active: true } : null
        });
    } catch (error) {
        console.error('Error fetching Claude settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update or create Claude API settings
router.post('/claude', async (req, res) => {
    try {
        const { baseUrl, apiKey } = req.body;
        const userId = req.user.id;

        // Helper to update or create
        const upsertSetting = (name, value) => {
            if (value === undefined) return;

            const existing = credentialsDb.getCredentials(userId, PROVIDER_TYPE)
                .find(c => c.credential_name === name);

            if (existing) {
                // We don't have a direct updateValue in credentialsDb, so we delete and recreate 
                // OR we can just create a new one and the bridge will take the most recent active one.
                // For simplicity and since credentialsDb.getActiveCredential uses ORDER BY created_at DESC,
                // we just push a new one.
                credentialsDb.createCredential(userId, name, PROVIDER_TYPE, value, `UI Updated: ${new Date().toISOString()}`);
            } else {
                credentialsDb.createCredential(userId, name, PROVIDER_TYPE, value, 'Initial UI Setup');
            }
        };

        if (baseUrl) upsertSetting('base_url', baseUrl);
        if (apiKey) upsertSetting('api_key', apiKey);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving Claude settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

export default router;
