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
} from 'lucide-react';
import { PetRecord } from '@/types';
import { playSound } from '@/lib/sound';

interface EmergencyFlyerModalProps {
  pet: PetRecord;
  onClose: () => void;
}

type SupportedLanguage = 'en' | 'es' | 'fr' | 'zh' | 'ja';

// Multilingual translations database for pet distinctive features
const FEATURE_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  'pet-001': { // Atlas
    en: 'Wearing red reflective harness. Distinctive wolf mask markings, friendly but fast runner.',
    es: 'Lleva arnés reflectante rojo. Marcas faciales distintivas de lobo, muy amigable pero corre rápido.',
    fr: 'Porte un harnais réfléchissant rouge. Masque facial distinctif de loup, très amical mais rapide.',
    zh: '佩戴红色反光胸背带。独特的狼面斑纹，性格温顺亲人，奔跑迅速。',
    ja: '赤い反射ハーネス着用。特徴的なオオカミ柄の顔立ち、人懐っこいですが走るのが速いです。',
  },
  'pet-002': { // Kobe
    en: 'Wearing teal collar with stainless tag. Loves chasing tennis balls, answers to Kobe.',
    es: 'Lleva collar verde azulado con placa de acero. Le encanta perseguir pelotas de tenis, responde a Kobe.',
    fr: 'Porte un collier turquoise avec médaille inox. Adore courir après les balles de tennis, répond à Kobe.',
    zh: '佩戴青色项圈配不锈钢标牌。喜欢追网球，呼唤Kobe有反应。',
    ja: 'ティール色の首輪とステンレス迷子札着用。テニスボール遊びが大好きで、「コービー」と呼ぶと反応します。',
  },
  'pet-003': { // Mochi
    en: 'Folded ears, large owl-like copper eyes, bell collar. Very timid with strangers.',
    es: 'Orejas plegadas, grandes ojos cobrizos, collar con cascabel. Muy tímido con extraños.',
    fr: 'Oreilles pliées, grands yeux cuivrés, collier à clochette. Très timide avec les inconnus.',
    zh: '折耳，猫头鹰般的大铜眼，带有小铃铛项圈。见陌生人比较胆小。',
    ja: '折れ耳、フクロウのような大きな琥珀色の瞳、鈴付きの首輪。人見知りしやすい性格です。',
  },
  'pet-004': { // Ziggy
    en: 'Intense amber eyes, white chest blaze and paws, blue nylon collar. Highly energetic and responsive to whistles.',
    es: 'Ojos ámbar intensos, mancha blanca en pecho y patas, collar de nylon azul. Muy enérgico y responde a silbidos.',
    fr: 'Yeux ambrés intenses, poitrail et pattes blancs, collier en nylon bleu. Très dynamique et obéissant au sifflet.',
    zh: '清澈琥珀色眼睛，胸前与爪子有白斑，戴蓝色尼龙项圈。精力充沛，对哨声有灵敏反应。',
    ja: '鮮やかな琥珀色の瞳、胸元と足先が白い毛並み、青いナイロン首輪。元気いっぱいで口笛に反応します。',
  },
  'pet-005': { // Rex
    en: 'Large scar over left shoulder, leather collar with silver rivets. Loyal family dog, responds to hand signals.',
    es: 'Cicatriz en el hombro izquierdo, collar de cuero con remaches. Perro leal, responde a señas con la mano.',
    fr: 'Grande cicatrice sur l\'épaule gauche, collier en cuir clouté. Chien fidèle, réactif aux gestes.',
    zh: '左肩有明显疤痕，皮质铆钉项圈。忠诚亲人，对常用手势口令有良好反应。',
    ja: '左肩に傷跡あり、シルバーリベット付き革首輪。忠実な家族犬で、ハンドサインに反応します。',
  },
  'pet-006': { // Luna
    en: 'Cream French Bulldog with black mask, lilac harness. Snorts when excited, loves people.',
    es: 'Bulldog francés crema con máscara negra, arnés lila. Resopla cuando está emocionada, muy cariñosa.',
    fr: 'Bouledogue français crème à masque noir, harnais lilas. Renifle quand elle est excitée, adore les gens.',
    zh: '奶油色法国斗牛犬带黑面罩，淡紫色胸背带。兴奋时会打呼噜，极度喜欢人类。',
    ja: 'ブラックマスクのクリーム色フレンチブルドッグ、薄紫色のハーネス。興奮すると鼻を鳴らします。人が大好きです。',
  },
  'pet-007': { // Bear
    en: 'Chocolate coat with golden undertones, service vest patch removed. Extremely gentle giant.',
    es: 'Pelaje chocolate con reflejos dorados. Perro gigante extremadamente dócil y gentil.',
    fr: 'Pelage chocolat aux reflets dorés. Chien géant extrêmement doux et calme.',
    zh: '深巧克力色毛发泛金光。性格极其温顺的大型犬。',
    ja: '光沢のあるチョコレート色の毛並み。とても穏やかで優しい性格の大型犬です。',
  },
  'pet-008': { // Coco
    en: 'Tiny frame (4 lbs), feathery ears, pink rhinestone collar. Needs heart medication.',
    es: 'Tamaño muy pequeño (2 kg), orejas plumosas, collar rosa con pedrería. Requiere medicación cardíaca.',
    fr: 'Très petite taille (2 kg), oreilles frangées, collier rose à strass. A besoin de médicaments cardiaques.',
    zh: '娇小体型（约2公斤），羽状长耳，佩戴粉色水钻项圈。需要按时服用心脏药物。',
    ja: '体重約2kgの超小型犬、フサフサの飾り毛のある耳、ピンクのラインストーン首輪。心臓病の薬が毎日必要です。',
  },
  'pet-009': { // Milo
    en: 'Tri-color pattern with white socks, blue bandana. Very food-motivated and quick to follow treats.',
    es: 'Patrón tricolor con patas blancas, bandana azul. Le motiva mucho la comida y sigue golosinas.',
    fr: 'Robe tricolore avec pattes blanches, bandana bleu. Très gourmand et obéit aux friandises.',
    zh: '三色毛发配白袜爪，戴蓝色三角巾。对食物极度敏感，容易被零食吸引。',
    ja: '足先が白いトライカラーの毛並み、青いバンダナ着用。食いしん坊でおやつによく反応します。',
  },
};

const TRANSLATIONS: Record<SupportedLanguage, {
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
  speechText: (name: string, breed: string, city: string, reward: number) => string;
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
    speechText: (name, breed, city, reward) =>
      `Emergency missing companion alert. A ${breed} named ${name} was last seen in ${city}. A verified escrow reward of ${reward} SOL is locked on the Solana blockchain for their safe return. Please scan the QR tag or notify authorities immediately.`,
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
    speechText: (name, breed, city, reward) =>
      `Alerta de emergencia de mascota perdida. Un ${breed} llamado ${name} fue visto por última vez en ${city}. Hay una recompensa en custodia de ${reward} SOL en la cadena de bloques Solana para su regreso seguro.`,
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
    speechText: (name, breed, city, reward) =>
      `Alerte d'urgence pour animal disparu. Un ${breed} nommé ${name} a été vu pour la dernière fois à ${city}. Une récompense de ${reward} SOL est bloquée sur la blockchain Solana pour son retour en toute sécurité.`,
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
    speechText: (name, breed, city, reward) =>
      `紧急寻宠通知。名为${name}的${breed}在${city}走失。已在Solana区块链锁定${reward}个SOL智能合约悬赏金。请扫描芯片二维码或联系救援。`,
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
    speechText: (name, breed, city, reward) =>
      `緊急迷子ペットアラート。${city}で迷子になった${breed}の${name}を探しています。Solana上で${reward}SOLの懸賞金が預託されています。見かけた方はQRスキャンをお願いします。`,
  },
};

export const EmergencyFlyerModal: React.FC<EmergencyFlyerModalProps> = ({ pet, onClose }) => {
  const [lang, setLang] = useState<SupportedLanguage>('ja');
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
    
    // Set appropriate language tag
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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://chain-paws.vercel.app&bgcolor=ffffff&color=080c14&margin=2`;

  // Get translated features for known pets or fallback
  const translatedFeatures = FEATURE_TRANSLATIONS[pet.id]?.[lang] || pet.distinctiveFeatures || `${pet.breed} — ${pet.color}. Very friendly.`;

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

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]"
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t.featuresLabel}
              </div>
              <p className="text-slate-200 leading-relaxed">
                {translatedFeatures}
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
            className={`btn-ghost text-xs py-2 px-4 flex items-center gap-2 cursor-pointer ${
              isSpeaking ? 'border-red-500 text-red-400 bg-red-950/40' : ''
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
