'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Printer,
  Volume2,
  VolumeX,
  Languages,
  X,
  ShieldAlert,
  QrCode,
  MapPin,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';
import { PetRecord } from '@/types';
import { playSound } from '@/lib/sound';

interface EmergencyFlyerModalProps {
  pet: PetRecord;
  onClose: () => void;
}

type SupportedLanguage = 'en' | 'es' | 'fr' | 'zh' | 'ja';

const TRANSLATIONS: Record<SupportedLanguage, {
  title: string;
  rewardLabel: string;
  lastSeenLabel: string;
  featuresLabel: string;
  scanLabel: string;
  speechText: (name: string, breed: string, city: string, reward: number) => string;
}> = {
  en: {
    title: 'LOST COMPANION ALERT',
    rewardLabel: 'ESCROW REWARD',
    lastSeenLabel: 'LAST SEEN LOCATION',
    featuresLabel: 'IDENTIFYING MARKS & MEDICAL NOTES',
    scanLabel: 'SCAN TO VERIFY CHIP & CLAIM REWARD',
    speechText: (name, breed, city, reward) =>
      `Emergency missing companion alert. A ${breed} named ${name} was last seen in ${city}. A verified escrow reward of ${reward} SOL is locked on the Solana blockchain for their safe return. Please scan the QR tag or notify authorities immediately.`,
  },
  es: {
    title: 'ALERTA DE MASCOTA PERDIDA',
    rewardLabel: 'RECOMPENSA EN CUSTODIA',
    lastSeenLabel: 'ÚLTIMA UBICACIÓN VISTA',
    featuresLabel: 'MARCAS DE IDENTIFICACIÓN Y NOTAS MÉDICAS',
    scanLabel: 'ESCANEE PARA VERIFICAR Y RECLAMAR RECOMPENSA',
    speechText: (name, breed, city, reward) =>
      `Alerta de emergencia. Una mascota de raza ${breed} llamada ${name} fue vista por última vez en ${city}. Hay una recompensa en custodia de ${reward} SOL en la cadena de bloques Solana.`,
  },
  fr: {
    title: 'ALERTE ANIMAL DISPARU',
    rewardLabel: 'RÉCOMPENSE SOUS SÉQUESTRE',
    lastSeenLabel: 'DERNIER LIEU VU',
    featuresLabel: 'SIGNES DISTINCTIFS ET NOTES MÉDICALES',
    scanLabel: 'SCANNEZ POUR VÉRIFIER LA PUCE ET RÉCLAMER',
    speechText: (name, breed, city, reward) =>
      `Alerte d'urgence pour animal disparu. Un ${breed} nommé ${name} a été vu pour la dernière fois à ${city}. Une récompense de ${reward} SOL est bloquée sur Solana.`,
  },
  zh: {
    title: '紧急寻宠启事',
    rewardLabel: '区块链智能合约悬赏',
    lastSeenLabel: '最后目击地点',
    featuresLabel: '外貌特征与健康注意事项',
    scanLabel: '扫描芯片二维码验证并领取赏金',
    speechText: (name, breed, city, reward) =>
      `紧急寻宠通知。名为${name}的${breed}在${city}走失。已在Solana区块链锁定${reward}个SOL智能合约悬赏金。`,
  },
  ja: {
    title: '迷子ペット緊急捜索',
    rewardLabel: 'スマートコントラクト懸賞金',
    lastSeenLabel: '最終目撃場所',
    featuresLabel: '特徴および医療上の注意',
    scanLabel: 'QRスキャンでチップ確認と報奨金受取',
    speechText: (name, breed, city, reward) =>
      `緊急迷子ペットアラート。${city}で迷子になった${breed}の${name}を探しています。Solana上で${reward}SOLの懸賞金が預託されています。`,
  },
};

export const EmergencyFlyerModal: React.FC<EmergencyFlyerModalProps> = ({ pet, onClose }) => {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynth(window.speechSynthesis);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleVoiceAlert = () => {
    if (!speechSynth) return;

    if (isSpeaking) {
      speechSynth.cancel();
      setIsSpeaking(false);
      return;
    }

    speechSynth.cancel();
    const t = TRANSLATIONS[lang];
    const text = t.speechText(pet.name, pet.breed, pet.city || pet.lastSeenLocation || 'the area', pet.bountySol);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate lang
    utterance.lang = lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynth.speak(utterance);
    setIsSpeaking(true);
    playSound('radar');
  };

  const handlePrint = () => {
    playSound('click');
    window.print();
  };

  const t = TRANSLATIONS[lang];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://chainpaws.app/pet/${pet.id}&bgcolor=ffffff&color=080c14&margin=2`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="card w-full max-w-2xl overflow-hidden border-red-500/30 bg-[#0d1526] my-8 shadow-2xl">

        {/* Modal Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#080c14]">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider"
               style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <ShieldAlert className="w-4 h-4" />
            <span>AI Emergency Bulletin & Voice Broadcast</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {(['en', 'es', 'fr', 'zh', 'ja'] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); playSound('click'); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors ${
                    lang === l ? 'bg-[#2ec4b6] text-[#080c14]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={() => { if (speechSynth) speechSynth.cancel(); onClose(); playSound('click'); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Poster Canvas */}
        <div id="printable-flyer" className="p-6 sm:p-8 space-y-6 bg-[#080c14] border-b border-white/[0.08]">
          
          {/* Header Banner */}
          <div className="text-center space-y-1.5 pb-4 border-b-2 border-red-600">
            <span className="inline-block px-3 py-1 rounded bg-red-600 text-white font-black text-xs uppercase tracking-widest"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t.title}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight pt-1"
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {pet.name.toUpperCase()}
            </h1>
            <p className="text-xs font-mono text-slate-400">
              ISO 11784 Microchip Tag: <span className="text-[#2ec4b6] font-bold">{pet.microchipId}</span>
            </p>
          </div>

          {/* Photo & Escrow Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div className="relative h-56 rounded-2xl overflow-hidden border-2 border-white/[0.1] bg-[#0d1526]">
              <Image
                src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                alt={pet.name}
                fill
                className="object-cover"
                unoptimized
              />
              {pet.medicalUrgent && (
                <div className="absolute top-2 left-2 badge-urgent text-[10px]">
                  Needs Daily Medication
                </div>
              )}
            </div>

            {/* Escrow Reward Callout */}
            <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-[#f4a261]/15 to-red-500/10 border-2 border-[#f4a261]/40 text-center">
              <div className="text-[11px] font-bold text-[#f4a261] uppercase tracking-wider"
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.rewardLabel}
              </div>
              <div className="stat-value text-4xl sm:text-5xl text-[#f4a261]">
                {pet.bountySol} SOL
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Funds locked in non-custodial smart contract on Solana Devnet. Guaranteed payout on verified return.
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]"
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.lastSeenLabel}
              </div>
              <div className="text-white font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span>{pet.lastSeenLocation || pet.city || 'Nearby'}</span>
              </div>
              {pet.timeElapsed && (
                <div className="text-slate-500 text-[11px] flex items-center gap-1 pt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>Missing since {pet.timeElapsed}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]"
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.featuresLabel}
              </div>
              <p className="text-slate-200 leading-relaxed">
                {pet.distinctiveFeatures || `${pet.breed} — ${pet.color}. Very friendly.`}
              </p>
            </div>
          </div>

          {/* QR Footer */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white text-[#080c14]">
            <div className="space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.scanLabel}
              </div>
              <p className="text-[10px] text-slate-700 font-mono">
                ChainPaws On-Chain PDA: {pet.pdaAddress.slice(0, 16)}...
              </p>
            </div>
            <div className="relative w-14 h-14 flex-shrink-0 bg-white p-1 rounded-lg">
              <Image src={qrUrl} alt="Collar QR Code" fill className="object-contain" unoptimized />
            </div>
          </div>

        </div>

        {/* Modal Action Controls */}
        <div className="p-4 bg-[#0d1526] flex flex-wrap items-center justify-between gap-3">
          
          {/* Voice Broadcast */}
          <button
            onClick={handleToggleVoiceAlert}
            className={`btn-ghost text-xs py-2 px-4 flex items-center gap-2 ${
              isSpeaking ? 'border-red-500 text-red-400 bg-red-950/40' : ''
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 animate-pulse text-red-400" />
                <span>Stop Broadcast</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#2ec4b6]" />
                <span>Play Voice Siren ({lang.toUpperCase()})</span>
              </>
            )}
          </button>

          {/* Print Flyer */}
          <button
            onClick={handlePrint}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Emergency Flyer</span>
          </button>
        </div>

      </div>
    </div>
  );
};
