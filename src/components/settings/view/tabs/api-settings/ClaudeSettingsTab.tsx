import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../../../utils/api';
import { Button, Input } from '../../../../../shared/view/ui';
import { Loader2, Save, Globe, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ClaudeSettingsTab() {
    const { t } = useTranslation('settings');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.providerSettings.getClaude();
            if (response.ok) {
                const data = await response.json();
                if (data.baseUrl?.value) {
                    setBaseUrl(data.baseUrl.value);
                }
                // API key is not returned for security reasons
            }
        } catch (error) {
            console.error('Failed to fetch Claude settings:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            const response = await api.providerSettings.saveClaude({
                baseUrl: baseUrl.trim() || undefined,
                apiKey: apiKey.trim() || undefined
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully. Changes will apply to new chats.' });
                setApiKey(''); // Clear API key field for security
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading settings...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Claude Driver Settings (Hot Reload)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Override the default <code>ANTHROPIC_BASE_URL</code> and <code>ANTHROPIC_AUTH_TOKEN</code>.
                    These settings are stored in the database and take precedence over <code>.env</code> files.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        API Base URL
                    </label>
                    <Input
                        placeholder="https://api.anthropic.com (or your proxy)"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground italic">
                        Leave epmty to use system default.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Key className="h-4 w-4 text-amber-500" />
                        API Key (Auth Token)
                    </label>
                    <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground italic">
                        Input a new key to override. We don't display the current key for security.
                    </p>
                </div>

                {message && (
                    <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}

                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Configuration
                </Button>
            </form>

            <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                    Note: This feature is only available in our custom <b>Claude Code UI</b> build.
                    It works by intercepting the CLI bridge commands and injecting custom environment variables before spawning the process.
                </p>
            </div>
        </div>
    );
}
