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
  MapPin,
  Clock,
  Sparkles,
  Loader2,
  Activity,
} from 'lucide-react';
import { PetRecord } from '@/types';
import { playSound } from '@/lib/sound';

interface EmergencyFlyerModalProps {
  pet: PetRecord;
  onClose: () => void;
}

type SupportedLanguage = 'en' | 'es' | 'fr' | 'zh' | 'ja';

const UI_TRANSLATIONS: Record<SupportedLanguage, {
  headerTitle: string;
  title: string;
  isoLabel: string;
  medicalBadge: string;
  rewardLabel: string;
  escrowSubtext: string;
  lastSeenLabel: string;
  missingSince: (time: string) => string;
  featuresLabel: string;
  scanLabel: string;
  pdaLabel: string;
  voiceButton: (langName: string) => string;
  stopVoiceButton: string;
  printButton: string;
  aiBadge: string;
  broadcastingLabel: string;
  speechText: (name: string, breed: string, city: string, reward: number, medicalUrgent: boolean, features: string) => string;
}> = {
  en: {
    headerTitle: 'AI EMERGENCY BULLETIN & VOICE BROADCAST',
    title: 'LOST COMPANION ALERT',
    isoLabel: 'ISO 11784 Microchip Tag',
    medicalBadge: 'Needs Daily Medication',
    rewardLabel: 'ESCROW REWARD',
    escrowSubtext: 'Funds locked in non-custodial smart contract on Solana Devnet. Guaranteed payout on verified return.',
    lastSeenLabel: 'LAST SEEN LOCATION',
    missingSince: (time) => `Missing since ${time}`,
    featuresLabel: 'IDENTIFYING MARKS & MEDICAL NOTES',
    scanLabel: 'SCAN TO VERIFY CHIP & CLAIM REWARD',
    pdaLabel: 'ChainPaws On-Chain PDA',
    voiceButton: (lang) => `Play Voice Siren (${lang})`,
    stopVoiceButton: 'Stop Broadcast',
    printButton: 'Print Emergency Flyer',
    aiBadge: 'AI Multilingual Engine',
    broadcastingLabel: 'Broadcasting emergency audio siren...',
    speechText: (name, breed, city, reward, medicalUrgent, features) =>
      `Emergency lost companion alert. ${name}, a ${breed}, is missing near ${city}. ${
        medicalUrgent ? 'Critical medical alert: this companion requires daily essential medication. ' : ''
      }Identifying traits: ${features}. A verified escrow bounty of ${reward} SOL is locked on the Solana blockchain for their safe recovery. Please scan the QR tag or notify authorities immediately.`,
  },
  es: {
    headerTitle: 'BOLETÍN DE EMERGENCIA IA Y DIFUSIÓN DE VOZ',
    title: 'ALERTA DE MASCOTA PERDIDA',
    isoLabel: 'Microchip ISO 11784',
    medicalBadge: 'Requiere Medicación Diaria',
    rewardLabel: 'RECOMPENSA EN CUSTODIA',
    escrowSubtext: 'Fondos bloqueados en contrato inteligente no custodial en Solana Devnet. Pago garantizado tras verificación.',
    lastSeenLabel: 'ÚLTIMA UBICACIÓN VISTA',
    missingSince: (time) => `Desaparecido hace ${time}`,
    featuresLabel: 'MARCAS DE IDENTIFICACIÓN Y NOTAS MÉDICAS',
    scanLabel: 'ESCANEE PARA VERIFICAR CHIP Y RECLAMAR RECOMPENSA',
    pdaLabel: 'PDA en cadena ChainPaws',
    voiceButton: (lang) => `Reproducir Sirena (${lang})`,
    stopVoiceButton: 'Detener Emisión',
    printButton: 'Imprimir Cartel de Emergencia',
    aiBadge: 'Traducción Dinámica IA',
    broadcastingLabel: 'Transmitiendo sirena de voz de emergencia...',
    speechText: (name, breed, city, reward, medicalUrgent, features) =>
      `Alerta de emergencia de mascota perdida. ${name}, de raza ${breed}, está desaparecido cerca de ${city}. ${
        medicalUrgent ? 'Alerta médica crítica: requiere medicación vital diaria. ' : ''
      }Características: ${features}. Una recompensa en custodia de ${reward} SOL está bloqueada en la cadena de bloques Solana para su regreso seguro.`,
  },
  fr: {
    headerTitle: 'BULLETIN D\'URGENCE IA ET DIFFUSION VOCALE',
    title: 'ALERTE ANIMAL DISPARU',
    isoLabel: 'Puce Électronique ISO 11784',
    medicalBadge: 'Médication Quotidienne Requise',
    rewardLabel: 'RÉCOMPENSE SOUS SÉQUESTRE',
    escrowSubtext: 'Fonds sécurisés sur smart contract non-dépositaire Solana Devnet. Paiement garanti après vérification.',
    lastSeenLabel: 'DERNIER LIEU VU',
    missingSince: (time) => `Disparu depuis ${time}`,
    featuresLabel: 'SIGNES DISTINCTIFS ET REMARQUES MÉDICALES',
    scanLabel: 'SCANNEZ POUR VÉRIFIER LA PUCE ET RÉCLAMER',
    pdaLabel: 'PDA sur chaîne ChainPaws',
    voiceButton: (lang) => `Diffuser l'Alerte Vocale (${lang})`,
    stopVoiceButton: 'Arrêter la Diffusion',
    printButton: 'Imprimer l\'Affiche d\'Urgence',
    aiBadge: 'Traduction Dynamique IA',
    broadcastingLabel: 'Diffusion de la sirène vocale d\'urgence...',
    speechText: (name, breed, city, reward, medicalUrgent, features) =>
      `Alerte d'urgence pour animal disparu. ${name}, un ${breed}, est porté disparu vers ${city}. ${
        medicalUrgent ? 'Avis médical critique : cet animal nécessite son traitement médical quotidien. ' : ''
      }Signes distinctifs : ${features}. Une récompense de ${reward} SOL est sécurisée sur la blockchain Solana pour son retour.`,
  },
  zh: {
    headerTitle: 'AI 紧急寻宠通告与语音广播',
    title: '紧急寻宠启事',
    isoLabel: 'ISO 11784 微芯片识别码',
    medicalBadge: '需要每日定时服药',
    rewardLabel: '区块链智能合约悬赏',
    escrowSubtext: '赏金已锁定于 Solana Devnet 非托管智能合约，芯片验证确认归还后自动发放。',
    lastSeenLabel: '最后目击地点',
    missingSince: (time) => `走失时间：${time}`,
    featuresLabel: '外貌特征与健康注意事项',
    scanLabel: '扫描芯片二维码验证并领取悬赏',
    pdaLabel: 'ChainPaws 链上 PDA',
    voiceButton: (lang) => `播放语音警报 (${lang})`,
    stopVoiceButton: '停止广播',
    printButton: '打印紧急寻宠传单',
    aiBadge: 'AI 智能多语言翻译',
    broadcastingLabel: '正在广播紧急语音警报...',
    speechText: (name, breed, city, reward, medicalUrgent, features) =>
      `紧急寻宠广播通知。名为${name}的${breed}在${city}走失。${
        medicalUrgent ? '关键医疗警告：该宠物需要每日按时服用必要药物！' : ''
      }外貌特征：${features}。已在Solana区块链锁定${reward}个SOL智能合约悬赏金。请扫描芯片二维码或通知救援。`,
  },
  ja: {
    headerTitle: 'AI 緊急捜索通告・音声ブロードキャスト',
    title: '迷子ペット緊急捜索',
    isoLabel: 'ISO 11784 マイクロチップ番号',
    medicalBadge: '毎日の投薬が必要です',
    rewardLabel: 'スマートコントラクト懸賞金',
    escrowSubtext: 'Solana Devnetの非管理型スマートコントラクトに安全に預託中。チップ確認後に確実にお支払いします。',
    lastSeenLabel: '最終目撃場所',
    missingSince: (time) => `失踪からの経過時間：${time}`,
    featuresLabel: '特徴および医療上の注意事項',
    scanLabel: 'QRスキャンでチップ確認＆懸賞金受取',
    pdaLabel: 'ChainPaws オンチェーンPDA',
    voiceButton: (lang) => `音声アラート再生 (${lang})`,
    stopVoiceButton: '音声を停止',
    printButton: '緊急捜索チラシを印刷',
    aiBadge: 'AI リアルタイム自動翻訳',
    broadcastingLabel: '緊急音声サイレンを放送中...',
    speechText: (name, breed, city, reward, medicalUrgent, features) =>
      `緊急迷子ペットアラート。${city}付近で迷子になった${breed}の${name}を探しています。${
        medicalUrgent ? '緊急医療警告：このペットは毎日の重要な投薬治療が不可欠です！' : ''
      }特徴：${features}。Solanaブロックチェーン上に${reward}SOLのスマートコントラクト懸賞金が預託されています。見かけた方は至急QRコードをスキャンしてください。`,
  },
};

export const EmergencyFlyerModal: React.FC<EmergencyFlyerModalProps> = ({ pet, onClose }) => {
  const [lang, setLang] = useState<SupportedLanguage>('ja');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesis | null>(null);

  // Dynamic AI Translation state
  const rawFeatures = pet.distinctiveFeatures || `${pet.breed} — ${pet.color}. Very friendly.`;
  const [translatedFeatures, setTranslatedFeatures] = useState<string>(rawFeatures);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({
    [`en:${rawFeatures}`]: rawFeatures,
  });

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

  // Fetch dynamic AI translation whenever language changes
  useEffect(() => {
    if (lang === 'en') {
      setTranslatedFeatures(rawFeatures);
      return;
    }

    const cacheKey = `${lang}:${rawFeatures}`;
    if (translationCache[cacheKey]) {
      setTranslatedFeatures(translationCache[cacheKey]);
      return;
    }

    let isMounted = true;
    async function fetchDynamicTranslation() {
      setIsTranslating(true);
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawFeatures, targetLang: lang }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.translatedText) {
            setTranslatedFeatures(data.translatedText);
            setTranslationCache((prev) => ({ ...prev, [cacheKey]: data.translatedText }));
          }
        }
      } catch (err) {
        console.warn('Dynamic translation failed, using fallback:', err);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    }

    fetchDynamicTranslation();

    return () => {
      isMounted = false;
    };
  }, [lang, rawFeatures, translationCache]);

  const handleToggleVoiceAlert = () => {
    if (!speechSynth) return;

    if (isSpeaking) {
      speechSynth.cancel();
      setIsSpeaking(false);
      return;
    }

    speechSynth.cancel();
    
    // 1. Play siren acoustic burst first
    playSound('siren');

    // 2. Queue synthesized voice broadcast with translated medical urgency and features
    const t = UI_TRANSLATIONS[lang];
    const text = t.speechText(
      pet.name,
      pet.breed,
      pet.city || pet.lastSeenLocation || 'the area',
      pet.bountySol,
      !!pet.medicalUrgent,
      translatedFeatures
    );
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate language tag
    utterance.lang = lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Small delay so siren acoustic rings before speech begins
    setTimeout(() => {
      speechSynth.speak(utterance);
      setIsSpeaking(true);
    }, 450);
  };

  const handlePrint = () => {
    playSound('click');
    window.print();
  };

  const t = UI_TRANSLATIONS[lang];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://chain-paws.vercel.app&bgcolor=ffffff&color=080c14&margin=2`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="card w-full max-w-2xl overflow-hidden border-red-500/30 bg-[#0d1526] my-8 shadow-2xl">

        {/* Modal Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#080c14]">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider"
               style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <ShieldAlert className="w-4 h-4" />
            <span>{t.headerTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {(['en', 'es', 'fr', 'zh', 'ja'] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); playSound('click'); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
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
              {t.isoLabel}: <span className="text-[#2ec4b6] font-bold">{pet.microchipId}</span>
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
                <div className="absolute top-2 left-2 badge-urgent text-[10px] shadow-lg animate-pulse">
                  {t.medicalBadge}
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
                {t.escrowSubtext}
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
                <div className="text-slate-400 text-[11px] flex items-center gap-1 pt-0.5 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{t.missingSince(pet.timeElapsed)}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1 relative">
              <div className="flex items-center justify-between">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t.featuresLabel}
                </div>
                {lang !== 'en' && (
                  <span className="flex items-center gap-1 text-[10px] text-[#2ec4b6] font-medium">
                    <Sparkles className="w-3 h-3 text-[#2ec4b6]" />
                    <span>{t.aiBadge}</span>
                  </span>
                )}
              </div>
              <p className="text-slate-200 leading-relaxed min-h-[20px]">
                {isTranslating ? (
                  <span className="flex items-center gap-2 text-slate-400 italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2ec4b6]" />
                    Translating with AI...
                  </span>
                ) : (
                  translatedFeatures
                )}
              </p>
            </div>
          </div>

          {/* Active Voice Siren Broadcast Banner */}
          {isSpeaking && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center justify-between gap-3 text-red-300 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Activity className="w-4 h-4 text-red-400 animate-spin" />
                <span>{t.broadcastingLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-6 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1.5 h-7 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
            </div>
          )}

          {/* QR Footer */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white text-[#080c14]">
            <div className="space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.scanLabel}
              </div>
              <p className="text-[10px] text-slate-700 font-mono">
                {t.pdaLabel}: {pet.pdaAddress.slice(0, 16)}...
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
            className={`btn-ghost text-xs py-2 px-4 flex items-center gap-2 cursor-pointer transition-all ${
              isSpeaking ? 'border-red-500 text-red-400 bg-red-950/60 shadow-lg shadow-red-500/20' : ''
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 animate-pulse text-red-400" />
                <span>{t.stopVoiceButton}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#2ec4b6]" />
                <span>{t.voiceButton(lang.toUpperCase())}</span>
              </>
            )}
          </button>

          {/* Print Flyer */}
          <button
            onClick={handlePrint}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printButton}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
