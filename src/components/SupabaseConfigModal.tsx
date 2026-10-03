'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, Check, UploadCloud, RefreshCw, Key, Globe, ShieldCheck, Copy } from 'lucide-react';
import { getSupabaseCredentials, resetSupabaseClient } from '@/lib/supabase';
import { dataStore } from '@/lib/storage';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url || '');
      setKey(creds.key || '');
      setStatusMessage(null);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide both Supabase URL and Anon Key.' });
      return;
    }

    try {
      localStorage.setItem('supabase_custom_url', url.trim());
      localStorage.setItem('supabase_custom_key', key.trim());
      resetSupabaseClient();

      setIsTesting(true);
      setStatusMessage({ type: 'info', text: 'Connecting and syncing data with Supabase...' });

      const syncResult = await dataStore.pushLocalToSupabase();
      setIsTesting(false);

      if (syncResult.success) {
        setStatusMessage({ type: 'success', text: 'Connected and synchronized with Supabase database!' });
        onSyncComplete();
      } else {
        setStatusMessage({ type: 'error', text: syncResult.message });
      }
    } catch (err: unknown) {
      setIsTesting(false);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: 'Error: ' + msg });
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('supabase_custom_url');
    localStorage.removeItem('supabase_custom_key');
    resetSupabaseClient();
    setUrl('');
    setKey('');
    setStatusMessage({ type: 'info', text: 'Disconnected. App will use fast local storage.' });
    onSyncComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Supabase Cloud Database</h3>
              <p className="text-xs text-slate-400">100% Free PostgreSQL Cloud Sync & Backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick 3-Step Guide */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Quick 3-Minute Setup:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>Create a free project at <strong className="text-slate-200">supabase.com</strong>.</li>
              <li>Paste and run the SQL table schema from <code className="text-emerald-400">supabase/schema.sql</code>.</li>
              <li>Copy your <strong className="text-slate-200">Project URL</strong> &amp; <strong className="text-slate-200">Anon Public Key</strong> below (or put in <code className="text-slate-200">.env.local</code>).</li>
            </ol>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/30 text-rose-300 border-rose-500/30'
                  : 'bg-blue-950/30 text-blue-300 border-blue-500/30'
              }`}
            >
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Supabase Anon Public API Key</span>
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              {url ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Disconnect &amp; Use Local
                </button>
              ) : <div />}

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Testing &amp; Syncing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Save &amp; Sync Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
