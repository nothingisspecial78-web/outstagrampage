import React, { useState } from 'react';
import { Settings, Grid, MapPin, Hourglass, Plus, Footprints, Gift, Users, Hammer, Lock, Zap, Sparkles, CheckCircle2, Plane, Award } from 'lucide-react';

interface HighlightItem {
  id: string;
  title: string;
  cover: string;
}

const HIGHLIGHTS: HighlightItem[] = [
  { id: 'h1', title: 'Berlin', cover: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80' },
  { id: 'h2', title: 'Cafes', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80' },
  { id: 'h3', title: 'Meetups', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80' },
  { id: 'h4', title: 'Linocuts', cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80' },
  { id: 'h5', title: 'Quests', cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&auto=format&fit=crop&q=80' },
];

const USER_POSTS = [
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
];

const USER_STAMPS = [
  { place: 'West Pier', date: 'NOV 12', kind: 'Place' },
  { place: 'With Priya', date: 'NOV 10', kind: 'Meetup' },
  { place: 'Notice 3 Things', date: 'NOV 09', kind: 'Quest' },
  { place: 'Old Greenhouse', date: 'NOV 07', kind: 'Place' },
  { place: 'Linocut Pier', date: 'NOV 03', kind: 'Craft' },
];

export const ProfileView: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'stamps' | 'activities' | 'rewards' | 'posts'>('stamps');

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-6 space-y-8 select-none">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
        {/* Large Avatar with Gradient Story Ring */}
        <div className="size-28 sm:size-36 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-1 shrink-0 shadow-md">
          <div className="size-full rounded-full bg-white p-1">
            <div className="size-full rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-black text-2xl text-slate-700 shadow-inner">
              AN
            </div>
          </div>
        </div>

        {/* Info & Stats */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          {/* Username & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">abdullanothing7</h2>
            <button className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-800 transition-colors">
              Edit profile
            </button>
            <button className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-800 transition-colors">
              View archive
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
              title="Settings"
            >
              <Settings className="size-5" />
            </button>
          </div>

          {/* Activities Stats Row (No Followers, No Following) */}
          <div className="flex items-center justify-center sm:justify-start gap-6 text-sm">
            <p>
              <span className="font-extrabold text-slate-900">18</span>{' '}
              <span className="text-slate-500">quests</span>
            </p>
            <p>
              <span className="font-extrabold text-slate-900">9</span>{' '}
              <span className="text-slate-500">meetups</span>
            </p>
            <p>
              <span className="font-extrabold text-slate-900">14</span>{' '}
              <span className="text-slate-500">postcards</span>
            </p>
            <p>
              <span className="font-extrabold text-slate-900">6</span>{' '}
              <span className="text-slate-500">crafts</span>
            </p>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#C8452D] text-xs font-bold border border-orange-200">
              <Hourglass className="size-3.5" />
              <span>12.5h Reclaimed</span>
            </div>
          </div>

          {/* Bio */}
          <div className="text-xs text-slate-800 space-y-1">
            <p className="font-bold">Abdulla</p>
            <p className="text-slate-500 font-medium">City Explorer & Analog Postcard Maker 🚲</p>
            <p>Post less. Go somewhere. Meet someone.</p>
            <a
              href="#"
              className="text-sky-600 font-semibold hover:underline block pt-0.5"
            >
              outstagram.app/abdulla
            </a>
          </div>
        </div>
      </div>

      {/* Story Highlights Row */}
      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar pt-2 px-1">
        {HIGHLIGHTS.map((hl) => (
          <div key={hl.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="size-16 sm:size-18 rounded-full border-2 border-slate-200 p-0.5 group-hover:border-slate-400 transition-colors">
              <img
                src={hl.cover}
                alt={hl.title}
                className="size-full rounded-full object-cover"
              />
            </div>
            <span className="text-[11px] font-bold text-slate-800">{hl.title}</span>
          </div>
        ))}

        {/* Add New Highlight */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div className="size-16 sm:size-18 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-slate-500 group-hover:text-slate-600 transition-all">
            <Plus className="size-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-400">New</span>
        </div>
      </div>

      {/* Tabs Row (STAMPS, ACTIVITIES, REWARDS, MY POSTCARDS) */}
      <div className="border-t border-slate-200">
        <div className="flex justify-center gap-6 sm:gap-10 text-xs font-bold tracking-wider uppercase">
          <button
            onClick={() => setActiveTab('stamps')}
            className={`flex items-center gap-1.5 py-3.5 border-t-2 -mt-[2px] transition-colors ${
              activeTab === 'stamps'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="size-3.5 text-[#C8452D]" />
            <span>Stamps</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-1.5 py-3.5 border-t-2 -mt-[2px] transition-colors ${
              activeTab === 'activities'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Footprints className="size-3.5 text-[#4F6F52]" />
            <span>Activities</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex items-center gap-1.5 py-3.5 border-t-2 -mt-[2px] transition-colors ${
              activeTab === 'rewards'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Gift className="size-3.5 text-amber-600" />
            <span>Rewards</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 py-3.5 border-t-2 -mt-[2px] transition-colors ${
              activeTab === 'posts'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid className="size-3.5" />
            <span>My Postcards</span>
          </button>
        </div>

        {/* Tab 1: PASSPORT STAMPS */}
        {activeTab === 'stamps' && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-center gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-md">
              <Hourglass className="size-10 text-orange-400" />
              <div>
                <p className="text-4xl font-extrabold leading-none">12.5h</p>
                <p className="text-xs text-slate-300 mt-1">reclaimed from scrolling · 5 stamps collected</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {USER_STAMPS.map((s, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border-2 border-dashed border-amber-200 bg-[#FBF8F1] flex flex-col items-center justify-center text-center gap-2 transform hover:-translate-y-0.5 transition-transform shadow-sm"
                >
                  <div className="size-16 rounded-full border-2 border-[#C8452D] border-dashed flex flex-col items-center justify-center text-[#C8452D]">
                    <span className="text-[10px] font-black uppercase tracking-wider">{s.date}</span>
                    <span className="text-[8px] font-bold">OFFLINE</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-800">{s.place}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.kind} Stamp</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: ACTIVITIES BREAKDOWN */}
        {activeTab === 'activities' && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="size-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Footprints className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">18</p>
                <p className="text-xs text-slate-500">Quests Completed</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="size-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">9</p>
                <p className="text-xs text-slate-500">In-Person Meetups Attended</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="size-12 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                <MapPin className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">14</p>
                <p className="text-xs text-slate-500">Postcards Live-Stamped</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="size-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Hammer className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">6</p>
                <p className="text-xs text-slate-500">Crafts Hand-Made</p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 sm:col-span-2 pt-2">
              All records are private to you. No public comparison, no streaks, no algorithms.
            </p>
          </div>
        )}

        {/* Tab 3: OFFLINE REWARDS & PARTNER PERKS - Enhanced with Stamps & Badges */}
        {activeTab === 'rewards' && (
          <div className="space-y-4 pt-4">
            {/* Google Fit Sync Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-sky-200 bg-sky-50/70 text-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
                  <Zap className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Google Fit Synced</span>
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">18,450 Steps Recorded Today</p>
                  <p className="text-xs text-slate-500">Qualifies for Lenskart Optical Frames & Star Air Passes</p>
                </div>
              </div>
              <button
                onClick={() => alert('Google Fit Step Sync Verified: 18,450 steps.')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Sync Google Fit
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold cursor-pointer">All Rewards (6)</span>
              <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1 cursor-pointer">
                <Sparkles className="size-3" /> Featured (2)
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1 cursor-pointer">
                <CheckCircle2 className="size-3" /> Achieved (2)
              </span>
            </div>

            {/* Reward 1: Star Air 50% Flight Pass (FEATURED) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-4 shadow-sm hover:shadow transition-shadow">
              <div className="relative size-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                <Plane className="size-6 text-amber-200" />
                <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">50% OFF</span>
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[8px] font-extrabold uppercase">
                  FEATURED
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-slate-900 text-sm">Star Air 50% Domestic Flight Pass</p>
                  <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black">
                    FEATURED AIR PASS
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Walk 50,000 steps outdoors · Verified by Google Fit (18,450 / 50,000 steps)</p>
                <div className="mt-2 w-full max-w-xs h-2 rounded-full bg-amber-200/60 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '37%' }} />
                </div>
              </div>
              <button
                onClick={() => alert('Star Air Boarding Pass: Code OUT-FLIGHT-50-WNDR')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                View Pass
              </button>
            </div>

            {/* Reward 2: Lenskart Optical Frames (FEATURED & ACHIEVED) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/60 p-4 shadow-sm">
              <div className="relative size-16 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                <Award className="size-6 text-emerald-100" />
                <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">STAMP</span>
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[8px] font-extrabold uppercase">
                  ACHIEVED
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-slate-900 text-sm">Complimentary Handcrafted Acetate Frame</p>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Stamp Verified
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Lenskart Optical Works · 20,000 steps challenge completed</p>
                <p className="text-[11px] font-bold text-emerald-700 mt-1">Ready to redeem at any neighborhood store</p>
              </div>
              <button
                onClick={() => alert('Lenskart Store Pass: Code LK-OUT-20K-VISION presented')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95"
              >
                Claim at Counter
              </button>
            </div>

            {/* Reward 3: Free Chai at Riverside Cafe (ACHIEVED) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-4">
              <div className="relative size-16 rounded-2xl border-2 border-dashed border-emerald-500 bg-white flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-serif font-black text-emerald-800">RIVERSIDE</span>
                <span className="text-[8px] font-bold text-emerald-600">NOV 18</span>
                <span className="text-[8px] font-extrabold text-emerald-700">STAMPED</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 text-sm">Free Chai or Herbal Tea</p>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800 text-[10px] font-bold">
                    ACHIEVED STAMP
                  </span>
                </div>
                <p className="text-xs text-slate-500">Riverside Artisan Cafe · Unlocked by your Riverside Cafe stamp</p>
              </div>
              <button
                onClick={() => alert('Voucher verified: Show your screen to barista at Riverside Cafe')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700 shadow-sm transition-all"
              >
                Show at counter
              </button>
            </div>

            {/* Reward 4: Remparts Books Atlas (IN PROGRESS) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
              <div className="size-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 flex flex-col items-center justify-center shrink-0">
                <Lock className="size-5 mb-0.5" />
                <span className="text-[8px] font-bold uppercase">REMPARTS</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 text-sm">10% Off Vintage Atlases & Maps</p>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                    NEEDS STAMP
                  </span>
                </div>
                <p className="text-xs text-slate-400">Remparts Books · Requires Remparts Books Place Stamp</p>
              </div>
              <button
                onClick={() => alert('Check in at Remparts Books to stamp your passport')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Visit to unlock
              </button>
            </div>

            {/* Reward 5: Corner Bakery Sourdough (IN PROGRESS) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
              <div className="size-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 flex flex-col items-center justify-center shrink-0">
                <Lock className="size-5 mb-0.5" />
                <span className="text-[8px] font-bold uppercase">BAKERY</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 text-sm">Complimentary Day-Old Sourdough</p>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                    AFTER 5 PM
                  </span>
                </div>
                <p className="text-xs text-slate-400">Corner Bakery · Available after 5:00 PM with any neighborhood stamp</p>
              </div>
              <button
                onClick={() => alert('Check in at Corner Bakery after 5:00 PM to claim')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Visit to unlock
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: MY POSTCARDS GRID */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
            {USER_POSTS.map((img, i) => (
              <div
                key={i}
                className="relative aspect-[3/2] overflow-hidden bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm"
              >
                <img
                  src={img}
                  alt="Postcard"
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
