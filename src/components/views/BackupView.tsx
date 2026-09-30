import React from 'react';
import { db } from '../../services/db';
import { Database, Download, Upload, RotateCcw } from 'lucide-react';

export const BackupView: React.FC = () => {
  const handleExportJSON = () => {
    const jsonStr = db.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `talent_os_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (db.importBackupJSON(content)) {
        alert('Database restored successfully from backup JSON!');
        window.location.reload();
      } else {
        alert('Failed to import database. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset database to default demo data?')) {
      db.resetToSeed();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-12 text-xs">
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" /> Database Backup, Export & Reset
        </h2>
        <p className="text-slate-400">
          Full data sovereignty. Export entire relational schema as JSON or restore state.
        </p>
      </div>

      <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4 max-w-xl">
        <div className="p-4 bg-[#0b0f17] border border-tech-border rounded-xl space-y-2">
          <h3 className="font-bold text-slate-200">Export Complete Relational Database</h3>
          <p className="text-slate-400 text-[11px]">
            Download JSON backup containing all 5 Influencers, Brands, Campaigns, Payments & Logs.
          </p>
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg mt-2 shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup JSON</span>
          </button>
        </div>

        <div className="p-4 bg-[#0b0f17] border border-tech-border rounded-xl space-y-2">
          <h3 className="font-bold text-slate-200">Restore from Backup File</h3>
          <p className="text-slate-400 text-[11px]">Upload a previously exported JSON backup file.</p>
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="text-slate-300 text-xs mt-1"
          />
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
          <h3 className="font-bold text-red-400">Reset to Pre-seeded Demo Data</h3>
          <p className="text-slate-400 text-[11px]">
            Restores original 5 technology influencers (JD Tech, TechCraft Pro, etc.) & 8 active campaigns.
          </p>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-lg mt-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
