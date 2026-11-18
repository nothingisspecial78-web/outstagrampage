import { useState } from 'react';
import {
  Home,
  Search,
  Film,
  Send,
  Heart,
  PlusSquare,
  Menu,
  MoreHorizontal,
  Bookmark,
  MessageCircle,
  Smile,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { StoryViewerModal, type StoryItem } from './components/StoryViewerModal';
import { CreatePostModal } from './components/CreatePostModal';
import type { ChatThread } from './components/DirectMessagesDrawer';
import { ReelsView } from './components/ReelsView';
import { MessagesView } from './components/MessagesView';
import { ExploreView } from './components/ExploreView';
import { ProfileView } from './components/ProfileView';
import { NotificationsPopover } from './components/NotificationsPopover';
import { SettingsModal } from './components/SettingsModal';

// Sample Stories matching the user's screenshot
const INITIAL_STORIES: StoryItem[] = [
  {
    id: 's1',
    username: 'rahimaneey',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    caption: 'Golden hour at West Pier 🌅 No scrolling, just breeze',
    time: '2h',
  },
  {
    id: 's2',
    username: 'sham.leoo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    media: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    caption: 'City ride with friends! 🚲',
    time: '3h',
  },
  {
    id: 's3',
    username: 'thesanska...',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    media: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    caption: 'Found an old library full of atlases 📖',
    time: '5h',
  },
  {
    id: 's4',
    username: 'badarmun...',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    media: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    caption: 'Coffee and live postcards ☕',
    time: '6h',
  },
  {
    id: 's5',
    username: 'web.dev.g...',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    media: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    caption: 'Building the anti-app on React & Tailwind 💻',
    time: '7h',
  },
  {
    id: 's6',
    username: 'vedd.sh',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    media: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    caption: 'Midnight acoustic set in the courtyard 🎸',
    time: '8h',
  },
];

// Suggested Users matching the screenshot
interface SuggestedUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subtitle: string;
  isFollowing: boolean;
}

const INITIAL_SUGGESTIONS: SuggestedUser[] = [
  {
    id: 'u1',
    name: 'محمد فرحان',
    handle: 'mohamed_farhan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    subtitle: 'Suggested for you',
    isFollowing: false,
  },
  {
    id: 'u2',
    name: 'Ibrahim Badsha',
    handle: 'ibrahim_badsha',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    subtitle: 'Suggested for you',
    isFollowing: false,
  },
  {
    id: 'u3',
    name: 'Thamjeed',
    handle: 'thamjeed_',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    subtitle: 'Suggested for you',
    isFollowing: false,
  },
  {
    id: 'u4',
    name: 'shahim chemban',
    handle: 'shahimchemban',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    subtitle: 'Suggested for you',
    isFollowing: false,
  },
  {
    id: 'u5',
    name: 'عادل سنان',
    handle: 'adil_sinan',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    subtitle: 'Suggested for you',
    isFollowing: false,
  },
];

// Sample Posts matching the user's screenshot
interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  subtitle: string;
  timeAgo: string;
  mediaUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: { user: string; text: string }[];
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'rahimaneey and 3 others',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Original audio',
    timeAgo: '3 h',
    mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    caption: 'Sat here until the sun went down. No phones, just good conversation with old friends. Stamped at West Pier cafe.',
    likesCount: 1482,
    commentsCount: 48,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: 'sham.leoo', text: 'Best evening this month!' },
      { user: 'thesanska...', text: 'Love the analog vibe here.' },
    ],
  },
  {
    id: 'p2',
    author: 'thesanska...',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Remparts Books · Berlin',
    timeAgo: '6 h',
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    caption: 'Found a 1962 world atlas for two coins. The smell of aged paper never gets old.',
    likesCount: 894,
    commentsCount: 22,
    isLiked: true,
    isSaved: true,
    comments: [
      { user: 'rahimaneey', text: 'Which section was it in?' },
    ],
  },
  {
    id: 'p3',
    author: 'badarmun...',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Botanical Gardens',
    timeAgo: '12 h',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    caption: 'Morning walk completed. 100 steps and noticed the old greenhouse reflection in the pond.',
    likesCount: 2105,
    commentsCount: 63,
    isLiked: false,
    isSaved: false,
    comments: [],
  },
];

// Initial Chat Threads
const INITIAL_CHATS: ChatThread[] = [
  {
    id: 'c1',
    name: 'rahimaneey',
    username: 'rahimaneey',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    unread: true,
    messages: [
      { id: 'm1', text: 'Are you coming to the pier today?', sender: 'them', time: '10:45 AM' },
      { id: 'm2', text: 'Yes, heading there now! Bringing the camera.', sender: 'me', time: '10:47 AM' },
      { id: 'm3', text: 'Awesome, see you near the coffee cart.', sender: 'them', time: '10:48 AM' },
    ],
  },
  {
    id: 'c2',
    name: 'sham.leoo',
    username: 'sham.leoo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    unread: true,
    messages: [
      { id: 'm1', text: 'Did you get the meetup token for Friday?', sender: 'them', time: 'Yesterday' },
      { id: 'm2', text: 'Yep, redeemed it at CentralMail point!', sender: 'me', time: 'Yesterday' },
    ],
  },
  {
    id: 'c3',
    name: 'thesanska...',
    username: 'thesanska',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    unread: false,
    messages: [
      { id: 'm1', text: 'Check out the new postcard on the rack.', sender: 'them', time: '2d ago' },
    ],
  },
];

export function App() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>(INITIAL_SUGGESTIONS);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'reels' | 'messages' | 'profile'>('home');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // Modals
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Handle Like
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }
        return p;
      })
    );
  };

  // Handle Save
  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  // Handle Follow / Unfollow
  const handleToggleFollow = (userId: string) => {
    setSuggestions((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  // Handle Add Comment
  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, { user: 'abdullanothing7', text }],
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  // Handle Create Post
  const handlePostCreated = (newPost: { caption: string; location: string; mediaUrl: string }) => {
    const created: Post = {
      id: crypto.randomUUID(),
      author: 'abdullanothing7',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      subtitle: newPost.location || 'Outstagram Moment',
      timeAgo: 'Just now',
      mediaUrl: newPost.mediaUrl,
      caption: newPost.caption,
      likesCount: 1,
      commentsCount: 0,
      isLiked: true,
      isSaved: false,
      comments: [],
    };
    setPosts([created, ...posts]);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex justify-center selection:bg-rose-500/20 selection:text-rose-600 antialiased font-sans">
      <div className="w-full flex">
        {/* ============================================================ */}
        {/* 1. LEFT SIDEBAR NAVIGATION (Matching Screenshot Left Column) */}
        {/* ============================================================ */}
        <aside className="hidden md:flex flex-col justify-between w-18 xl:w-60 h-screen sticky top-0 px-3 xl:px-4 py-6 border-r border-slate-200 shrink-0 bg-white z-40 select-none">
          <div>
            {/* Outstagram Logo & Camera Glyph */}
            <div
              onClick={() => setActiveTab('home')}
              className="px-2 mb-7 flex items-center gap-3 cursor-pointer"
            >
              <div className="relative flex items-center justify-center size-7 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-xs">
                <div className="size-full bg-white rounded-[9px] flex items-center justify-center">
                  <div className="size-2.5 rounded-full border-2 border-slate-900" />
                </div>
              </div>
              <span className="hidden xl:inline-block font-black text-2xl tracking-tighter text-slate-900">
                Outstagram
              </span>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {/* Home */}
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 ${
                  activeTab === 'home' ? 'font-extrabold text-slate-900' : 'font-medium text-slate-800'
                }`}
              >
                <Home className={`size-6 ${activeTab === 'home' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                <span className="hidden xl:inline text-sm">Home</span>
              </button>

              {/* Reels */}
              <button
                onClick={() => setActiveTab('reels')}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 ${
                  activeTab === 'reels' ? 'font-extrabold text-slate-900' : 'font-medium text-slate-800'
                }`}
              >
                <Film className={`size-6 ${activeTab === 'reels' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                <span className="hidden xl:inline text-sm">Reels</span>
              </button>

              {/* Messages */}
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 relative ${
                  activeTab === 'messages' ? 'font-extrabold text-slate-900' : 'font-medium text-slate-800'
                }`}
              >
                <div className="relative">
                  <Send className={`size-6 ${activeTab === 'messages' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                    2
                  </span>
                </div>
                <span className="hidden xl:inline text-sm">Messages</span>
              </button>

              {/* Search */}
              <button
                onClick={() => setActiveTab('search')}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 ${
                  activeTab === 'search' ? 'font-extrabold text-slate-900' : 'font-medium text-slate-800'
                }`}
              >
                <Search className={`size-6 ${activeTab === 'search' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                <span className="hidden xl:inline text-sm">Search</span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 relative ${
                  showNotifications ? 'font-extrabold text-slate-900' : 'font-medium text-slate-800'
                }`}
              >
                <div className="relative">
                  <Heart className={`size-6 ${showNotifications ? 'fill-rose-500 text-rose-500 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  <span className="absolute top-0 right-0 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </div>
                <span className="hidden xl:inline text-sm">Notifications</span>
              </button>

              {/* Create */}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 font-medium text-slate-800"
              >
                <PlusSquare className="size-6 stroke-[1.8]" />
                <span className="hidden xl:inline text-sm">Create</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-100/80 ${
                  activeTab === 'profile' ? 'font-extrabold text-slate-900' : 'font-medium text-slate-800'
                }`}
              >
                <div className="size-6 rounded-full bg-slate-200 border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-700">A</span>
                </div>
                <span className="hidden xl:inline text-sm">Profile</span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar: More & Meta Footer */}
          <div className="space-y-3">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-slate-100/80 transition-all text-slate-800 font-medium"
            >
              <Menu className="size-6 stroke-[1.8]" />
              <span className="hidden xl:inline text-sm">More</span>
            </button>

            <div className="hidden xl:flex items-center gap-2 px-3 text-[11px] font-semibold text-slate-400">
              <div className="size-4 rounded-md border border-slate-300 flex items-center justify-center text-[9px] font-bold">
                ∞
              </div>
              <span>Also from Meta</span>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* MOBILE TOP BAR (For small screens < 768px)                   */}
        {/* ============================================================ */}
        <div className="md:hidden fixed top-0 inset-x-0 h-13 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-40">
          <span
            onClick={() => setActiveTab('home')}
            className="font-black text-xl tracking-tight text-slate-900 cursor-pointer"
          >
            Outstagram
          </span>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative">
              <Heart className="size-6 text-slate-900 stroke-[1.8]" />
              <span className="absolute top-0 right-0 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <button onClick={() => setActiveTab('messages')} className="relative">
              <Send className="size-6 text-slate-900 stroke-[1.8]" />
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                2
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. DYNAMIC MAIN VIEW CONTENT (Home, Reels, Messages, Search, Profile) */}
        {/* ============================================================ */}
        <main className="flex-1 flex justify-center pt-16 md:pt-8 pb-20 px-2 sm:px-4 min-h-screen">
          {/* TAB 1: HOME FEED */}
          {activeTab === 'home' && (
            <div className="flex justify-center gap-12 w-full max-w-5xl">
              <div className="w-full max-w-[470px] space-y-6">
                {/* Stories Horizontal Tray (Matching Screenshot Top) */}
                <section className="w-full relative">
                  <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                    {INITIAL_STORIES.map((story, index) => (
                      <button
                        key={story.id}
                        onClick={() => {
                          setSelectedStoryIndex(index);
                          setStoryModalOpen(true);
                        }}
                        className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                      >
                        {/* Story Gradient Ring matching Instagram (Sunset/Pink/Orange) */}
                        <div className="size-16 sm:size-17 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-xs group-hover:scale-105 transition-transform duration-200">
                          <div className="size-full rounded-full bg-white p-0.5">
                            <img
                              src={story.avatar}
                              alt={story.username}
                              className="size-full rounded-full object-cover"
                            />
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-800 tracking-tight max-w-[64px] truncate">
                          {story.username}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Carousel Right Scroll Button */}
                  <button
                    onClick={() => {
                      setSelectedStoryIndex(0);
                      setStoryModalOpen(true);
                    }}
                    className="hidden sm:flex absolute right-1 top-6 size-6 rounded-full bg-white/90 border border-slate-200/80 shadow-md items-center justify-center text-slate-700 hover:bg-white"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </section>

                {/* Posts Feed (Matching Screenshot Center Feed Card) */}
                <section className="w-full space-y-7">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs"
                    >
                      {/* Post Header (Avatar + Username + Time + Options) */}
                      <div className="flex items-center justify-between px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          {/* Author Story Ring */}
                          <div className="size-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5">
                            <div className="size-full rounded-full bg-white p-0.5">
                              <img
                                src={post.authorAvatar}
                                alt={post.author}
                                className="size-full rounded-full object-cover"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 hover:text-slate-600 cursor-pointer">
                                {post.author}
                              </span>
                              <span className="text-slate-400 text-xs">·</span>
                              <span className="text-slate-400 text-xs font-medium">{post.timeAgo}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                              {post.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Three Dots Menu */}
                        <button className="text-slate-700 hover:text-slate-400 p-1">
                          <MoreHorizontal className="size-5" />
                        </button>
                      </div>

                      {/* Media Image (Square / 4:5 aspect ratio) */}
                      <div
                        onDoubleClick={() => handleToggleLike(post.id)}
                        className="relative w-full aspect-square bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer select-none group"
                      >
                        {post.mediaUrl.startsWith('data:video') || post.mediaUrl.endsWith('.mp4') || post.mediaUrl.endsWith('.webm') ? (
                          <video
                            src={post.mediaUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt={post.caption}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 shadow-md">
                          <MapPin className="size-3 text-orange-400" />
                          <span>Live Postcard</span>
                        </div>
                      </div>

                      {/* Action Buttons Bar (Heart, Comment, Share, Bookmark) */}
                      <div className="px-3.5 pt-3 pb-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleLike(post.id)}
                              className={`transition-transform active:scale-125 ${
                                post.isLiked ? 'text-rose-500' : 'text-slate-900 hover:text-slate-500'
                              }`}
                            >
                              <Heart
                                className={`size-6 ${post.isLiked ? 'fill-rose-500 stroke-rose-500' : 'stroke-[1.8]'}`}
                              />
                            </button>

                            <button className="text-slate-900 hover:text-slate-500">
                              <MessageCircle className="size-6 stroke-[1.8]" />
                            </button>

                            <button className="text-slate-900 hover:text-slate-500">
                              <Send className="size-6 stroke-[1.8]" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleSave(post.id)}
                            className={`transition-colors ${
                              post.isSaved ? 'text-slate-900' : 'text-slate-900 hover:text-slate-500'
                            }`}
                          >
                            <Bookmark className={`size-6 ${post.isSaved ? 'fill-current' : 'stroke-[1.8]'}`} />
                          </button>
                        </div>

                        {/* Likes Count */}
                        <div className="mt-2.5">
                          <span className="font-extrabold text-xs text-slate-900">
                            {post.likesCount.toLocaleString()} likes
                          </span>
                        </div>

                        {/* Caption */}
                        <div className="mt-1 text-xs text-slate-900 leading-relaxed">
                          <span className="font-extrabold mr-1.5">{post.author.split(' ')[0]}</span>
                          <span>{post.caption}</span>
                        </div>

                        {/* Comments link */}
                        {post.commentsCount > 0 && (
                          <button className="mt-1 text-xs text-slate-500 font-medium hover:underline block">
                            View all {post.commentsCount} comments
                          </button>
                        )}

                        {/* Comments Preview */}
                        {post.comments.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {post.comments.slice(-2).map((c, i) => (
                              <p key={i} className="text-xs text-slate-800">
                                <span className="font-bold mr-1.5">{c.user}</span>
                                <span>{c.text}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {post.timeAgo.toUpperCase()} AGO
                        </p>
                      </div>

                      {/* Comment Input */}
                      <div className="px-3.5 py-3 border-t border-slate-100 flex items-center gap-2.5">
                        <Smile className="size-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Add a comment..."
                          className="flex-1 text-xs text-slate-800 placeholder:text-slate-400 border-none bg-transparent focus:outline-none"
                        />
                        {commentInputs[post.id]?.trim() && (
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="text-xs font-bold text-sky-500 hover:text-sky-600"
                          >
                            Post
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </section>
              </div>

              {/* Right Sidebar ("Suggested for you" - Matching Screenshot) */}
              <aside className="hidden lg:block w-80 xl:w-84 pt-2 select-none shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-inner">
                      AN
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 tracking-tight leading-tight">
                        abdullanothing7
                      </p>
                      <p className="text-xs text-slate-400 font-medium">Abdulla</p>
                    </div>
                  </div>

                  <button className="text-xs font-bold text-sky-500 hover:text-sky-700 transition-colors">
                    Switch
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3.5">
                  <span className="font-bold text-xs text-slate-500">Suggested for you</span>
                  <button className="text-xs font-bold text-slate-900 hover:text-slate-500">
                    See all
                  </button>
                </div>

                <div className="space-y-3.5">
                  {suggestions.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="size-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">{user.subtitle}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleFollow(user.id)}
                        className={`text-xs font-bold transition-colors ${
                          user.isFollowing
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-sky-500 hover:text-sky-700'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-3">
                  <p className="leading-relaxed">
                    About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language
                  </p>
                  <p className="font-semibold uppercase tracking-wider text-[10px]">
                    © 2026 OUTSTAGRAM FROM META
                  </p>
                </div>
              </aside>
            </div>
          )}

          {/* TAB 2: REELS VIEW */}
          {activeTab === 'reels' && <ReelsView />}

          {/* TAB 3: DIRECT MESSAGES VIEW */}
          {activeTab === 'messages' && <MessagesView threads={INITIAL_CHATS} />}

          {/* TAB 4: EXPLORE / SEARCH VIEW */}
          {activeTab === 'search' && <ExploreView />}

          {/* TAB 5: USER PROFILE VIEW */}
          {activeTab === 'profile' && (
            <ProfileView onOpenSettings={() => setShowSettings(true)} />
          )}
        </main>

        {/* ============================================================ */}
        {/* 4. FLOATING MESSENGER WIDGET (Matching Screenshot Bottom Right) */}
        {/* ============================================================ */}
        {/* DirectMessagesDrawer removed as requested */}

        {/* ============================================================ */}
        {/* MOBILE BOTTOM NAVIGATION BAR (< 768px)                       */}
        {/* ============================================================ */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-13 bg-white border-t border-slate-200 flex items-center justify-around z-40">
          <button onClick={() => setActiveTab('home')} className="p-2 text-slate-900">
            <Home className={`size-6 ${activeTab === 'home' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
          </button>
          <button onClick={() => setActiveTab('search')} className="p-2 text-slate-900">
            <Search className={`size-6 ${activeTab === 'search' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
          </button>
          <button onClick={() => setCreateModalOpen(true)} className="p-2 text-slate-900">
            <PlusSquare className="size-6 stroke-[1.8]" />
          </button>
          <button onClick={() => setActiveTab('reels')} className="p-2 text-slate-900">
            <Film className={`size-6 ${activeTab === 'reels' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
          </button>
          <button onClick={() => setActiveTab('profile')} className="p-2">
            <div className={`size-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold border ${activeTab === 'profile' ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-400'}`}>
              A
            </div>
          </button>
        </nav>

        {/* STORY VIEWER MODAL */}
        <StoryViewerModal
          stories={INITIAL_STORIES}
          initialIndex={selectedStoryIndex}
          isOpen={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
        />

        {/* CREATE POST MODAL */}
        <CreatePostModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onPostCreated={handlePostCreated}
        />

        {/* NOTIFICATIONS POPOVER */}
        <NotificationsPopover
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* SETTINGS MODAL */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  );
}

export default App;