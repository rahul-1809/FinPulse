'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet, RotateCcw, Check } from 'lucide-react';
import { dataStore } from '@/lib/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  onDataImported: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onDataImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportJSON = () => {
    const jsonStr = dataStore.exportDataJSON();
    downloadFile(jsonStr, `finpulse-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleExportMonthCSV = () => {
    const csvStr = dataStore.exportTransactionsCSV(currentMonth);
    downloadFile(csvStr, `finpulse-transactions-${currentMonth}.csv`, 'text/csv');
  };

  const handleExportAllCSV = () => {
    const csvStr = dataStore.exportTransactionsCSV();
    downloadFile(csvStr, `finpulse-transactions-all.csv`, 'text/csv');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = dataStore.importDataJSON(text);
        if (result.success) {
          setImportStatus('Backup restored successfully!');
          onDataImported();
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportStatus('Error: ' + result.message);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setImportStatus('Failed to read file: ' + msg);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset to sample demo data? Any unbacked-up changes will be restored to default.')) {
      dataStore.resetToDefaults();
      onDataImported();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Data Backup &amp; Export</h3>
              <p className="text-xs text-slate-400">Export or restore your financial records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Export Data</span>
            
            <button
              onClick={handleExportMonthCSV}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-400">
                    Export {currentMonth} CSV
                  </div>
                  <div className="text-xs text-slate-400">Spreadsheet of this month&apos;s transactions</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <FileJson className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-blue-400">
                    Full JSON Backup
                  </div>
                  <div className="text-xs text-slate-400">Includes accounts, opening balances &amp; all data</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
            </button>
          </div>

          <div className="pt-2 space-y-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Restore &amp; Reset</span>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-teal-400" />
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-teal-400">
                    Restore from JSON Backup
                  </div>
                  <div className="text-xs text-slate-400">Upload a previously exported backup file</div>
                </div>
              </div>
              <Upload className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
            </button>

            <button
              onClick={handleResetDefaults}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 hover:border-rose-500/30 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-300 group-hover:text-rose-400">
                    Reset to Demo Sample Data
                  </div>
                  <div className="text-xs text-slate-500">Restore fresh pre-filled sample ledger</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
