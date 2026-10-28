import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Zap, 
  Coins, 
  Clock, 
  FileCheck, 
  Flame, 
  BarChart3, 
  ExternalLink 
} from 'lucide-react';
import { NileTokenCoin } from './NileTokenCoin.tsx';
import { useApp } from '../context/AppContext.tsx';

interface StakingAdvantageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDuration?: (days: number) => void;
}

export const StakingAdvantageModal: React.FC<StakingAdvantageModalProps> = ({
  isOpen,
  onClose,
  onSelectDuration
}) => {
  const { setCertificateModalOpen, showToast } = useApp();

  // 100ms real-time streaming accrual engine simulation (+0.0006944 USDT / sec)
  const [liveStreamYield, setLiveStreamYield] = useState<number>(248.914200);
  const [sliderAmount, setSliderAmount] = useState<number>(10000);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(90);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveStreamYield(prev => prev + 0.0006944);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const horizonTiers = [
    { days: 1, label: '24h Daily', apr: 4.5, highlight: 'Immediate spot liquidity, no commitment' },
    { days: 7, label: '7 Days Weekly', apr: 6.0, highlight: 'Short cycle cash-flow, zero penalty' },
    { days: 15, label: '15 Days Bi-Weekly', apr: 7.5, highlight: 'Balanced short-term reserve' },
    { days: 30, label: '30 Days Monthly', apr: 9.0, highlight: 'Standard institutional horizon' },
    { days: 90, label: '90 Days Strategic', apr: 12.0, highlight: 'Recommended: High compounded APY' },
    { days: 180, label: '180 Days Reserve', apr: 14.5, highlight: '1.8× Multiplier for accredited allocators' },
    { days: 365, label: '365 Days Annual', apr: 17.5, highlight: 'Maximum standard treasury yield' },
    { days: 365, label: 'NILE Diamond Apex', apr: 22.0, highlight: 'Native Token 2.0× Multiplier Boost' }
  ];

  const currentTier = horizonTiers.find(h => h.days === selectedHorizon) || horizonTiers[4];
  const projectedReturn = ((sliderAmount * (currentTier.apr / 100) * selectedHorizon) / 365).toFixed(2);

  const handleApplyHorizon = () => {
    if (onSelectDuration) {
      onSelectDuration(selectedHorizon);
    }
    showToast(`Selected ${currentTier.label} (${currentTier.apr}% APR). Ready to enroll!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-[#091124] border-2 border-[#E5B842] shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center text-[#E5B842]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-[10px] font-mono font-bold uppercase tracking-wider">
                Institutional Whitepaper Brief
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Why Lock Tokens With Nile? 5 Staking Advantages
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 100ms Live Streaming Accrual Engine Header Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#060B17] via-[#0A1633] to-[#060B17] border border-[#E5B842]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
              <Zap className="w-4 h-4 text-[#E5B842] animate-pulse" />
              <span>100ms Real-Time Yield Streaming Engine</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              +${liveStreamYield.toFixed(6)} <span className="text-sm font-semibold text-slate-400">USDT Live Yield</span>
            </div>
            <p className="text-xs text-slate-400 max-w-lg">
              Unlike traditional monthly banks or weekly DeFi batches, Nile calculates and streams fractional earnings every 100 milliseconds directly to your verified ledger.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right font-mono text-xs shrink-0">
            <div className="text-[10px] text-slate-500 uppercase">Streaming Rate:</div>
            <div className="text-sm font-bold text-[#E5B842]">+0.0006944 USDT / sec</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Continuous Compounding</div>
          </div>
        </div>

        {/* 5 Core Institutional Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reason 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs">01</span>
              <span>High Compounded APY (Up to 22.0% APR)</span>
            </div>
            <h4 className="text-sm font-bold text-white">Institutional Yield Curves</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Locking capital provides strategic liquidity to Nile algorithmic market-making pools, earning top-tier returns ranging from 4.5% up to 22.0% APR for native NILE stakers.
            </p>
          </div>

          {/* Reason 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-[#E5B842] text-xs font-bold font-mono">
              <span className="w-6 h-6 rounded-lg bg-[#E5B842]/15 border border-[#E5B842]/30 flex items-center justify-center text-xs">02</span>
              <span>100ms Continuous Streaming Accrual</span>
            </div>
            <h4 className="text-sm font-bold text-white">Zero Batch Delay or Freeze</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earnings accumulate continuously without waiting for calendar months. Sweep accrued rewards into your spot Liquid Wallet anytime with 1 click.
            </p>
          </div>

          {/* Reason 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xs">03</span>
              <span>150% Overcollateralized Security</span>
            </div>
            <h4 className="text-sm font-bold text-white">Full Capital Protection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All yield-generating deployments require minimum 150% prime collateral. Nile maintains a 115%+ reserve buffer verified by on-chain Merkle-Tree Proof of Reserves.
            </p>
          </div>

          {/* Reason 4 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold font-mono">
              <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xs">04</span>
              <span>Emergency 48-Hour Unstaking Cooldown</span>
            </div>
            <h4 className="text-sm font-bold text-white">Capital is Never Inflexible</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Need immediate liquidity? Request an emergency unstake anytime with a compliant 48-hour cooldown window. Full principal is returned directly to your Liquid Wallet.
            </p>
          </div>

          {/* Reason 5 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
              <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs">05</span>
              <span>Native NILE Token 2.0× Multiplier & Governance</span>
            </div>
            <h4 className="text-sm font-bold text-white">Double Yield with Staked Governance Assets</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Locking NILE tokens unlocks automatic tier progression, 2.0× multiplier boosts across multi-asset vaults, VIP concierge support, and fee waivers for corporate card issuance.
            </p>
          </div>
        </div>

        {/* Interactive Horizon Simulator */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#E5B842]" />
              <span>Interactive Yield Simulator By Horizon</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Projected Yield: +${projectedReturn} USDT
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {[1, 7, 30, 90, 180, 365].map(d => {
              const tier = horizonTiers.find(h => h.days === d)!;
              const isSelected = selectedHorizon === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedHorizon(d)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#E5B842] text-[#070D1B] border-[#E5B842] font-black shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] uppercase">{d === 1 ? 'Daily' : `${d} Days`}</div>
                  <div className="text-sm font-bold">{tier.apr}% APR</div>
                </button>
              );
            })}
          </div>

          {/* Slider for Principal Amount */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Simulated Deposit Principal:</span>
              <span className="text-white font-bold">${sliderAmount.toLocaleString()} USDT</span>
            </div>
            <input
              type="range"
              min={500}
              max={100000}
              step={500}
              value={sliderAmount}
              onChange={(e) => setSliderAmount(Number(e.target.value))}
              className="w-full accent-[#E5B842] cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setCertificateModalOpen(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#E5B842]" />
            <span>Verify UK Cardiff Entity #08253865</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApplyHorizon}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E5B842] to-[#F3BA2F] text-[#070D1B] font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Apply {currentTier.label} ({currentTier.apr}%)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
