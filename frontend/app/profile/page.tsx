'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, 
  Crown, 
  Calendar, 
  Clock, 
  CreditCard, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Camera,
  Edit3,
  Settings,
  Lock,
  Bell,
  Trash2,
  Package,
  Download,
  Check,
  MapPin,
  Phone,
  Mail,
  Award,
  Globe,
  MessageSquare,
  Laptop,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { API_BASE_URL } from '@/lib/api';
import dynamic from 'next/dynamic';
import VIPBadge from '@/components/common/VIPBadge';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import AppointmentStatusBadge from '@/components/appointments/AppointmentStatusBadge';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';

const ProfileImageModal = dynamic(() => import('@/components/profile/ProfileImageModal'), {
  ssr: false
});

interface AppointmentRecord {
  _id: string;
  bookingId: string;
  service: string;
  specialistName?: string;
  staffPreference?: string;
  branch: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  bookingDateTime?: string;
  bookingDate?: string;
  bookingTimeFormatted?: string;
}

interface PackageRecord {
  packageId: string;
  title: string;
  serviceIncluded: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  packagePrice: number;
  purchaseDate: string;
  expiryDate: string;
  status: string;
}

function UserProfileContent() {
  const { user, isLoading, logout, logoutAll, getSessions, revokeSession, sessions, updateProfileUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTabFromUrl = searchParams?.get('tab') || 'settings';
  const [activeTab, setActiveTab] = useState<string>(activeTabFromUrl);

  useEffect(() => {
    if (activeTabFromUrl) setActiveTab(activeTabFromUrl);
  }, [activeTabFromUrl]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/profile?tab=${newTab}`, { scroll: false });
  };

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [hasMembership, setHasMembership] = useState<boolean>(false);
  const [membershipDetails, setMembershipDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Profile Photo Upload Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Female',
    dob: '',
    anniversary: '',
    address: '',
    emergencyContact: '',
    preferredLanguage: 'English',
    preferredCommunication: 'WhatsApp'
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    smsAlerts: true,
    whatsappAlerts: true,
    promoOffers: true
  });

  // Account Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Active Sessions State
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'security' && user) {
      setSessionsLoading(true);
      getSessions().finally(() => setSessionsLoading(false));
    }
  }, [activeTab, user]);

  const handleRevokeSession = async (sessionId: string) => {
    setSessionMsg(null);
    const res = await revokeSession(sessionId);
    setSessionMsg(res.message);
  };

  const handleLogoutAllDevices = async () => {
    if (confirm('Are you sure you want to log out from all active devices?')) {
      await logoutAll();
      router.push('/login');
    }
  };

  // Initialize edit form when user loads
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        gender: user.gender || 'Female',
        dob: user.dob || '1995-06-15',
        anniversary: user.anniversary || '',
        address: user.address || 'Jubilee Hills, Road No. 36, Hyderabad',
        emergencyContact: user.emergencyContact || '+91 98765 00000',
        preferredLanguage: user.preferredLanguage || 'English',
        preferredCommunication: user.preferredCommunication || 'WhatsApp'
      });

      if (user.notificationPreferences) {
        setNotifPrefs({
          emailAlerts: user.notificationPreferences.emailAlerts ?? true,
          smsAlerts: user.notificationPreferences.smsAlerts ?? true,
          whatsappAlerts: user.notificationPreferences.whatsappAlerts ?? true,
          promoOffers: user.notificationPreferences.promoOffers ?? true
        });
      }
    }
  }, [user]);

  // Reschedule Request Modal State
  const [rescheduleModalApp, setRescheduleModalApp] = useState<AppointmentRecord | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: new Date().toISOString().split('T')[0],
    newTime: '02:00 PM',
    reason: ''
  });
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // ROLE REDIRECT: Admin/Employee role check
  useEffect(() => {
    if (isLoading) return;

    if (user?.role === 'admin' || user?.email?.includes('admin')) {
      router.push('/admin');
      return;
    }
    if (user?.role === 'employee') {
      router.push('/employee');
      return;
    }

    if (user) {
      fetchProfileData();
    }
  }, [user, isLoading, router]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('user:profile_updated', (data: any) => {
      if (data && (data.email === user?.email || data.phone === user?.phone)) {
        updateProfileUser(data);
      }
    });

    socket.on('package:updated', (updatedPkg: any) => {
      if (updatedPkg) {
        setPackages(prev => prev.map(p => p.packageId === updatedPkg.packageId ? updatedPkg : p));
      }
    });

    return () => {
      socket.off('user:profile_updated');
      socket.off('package:updated');
    };
  }, [socket, user, updateProfileUser]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const email = user?.email || '';
      const phone = user?.phone || '';

      const [appRes, memRes, pkgRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/appointments?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`)
          .then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/user/membership`).then(r => r.json()).catch(() => ({ hasActiveMembership: false })),
        fetch(`${API_BASE_URL}/user/profile/packages?email=${encodeURIComponent(email)}`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (appRes.data) setAppointments(appRes.data);
      if (pkgRes.data && Array.isArray(pkgRes.data)) {
        setPackages(pkgRes.data);
      } else {
        setPackages([]);
      }

      if (memRes.hasActiveMembership || user?.membership?.status === 'Active') {
        setHasMembership(true);
        setMembershipDetails(memRes.membership || user?.membership);
      } else {
        setHasMembership(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Avatar Upload Handler
  const handleSaveAvatar = async (imageBase64: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          email: user?.email,
          phone: user?.phone
        })
      });
      const data = await res.json();
      if (data.data) {
        updateProfileUser({
          avatar: data.data.avatar,
          avatarVariants: data.data.avatarVariants
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Avatar Remove Handler
  const handleRemoveAvatar = async () => {
    try {
      await fetch(`${API_BASE_URL}/user/profile/avatar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
      updateProfileUser({ avatar: '', avatarVariants: undefined });
    } catch (e) {
      console.error(e);
    }
  };

  // Save Profile Details Handler
  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          notificationPreferences: notifPrefs
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        updateProfileUser(data.data);
        setProfileMsg({ type: 'success', text: 'Profile details & preferences updated successfully!' });
      }
    } catch (e) {
      setProfileMsg({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Password Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Password update failed.' });
      }
    } catch (e) {
      setPasswordMsg({ type: 'error', text: 'Error changing password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Book Session from Package Handler
  const handleBookPackageSession = async (pkg: PackageRecord) => {
    try {
      await fetch(`${API_BASE_URL}/user/profile/packages/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.packageId,
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '11:00 AM'
        })
      });
      fetchProfileData();
      router.push(`/book?service=${encodeURIComponent(pkg.serviceIncluded)}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Account Delete Handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== 'DELETE') return;
    setIsDeletingAccount(true);
    try {
      await fetch(`${API_BASE_URL}/user/profile/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, confirmCode: 'DELETE' })
      });
      await logout();
      router.push('/');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Calculate Profile Completeness Percentage
  const completenessScore = useMemo(() => {
    let score = 0;
    const missing: string[] = [];
    if (user?.name) score += 15; else missing.push('Full Name');
    if (user?.email) score += 15; else missing.push('Email Address');
    if (user?.phone) score += 15; else missing.push('Mobile Phone');
    if (user?.avatar) score += 20; else missing.push('Profile Photo');
    if (user?.dob || editForm.dob) score += 10; else missing.push('Date of Birth');
    if (user?.gender || editForm.gender) score += 5; else missing.push('Gender');
    if (user?.address || editForm.address) score += 10; else missing.push('Address');
    if (user?.emergencyContact || editForm.emergencyContact) score += 5; else missing.push('Emergency Contact');
    if (user?.anniversary || editForm.anniversary) score += 5; else missing.push('Anniversary');
    return { percentage: Math.min(score, 100), missing };
  }, [user, editForm]);

  if (!isLoading && !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rosegold-500/20 border border-rosegold-500/40 text-rosegold-400 flex items-center justify-center mx-auto shadow-glow-rosegold">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-white">Sign In to View Profile</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Sign in to manage your profile photo, VIP membership pass, service packages, and appointment schedules.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => router.push('/login?redirect=/profile')}
            className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold hover:scale-105 transition-transform cursor-pointer"
          >
            Sign In / Register →
          </button>
          <Link
            href="/"
            className="w-full py-3.5 rounded-full bg-dark-800 text-gray-300 hover:text-white font-semibold text-xs border border-white/10 text-center"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin' || user?.email?.includes('admin') || user?.role === 'employee') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-rosegold-400 font-serif animate-pulse">
        Redirecting to Executive Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 responsive-card-container">
      
      {/* 1. USER HEADER PROFILE CARD WITH AVATAR OVERLAY */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-glow-rosegold relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6 w-full">
          
          {/* Avatar Container with Interactive Camera Trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl font-extrabold text-3xl flex items-center justify-center shadow-2xl overflow-hidden brand-profile-avatar">
              {user?.avatar || user?.avatarVariants?.card ? (
                <img
                  src={user.avatarVariants?.card || user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name ? user.name.slice(0, 2).toUpperCase() : 'VIP'
              )}
            </div>

            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-dark-900 border border-rosegold-400 text-rosegold-400 hover:text-white hover:bg-rosegold-500 hover:text-dark-900 transition-all shadow-lg cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Information */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                {user?.name || 'Valued VIP Guest'}
              </h1>
              {(user?.membership?.badge || hasMembership) ? (
                <VIPBadge badge={user?.membership?.badge || '👑 Gold Member'} tier={user?.membership?.tier || 'gold'} size="sm" />
              ) : (
                <Crown className="w-5 h-5 text-rosegold-400 shrink-0" />
              )}
            </div>

            <p className="text-xs text-gray-300 flex flex-wrap justify-center sm:justify-start items-center gap-3">
              <span>{user?.email || ''}</span>
              <span>•</span>
              <span>{user?.phone || '+91 98765 43210'}</span>
              <span>•</span>
              <span className="font-mono text-rosegold-300">ID: CUST-84920</span>
            </p>
            
            <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start text-[10px] font-bold">
              <span className="text-rosegold-400 bg-rosegold-500/15 border border-rosegold-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
                {user?.membership?.tier ? `${user.membership.tier} Member` : hasMembership ? 'Active VIP Member' : 'Standard Account'}
              </span>
              <span className="text-green-400 bg-green-500/15 border border-green-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Client</span>
              </span>
              <span className="text-gray-400 bg-white/5 border border-white/10 px-3 py-0.5 rounded-full uppercase font-mono">
                Member Since Jan 2026
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 shrink-0 self-center md:self-start">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 rounded-full bg-dark-800 hover:bg-dark-750 text-rosegold-400 hover:text-white border border-rosegold-500/40 transition-all cursor-pointer shadow-md flex items-center justify-center"
            title="Account Settings & Security"
          >
            <Settings className="w-4 h-4 text-rosegold-400" />
          </button>
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="px-4 py-2 rounded-full bg-dark-800 hover:bg-dark-750 text-rosegold-300 font-bold text-xs border border-rosegold-500/30 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>

      {/* 2. PROFILE COMPLETENESS INDICATOR */}
      <div className="glass-panel p-5 rounded-2xl border border-rosegold-500/20 space-y-3 bg-dark-850/90 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-rosegold-400" />
            <h3 className="font-serif font-bold text-sm text-white">Profile Completeness</h3>
          </div>
          <span className="font-serif font-bold text-rosegold-400 text-base">{completenessScore.percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-dark-900 border border-white/10 overflow-hidden">
          <div 
            className="h-full rosegold-gradient-bg transition-all duration-500 rounded-full"
            style={{ width: `${completenessScore.percentage}%` }}
          />
        </div>

        {completenessScore.missing.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 pt-1">
            <span className="font-semibold text-gray-300">Missing for 100%:</span>
            {completenessScore.missing.map(m => (
              <span key={m} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-rosegold-300 font-mono text-[10px]">
                + {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. NAVIGATION TABS FOR SETTINGS & MODULES */}
      <div className="flex items-center space-x-2 overflow-x-auto border-b border-white/10 pb-2 custom-scrollbar">
        {[
          { id: 'settings', label: '⚙️ Profile Settings', icon: Settings },
          { id: 'membership', label: '👑 Membership Pass', icon: Crown },
          { id: 'packages', label: '🎟️ My Packages', icon: Package },
          { id: 'schedules', label: '📅 Active Schedules', icon: Calendar },
          { id: 'security', label: '🔒 Security & Alerts', icon: Lock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold'
                : 'bg-dark-800 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. TAB 1: ⚙️ PROFILE SETTINGS FORM */}
      {activeTab === 'settings' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-rosegold-400" />
                <span>Edit Profile Details</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Update your personal information, address, and communication preferences.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfileDetails} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Anniversary Date (Optional)</label>
                <input
                  type="date"
                  value={editForm.anniversary}
                  onChange={e => setEditForm({ ...editForm, anniversary: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-bold block mb-1">Saved Address / Studio Delivery</label>
              <textarea
                rows={2}
                value={editForm.address}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Enter your street address, apartment, and city"
                className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Emergency Contact Number</label>
                <input
                  type="tel"
                  value={editForm.emergencyContact}
                  onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Preferred Language</label>
                <select
                  value={editForm.preferredLanguage}
                  onChange={e => setEditForm({ ...editForm, preferredLanguage: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Preferred Communication</label>
                <select
                  value={editForm.preferredCommunication}
                  onChange={e => setEditForm({ ...editForm, preferredCommunication: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp Instant Alert</option>
                  <option value="SMS">SMS Message</option>
                  <option value="Email">Email Notification</option>
                </select>
              </div>
            </div>

            {profileMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                profileMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. TAB 2: 👑 DEDICATED MEMBERSHIP CARD */}
      {activeTab === 'membership' && (
        <div className="space-y-6 animate-fadeIn">
          {(user?.membership?.status === 'Active' || hasMembership) ? (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 bg-gradient-to-r from-rosegold-500/20 via-purple-900/30 to-dark-800 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <VIPBadge badge={user?.membership?.badge || '👑 Gold Member'} tier={user?.membership?.tier || 'gold'} size="lg" />
                  <h3 className="text-2xl font-serif font-bold text-white pt-2">
                    {user?.membership?.tier || 'Gold VIP'} Membership Active
                  </h3>
                  <span className="text-xs font-mono text-rosegold-300 block">
                    Pass ID: {user?.membership?.membershipId || 'MEMB-849201'}
                  </span>
                </div>

                <div className="flex flex-col items-start sm:items-end space-y-1">
                  <span className="text-xs text-green-400 font-bold bg-green-500/20 border border-green-500/30 px-3.5 py-1 rounded-full">
                    {user?.membership?.discountPercent || 20}% Flat Service Discount
                  </span>
                  <span className="text-[11px] text-gray-300 font-mono">
                    Expires: Dec 31, 2026 (148 Days Remaining)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Flat Service Discount</span>
                  <strong className="text-xl font-serif font-bold text-rosegold-400 block">{user?.membership?.discountPercent || 20}% OFF</strong>
                  <span className="text-[10px] text-gray-400 block">Auto-applied at checkout</span>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Priority Booking Queue</span>
                  <strong className="text-xl font-serif font-bold text-green-400 block">Instant Priority ✅</strong>
                  <span className="text-[10px] text-gray-400 block">Zero wait time at studio</span>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Monthly Spa Ritual</span>
                  <strong className="text-xl font-serif font-bold text-purple-300 block">1 Free Hair Spa / mo</strong>
                  <span className="text-[10px] text-gray-400 block">Complimentary benefit</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                <button
                  onClick={() => router.push('/book')}
                  className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  Book Appointment with {user?.membership?.discountPercent || 20}% Off →
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push('/services')}
                    className="px-5 py-3 rounded-full bg-dark-800 text-gray-300 font-bold text-xs border border-white/10 hover:text-white cursor-pointer"
                  >
                    Renew / Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-5 bg-dark-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-rosegold-400 text-xs font-bold uppercase tracking-wider block">👑 Become a VIP Member</span>
                  <h3 className="text-xl font-serif font-bold text-white">Unlock Up to 20% Flat Discount & Free Monthly Treatments</h3>
                </div>
                <button
                  onClick={() => router.push('/services')}
                  className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
                >
                  Explore VIP Plans →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-dark-900 border border-amber-600/30 space-y-2 text-left">
                  <VIPBadge badge="🥉 Standard Member" tier="standard" size="sm" />
                  <h4 className="font-serif font-bold text-white text-base">Standard (5% Off)</h4>
                  <p className="text-xs text-gray-400">Essential priority booking & birthday offer.</p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400">₹999 / mo</span>
                    <Link href="/membership/standard" className="text-xs text-amber-300 font-bold hover:underline">Details →</Link>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-400/40 space-y-2 text-left">
                  <VIPBadge badge="🥈 Premium Member" tier="premium" size="sm" />
                  <h4 className="font-serif font-bold text-white text-base">Premium (10% Off)</h4>
                  <p className="text-xs text-gray-400">Includes 1 Free Hair Spa every month.</p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">₹2,499 / mo</span>
                    <Link href="/membership/premium" className="text-xs text-slate-200 font-bold hover:underline">Details →</Link>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-rosegold-400 space-y-2 text-left">
                  <VIPBadge badge="👑 Gold Member" tier="gold" size="sm" />
                  <h4 className="font-serif font-bold text-white text-base">Gold VIP (20% Off)</h4>
                  <p className="text-xs text-gray-300">Free Hair Spa & Facial + VIP Lounge access.</p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-rosegold-400">₹4,999 / mo</span>
                    <Link href="/membership/gold" className="text-xs text-rosegold-400 font-bold hover:underline">Details →</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: 🎟️ MY PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6 animate-fadeIn text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-rosegold-400" />
                <span>My Purchased Service Packages</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">View your session quotas, used count, remaining sessions, and book directly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {packages.map(pkg => (
              <div key={pkg.packageId} className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-rosegold-400 font-bold block">{pkg.packageId}</span>
                    <h3 className="font-serif font-bold text-white text-base">{pkg.title}</h3>
                  </div>
                  <span className="text-xs text-green-400 font-bold bg-green-500/15 border border-green-500/30 px-3 py-1 rounded-full">
                    {pkg.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Service Included:</span>
                    <strong className="text-white text-right">{pkg.serviceIncluded}</strong>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Package Price Paid:</span>
                    <strong className="text-rosegold-400">₹{pkg.packagePrice.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Expires On:</span>
                    <span className="font-mono text-gray-200">{pkg.expiryDate}</span>
                  </div>
                </div>

                {/* Session Counter Progress Bar */}
                <div className="p-3 rounded-2xl bg-dark-900 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-400">Remaining Sessions</span>
                    <span className="text-rosegold-400 font-mono">{pkg.remainingSessions} of {pkg.totalSessions} Left</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
                    <div 
                      className="h-full rosegold-gradient-bg transition-all" 
                      style={{ width: `${(pkg.remainingSessions / pkg.totalSessions) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleBookPackageSession(pkg)}
                  disabled={pkg.remainingSessions <= 0}
                  className="w-full py-3 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {pkg.remainingSessions > 0 ? 'Book Remaining Session →' : 'Package Completed'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB 4: 📅 ACTIVE SCHEDULES & HISTORY */}
      {activeTab === 'schedules' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-rosegold-400" />
                <span>My Appointments Desk</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Real-time schedule tracker with status badges and appointment journey progress.</p>
            </div>
            <Link
              href="/appointments"
              className="px-4 py-2 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all self-start sm:self-auto"
            >
              Launch Full Appointments Hub →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <Calendar className="w-10 h-10 text-rosegold-400 mx-auto opacity-50" />
              <p className="text-sm font-serif text-gray-300">No active appointment schedules found.</p>
              <button onClick={() => router.push('/book')} className="px-6 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs">
                Book Your Salon Session Now →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map(app => (
                <AppointmentCard
                  key={app._id}
                  appointment={app}
                  onReschedule={() => router.push(`/appointments?status=${encodeURIComponent(app.status)}`)}
                  onBookAgain={() => router.push(`/book?service=${encodeURIComponent(app.service)}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 5: 🔒 SECURITY & PREFERENCES */}
      {activeTab === 'security' && (
        <div className="space-y-8 animate-fadeIn text-left">
          {/* Change Password Form */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2 border-b border-white/10 pb-3">
              <Lock className="w-4 h-4 text-rosegold-400" />
              <span>Change Security Password</span>
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-4 text-xs max-w-md">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  passwordMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
              >
                {isSavingPassword ? 'Updating...' : 'Update Password →'}
              </button>
            </form>
          </div>

          {/* Active Device Sessions List */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-rosegold-400" />
                  <span>Active Login Sessions & Devices</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Manage and revoke active sessions connected to your SPY Salon account.</p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => getSessions()}
                  className="p-2 rounded-xl bg-dark-800 text-rosegold-400 hover:text-white border border-white/10 text-xs flex items-center space-x-1 cursor-pointer"
                  title="Refresh Active Sessions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sessionsLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/40 cursor-pointer"
                >
                  Logout All Devices
                </button>
              </div>
            </div>

            {sessionMsg && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                {sessionMsg}
              </div>
            )}

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 font-mono">
                  {sessionsLoading ? 'Loading active device sessions...' : 'No other active device sessions found.'}
                </div>
              ) : (
                sessions.map(s => {
                  const isMobile = s.deviceType === 'Mobile';
                  return (
                    <div key={s.id || s.sessionId} className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      s.isCurrent 
                        ? 'bg-rosegold-500/10 border-rosegold-500/40 shadow-sm' 
                        : 'bg-dark-850 border-white/10'
                    }`}>
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-dark-800 border border-rosegold-500/30 flex items-center justify-center shrink-0">
                          {isMobile ? <Smartphone className="w-5 h-5 text-rosegold-400" /> : <Laptop className="w-5 h-5 text-rosegold-400" />}
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm font-serif">{s.browser} on {s.os}</span>
                            {s.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-[11px] font-mono">
                            IP: {s.ipAddress} • Signed in {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id || s.sessionId)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs border border-red-500/30 transition-colors cursor-pointer"
                        >
                          Revoke Session
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Delete Account Warning Box */}
          <div className="p-6 rounded-3xl border border-red-500/30 bg-red-500/10 space-y-4">
            <h4 className="font-serif font-bold text-red-400 text-base">Delete SPY Salon Account</h4>
            <p className="text-xs text-gray-300">
              Permanently remove your account, membership records, and booking history. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-500 cursor-pointer"
            >
              Delete Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* PHOTO UPLOAD & EDIT MODAL */}
      <ProfileImageModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentAvatar={user?.avatar}
        onSaveAvatar={handleSaveAvatar}
        onRemoveAvatar={handleRemoveAvatar}
      />

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card border border-red-500/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-serif font-bold text-red-400">Confirm Account Deletion</h3>
            <p className="text-xs text-gray-300">
              Type <strong className="text-white font-mono">DELETE</strong> below to confirm account removal.
            </p>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={e => setDeleteConfirmInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full p-3 rounded-xl bg-dark-900 border border-white/15 text-white text-xs focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl bg-dark-800 text-gray-300 text-xs">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmInput !== 'DELETE' || isDeletingAccount}
                className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD & SECURITY SETTINGS MODAL */}
      <ChangePasswordModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userName={user?.name}
        userRole="Customer"
      />

    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 text-rosegold-400 flex items-center justify-center font-serif">Loading Profile...</div>}>
      <UserProfileContent />
    </Suspense>
  );
}

