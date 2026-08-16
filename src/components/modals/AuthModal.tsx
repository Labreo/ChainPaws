'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  X,
  User,
  Mail,
  Lock,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  CheckCircle2,
  Smartphone,
  Coins,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types';
import { DEFAULT_USERS } from '@/lib/mockData';
import { playSound } from '@/lib/sound';
import { shortenAddress } from '@/lib/solana/pda';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('owner');
  const [signUpClinicName, setSignUpClinicName] = useState('');
  const [signUpClinicAddress, setSignUpClinicAddress] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      setError('Please enter your email address.');
      playSound('alert');
      return;
    }

    // Check if matching preset or stored user
    const existing = DEFAULT_USERS.find(
      (u) => u.email.toLowerCase() === signInEmail.trim().toLowerCase()
    );

    const userToLogin: UserProfile = existing || {
      id: `user-${Date.now()}`,
      name: signInEmail.split('@')[0],
      email: signInEmail.trim(),
      role: 'owner',
      walletAddress: publicKey?.toBase58() || `Grdn_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: Date.now(),
    };

    playSound('success');
    onLogin(userToLogin);
    onClose();
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim()) {
      setError('Please enter your full name and email address.');
      playSound('alert');
      return;
    }

    const generatedWallet =
      publicKey?.toBase58() ||
      (signUpRole === 'clinic'
        ? `Vet_${Math.random().toString(36).slice(2, 10)}`
        : `Grdn_${Math.random().toString(36).slice(2, 10)}`);

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      role: signUpRole,
      clinicName: signUpRole === 'clinic' ? signUpClinicName.trim() : undefined,
      clinicAddress: signUpRole === 'clinic' ? signUpClinicAddress.trim() : undefined,
      phone: signUpPhone.trim() || undefined,
      walletAddress: generatedWallet,
      createdAt: Date.now(),
    };

    playSound('success');
    onLogin(newUser);
    onClose();
  };

  const handleQuickDemoLogin = (user: UserProfile) => {
    playSound('click');
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="card w-full max-w-lg overflow-hidden border-white/[0.12] bg-[#0d1526] my-8 shadow-2xl animate-fade-in relative">

        {/* Close Button */}
        <button
          onClick={() => { onClose(); playSound('click'); }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Brand */}
        <div className="p-6 sm:p-7 border-b border-white/[0.08] bg-[#080c14]/90 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/30 text-[#2ec4b6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {currentUser ? 'Guardian Profile' : 'ChainPaws Guardian Auth'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser ? 'Logged in on Solana Protocol' : 'Decentralized Pet Recovery & Clinic Network'}
              </p>
            </div>
          </div>

          {/* Already Logged In Card */}
          {currentUser && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2ec4b6]/20 border border-[#2ec4b6]/40 flex items-center justify-center text-[#2ec4b6] font-bold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-slate-400">{currentUser.email}</div>
                  <div className="text-[10px] font-mono text-[#2ec4b6] mt-0.5">
                    {shortenAddress(currentUser.walletAddress, 6)} • <span className="uppercase">{currentUser.role}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { onLogout(); playSound('click'); }}
                className="btn-ghost text-xs text-red-400 hover:text-red-300 border-red-500/30"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Sign In / Sign Up Tabs */}
        {!currentUser && (
          <div>
            <div className="flex border-b border-white/[0.08] bg-[#080c14]/40">
              <button
                onClick={() => { setTab('signin'); setError(null); playSound('click'); }}
                className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  tab === 'signin'
                    ? 'text-[#2ec4b6] border-b-2 border-[#2ec4b6] bg-white/[0.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => { setTab('signup'); setError(null); playSound('click'); }}
                className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  tab === 'signup'
                    ? 'text-[#2ec4b6] border-b-2 border-[#2ec4b6] bg-white/[0.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-6">

              {error && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
                  {error}
                </div>
              )}

              {/* ── Sign In Form ── */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="e.g. alex.guardian@chainpaws.io"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password / Guardian PIN</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center py-3 text-xs">
                    <span>Sign In to Guardian Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* 1-Click Quick Demo Switcher */}
                  <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center"
                         style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      ⚡ 1-Click Instant Demo Profiles
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {DEFAULT_USERS.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleQuickDemoLogin(user)}
                          className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#2ec4b6]/10 text-[#2ec4b6] flex items-center justify-center text-xs font-bold">
                              {user.name[0]}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white group-hover:text-[#2ec4b6] transition-colors">
                                {user.name}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {user.role === 'owner' ? 'Pet Owner' : user.role === 'clinic' ? 'Veterinary Node' : 'Community Finder'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase font-mono">
                            Select →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Web3 Wallet Option */}
                  <div className="pt-2 text-center">
                    <div className="text-[11px] text-slate-500 mb-2">Or connect natively with your Web3 wallet:</div>
                    <div className="flex justify-center wallet-button-wrapper">
                      <WalletMultiButton />
                    </div>
                  </div>
                </form>
              )}

              {/* ── Sign Up Form ── */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Account Type / Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { role: 'owner' as UserRole, label: 'Pet Parent' },
                        { role: 'clinic' as UserRole, label: 'Vet Clinic' },
                        { role: 'guardian' as UserRole, label: 'Finder / Scout' },
                      ].map((r) => (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => { setSignUpRole(r.role); playSound('click'); }}
                          className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                            signUpRole === r.role
                              ? 'bg-[#2ec4b6] text-[#080c14] border-[#2ec4b6] font-bold'
                              : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.06]'
                          }`}
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {signUpRole === 'clinic' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Hospital / Shelter Name</label>
                        <input
                          type="text"
                          value={signUpClinicName}
                          onChange={(e) => setSignUpClinicName(e.target.value)}
                          placeholder="e.g. Golden Gate Veterinary Clinic"
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Clinic Street Address</label>
                        <input
                          type="text"
                          value={signUpClinicAddress}
                          onChange={(e) => setSignUpClinicAddress(e.target.value)}
                          placeholder="e.g. 1200 Market St, San Francisco, CA"
                          className="input-field"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password / Passkey</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a secure passkey"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center py-3 text-xs">
                    <span>Create Guardian Profile & Mint PDA</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
