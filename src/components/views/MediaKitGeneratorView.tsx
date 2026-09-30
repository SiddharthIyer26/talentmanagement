import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { pdfService } from '../../services/pdfService';
import { MediaKitTheme, MediaKitDesignStyle, InstagramInsightsSnapshot, MediaKitFeaturedReel } from '../../types';
import {
  Palette,
  Download,
  Sparkles,
  Eye,
  Users,
  BarChart2,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Plus,
  Save,
  Grid,
  Zap,
  Crown,
  Waves,
  Sun,
  Minimize2,
  Heart,
  Flame,
  Layout,
  FileText,
  Award,
  Layers,
  Film,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';

export const MediaKitGeneratorView: React.FC = () => {
  const influencers = db.getInfluencers();
  const campaigns = db.getCampaigns();

  const [selectedInfId, setSelectedInfId] = useState(influencers[0]?.id || '');
  const [selectedTheme, setSelectedTheme] = useState<MediaKitTheme>(() => {
    return (localStorage.getItem('talent_os_mediakit_theme') as MediaKitTheme) || 'dark-tech';
  });
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<MediaKitDesignStyle>(() => {
    return (localStorage.getItem('talent_os_mediakit_style') as MediaKitDesignStyle) || 'tech-matrix';
  });

  const handleSelectTheme = (theme: MediaKitTheme) => {
    setSelectedTheme(theme);
    localStorage.setItem('talent_os_mediakit_theme', theme);
  };

  const handleSelectStyle = (style: MediaKitDesignStyle) => {
    setSelectedDesignStyle(style);
    localStorage.setItem('talent_os_mediakit_style', style);
  };

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('August 2026');
  const [isEditingInsights, setIsEditingInsights] = useState(false);

  // Manual Featured Collaborations State
  const [featuredReels, setFeaturedReels] = useState<MediaKitFeaturedReel[]>([]);
  const [isManagingCollabs, setIsManagingCollabs] = useState(false);
  const [isCollabFormOpen, setIsCollabFormOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<MediaKitFeaturedReel | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields State
  const [collabTitle, setCollabTitle] = useState('');
  const [collabBrandName, setCollabBrandName] = useState('');
  const [collabCampaignName, setCollabCampaignName] = useState('');
  const [collabViews, setCollabViews] = useState('');
  const [collabReelUrl, setCollabReelUrl] = useState('');
  const [collabThumbnailUrl, setCollabThumbnailUrl] = useState('');
  const [collabPlatform, setCollabPlatform] = useState('Instagram');
  const [collabPublishDate, setCollabPublishDate] = useState('');
  const [collabDescription, setCollabDescription] = useState('');

  const selectedInfluencer = db.getInfluencerById(selectedInfId) || influencers[0];
  const monthlySnapshots = selectedInfluencer.monthlyInsightsSnapshots || [];

  // Sync Featured Reels on Influencer Select
  useEffect(() => {
    if (selectedInfluencer) {
      const reels = db.getFeaturedReelsByInfluencerId(selectedInfluencer.id);
      setFeaturedReels(reels);
    }
  }, [selectedInfluencer?.id]);

  const snapRaw = monthlySnapshots.find(
    s => s.monthYear.trim().toLowerCase() === selectedMonthYear.trim().toLowerCase()
  ) || monthlySnapshots[0];

  const [insightForm, setInsightForm] = useState<InstagramInsightsSnapshot>(snapRaw || {
    monthYear: selectedMonthYear,
    dateRangeText: '1 Aug - 31 Aug 2026',
    followersCount: 450000,
    monthlyReach: 3200000,
    engagementRate: 8.4,
    views30d: 3200000,
    accountsEngaged: 420000,
    interactions30d: 280000,
    reach30d: 3200000,
    topAgeGroup: '18-34 years (78%)',
    genderDistribution: '82% Male / 18% Female',
    topCities: 'Mumbai, Bengaluru, Delhi'
  });

  const currentSnapshot = {
    monthYear: insightForm.monthYear || snapRaw?.monthYear || selectedMonthYear,
    dateRangeText: insightForm.dateRangeText || snapRaw?.dateRangeText || '1 Aug - 31 Aug 2026',
    followersCount: insightForm.followersCount ?? snapRaw?.followersCount ?? 450000,
    monthlyReach: insightForm.monthlyReach ?? snapRaw?.monthlyReach ?? 3200000,
    engagementRate: insightForm.engagementRate ?? snapRaw?.engagementRate ?? 8.4,
    views30d: insightForm.views30d ?? snapRaw?.views30d ?? 3200000,
    accountsEngaged: insightForm.accountsEngaged ?? snapRaw?.accountsEngaged ?? 420000,
    interactions30d: insightForm.interactions30d ?? snapRaw?.interactions30d ?? 280000,
    reach30d: insightForm.reach30d ?? snapRaw?.reach30d ?? 3200000,
    topAgeGroup: insightForm.topAgeGroup || snapRaw?.topAgeGroup || '18-34 years (78%)',
    genderDistribution: insightForm.genderDistribution || snapRaw?.genderDistribution || '82% Male / 18% Female',
    topCities: typeof insightForm.topCities === 'string' ? insightForm.topCities : (Array.isArray(insightForm.topCities) ? insightForm.topCities.join(', ') : 'Mumbai, Bengaluru, Delhi')
  };

  const handleSelectInfluencer = (infId: string) => {
    setSelectedInfId(infId);
    const inf = db.getInfluencerById(infId);
    if (inf && inf.monthlyInsightsSnapshots && inf.monthlyInsightsSnapshots.length > 0) {
      setSelectedMonthYear(inf.monthlyInsightsSnapshots[0].monthYear);
      setInsightForm(inf.monthlyInsightsSnapshots[0]);
    }
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonthYear(month);
    const snap = monthlySnapshots.find(
      s => s.monthYear.trim().toLowerCase() === month.trim().toLowerCase()
    );
    if (snap) {
      setInsightForm(snap);
    }
  };

  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    db.addMonthlyInsightsSnapshot(selectedInfId, insightForm);
    setIsEditingInsights(false);
    alert(`Instagram Insights Snapshot for ${insightForm.monthYear} saved successfully!`);
  };

  const handleCancelSnapshot = () => {
    if (snapRaw) {
      setInsightForm(snapRaw);
    }
    setIsEditingInsights(false);
  };

  const topCollabs = campaigns
    .filter(c => c.influencerId === selectedInfId && c.metrics && c.metrics.views > 0)
    .sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0));

  const activeReels: MediaKitFeaturedReel[] = featuredReels;
  const displayReels = activeReels.slice(0, 10);
  const reelCount = displayReels.length;
  const cardPaddingClass = reelCount <= 2 ? 'p-3.5 rounded-2xl' : (reelCount === 3 || reelCount === 4) ? 'p-2 rounded-xl' : 'p-1.5 px-2.5 rounded-lg';
  const minHeightClass = reelCount <= 2 ? 'min-h-[56px]' : (reelCount === 3 || reelCount === 4) ? 'min-h-[42px]' : 'min-h-[34px]';
  const titleTextClass = reelCount <= 2 ? 'text-xs sm:text-sm font-bold' : (reelCount === 3 || reelCount === 4) ? 'text-xs font-bold' : 'text-[11px] font-bold';

  // Handlers for Collaborations CRUD
  const handleOpenAddCollab = () => {
    if (featuredReels.length >= 10) {
      alert('Maximum 10 collaborations allowed.');
      return;
    }
    setEditingCollab(null);
    setCollabTitle('');
    setCollabBrandName('');
    setCollabCampaignName('');
    setCollabViews('1250000');
    setCollabReelUrl('https://instagram.com/reel/demo');
    setCollabThumbnailUrl('');
    setCollabPlatform('Instagram');
    setCollabPublishDate('');
    setCollabDescription('');
    setIsCollabFormOpen(true);
  };

  const handleOpenEditCollab = (reel: MediaKitFeaturedReel) => {
    setEditingCollab(reel);
    setCollabTitle(reel.title);
    setCollabBrandName(reel.brandName || '');
    setCollabCampaignName(reel.campaignName || '');
    setCollabViews(reel.views ? reel.views.toString() : '');
    setCollabReelUrl(reel.reelUrl || '');
    setCollabThumbnailUrl(reel.thumbnailUrl || '');
    setCollabPlatform(reel.platform || 'Instagram');
    setCollabPublishDate(reel.publishDate || '');
    setCollabDescription(reel.description || '');
    setIsCollabFormOpen(true);
  };

  const handleSaveCollabForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabTitle.trim() || !collabViews || !collabReelUrl.trim()) {
      alert('Please fill in required fields: Collaboration Title, Views, and Reel URL.');
      return;
    }

    const viewsNum = parseInt(collabViews, 10) || 0;
    let updated: MediaKitFeaturedReel[];

    if (editingCollab) {
      updated = featuredReels.map(r => r.id === editingCollab.id ? {
        ...r,
        title: collabTitle,
        brandName: collabBrandName,
        campaignName: collabCampaignName,
        views: viewsNum,
        reelUrl: collabReelUrl,
        thumbnailUrl: collabThumbnailUrl,
        platform: collabPlatform,
        publishDate: collabPublishDate,
        description: collabDescription
      } : r);
    } else {
      const newItem: MediaKitFeaturedReel = {
        id: `mkr-${Date.now()}`,
        title: collabTitle,
        brandName: collabBrandName,
        campaignName: collabCampaignName,
        views: viewsNum,
        reelUrl: collabReelUrl,
        thumbnailUrl: collabThumbnailUrl,
        platform: collabPlatform,
        publishDate: collabPublishDate,
        description: collabDescription
      };
      updated = [...featuredReels, newItem];
    }

    setFeaturedReels(updated);
    db.saveFeaturedReels(selectedInfluencer.id, updated);
    setIsCollabFormOpen(false);
    setEditingCollab(null);
  };

  const handleDeleteCollab = (id: string) => {
    const updated = featuredReels.filter(r => r.id !== id);
    setFeaturedReels(updated);
    db.saveFeaturedReels(selectedInfluencer.id, updated);
    setDeleteConfirmId(null);
  };

  const handleMoveCollab = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featuredReels.length) return;
    const copy = [...featuredReels];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setFeaturedReels(copy);
    db.saveFeaturedReels(selectedInfluencer.id, copy);
  };

  const handleExportPDF = async () => {
    await pdfService.exportMediaKit(selectedInfluencer.name, `${selectedTheme}_${selectedDesignStyle}`);
  };

  // 8 Color Themes
  const themeDefinitions = [
    { id: 'dark-tech', name: 'Dark Tech', icon: Zap, bg: 'bg-[#0b0f17]', cardBg: 'bg-[#131924]', border: 'border-[#1f293d]', textPrimary: 'text-slate-100', textAccent: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    { id: 'electric-neon', name: 'Electric Neon', icon: Flame, bg: 'bg-[#09100d]', cardBg: 'bg-[#0f1d18]', border: 'border-emerald-500/40', textPrimary: 'text-emerald-50', textAccent: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { id: 'royal-luxury', name: 'Royal Luxury', icon: Crown, bg: 'bg-[#12081f]', cardBg: 'bg-[#1d0e33]', border: 'border-purple-500/40', textPrimary: 'text-amber-100', textAccent: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'ocean-breeze', name: 'Ocean Breeze', icon: Waves, bg: 'bg-[#061325]', cardBg: 'bg-[#0c223f]', border: 'border-blue-500/40', textPrimary: 'text-blue-50', textAccent: 'text-sky-300', badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-500/30' },
    { id: 'sunset-gold', name: 'Sunset Gold', icon: Sun, bg: 'bg-[#1a1106]', cardBg: 'bg-[#2b1c0a]', border: 'border-amber-600/40', textPrimary: 'text-amber-50', textAccent: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'clean-minimal', name: 'Clean Minimal', icon: Minimize2, bg: 'bg-[#111113]', cardBg: 'bg-[#1a1a1e]', border: 'border-slate-700', textPrimary: 'text-slate-100', textAccent: 'text-slate-300', badgeBg: 'bg-slate-700/40 text-slate-200 border-slate-600' },
    { id: 'rose-gold-luxury', name: 'Rose Gold', icon: Heart, bg: 'bg-[#1c0f14]', cardBg: 'bg-[#2d1820]', border: 'border-rose-500/40', textPrimary: 'text-rose-100', textAccent: 'text-rose-300', badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-500/40' },
    { id: 'cyberpunk-violet', name: 'Cyberpunk', icon: Sparkles, bg: 'bg-[#180624]', cardBg: 'bg-[#280a3c]', border: 'border-fuchsia-500/40', textPrimary: 'text-fuchsia-100', textAccent: 'text-fuchsia-400', badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' }
  ];

  // 8 Genuinely Distinct Design Styles
  const styleDefinitions = [
    { id: 'tech-matrix', name: '1. Tech Matrix', desc: 'Grid cards, neon borders & metric chips' },
    { id: 'executive-luxury', name: '2. Executive Luxury', desc: 'Serif headers, gold borders & structured layout' },
    { id: 'minimalist-modern', name: '3. Minimalist Modern', desc: 'Borderless clean typography & high whitespace' },
    { id: 'creative-bold', name: '4. Creative Bold', desc: 'Large gradient header & hero stat callouts' },
    { id: 'sidebar-split', name: '5. Sidebar Split', desc: '2-Column layout with fixed creator sidebar panel' },
    { id: 'hero-spotlight', name: '6. Hero Cover Banner', desc: 'Full-width top hero cover banner with profile overlay' },
    { id: 'magazine-editorial', name: '7. Magazine Editorial', desc: 'Editorial article format with quote block bio' },
    { id: 'cyberpunk-hud', name: '8. Cyberpunk Sci-Fi HUD', desc: 'Sci-Fi HUD display with corner bracket borders' }
  ];

  const currentThemeObj = themeDefinitions.find(t => t.id === selectedTheme) || themeDefinitions[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" /> Technology Influencer Media Kit Generator
          </h2>
          <p className="text-xs text-slate-400">
            Export A4 Media Kits with 8 Themes, 8 Genuinely Distinct Layout Styles & Clickable Reel Links.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditingInsights(true)}
            className="flex items-center space-x-1.5 bg-[#131924] hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Manually Edit Insights</span>
          </button>

          <button
            onClick={() => setIsManagingCollabs(true)}
            className="flex items-center space-x-1.5 bg-[#131924] hover:bg-slate-800 border border-purple-500/40 text-purple-300 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Film className="w-4 h-4 text-purple-400" />
            <span>Manage Recent Collaborations</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export A4 Media Kit PDF</span>
          </button>
        </div>
      </div>

      {/* Manual Insights Editing Modal */}
      {isEditingInsights && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-tech-border pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> Manually Edit Media Kit Insights Snapshot
              </h3>
              <button onClick={handleCancelSnapshot} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSnapshot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Month / Year *</label>
                  <input
                    type="text"
                    value={insightForm.monthYear}
                    onChange={e => setInsightForm({ ...insightForm, monthYear: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Date Range Text</label>
                  <input
                    type="text"
                    value={insightForm.dateRangeText || ''}
                    onChange={e => setInsightForm({ ...insightForm, dateRangeText: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-cyan-400 focus:outline-none"
                    placeholder="e.g. 1 Aug 2026 – 31 Aug 2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Followers Count</label>
                  <input
                    type="number"
                    value={insightForm.followersCount || 0}
                    onChange={e => setInsightForm({ ...insightForm, followersCount: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Monthly Reach</label>
                  <input
                    type="number"
                    value={insightForm.monthlyReach || 0}
                    onChange={e => setInsightForm({ ...insightForm, monthlyReach: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-cyan-400 font-mono font-bold rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Engagement Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={insightForm.engagementRate || 0}
                    onChange={e => setInsightForm({ ...insightForm, engagementRate: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 font-mono rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">30-Day Views</label>
                  <input
                    type="number"
                    value={insightForm.views30d || 0}
                    onChange={e => setInsightForm({ ...insightForm, views30d: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 font-mono rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Accounts Engaged</label>
                  <input
                    type="number"
                    value={insightForm.accountsEngaged || 0}
                    onChange={e => setInsightForm({ ...insightForm, accountsEngaged: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 font-mono rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">30-Day Interactions</label>
                  <input
                    type="number"
                    value={insightForm.interactions30d || 0}
                    onChange={e => setInsightForm({ ...insightForm, interactions30d: Number(e.target.value) })}
                    className="w-full bg-[#0b0f17] border border-tech-border text-indigo-400 font-mono font-bold rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Top Age Group</label>
                <input
                  type="text"
                  value={insightForm.topAgeGroup || ''}
                  onChange={e => setInsightForm({ ...insightForm, topAgeGroup: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
                  placeholder="e.g. 18–34 (82%)"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Gender Distribution</label>
                <input
                  type="text"
                  value={insightForm.genderDistribution || ''}
                  onChange={e => setInsightForm({ ...insightForm, genderDistribution: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
                  placeholder="e.g. Male 76% / Female 24%"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Top Cities</label>
                <input
                  type="text"
                  value={typeof insightForm.topCities === 'string' ? insightForm.topCities : (insightForm.topCities || []).join(', ')}
                  onChange={e => setInsightForm({ ...insightForm, topCities: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
                  placeholder="e.g. Bengaluru, Mumbai, Delhi NCR"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-tech-border">
                <button
                  type="button"
                  onClick={handleCancelSnapshot}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-lg shadow-md"
                >
                  Save Insights Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Recent Collaborations Modal */}
      {isManagingCollabs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-tech-border pb-3">
              <div className="flex items-center space-x-2">
                <Film className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Manage Recent Collaborations & Featured Reels
                </h3>
              </div>
              <button onClick={() => { setIsManagingCollabs(false); setIsCollabFormOpen(false); }} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List / Form View Toggle */}
            {!isCollabFormOpen ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs">
                    Add, edit, delete, or reorder the featured reels shown in your Media Kit & exported PDF (Max 10).
                  </p>
                  {featuredReels.length >= 10 ? (
                    <span className="text-amber-400 font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg shrink-0">
                      Maximum 10 collaborations allowed.
                    </span>
                  ) : (
                    <button
                      onClick={handleOpenAddCollab}
                      className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Collaboration</span>
                    </button>
                  )}
                </div>

                {featuredReels.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-700/60 rounded-xl bg-[#0b0f17]/50 space-y-3">
                    <Film className="w-8 h-8 text-purple-400/50 mx-auto" />
                    <p className="text-slate-300 font-bold text-xs">No recent collaborations added yet.</p>
                    <p className="text-slate-400 text-[11px]">Click below to manually add your first featured reel or case study.</p>
                    <button
                      onClick={handleOpenAddCollab}
                      className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Collaboration</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {featuredReels.map((reel, index) => (
                      <div key={reel.id} className="p-3.5 bg-[#0b0f17] border border-tech-border rounded-xl flex items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleMoveCollab(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveCollab(index, 'down')}
                            disabled={index === featuredReels.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">{reel.title}</span>
                            {reel.platform && (
                              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono">
                                {reel.platform}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {reel.brandName ? `${reel.brandName} • ` : ''}{(reel.views / 1000).toFixed(0)}K Views
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleOpenEditCollab(reel)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded text-xs font-bold inline-flex items-center space-x-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {deleteConfirmId === reel.id ? (
                            <div className="flex items-center space-x-1 bg-red-950/80 border border-red-500/50 p-1 rounded">
                              <span className="text-[10px] text-red-200 font-bold px-1">Confirm?</span>
                              <button
                                onClick={() => handleDeleteCollab(reel.id)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(reel.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                              title="Delete Collaboration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Add / Edit Form */
              <form onSubmit={handleSaveCollabForm} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-purple-300 text-xs">
                    {editingCollab ? 'Edit Collaboration' : 'Add New Collaboration'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCollabFormOpen(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to List
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Collaboration / Reel Title *</label>
                    <input
                      type="text"
                      value={collabTitle}
                      onChange={e => setCollabTitle(e.target.value)}
                      placeholder="e.g. JD Tech × Samsung Galaxy Z Fold6 AI Workflow Showcase"
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Brand / Client Name</label>
                    <input
                      type="text"
                      value={collabBrandName}
                      onChange={e => setCollabBrandName(e.target.value)}
                      placeholder="e.g. Samsung India"
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Campaign / Project Name</label>
                    <input
                      type="text"
                      value={collabCampaignName}
                      onChange={e => setCollabCampaignName(e.target.value)}
                      placeholder="e.g. Galaxy Z Fold6 Launch"
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Views Count *</label>
                    <input
                      type="number"
                      value={collabViews}
                      onChange={e => setCollabViews(e.target.value)}
                      placeholder="e.g. 1250000"
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Reel / Content URL *</label>
                    <input
                      type="url"
                      value={collabReelUrl}
                      onChange={e => setCollabReelUrl(e.target.value)}
                      placeholder="https://instagram.com/reel/..."
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Platform</label>
                    <select
                      value={collabPlatform}
                      onChange={e => setCollabPlatform(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="X/Twitter">X / Twitter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Publish Date</label>
                    <input
                      type="date"
                      value={collabPublishDate}
                      onChange={e => setCollabPublishDate(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-tech-border">
                  <button
                    type="button"
                    onClick={() => setIsCollabFormOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30"
                  >
                    Save Collaboration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Sidebar */}
        <div className="space-y-5">
          {/* Creator & Insights Selector */}
          <div className="bg-tech-card border border-tech-border rounded-2xl p-4 space-y-4 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 1. Influencer & Insights
            </h3>

            <div>
              <label className="block text-slate-400 mb-1">Select Technology Influencer *</label>
              <select
                value={selectedInfId}
                onChange={e => handleSelectInfluencer(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
              >
                {influencers.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.handle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400">Select Monthly Snapshot *</label>
                <button
                  type="button"
                  onClick={() => setIsEditingInsights(true)}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <BarChart2 className="w-3 h-3" /> Manually Edit Insights
                </button>
              </div>
              <select
                value={selectedMonthYear}
                onChange={e => handleSelectMonth(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-cyan-300 font-bold rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
              >
                {['August 2026', 'July 2026', 'June 2026', 'May 2026'].map(month => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 8 Color Themes */}
          <div className="bg-tech-card border border-tech-border rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> 2. Color Themes (8 Presets)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {themeDefinitions.map(t => {
                const IconComp = t.icon;
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id as MediaKitTheme)}
                    className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-md'
                        : 'bg-[#0b0f17] border-tech-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="text-[11px] truncate">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8 Design Styles */}
          <div className="bg-tech-card border border-tech-border rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-indigo-400" /> 3. Layout Styles (8 Layouts)
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {styleDefinitions.map(s => {
                const isSelected = selectedDesignStyle === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStyle(s.id as MediaKitDesignStyle)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-bold shadow-md'
                        : 'bg-[#0b0f17] border-tech-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live A4 Media Kit Canvas Preview Container */}
        <div className="md:col-span-2 bg-[#05070a] border border-tech-border rounded-2xl p-4 sm:p-6 shadow-2xl overflow-x-auto">
          <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between">
            <span>A4 Document Canvas Preview (210mm x 297mm)</span>
            <span className="text-cyan-400 font-bold">
              Theme: {currentThemeObj.name} | Style: {selectedDesignStyle.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-center overflow-x-auto py-2">
            <div
              id="media-kit-preview-container"
              className={`${currentThemeObj.bg} w-[794px] min-w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-9 text-xs font-sans shadow-2xl flex flex-col justify-between box-border relative overflow-hidden`}
              style={{ width: '794px', height: '1123px', maxHeight: '1123px', boxSizing: 'border-box', overflow: 'hidden' }}
            >
              {/* RENDER THE SELECTED 1 OF 8 LAYOUT STYLES */}

              {/* STYLE 1: TECH MATRIX (Default Grid Cards Layout) */}
              {selectedDesignStyle === 'tech-matrix' && (
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-3.5">
                    <div className="flex items-center space-x-4">
                      <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-xl shrink-0" style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover' }} crossOrigin="anonymous" />
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${currentThemeObj.badgeBg}`}>
                          TECH MATRIX • {selectedMonthYear}
                        </span>
                        <h1 className={`text-2xl font-black ${currentThemeObj.textPrimary} mt-0.5 tracking-tight`}>{selectedInfluencer.name}</h1>
                        <p className={`font-mono text-xs ${currentThemeObj.textAccent}`}>{selectedInfluencer.handle} • {selectedInfluencer.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold tracking-wider">Followers</span>
                      <span className={`text-2xl font-black font-sans ${currentThemeObj.textPrimary}`}>{(currentSnapshot.followersCount / 1000).toFixed(0)}K+</span>
                    </div>
                  </div>

                  <div className={`${currentThemeObj.cardBg} p-4.5 rounded-2xl border ${currentThemeObj.border}`}>
                    <h3 className={`font-bold text-[11px] uppercase tracking-wider ${currentThemeObj.textAccent} mb-1.5`}>Creator Overview</h3>
                    <p className={`${currentThemeObj.textPrimary} leading-relaxed text-sm font-medium`}>{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}</p>
                  </div>

                  <div>
                    <h3 className={`font-bold text-[11px] uppercase tracking-wider ${currentThemeObj.textAccent} mb-2 flex items-center gap-1.5`}>
                      <BarChart2 className="w-3.5 h-3.5" /> Monthly Insights ({selectedMonthYear})
                    </h3>
                    <div className="grid grid-cols-4 gap-2.5 text-center">
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border}`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Monthly Reach</span>
                        <span className={`text-xl font-black font-sans ${currentThemeObj.textAccent} mt-0.5 block`}>{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M+</span>
                      </div>
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border}`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Engagement Rate</span>
                        <span className={`text-xl font-black font-sans ${currentThemeObj.textPrimary} mt-0.5 block`}>{currentSnapshot.engagementRate}%</span>
                      </div>
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border}`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Accounts Engaged</span>
                        <span className={`text-xl font-black font-sans ${currentThemeObj.textAccent} mt-0.5 block`}>{(currentSnapshot.accountsEngaged / 1000).toFixed(0)}K+</span>
                      </div>
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border}`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Interactions</span>
                        <span className={`text-xl font-black font-sans ${currentThemeObj.textPrimary} mt-0.5 block`}>{(currentSnapshot.interactions30d / 1000).toFixed(0)}K+</span>
                      </div>
                    </div>
                  </div>

                  {/* Audience Demographics & Geo */}
                  <div>
                    <h3 className={`font-bold text-[11px] uppercase tracking-wider ${currentThemeObj.textAccent} mb-2 flex items-center gap-1.5`}>
                      <Users className="w-3.5 h-3.5" /> Audience Demographics & Geo Location
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border} min-h-[68px] flex flex-col justify-center`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Top Age Group</span>
                        <span className={`text-xs font-bold font-sans ${currentThemeObj.textPrimary} mt-0.5 block`}>{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border} min-h-[68px] flex flex-col justify-center`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Gender Distribution</span>
                        <span className={`text-xs font-bold font-sans ${currentThemeObj.textAccent} mt-0.5 block`}>{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className={`${currentThemeObj.cardBg} p-3.5 rounded-2xl border ${currentThemeObj.border} min-h-[68px] flex flex-col justify-center`}>
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold uppercase">Top Cities</span>
                        <span className={`text-xs font-bold font-sans ${currentThemeObj.textPrimary} mt-0.5 block break-words whitespace-normal leading-snug`}>{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Content & Reels Links */}
                  <div>
                    <h3 className={`font-bold text-[11px] uppercase tracking-wider ${currentThemeObj.textAccent} mb-2`}>Featured Top Reels & Case Studies</h3>
                    <div className="space-y-2">
                      {displayReels.length === 0 ? (
                        <div className="p-3.5 text-center text-slate-400 text-xs italic border border-dashed border-slate-700/60 rounded-xl bg-black/20">
                          No recent collaborations added yet.
                        </div>
                      ) : (
                        displayReels.map(c => (
                          <div key={c.id} className={`${currentThemeObj.cardBg} ${cardPaddingClass} border ${currentThemeObj.border} flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                            <div className="flex-1 min-w-0 pr-1">
                              <p className={`${titleTextClass} leading-snug break-words ${currentThemeObj.textPrimary}`}>{c.title || (c.brandName ? `${c.campaignName} (${c.brandName})` : c.campaignName)}</p>
                              <p className="text-[10px] text-slate-400 font-sans mt-0.5">{(c.views / 1000).toFixed(0)}K Views</p>
                            </div>
                            {c.reelUrl && (
                              <a href={c.reelUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-lg text-[10px] font-bold shrink-0 inline-flex items-center space-x-1 hover:bg-cyan-500/30">
                                <span>WATCH THE REEL →</span>
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Rate Card */}
                  <div className={`${currentThemeObj.cardBg} p-4 rounded-2xl border ${currentThemeObj.border}`}>
                    <h3 className={`font-bold text-[11px] uppercase tracking-wider ${currentThemeObj.textAccent} mb-2`}>Official Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-3 text-center font-sans text-xs">
                      <div className="p-3 bg-black/40 rounded-xl border border-slate-700/80 flex flex-col justify-center items-center min-h-[72px]">
                        <span className="text-[10px] text-slate-400 font-sans block mb-0.5 uppercase font-semibold">Single Reel</span>
                        <span className="text-base font-black text-slate-100 font-sans">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-slate-700/80 flex flex-col justify-center items-center min-h-[72px]">
                        <span className="text-[10px] text-slate-400 font-sans block mb-0.5 uppercase font-semibold">Collab Reel</span>
                        <span className={`text-base font-black ${currentThemeObj.textAccent} font-sans`}>₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-slate-700/80 flex flex-col justify-center items-center min-h-[72px]">
                        <span className="text-[10px] text-slate-400 font-sans block mb-0.5 uppercase font-semibold">Store Visit Reel</span>
                        <span className={`text-base font-black ${currentThemeObj.textPrimary} font-sans`}>₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 2: EXECUTIVE LUXURY */}
              {selectedDesignStyle === 'executive-luxury' && (
                <div className="space-y-4 flex-1 font-serif">
                  <div className="border-b-2 border-amber-400/60 pb-3 text-center">
                    <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-400 shadow-lg mb-2 shrink-0" style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover' }} crossOrigin="anonymous" />
                    <span className="text-[10px] font-sans tracking-widest text-amber-400 uppercase block">OFFICIAL MEDIA PORTFOLIO</span>
                    <h1 className={`text-2xl font-bold ${currentThemeObj.textPrimary} mt-0.5`}>{selectedInfluencer.name}</h1>
                    <p className="text-xs font-sans text-slate-400 mt-0.5">{selectedInfluencer.handle} | {selectedInfluencer.city}</p>
                  </div>

                  <div className="p-4 border border-amber-500/30 rounded-lg bg-black/30 font-sans space-y-1">
                    <span className="text-amber-400 text-[10px] font-bold tracking-wider uppercase block">Executive Profile</span>
                    <p className="text-slate-200 italic leading-relaxed text-xs">{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}</p>
                  </div>

                  <div className="font-sans space-y-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-slate-700 pb-1">30-Day Verified Key Metrics</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 border border-slate-700 rounded bg-black/40">
                        <span className="text-xl font-bold font-sans text-amber-300">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M</span>
                        <span className="text-[10px] text-slate-400 block uppercase mt-0.5">Monthly Reach</span>
                      </div>
                      <div className="p-3 border border-slate-700 rounded bg-black/40">
                        <span className="text-xl font-bold font-sans text-white">{currentSnapshot.engagementRate}%</span>
                        <span className="text-[10px] text-slate-400 block uppercase mt-0.5">Engagement</span>
                      </div>
                      <div className="p-3 border border-slate-700 rounded bg-black/40">
                        <span className="text-xl font-bold font-sans text-amber-300">{(currentSnapshot.interactions30d / 1000).toFixed(0)}K</span>
                        <span className="text-[10px] text-slate-400 block uppercase mt-0.5">Interactions</span>
                      </div>
                    </div>
                  </div>

                  <div className="font-sans space-y-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-slate-700 pb-1">Audience Demographics & Geo</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 border border-slate-700 rounded bg-black/40 min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Top Age Group</span>
                        <span className="text-xs font-bold font-sans text-white">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className="p-3 border border-slate-700 rounded bg-black/40 min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Gender Ratio</span>
                        <span className="text-xs font-bold font-sans text-amber-300">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className="p-3 border border-slate-700 rounded bg-black/40 min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Top Cities</span>
                        <span className="text-xs font-bold font-sans text-white break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  <div className="font-sans space-y-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-slate-700 pb-1">Featured Collaborations</h3>
                    <div className="space-y-2">
                      {displayReels.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs italic border border-dashed border-amber-500/30 rounded bg-black/20">
                          No recent collaborations added yet.
                        </div>
                      ) : (
                        displayReels.map(c => (
                          <div key={c.id} className={`p-2.5 border border-slate-700 rounded bg-black/30 flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                            <div className="flex-1 min-w-0 pr-1">
                              <p className={`font-bold text-white leading-snug break-words ${titleTextClass}`}>{c.title || `${c.brandName} - ${c.campaignName}`}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(c.views / 1000).toFixed(0)}K Total Views</p>
                            </div>
                            {c.reelUrl && (
                              <a href={c.reelUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded text-[10px] font-bold shrink-0 inline-flex items-center">
                                <span>WATCH THE REEL →</span>
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="font-sans space-y-2 border-t border-slate-800 pt-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Official Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="p-2.5 border border-slate-700 bg-black/40 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[10px] text-amber-400/80 uppercase block mb-0.5">Single Reel</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 border border-slate-700 bg-black/40 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[10px] text-amber-400/80 uppercase block mb-0.5">Collab Reel</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 border border-slate-700 bg-black/40 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[10px] text-amber-400/80 uppercase block mb-0.5">Store Visit</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 3: MINIMALIST MODERN */}
              {selectedDesignStyle === 'minimalist-modern' && (
                <div className="space-y-4 flex-1 font-sans">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-extrabold text-white tracking-tight">{selectedInfluencer.name}</h1>
                      <p className="text-slate-400 text-xs mt-0.5">{selectedInfluencer.handle} — {selectedInfluencer.city}</p>
                    </div>
                    <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-16 h-16 rounded-full object-cover shrink-0" style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover' }} crossOrigin="anonymous" />
                  </div>

                  <div className="border-t border-b border-slate-800 py-3">
                    <p className="text-slate-300 text-xs leading-relaxed">{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-2xl font-extrabold text-white font-sans block">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M</span>
                      <span className="text-[10px] text-slate-400 uppercase font-sans">Monthly Reach</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-cyan-400 font-sans block">{currentSnapshot.engagementRate}%</span>
                      <span className="text-[10px] text-slate-400 uppercase font-sans">Engagement Rate</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-white font-sans block">{(currentSnapshot.interactions30d / 1000).toFixed(0)}K</span>
                      <span className="text-[10px] text-slate-400 uppercase font-sans">Interactions</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Audience Demographics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans block">Top Age Group</span>
                        <span className="text-xs font-bold text-white font-sans">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans block">Gender Ratio</span>
                        <span className="text-xs font-bold text-cyan-400 font-sans">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans block">Top Cities</span>
                        <span className="text-xs font-bold text-white font-sans break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Top Reel Case Studies</h3>
                    {displayReels.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs italic border border-dashed border-slate-800">
                        No recent collaborations added yet.
                      </div>
                    ) : (
                      displayReels.map(c => (
                        <div key={c.id} className={`py-2 border-b border-slate-800 flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                          <div className="flex-1 min-w-0 pr-1">
                            <span className={`font-bold text-white block leading-snug break-words ${titleTextClass}`}>{c.title || c.campaignName}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{c.brandName ? `${c.brandName} • ` : ''}{(c.views / 1000).toFixed(0)}K Views</span>
                          </div>
                          {c.reelUrl && (
                            <a href={c.reelUrl} target="_blank" rel="noreferrer" className="text-cyan-400 font-bold text-[10px] shrink-0 inline-flex items-center">
                              <span>WATCH THE REEL →</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-2 font-sans">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="p-2.5 border border-slate-800 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Single Reel</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 border border-slate-800 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Collab Reel</span>
                        <span className="text-sm font-bold text-cyan-400">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 border border-slate-800 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Store Visit</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 4: CREATIVE BOLD */}
              {selectedDesignStyle === 'creative-bold' && (
                <div className="space-y-4 flex-1 font-sans">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 p-5 rounded-2xl text-white shadow-xl">
                    <span className="bg-black/30 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">CREATIVE PRESS KIT</span>
                    <h1 className="text-2xl font-extrabold mt-1">{selectedInfluencer.name}</h1>
                    <p className="text-xs opacity-90">{selectedInfluencer.handle} • {selectedInfluencer.city}</p>
                  </div>

                  <div className="bg-tech-card p-3.5 rounded-xl border border-tech-border text-slate-200 text-xs">
                    <p>{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-cyan-500/20 border border-cyan-400 p-3 rounded-xl">
                      <span className="text-xl font-black font-sans text-cyan-300">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M+</span>
                      <span className="text-[10px] text-slate-300 block">30-Day Reach</span>
                    </div>
                    <div className="bg-indigo-500/20 border border-indigo-400 p-3 rounded-xl">
                      <span className="text-xl font-black font-sans text-indigo-300">{currentSnapshot.engagementRate}%</span>
                      <span className="text-[10px] text-slate-300 block">Engagement Rate</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase text-cyan-400">Audience Demographics</h3>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block">Top Age Group</span>
                        <span className="text-xs font-bold text-white">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block">Gender Ratio</span>
                        <span className="text-xs font-bold text-cyan-300">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block">Top Cities</span>
                        <span className="text-xs font-bold text-white break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase text-cyan-400">Featured Content</h3>
                    {displayReels.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs italic bg-slate-900 rounded-xl border border-slate-800">
                        No recent collaborations added yet.
                      </div>
                    ) : (
                      displayReels.map(c => (
                        <div key={c.id} className={`p-2.5 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                          <div className="flex-1 min-w-0 pr-1">
                            <span className={`font-bold text-white leading-snug break-words block ${titleTextClass}`}>{c.title || `${c.campaignName} (${c.brandName})`}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{(c.views / 1000).toFixed(0)}K Views</span>
                          </div>
                          {c.reelUrl && (
                            <a href={c.reelUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-cyan-500 text-black font-bold rounded text-[10px] shrink-0 inline-flex items-center">
                              <span>WATCH THE REEL →</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-2 font-sans">
                    <h3 className="font-bold text-xs uppercase text-cyan-400">Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Single Reel</span>
                        <span className="text-sm font-bold text-cyan-300">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Collab Reel</span>
                        <span className="text-sm font-bold text-indigo-300">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Store Visit</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 5: SIDEBAR SPLIT */}
              {selectedDesignStyle === 'sidebar-split' && (
                <div className="grid grid-cols-3 gap-5 font-sans flex-1">
                  <div className="bg-[#131924] p-4 rounded-xl border border-slate-700 space-y-3 text-center">
                    <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-cyan-400 shrink-0" style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover' }} crossOrigin="anonymous" />
                    <div>
                      <h2 className="font-extrabold text-white text-sm">{selectedInfluencer.name}</h2>
                      <p className="text-xs text-cyan-400 font-sans">{selectedInfluencer.handle}</p>
                      <p className="text-[10px] text-slate-400">{selectedInfluencer.city}</p>
                    </div>
                    <div className="border-t border-slate-700 pt-2 text-left space-y-1 text-[11px]">
                      <p className="text-slate-300">{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}</p>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-3">
                    <h3 className="font-bold text-xs uppercase text-cyan-400 border-b border-slate-700 pb-1">Performance Overview</h3>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-[#131924] p-2.5 rounded-lg border border-slate-700">
                        <span className="text-base font-bold font-sans text-cyan-300">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M</span>
                        <span className="text-[10px] text-slate-400 block">Monthly Reach</span>
                      </div>
                      <div className="bg-[#131924] p-2.5 rounded-lg border border-slate-700">
                        <span className="text-base font-bold font-sans text-white">{currentSnapshot.engagementRate}%</span>
                        <span className="text-[10px] text-slate-400 block">Engagement</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-xs uppercase text-cyan-400 border-b border-slate-700 pb-1 pt-1">Audience Demographics</h3>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-[#131924] p-2.5 rounded-lg border border-slate-700 min-h-[60px]">
                        <span className="text-[9px] text-slate-400 block">Age Group</span>
                        <span className="text-xs font-bold text-white">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className="bg-[#131924] p-2.5 rounded-lg border border-slate-700 min-h-[60px]">
                        <span className="text-[9px] text-slate-400 block">Gender</span>
                        <span className="text-xs font-bold text-cyan-300">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className="bg-[#131924] p-2.5 rounded-lg border border-slate-700 min-h-[60px]">
                        <span className="text-[9px] text-slate-400 block">Top Cities</span>
                        <span className="text-xs font-bold text-white break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-xs uppercase text-cyan-400 border-b border-slate-700 pb-1 pt-1">Case Studies</h3>
                    {displayReels.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs italic bg-[#131924] rounded-lg border border-slate-800">
                        No recent collaborations added yet.
                      </div>
                    ) : (
                      displayReels.map(c => (
                        <div key={c.id} className={`p-2.5 bg-[#131924] rounded-lg border border-slate-700 flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                          <div className="flex-1 min-w-0 pr-1">
                            <p className={`font-bold text-white leading-snug break-words ${titleTextClass}`}>{c.title || c.campaignName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{c.brandName ? `${c.brandName} • ` : ''}{(c.views / 1000).toFixed(0)}K Views</p>
                          </div>
                          {c.reelUrl && (
                            <a href={c.reelUrl} target="_blank" rel="noreferrer" className="text-cyan-400 font-bold text-[10px] shrink-0 inline-flex items-center">
                              <span>WATCH THE REEL →</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}

                    <h3 className="font-bold text-xs uppercase text-cyan-400 border-b border-slate-700 pb-1 pt-1">Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-sans">
                      <div className="p-2 bg-[#131924] border border-slate-700 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[9px] text-slate-400 uppercase block">Single Reel</span>
                        <span className="font-bold text-cyan-300">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2 bg-[#131924] border border-slate-700 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[9px] text-slate-400 uppercase block">Collab Reel</span>
                        <span className="font-bold text-white">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2 bg-[#131924] border border-slate-700 rounded-lg flex flex-col justify-center items-center">
                        <span className="text-[9px] text-slate-400 uppercase block">Store Visit</span>
                        <span className="font-bold text-cyan-300">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 6: HERO SPOTLIGHT */}
              {selectedDesignStyle === 'hero-spotlight' && (
                <div className="space-y-4 flex-1 font-sans">
                  <div className="relative bg-gradient-to-r from-purple-900 to-indigo-900 p-5 rounded-2xl text-white text-center">
                    <img src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} className="w-16 h-16 rounded-full mx-auto object-cover border-4 border-cyan-400 shadow-2xl mb-2 shrink-0" style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover' }} crossOrigin="anonymous" />
                    <h1 className="text-2xl font-extrabold">{selectedInfluencer.name}</h1>
                    <p className="text-cyan-300 font-sans text-xs">{selectedInfluencer.handle} • {selectedInfluencer.city}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-base font-bold text-cyan-400 font-sans">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M</span>
                      <span className="text-[10px] text-slate-400 block">Reach</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-base font-bold text-white font-sans">{currentSnapshot.engagementRate}%</span>
                      <span className="text-[10px] text-slate-400 block">Engagement</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-base font-bold text-cyan-400 font-sans">{(currentSnapshot.accountsEngaged / 1000).toFixed(0)}K</span>
                      <span className="text-[10px] text-slate-400 block">Engaged</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-base font-bold text-white font-sans">{(currentSnapshot.interactions30d / 1000).toFixed(0)}K</span>
                      <span className="text-[10px] text-slate-400 block">Interactions</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase text-cyan-400">Audience Demographics</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block">Top Age</span>
                        <span className="text-xs font-bold text-white">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block">Gender</span>
                        <span className="text-xs font-bold text-cyan-400">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block">Cities</span>
                        <span className="text-xs font-bold text-white break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase text-cyan-400">Featured Reel Content</h3>
                    {displayReels.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs italic bg-slate-900 rounded-xl border border-slate-800">
                        No recent collaborations added yet.
                      </div>
                    ) : (
                      displayReels.map(c => (
                        <div key={c.id} className={`p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                          <div className="flex-1 min-w-0 pr-1">
                            <span className={`font-bold text-white leading-snug break-words block ${titleTextClass}`}>{c.title || `${c.campaignName} (${c.brandName})`}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{(c.views / 1000).toFixed(0)}K Views</span>
                          </div>
                          {c.reelUrl && (
                            <a href={c.reelUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400 rounded text-[10px] font-bold shrink-0 inline-flex items-center">
                              <span>WATCH THE REEL →</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-2 font-sans">
                    <h3 className="font-bold text-xs uppercase text-cyan-400">Official Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Single Reel</span>
                        <span className="text-sm font-bold text-cyan-400">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Collab Reel</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Store Visit</span>
                        <span className="text-sm font-bold text-cyan-400">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 7: MAGAZINE EDITORIAL */}
              {selectedDesignStyle === 'magazine-editorial' && (
                <div className="space-y-5 font-serif">
                  <div className="border-b-4 border-slate-100 pb-3">
                    <span className="text-[10px] font-sans font-bold tracking-widest text-cyan-400">CREATOR PRESS EDITION</span>
                    <h1 className="text-3xl font-extrabold text-white mt-0.5">{selectedInfluencer.name}</h1>
                    <p className="font-sans text-xs text-slate-400">{selectedInfluencer.handle} • {selectedInfluencer.city}</p>
                  </div>

                  <blockquote className="italic text-slate-200 border-l-4 border-cyan-400 pl-3 py-0.5 text-xs font-sans">
                    "{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}"
                  </blockquote>

                  <div className="font-sans grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 border border-slate-700 bg-slate-900 rounded">
                      <span className="text-lg font-bold text-white font-sans">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M</span>
                      <span className="text-[10px] text-slate-400 block uppercase">Monthly Reach</span>
                    </div>
                    <div className="p-2.5 border border-slate-700 bg-slate-900 rounded">
                      <span className="text-lg font-bold text-cyan-400 font-sans">{currentSnapshot.engagementRate}%</span>
                      <span className="text-[10px] text-slate-400 block uppercase">Engagement Rate</span>
                    </div>
                    <div className="p-2.5 border border-slate-700 bg-slate-900 rounded">
                      <span className="text-lg font-bold text-white font-sans">{(currentSnapshot.interactions30d / 1000).toFixed(0)}K</span>
                      <span className="text-[10px] text-slate-400 block uppercase">Interactions</span>
                    </div>
                  </div>

                  <div className="font-sans space-y-2">
                    <h3 className="font-bold text-xs uppercase text-slate-300">Audience Demographics</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 border border-slate-700 bg-slate-900 rounded min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block uppercase">Top Age Group</span>
                        <span className="text-xs font-bold text-white">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className="p-3 border border-slate-700 bg-slate-900 rounded min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block uppercase">Gender Ratio</span>
                        <span className="text-xs font-bold text-cyan-400">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className="p-3 border border-slate-700 bg-slate-900 rounded min-h-[64px]">
                        <span className="text-[10px] text-slate-400 block uppercase">Top Cities</span>
                        <span className="text-xs font-bold text-white break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  <div className="font-sans space-y-2">
                    <h3 className="font-bold text-xs uppercase text-slate-300">Reel Case Studies</h3>
                    {displayReels.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs italic bg-slate-900 rounded border border-slate-800">
                        No recent collaborations added yet.
                      </div>
                    ) : (
                      displayReels.map(c => (
                        <div key={c.id} className={`p-2.5 border border-slate-800 rounded bg-slate-900 flex items-center justify-between gap-3 h-auto ${minHeightClass}`}>
                          <div className="flex-1 min-w-0 pr-1">
                            <span className={`font-bold text-white leading-snug break-words block ${titleTextClass}`}>{c.title || `${c.campaignName} (${c.brandName})`}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{(c.views / 1000).toFixed(0)}K Views</span>
                          </div>
                          {c.reelUrl && (
                            <a href={c.reelUrl} target="_blank" rel="noreferrer" className="text-cyan-400 font-bold text-[10px] shrink-0 inline-flex items-center">
                              <span>WATCH THE REEL →</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="font-sans space-y-2 border-t border-slate-800 pt-2 font-sans">
                    <h3 className="font-bold text-xs uppercase text-slate-300">Commercial Rates</h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="p-2.5 border border-slate-800 rounded-lg bg-slate-900 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Single Reel</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 border border-slate-800 rounded-lg bg-slate-900 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Collab Reel</span>
                        <span className="text-sm font-bold text-cyan-400">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 border border-slate-800 rounded-lg bg-slate-900 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Store Visit</span>
                        <span className="text-sm font-bold text-white">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 8: CYBERPUNK HUD */}
              {selectedDesignStyle === 'cyberpunk-hud' && (
                <div className="space-y-5 font-mono">
                  <div className="border-2 border-fuchsia-500/60 p-3.5 bg-fuchsia-950/20 rounded-xl relative">
                    <div className="absolute top-1 left-2 text-[9px] text-fuchsia-400">[SYSTEM_ID: CREATOR_PROFILE]</div>
                    <h1 className="text-xl font-extrabold text-fuchsia-200 mt-1.5 tracking-widest">{selectedInfluencer.name}</h1>
                    <p className="text-xs text-fuchsia-400">&gt; {selectedInfluencer.handle} // LOC: {selectedInfluencer.city}</p>
                  </div>

                  <div className="border border-fuchsia-500/30 p-2.5 bg-black/50 text-xs text-fuchsia-100">
                    <span className="text-[10px] text-fuchsia-400 block font-bold">// OVERVIEW_DATA</span>
                    <p>{selectedInfluencer.mediaKitBio || selectedInfluencer.bio}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-fuchsia-500/40 p-2.5 bg-black/60">
                      <span className="text-[10px] text-fuchsia-400 block">REACH_30D</span>
                      <span className="text-base font-bold text-fuchsia-300 font-sans">{(currentSnapshot.monthlyReach / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="border border-fuchsia-500/40 p-2.5 bg-black/60">
                      <span className="text-[10px] text-fuchsia-400 block">ENGAGE_RATE</span>
                      <span className="text-base font-bold text-white font-sans">{currentSnapshot.engagementRate}%</span>
                    </div>
                    <div className="border border-fuchsia-500/40 p-2.5 bg-black/60">
                      <span className="text-[10px] text-fuchsia-400 block">INTERACTIONS</span>
                      <span className="text-base font-bold text-fuchsia-300 font-sans">{(currentSnapshot.interactions30d / 1000).toFixed(0)}K</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-fuchsia-400 font-bold block font-mono">// AUDIENCE_DEMOGRAPHICS</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border border-fuchsia-500/40 p-2.5 bg-black/60 min-h-[64px]">
                        <span className="text-[9px] text-fuchsia-400 block">AGE_GROUP</span>
                        <span className="text-xs font-bold text-fuchsia-200 font-sans">{currentSnapshot.topAgeGroup}</span>
                      </div>
                      <div className="border border-fuchsia-500/40 p-2.5 bg-black/60 min-h-[64px]">
                        <span className="text-[9px] text-fuchsia-400 block">GENDER_RATIO</span>
                        <span className="text-xs font-bold text-white font-sans">{currentSnapshot.genderDistribution}</span>
                      </div>
                      <div className="border border-fuchsia-500/40 p-2.5 bg-black/60 min-h-[64px]">
                        <span className="text-[9px] text-fuchsia-400 block">TOP_CITIES</span>
                        <span className="text-xs font-bold text-fuchsia-200 font-sans break-words whitespace-normal leading-snug block">{currentSnapshot.topCities}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-fuchsia-400 font-bold block">// TOP_REEL_LINKS</span>
                    {displayReels.length === 0 ? (
                      <div className="p-3 text-center text-fuchsia-400/60 text-xs italic border border-fuchsia-500/30 bg-black/40">
                        // NO_DATA_AVAILABLE
                      </div>
                    ) : (
                      displayReels.map(c => (
                        <div key={c.id} className={`p-2 border border-fuchsia-500/30 bg-black/40 flex items-center justify-between gap-3 text-xs h-auto ${minHeightClass}`}>
                          <div className="flex-1 min-w-0 pr-1">
                            <span className={`text-fuchsia-100 font-bold leading-snug break-words block ${titleTextClass}`}>{c.title || `${c.campaignName} (${c.brandName})`}</span>
                            <span className="text-[10px] text-fuchsia-400 mt-0.5 block">{(c.views / 1000).toFixed(0)}K Views</span>
                          </div>
                          {c.reelUrl && (
                            <a href={c.reelUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-400 text-[10px] font-bold shrink-0 inline-flex items-center">
                              <span>WATCH THE REEL →</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t border-fuchsia-500/30 pt-2 text-xs font-sans">
                    <span className="text-[10px] text-fuchsia-400 font-bold block font-mono">// COMMERCIAL_RATES</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-sans">
                      <div className="border border-fuchsia-500/30 p-2 bg-black/60 rounded flex flex-col justify-center items-center">
                        <span className="text-[9px] text-fuchsia-400 block font-mono">// REEL</span>
                        <span className="font-bold text-fuchsia-200 text-xs">₹{selectedInfluencer.rateCard.reel.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border border-fuchsia-500/30 p-2 bg-black/60 rounded flex flex-col justify-center items-center">
                        <span className="text-[9px] text-fuchsia-400 block font-mono">// COLLAB</span>
                        <span className="font-bold text-white text-xs">₹{selectedInfluencer.rateCard.collabReel.toLocaleString('en-IN')}</span>
                      </div>
                        <div className="border border-fuchsia-500/30 p-1.5 bg-black/60 rounded flex flex-col justify-center items-center">
                          <span className="text-[9px] text-fuchsia-400 block font-mono">// STORE</span>
                          <span className="font-bold text-fuchsia-200 text-xs">₹{selectedInfluencer.rateCard.storeVisitReel.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Canvas Footer */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>OFFICIAL MEDIA KIT</span>
                <span>CONTACT: {selectedInfluencer.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
