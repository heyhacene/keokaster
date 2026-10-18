'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  Link as LinkIcon,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Radio,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  parseOpmlXml,
  downloadOpmlFile,
  resolveApplePodcastsUrl,
  resolveGenericOrSpotifyUrl,
  ParsedOpmlItem,
} from '@/lib/opml';
import {
  getSubscribedPodcasts,
  saveSubscribedPodcasts,
  isPodcastSubscribed,
} from '@/lib/storage';
import { Podcast } from '@/types/podcast';

interface PodcastImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

export default function PodcastImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: PodcastImportModalProps) {
  const [activeTab, setActiveTab] = useState<'opml' | 'url' | 'guide' | 'export'>('opml');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: 'Lecture et analyse du fichier OPML...' });

    try {
      const text = await file.text();
      const items = parseOpmlXml(text);

      if (items.length === 0) {
        setStatusMsg({
          type: 'error',
          text: 'Aucun podcast valide trouvé dans ce fichier OPML. Vérifiez le format.',
        });
        setIsProcessing(false);
        return;
      }

      // Ajout aux abonnements
      const currentSubs = getSubscribedPodcasts();
      const existingUrls = new Set(currentSubs.map((s) => s.feedUrl.toLowerCase()));
      const newPodcasts: Podcast[] = [];

      items.forEach((item) => {
        if (!existingUrls.has(item.feedUrl.toLowerCase())) {
          newPodcasts.push({
            id: `imported_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            title: item.title,
            author: 'Podcast importé',
            description: item.description || '',
            feedUrl: item.feedUrl,
            artworkUrl: item.artworkUrl || '',
            subscribedAt: new Date().toISOString(),
          });
          existingUrls.add(item.feedUrl.toLowerCase());
        }
      });

      const updated = [...newPodcasts, ...currentSubs];
      saveSubscribedPodcasts(updated);

      setStatusMsg({
        type: 'success',
        text: `🎉 ${newPodcasts.length} nouveau(x) podcast(s) importé(s) avec succès ! (${items.length - newPodcasts.length} étaient déjà présents).`,
      });

      onImportSuccess?.(newPodcasts.length);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Erreur lors de l'import : ${err.message || 'Fichier non lisible'}`,
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: 'Recherche et rapatriement du podcast...' });

    try {
      const resolved = await resolveGenericOrSpotifyUrl(urlInput.trim());
      if (!resolved || !resolved.feedUrl) {
        setStatusMsg({
          type: 'error',
          text: "Impossible de trouver le flux RSS de ce podcast. Vérifiez l'adresse ou essayez de chercher son titre dans l'onglet Recherche.",
        });
        setIsProcessing(false);
        return;
      }

      const currentSubs = getSubscribedPodcasts();
      if (currentSubs.some((s) => s.feedUrl.toLowerCase() === resolved.feedUrl.toLowerCase())) {
        setStatusMsg({
          type: 'info',
          text: `Le podcast « ${resolved.title} » est déjà présent dans votre bibliothèque.`,
        });
        setIsProcessing(false);
        return;
      }

      const newPodcast: Podcast = {
        id: `imported_url_${Date.now()}`,
        title: resolved.title,
        author: 'Podcast importé',
        description: '',
        feedUrl: resolved.feedUrl,
        artworkUrl: resolved.artworkUrl || '',
        subscribedAt: new Date().toISOString(),
      };

      saveSubscribedPodcasts([newPodcast, ...currentSubs]);
      setUrlInput('');
      setStatusMsg({
        type: 'success',
        text: `🎉 « ${newPodcast.title} » a été ajouté à votre bibliothèque !`,
      });
      onImportSuccess?.(1);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Erreur : ${err.message || 'Lien invalide'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const subs = getSubscribedPodcasts();
    if (subs.length === 0) {
      setStatusMsg({
        type: 'error',
        text: 'Vous n\'avez aucun podcast abonné à exporter pour le moment.',
      });
      return;
    }
    downloadOpmlFile(subs);
    setStatusMsg({
      type: 'success',
      text: `Fichier OPML de ${subs.length} podcast(s) téléchargé avec succès !`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Rapatrier mes podcasts
              </h2>
              <p className="text-xs text-slate-400">
                Transférez vos abonnements depuis vos autres applications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('opml');
              setStatusMsg(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'opml'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fichier OPML</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setStatusMsg(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'url'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Coller un lien</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('guide');
              setStatusMsg(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'guide'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guide des applis</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMsg(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'export'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Sauvegarder</span>
          </button>
        </div>

        {/* MESSAGE DE STATUT */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : statusMsg.type === 'error'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-purple-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* CONTENU ONGLET 1 : IMPORT OPML */}
        {activeTab === 'opml' && (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-3xl bg-slate-950/60 transition space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Sélectionnez votre fichier .opml ou .xml
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Compatible avec Apple Podcasts, Pocket Casts, AntennaPod, Podcast Addict, Castbox, Overcast, etc.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".opml,.xml,text/xml,application/xml"
                onChange={handleFileUpload}
                className="hidden"
                id="opml-file-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Choisir le fichier OPML</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed text-center">
              💡 Le fichier OPML est le standard universel de podcasts. Tous vos abonnements seront ajoutés en un clic avec Stop-Pub automatique.
            </p>
          </div>
        )}

        {/* CONTENU ONGLET 2 : COLLER UN LIEN */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlImport} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Lien de podcast (Apple Podcasts, Spotify, ou flux RSS direct) :
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ex: https://podcasts.apple.com/... ou https://open.spotify.com/show/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !urlInput.trim()}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 active:scale-95"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Rapatrier ce podcast</span>
            </button>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 Vous pouvez coller le lien d'une émission partagée depuis Spotify ou Apple Podcasts : KeoKaster identifie automatiquement le flux original.
            </p>
          </form>
        )}

        {/* CONTENU ONGLET 3 : GUIDE PAR APPLICATION */}
        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="text-slate-400 font-semibold mb-2">
              Comment exporter vos podcasts depuis votre ancienne application :
            </p>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>🍏 Apple Podcasts</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sur Mac : Fichier &gt; Exporter les abonnements... pour enregistrer le fichier OPML, puis importez-le ici.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>🔴 Pocket Casts</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Profil &gt; Icône Paramètres (engrenage) &gt; Import / Export &gt; Exporter OPML.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>🐜 AntennaPod</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Menu &gt; Paramètres &gt; Importer / Exporter &gt; Export OPML.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>📻 Podcast Addict</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Paramètres &gt; Sauvegarder / Restaurer &gt; Sauvegarder les abonnements (OPML).
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>🟢 Spotify</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Spotify ne propose pas d'export OPML, mais vous pouvez copier le lien de votre podcast sur Spotify (Partager &gt; Copier le lien) et le coller dans l'onglet <strong>« Coller un lien »</strong> !
              </p>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 4 : SAUVEGARDER / EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Exporter tous vos abonnements KeoKaster
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Générez un fichier de sauvegarde OPML contenant tous vos podcasts favoris. Vous restez 100% libre et indépendant.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger la sauvegarde (.opml)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
