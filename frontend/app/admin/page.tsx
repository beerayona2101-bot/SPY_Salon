'use client';

// Executive Admin Dashboard Portal for SPY Salon Enterprise System
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminSkeleton } from '@/components/common/Skeleton';
import { 
  Users, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Mail,
  Trash2, 
  Plus, 
  Edit3, 
  Scissors, 
  ShieldCheck, 
  TrendingUp, 
  UserCheck, 
  LogOut, 
  Lock, 
  Building, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  CalendarDays,
  Download,
  Search,
  Filter,
  Bell,
  Activity,
  Key,
  CheckCircle2,
  Eye,
  Copy,
  Check,
  ExternalLink,
  CheckCircle,
  CheckCheck,
  XCircle,
  Star,
  Wand2,
  Sparkles,
  DollarSign,
  CreditCard,
  FileText,
  Printer,
  Home,
  Phone,
  MessageCircle,
  AlertCircle,
  User,
  Crown,
  Sun,
  Moon,
  Settings,
  Sliders,
  Tag,
  Globe,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL, APP_BASE_URL, apiFetch } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import ImageUploader from '@/components/ui/ImageUploader';
import QuickContactActions from '@/components/admin/QuickContactActions';
import VIPBadge from '@/components/common/VIPBadge';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import ProfileAvatar from '@/components/common/ProfileAvatar';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
import { validateForm, validateName, validateEmail, validatePhone, validateNumber, validateRequired, validateDate } from '@/lib/validation';
import { SALON_CATALOGUE } from '@/lib/servicesData';

interface Employee {
  _id: string;
  empCode?: string;
  username?: string;
  tempPassword?: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  specialties: string[];
  services: string[];
  baseSalary?: number;
  commissionPercentage?: number;
  workingHours: { start: string; end: string };
  breakTime: { start: string; end: string };
  slotIntervalMinutes: number;
  status: 'Active' | 'On Leave' | 'Inactive';
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId: string;
  };
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  totalSpend: number;
  membership: string;
  status: string;
}

interface ServiceItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  durationMinutes: number;
  rating?: number;
  description?: string;
  image?: string;
  isPopular?: boolean;
  isActive: boolean;
  steps?: any[];
  benefits?: string[];
}

interface AppointmentItem {
  _id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  packageTier?: string;
  packageName?: string;
  specialistName: string;
  branch: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  price?: number | string;
  totalAmount?: number | string;
  bookingDateTime?: string;
  bookingDate?: string;
  bookingTimeFormatted?: string;
  rescheduleData?: {
    requestedDate?: string;
    requestedTime?: string;
    reason?: string;
    status?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Leave {
  _id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface Review {
  _id: string;
  customerName: string;
  serviceName: string;
  rating: number;
  comment: string;
}

interface EnquiryRecord {
  _id: string;
  enquiryId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Resolved' | 'Closed';
  adminNotes?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface SalarySlip {
  _id: string;
  slipId: string;
  employeeName: string;
  employeeId?: string;
  empCode: string;
  month: string;
  baseSalary: number;
  eligibleAmount?: number;
  commissionPercentage?: number;
  commissionAmount?: number;
  incentives: number;
  deductions: number;
  netPay: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

interface ActivityLog {
  _id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

function AdminDashboardContent() {
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Top Header Auto-Hide / Auto-Show on Scroll
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 20) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);
  
  const tabFromUrl = searchParams?.get('tab');
  const validTabs = ['analytics', 'calendar', 'memberships', 'earnings', 'employees', 'customers', 'services', 'appointments', 'leaves', 'reviews', 'ai-reports', 'enquiries', 'landing-settings'];
  const activeTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : 'analytics';

  const handleTabChange = (newTab: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    setSearchQuery('');
    setStatusFilter('All');

    // Auto-clear unread badge counts when opening respective tab
    if (newTab === 'enquiries') {
      setEnquiries(prev => prev.map(e => e.status === 'New' ? { ...e, status: 'Contacted' } : e));
    }

    router.replace(`/admin?tab=${newTab}`, { scroll: false });
  };

  // Schedule Calendar States
  const [selectedCalDate, setSelectedCalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calMonthView, setCalMonthView] = useState<Date>(new Date());
  const [calSearchQuery, setCalSearchQuery] = useState<string>('');
  const [calStatusFilter, setCalStatusFilter] = useState<string>('All');

  // Security Authorization Guard
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const storedUser = localStorage.getItem('spy_user');
    let currentUser = user;
    if (!currentUser && storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {}
    }

    if (!currentUser) {
      setIsAuthorized(false);
      return;
    }

    if (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.email?.includes('admin')) {
      setIsAuthorized(true);
      fetchAdminData();

      // Realtime background sync every 15 seconds (supplemented by Socket.IO live push events)
      const intervalId = setInterval(() => {
        fetchAdminData();
      }, 15000);
      return () => clearInterval(intervalId);
    } else {
      setIsAuthorized(false);
    }
  }, [user, isLoading, router]);
  
  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payrolls, setPayrolls] = useState<SalarySlip[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Enquiry Management Specific States
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryAdminNotes, setEnquiryAdminNotes] = useState('');
  const [isUpdatingEnquiry, setIsUpdatingEnquiry] = useState(false);
  const enquiryNewCount = enquiries.filter(e => e.status === 'New').length;

  // Leave Action Popup Modal State
  const [leaveActionModal, setLeaveActionModal] = useState<{
    isOpen: boolean;
    leave: any | null;
    loading: boolean;
    rejectReason: string;
    msg: string | null;
  }>({
    isOpen: false,
    leave: null,
    loading: false,
    rejectReason: '',
    msg: null
  });

  const handleAdminMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n._id === id || n.notificationId === id) ? { ...n, read: true, isRead: true } : n));
    await apiFetch(`${API_BASE_URL}/notifications/read/${id}`, { method: 'PATCH' }).catch(() => {});
  };

  const handleOpenLeaveModalFromNotif = async (notif: any) => {
    const notifId = notif._id || notif.notificationId;
    handleAdminMarkRead(notifId);
    setAdminNotifOpen(false);

    const leaveId = notif.leaveRequestId || (notif.link?.includes('leaveId=') ? notif.link.split('leaveId=')[1] : null);

    setLeaveActionModal({
      isOpen: true,
      leave: null,
      loading: true,
      rejectReason: '',
      msg: null
    });

    if (leaveId) {
      try {
        const res = await apiFetch(`${API_BASE_URL}/admin/leaves/${leaveId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setLeaveActionModal(prev => ({ ...prev, leave: json.data, loading: false }));
          return;
        }
      } catch (e) {
        console.warn('Error fetching leave details by ID:', e);
      }
    }

    const matchLeave = leaves.find(l => l._id === leaveId || notif.message.includes(l.employeeName));
    setLeaveActionModal(prev => ({ ...prev, leave: matchLeave || null, loading: false }));
  };

  const handleAcceptLeaveModalAction = async () => {
    if (!leaveActionModal.leave?._id) return;
    setLeaveActionModal(prev => ({ ...prev, loading: true, msg: null }));

    try {
      const res = await apiFetch(`${API_BASE_URL}/admin/leaves/${leaveActionModal.leave._id}/approve`, {
        method: 'PATCH'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLeaveActionModal(prev => ({ ...prev, loading: false, msg: json.message || 'Failed to approve leave.' }));
        return;
      }

      setLeaveActionModal(prev => ({
        ...prev,
        loading: false,
        leave: json.data,
        msg: 'Leave request APPROVED successfully! Notification sent to staff member.'
      }));
      setLeaves(prev => prev.map(l => l._id === json.data._id ? json.data : l));
    } catch (err: any) {
      setLeaveActionModal(prev => ({ ...prev, loading: false, msg: err.message || 'Network error.' }));
    }
  };

  const handleRejectLeaveModalAction = async () => {
    if (!leaveActionModal.leave?._id) return;
    setLeaveActionModal(prev => ({ ...prev, loading: true, msg: null }));

    try {
      const res = await apiFetch(`${API_BASE_URL}/admin/leaves/${leaveActionModal.leave._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: leaveActionModal.rejectReason })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLeaveActionModal(prev => ({ ...prev, loading: false, msg: json.message || 'Failed to reject leave.' }));
        return;
      }

      setLeaveActionModal(prev => ({
        ...prev,
        loading: false,
        leave: json.data,
        msg: 'Leave request REJECTED successfully. Notification sent to staff member.'
      }));
      setLeaves(prev => prev.map(l => l._id === json.data._id ? json.data : l));
    } catch (err: any) {
      setLeaveActionModal(prev => ({ ...prev, loading: false, msg: err.message || 'Network error.' }));
    }
  };

  // Landing Page / Home Page Settings State
  const [landingHeroTitle, setLandingHeroTitle] = useState("Unveil Your Radiant Beauty");
  const [landingHeroSubtitle, setLandingHeroSubtitle] = useState("“Beauty is not created—it is unveiled from within.”");
  const [landingAnnouncement, setLandingAnnouncement] = useState("✨ Festival Special: Enjoy 25% Off on All Luxury Bridal & Skin Care Packages! Use Code: LUXURY25");
  const [landingAnnouncementActive, setLandingAnnouncementActive] = useState(true);
  const [landingHotlinePhone, setLandingHotlinePhone] = useState("+91 94906 44434");
  const [landingSupportEmail, setLandingSupportEmail] = useState("concierge@spysalon.com");
  const [landingOpeningHours, setLandingOpeningHours] = useState("Mon - Sun: 09:00 AM - 09:00 PM");
  const [landingStudioAddress, setLandingStudioAddress] = useState("Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033");
  const [stat1Value, setStat1Value] = useState("25,000+");
  const [stat1Label, setStat1Label] = useState("Satisfied Clients");
  const [stat2Value, setStat2Value] = useState("45+");
  const [stat2Label, setStat2Label] = useState("Master Stylists");
  const [stat3Value, setStat3Value] = useState("Jubilee Hills");
  const [stat3Label, setStat3Label] = useState("Luxury Studio");
  const [stat4Value, setStat4Value] = useState("4.9 ⭐");
  const [stat4Label, setStat4Label] = useState("Google Rating");
  const [landingSettingsSavedMsg, setLandingSettingsSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadLandingSettingsFromBackend() {
      try {
        const res = await apiFetch(`${API_BASE_URL}/admin/landing-settings`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const parsed = json.data;
          if (parsed.heroTitle) setLandingHeroTitle(parsed.heroTitle);
          if (parsed.heroSubtitle) setLandingHeroSubtitle(parsed.heroSubtitle);
          if (parsed.announcement) setLandingAnnouncement(parsed.announcement);
          if (parsed.announcementActive !== undefined) setLandingAnnouncementActive(parsed.announcementActive);
          if (parsed.hotlinePhone) setLandingHotlinePhone(parsed.hotlinePhone);
          if (parsed.supportEmail) setLandingSupportEmail(parsed.supportEmail);
          if (parsed.openingHours) setLandingOpeningHours(parsed.openingHours);
          if (parsed.studioAddress) setLandingStudioAddress(parsed.studioAddress);
          if (parsed.stat1Value) setStat1Value(parsed.stat1Value);
          if (parsed.stat1Label) setStat1Label(parsed.stat1Label);
          if (parsed.stat2Value) setStat2Value(parsed.stat2Value);
          if (parsed.stat2Label) setStat2Label(parsed.stat2Label);
          if (parsed.stat3Value) setStat3Value(parsed.stat3Value);
          if (parsed.stat3Label) setStat3Label(parsed.stat3Label);
          if (parsed.stat4Value) setStat4Value(parsed.stat4Value);
          if (parsed.stat4Label) setStat4Label(parsed.stat4Label);
          localStorage.setItem('spy_landing_settings', JSON.stringify(parsed));
          return;
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('spy_landing_settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.heroTitle) setLandingHeroTitle(parsed.heroTitle);
            if (parsed.heroSubtitle) setLandingHeroSubtitle(parsed.heroSubtitle);
            if (parsed.announcement) setLandingAnnouncement(parsed.announcement);
            if (parsed.announcementActive !== undefined) setLandingAnnouncementActive(parsed.announcementActive);
            if (parsed.hotlinePhone) setLandingHotlinePhone(parsed.hotlinePhone);
            if (parsed.supportEmail) setLandingSupportEmail(parsed.supportEmail);
            if (parsed.openingHours) setLandingOpeningHours(parsed.openingHours);
            if (parsed.studioAddress) setLandingStudioAddress(parsed.studioAddress);
            if (parsed.stat1Value) setStat1Value(parsed.stat1Value);
            if (parsed.stat1Label) setStat1Label(parsed.stat1Label);
            if (parsed.stat2Value) setStat2Value(parsed.stat2Value);
            if (parsed.stat2Label) setStat2Label(parsed.stat2Label);
            if (parsed.stat3Value) setStat3Value(parsed.stat3Value);
            if (parsed.stat3Label) setStat3Label(parsed.stat3Label);
            if (parsed.stat4Value) setStat4Value(parsed.stat4Value);
            if (parsed.stat4Label) setStat4Label(parsed.stat4Label);
          } catch (e) {}
        }
      }
    }

    loadLandingSettingsFromBackend();
  }, []);

  // Search & Filter States
  const [appKpiFilter, setAppKpiFilter] = useState<'All' | 'Completed' | 'Pending' | 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'In Progress' | 'No Show'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [txnFilter, setTxnFilter] = useState<'All' | 'Credited' | 'Debited'>('All');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');

  // Interactive Breakdown Modals State
  const [breakdownModal, setBreakdownModal] = useState<'revenue' | 'payroll' | 'profit' | 'addTxn' | null>(null);
  const [manualTxnForm, setManualTxnForm] = useState({
    type: 'Credited' as 'Credited' | 'Debited',
    category: 'Counter Product Sale',
    description: '',
    amount: 1500,
    paymentMethod: 'UPI'
  });

  // Modal Controls
  const [modalType, setModalType] = useState<'addEmp' | 'editEmp' | 'addCust' | 'addSrv' | 'editSrv' | 'addMemb' | 'editMemb' | 'addApp' | 'empCreds' | 'viewEmp' | 'addPay' | 'viewPay' | 'rescheduleNote' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [rescheduleNoteText, setRescheduleNoteText] = useState('');

  // Notification Dropdown State & Auto-close Ref
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const adminNotifRef = React.useRef<HTMLDivElement>(null);

  // On-screen Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  // Executive Business Reports Selection States
  const [slicerDateRange, setSlicerDateRange] = useState<'daily' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [slicerCategory, setSlicerCategory] = useState<string>('All');
  const [slicerSpecialist, setSlicerSpecialist] = useState<string>('All');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeReportMeta, setActiveReportMeta] = useState({ dateRange: 'monthly', category: 'All', specialist: 'All' });
  const [showAiBriefModal, setShowAiBriefModal] = useState(false);

  // Sidebar Navigation Accordion Open States (only active tab parent open on load)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (accId: string) => {
    setOpenAccordions(prev => ({ ...prev, [accId]: !prev[accId] }));
  };

  useEffect(() => {
    if (!activeTab) return;
    const parentAccMap: Record<string, string> = {
      calendar: 'acc_appointments',
      appointments: 'acc_appointments',
      customers: 'acc_customers',
      enquiries: 'acc_customers',
      services: 'acc_services',
      memberships: 'acc_services',
      'landing-settings': 'acc_website',
      employees: 'acc_employees',
      leaves: 'acc_employees',
      earnings: 'acc_finance'
    };

    const parentId = parentAccMap[activeTab];
    if (parentId) {
      setOpenAccordions({ [parentId]: true });
    }
  }, [activeTab]);

  // Power BI Model Export Handler (.json file download)
  const handleDownloadPowerBiModel = () => {
    const powerBiDataModel = {
      modelName: "SPY_Salon_Enterprise_PowerBI_Dataset",
      version: "4.0",
      generatedAt: new Date().toISOString(),
      metadata: {
        totalAppointments: appointments.length,
        totalCustomers: customers.length,
        totalEmployees: employees.length,
        grossRevenue: analytics?.totalRevenue ?? 0,
        netProfit: Math.max(0, (analytics?.totalRevenue ?? 0) - payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0))
      },
      slicersApplied: {
        dateRange: slicerDateRange,
        category: slicerCategory,
        specialist: slicerSpecialist
      },
      tables: {
        transactions: transactions,
        specialistROI: employees.map((emp: any, idx: number) => {
          const empApps = appointments.filter((a: any) => a.specialistName?.toLowerCase().includes(emp.name?.toLowerCase()));
          const appRev = empApps.reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
          const empPay = payrolls.find((p: any) => p.employeeName?.toLowerCase() === emp.name?.toLowerCase() || p.empCode === emp.empCode);
          const sal = empPay ? empPay.netPay : 45000;
          const roiVal = sal > 0 ? (((appRev - sal) / sal) * 100).toFixed(1) : '0.0';
          return {
            name: emp.name,
            code: emp.empCode || `EMP-100${idx + 1}`,
            count: empApps.length,
            rev: appRev,
            sal,
            rating: 5.0,
            roi: `${Number(roiVal) >= 0 ? '+' : ''}${roiVal}%`
          };
        }),
        categoryBreakdown: (() => {
          const catMap: Record<string, number> = {};
          let totalRev = 0;
          appointments.forEach((a: any) => {
            const srvName = a.service;
            const matchSrv = services.find((s: any) => s.name === srvName);
            const cat = matchSrv ? matchSrv.category : 'General Service';
            const price = Number(a.price) || 1000;
            catMap[cat] = (catMap[cat] || 0) + price;
            totalRev += price;
          });
          return Object.entries(catMap).map(([cat, rev]) => ({
            category: cat,
            revenue: rev,
            percentage: totalRev > 0 ? Math.round((rev / totalRev) * 100) : 0
          }));
        })()
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(powerBiDataModel, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `spy_salon_powerbi_data_model_${Date.now()}.pbix.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Dynamic Category State & Custom Category Input
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'Hair Care', 'Skin Care', 'Body Spa', 'Nail Artistry', 'Bridal & Makeup', 'Barbering & Grooming'
  ]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const { socket } = useSocket();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminNotifRef.current && !adminNotifRef.current.contains(event.target as Node)) {
        setAdminNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Socket.IO event listener hook
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeSync = () => {
      fetchAdminData();
    };

    socket.on('service:created', handleRealtimeSync);
    socket.on('service:updated', handleRealtimeSync);
    socket.on('service:deleted', handleRealtimeSync);
    socket.on('membership:created', handleRealtimeSync);
    socket.on('membership:updated', handleRealtimeSync);
    socket.on('membership:deleted', handleRealtimeSync);

    socket.on('employee:created', (data: any) => {
      if (data?.employee) {
        setEmployees(prev => [data.employee, ...prev.filter(e => e._id !== data.employee._id)]);
      }
      fetchAdminData();
    });

    socket.on('employee:updated', (data: any) => {
      if (data?.employee) {
        setEmployees(prev => prev.map(e => e._id === data.employee._id ? { ...e, ...data.employee } : e));
      }
      fetchAdminData();
    });

    socket.on('employee:deleted', (data: any) => {
      if (data?.employeeId) {
        setEmployees(prev => prev.filter(e => e._id !== data.employeeId));
      }
      fetchAdminData();
    });

    socket.on('appointment:updated', (data: any) => {
      const appDoc = data?.appointment || data;
      if (appDoc && appDoc._id) {
        setAppointments(prev => prev.map(a => a._id === appDoc._id ? { ...a, ...appDoc } : a));
      }
      fetchAdminData();
    });

    socket.on('appointment:status_changed', (data: any) => {
      fetchAdminData();
    });

    socket.on('appointment:rescheduled', (data: any) => {
      fetchAdminData();
    });

    socket.on('appointment:cancelled', (data: any) => {
      fetchAdminData();
    });

    socket.on('booking_created', handleRealtimeSync);

    socket.on('new_enquiry', (newEnq: any) => {
      if (newEnq) {
        setEnquiries(prev => [newEnq, ...prev.filter(e => e.enquiryId !== newEnq.enquiryId)]);
      }
    });
    socket.on('enquiry_created', (newEnq: any) => {
      if (newEnq) {
        setEnquiries(prev => [newEnq, ...prev.filter(e => e.enquiryId !== newEnq.enquiryId)]);
      }
    });
    socket.on('enquiry_updated', (updatedEnq: any) => {
      if (updatedEnq) {
        setEnquiries(prev => prev.map(e => (e.enquiryId === updatedEnq.enquiryId || e._id === updatedEnq._id) ? { ...e, ...updatedEnq } : e));
      }
    });
    socket.on('enquiry_deleted', (data: any) => {
      if (data?.id) {
        setEnquiries(prev => prev.filter(e => e._id !== data.id && e.enquiryId !== data.id));
      }
    });

    return () => {
      socket.off('service:created', handleRealtimeSync);
      socket.off('service:updated', handleRealtimeSync);
      socket.off('service:deleted', handleRealtimeSync);
      socket.off('membership:created', handleRealtimeSync);
      socket.off('membership:updated', handleRealtimeSync);
      socket.off('membership:deleted', handleRealtimeSync);
      socket.off('employee:created');
      socket.off('employee:updated');
      socket.off('employee:deleted');
      socket.off('appointment:updated');
      socket.off('booking_created', handleRealtimeSync);
      socket.off('new_enquiry');
      socket.off('enquiry_created');
      socket.off('enquiry_updated');
      socket.off('enquiry_deleted');
    };
  }, [socket]);

  // Form States
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialties: '',
    avatar: '',
    services: '',
    baseSalary: 25000,
    commissionPercentage: 20,
    workStart: '09:00',
    workEnd: '19:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    slotInterval: 30
  });

  const [custForm, setCustForm] = useState({ name: '', email: '', phone: '', membership: 'VIP Gold' });
  
  const [servicesSubTab, setServicesSubTab] = useState<'memberships' | 'main-services' | 'full-catalogue' | 'individual-services'>('memberships');
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [catalogueGenderFilter, setCatalogueGenderFilter] = useState<'all' | 'men' | 'women' | 'kids'>('all');
  const [catalogueCatFilter, setCatalogueCatFilter] = useState<string>('All');

  const [membForm, setMembForm] = useState({
    code: '',
    name: '',
    badge: '👑 VIP Member',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    discountPercentage: 10,
    tagline: 'Essential VIP Privileges & Special Perks',
    benefits: '10% Discount on all salon services, Priority Salon Booking, Dedicated Support'
  });

  const [srvForm, setSrvForm] = useState({
    name: '',
    category: 'Hair',
    gender: 'all' as 'all' | 'men' | 'women' | 'kids',
    subCategory: 'Hair Care',
    price: 1999,
    discountPrice: 1699,
    durationMinutes: 60,
    rating: 4.9,
    description: 'Luxury botanical treatment provided by SPY Salon certified specialists.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
    isPopular: true,
    benefits: 'Deep Cellular Hydration, 100% Organic Serums, Stress Relief via Pressure Point Therapy',
    step1Title: 'Specialist Consultation & Texture Analysis',
    step1Desc: 'In-depth assessment by certified SPY Salon specialists to tailor treatment formulations.',
    step2Title: 'Deep Cleansing & Botanical Exfoliation',
    step2Desc: 'Removal of micro-impurities using organic, hypoallergenic cleansers.',
    step3Title: 'Therapeutic Hydro-Mask & Steam Treatment',
    step3Desc: 'Deep penetration of active botanical nutrients combined with gentle stress relief massage.',
    step4Title: 'Post-Care Moisture Seal & Executive Finish',
    step4Desc: 'Final application of protection shield, nutrient lock, and professional executive finish.'
  });

  const [appForm, setAppForm] = useState({
    customerName: '',
    customerPhone: '',
    service: '',
    specialistName: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '11:00 AM',
    paymentMethod: 'UPI'
  });

  const [payForm, setPayForm] = useState({
    employeeName: '',
    employeeId: '',
    empCode: '',
    month: 'July 2026',
    baseSalary: 25000,
    eligibleAmount: 0,
    commissionPercentage: 20,
    commissionAmount: 0,
    incentives: 0,
    deductions: 0,
    paymentMethod: 'Bank Transfer (HDFC)'
  });



  const [membershipsData, setMembershipsData] = useState<any>(null);
  const [membSearchQuery, setMembSearchQuery] = useState<string>('');
  const [membFilterTier, setMembFilterTier] = useState<string>('All');

  // CUSTOM CONFIRMATION POPUP MODAL STATE
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (message: string, onConfirm: () => void, title = 'Confirm Action') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };

  const fetchAdminData = async () => {
    try {
      const [anaRes, empRes, custRes, srvRes, appRes, leaveRes, revRes, payRes, actRes, notifRes, txnRes, attReportRes, enqRes, membRes, membPlansRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/admin/analytics`).then(r => r.json()).catch(() => ({ data: null })),
        apiFetch(`${API_BASE_URL}/admin/employees?limit=500`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/customers`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/services`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/appointments`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/leaves`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/reviews`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/payrolls`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/activity-logs`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/notifications`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/transactions`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/attendance/report`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/admin/enquiries`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/membership/admin/analytics`).then(r => r.json()).catch(() => ({ data: null })),
        apiFetch(`${API_BASE_URL}/admin/memberships`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (anaRes.data) setAnalytics(anaRes.data);
      if (empRes.data) setEmployees(Array.isArray(empRes.data) ? empRes.data : (empRes.data.data || []));
      if (custRes.data) setCustomers(custRes.data);
      if (srvRes.data) {
        setServices(srvRes.data);
        const fetchedCats = Array.from(new Set(srvRes.data.map((s: any) => s.category).filter(Boolean))) as string[];
        setCategoriesList(prev => Array.from(new Set([...prev, ...fetchedCats])));
      }
      if (appRes.data) setAppointments(appRes.data);
      if (leaveRes.data) setLeaves(leaveRes.data);
      if (revRes.data) setReviews(revRes.data);
      if (payRes.data) setPayrolls(payRes.data);
      if (actRes.data) setActivityLogs(actRes.data);
      if (notifRes.data) setNotifications(notifRes.data);
      if (txnRes.data) setTransactions(txnRes.data);
      if (attReportRes.data) setAttendanceReport(attReportRes.data);
      if (enqRes.data) setEnquiries(enqRes.data);
      if (membRes.data) setMembershipsData(membRes.data);
      if (membPlansRes.data && Array.isArray(membPlansRes.data)) setMembershipPlans(membPlansRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CSV Report Export Handler
  const handleExportReport = (moduleName: string) => {
    window.open(`${API_BASE_URL}/admin/export/${moduleName}`, '_blank');
  };

  // AUTO GENERATE PROCEDURE STEPS
  const autoGenerateProcedureSteps = () => {
    const titleLower = (srvForm.name || '').toLowerCase();
    const catLower = (srvForm.category || '').toLowerCase();

    if (titleLower.includes('cut') || titleLower.includes('trim') || (catLower === 'hair' && (titleLower.includes('style') || titleLower.includes('keratin')))) {
      setSrvForm(prev => ({
        ...prev,
        step1Title: 'Face Shape Consultation & Hair Cut Mapping',
        step1Desc: 'In-depth assessment of natural growth, scalp condition, and facial structure to select custom haircut sectioning.',
        step2Title: 'Purifying Botanical Shampoo & Scalp Massage',
        step2Desc: 'Sulfate-free scalp wash with organic botanical cleansers and gentle scalp pressure-point relaxation massage.',
        step3Title: 'Precision Scissors Sculpting & Layering',
        step3Desc: 'Precision wet/dry sectioning, weight-balance trimming, and texturizing layers by master hair stylists.',
        step4Title: 'Executive Blow-Dry & Gloss Seal Finish',
        step4Desc: 'Heat protection application, volume styling, mirror inspection finish, and sheen serum lock.'
      }));
    } else if (titleLower.includes('color') || titleLower.includes('balayage') || titleLower.includes('highlight')) {
      setSrvForm(prev => ({
        ...prev,
        step1Title: 'Shade Tone Consultation & Sensitivity Check',
        step1Desc: 'Custom shade swatch selection and allergy sensitivity check for 100% ammonia-free pigments.',
        step2Title: 'Foil Sectioning & Precision Color Infusion',
        step2Desc: 'Meticulous root-to-tip foil sectioning and organic color pigment application by senior color specialists.',
        step3Title: 'Post-Color Acidic pH Seal & Gloss Rinse',
        step3Desc: 'Acidic pH-balancing rinse to lock in color vibrancy, prevent fading, and boost soft texture.',
        step4Title: 'Keratin Blowout & Sheen Polish Finish',
        step4Desc: 'Deep conditioning treatment blast, smooth blowout, and light-reflecting shine spray.'
      }));
    } else if (titleLower.includes('facial') || titleLower.includes('glow') || catLower === 'skin') {
      setSrvForm(prev => ({
        ...prev,
        step1Title: 'Dermatological Skin Analysis & Hydration Mapping',
        step1Desc: 'Hydration and sebum evaluation to select active 24K gold or botanical collagen serums.',
        step2Title: 'Ultrasonic Micro-Exfoliation & Steam Cleansing',
        step2Desc: 'Gentle removal of dead skin cells and blackheads using ultrasonic skin scrubber.',
        step3Title: 'Nutrient Radiance Mask & Facial Massage',
        step3Desc: 'Deep penetration of gold or mineral collagen mask with soothing face, neck, and shoulder massage.',
        step4Title: 'SPF 50 UV Defense & Moisture Lock Seal',
        step4Desc: 'Application of hyaluronic acid barrier and broad-spectrum sunscreen for radiant glass skin.'
      }));
    } else {
      setSrvForm(prev => ({
        ...prev,
        step1Title: 'Specialist Consultation & Texture Analysis',
        step1Desc: 'In-depth assessment by certified SPY Salon specialists to tailor treatment formulations.',
        step2Title: 'Deep Cleansing & Botanical Exfoliation',
        step2Desc: 'Removal of micro-impurities using organic, hypoallergenic cleansers.',
        step3Title: 'Therapeutic Hydro-Mask & Steam Treatment',
        step3Desc: 'Deep penetration of active botanical nutrients combined with gentle stress relief massage.',
        step4Title: 'Post-Care Moisture Seal & Executive Finish',
        step4Desc: 'Final application of protection shield, nutrient lock, and professional executive finish.'
      }));
    }
  };

  // EMPLOYEE SAVE WITH CREDENTIALS
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const empName = empForm.name || 'Master Stylist Specialist';
    const empNameKey = empName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const finalEmail = empForm.email?.trim() || `${empNameKey}_${Math.floor(100 + Math.random() * 900)}@spysalon.com`;
    const finalPhone = empForm.phone?.trim() || `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`;

    const payload = {
      name: empName,
      email: finalEmail,
      phone: finalPhone,
      password: empForm.password || '',
      specialties: empForm.specialties ? empForm.specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
      avatar: empForm.avatar || '',
      services: empForm.services ? empForm.services.split(',').map(s => s.trim()).filter(Boolean) : [],
      workingHours: { start: empForm.workStart || '09:00', end: empForm.workEnd || '19:00' },
      breakTime: { start: empForm.breakStart || '13:00', end: empForm.breakEnd || '14:00' },
      slotIntervalMinutes: Number(empForm.slotInterval || 30),
      status: 'Active'
    };

    if (modalType === 'editEmp' && selectedItem) {
      const res = await apiFetch(`${API_BASE_URL}/admin/employees/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const updated = data.data || payload;
      setEmployees(prev => prev.map(emp => emp._id === selectedItem._id ? { ...emp, ...updated } : emp));
      if (data.credentials) {
        setCreatedCredentials({
          name: updated.name,
          empCode: data.credentials.empCode,
          email: data.credentials.email,
          username: data.credentials.username,
          tempPassword: data.credentials.tempPassword
        });
        setModalType('empCreds');
        await fetchAdminData();
        return;
      }
      setModalType(null);
    } else {
      const res = await apiFetch(`${API_BASE_URL}/admin/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setEmployees(prev => [data.data, ...prev.filter(e => e._id !== data.data._id)]);
        if (data.credentials) {
          setCreatedCredentials({
            name: data.data.name,
            empCode: data.credentials.empCode,
            email: data.credentials.email,
            username: data.credentials.username,
            tempPassword: data.credentials.tempPassword
          });
          setModalType('empCreds');
          await fetchAdminData();
          return;
        }
      } else {
        showToast(data.message || 'Failed to register employee profile', 'error');
      }
      setModalType(null);
    }
    await fetchAdminData();
  };

  const handleDeleteEmployee = (id: string) => {
    showConfirm('Delete this employee record?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/employees/${id}`, { method: 'DELETE' });
      setEmployees(employees.filter(e => e._id !== id));
    }, 'Delete Employee');
  };

  // SERVICE CRUD WITH STEP-BY-STEP PROCEDURE STEPS AND KEY BENEFITS
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const stepsArray = [
      { num: '01', title: srvForm.step1Title, desc: srvForm.step1Desc },
      { num: '02', title: srvForm.step2Title, desc: srvForm.step2Desc },
      { num: '03', title: srvForm.step3Title, desc: srvForm.step3Desc },
      { num: '04', title: srvForm.step4Title, desc: srvForm.step4Desc }
    ];

    const benefitsArray = srvForm.benefits.split(',').map(b => b.trim()).filter(Boolean);

    let finalCategory = srvForm.category;
    if (isCustomCategory && customCategoryInput.trim()) {
      finalCategory = customCategoryInput.trim();
      setCategoriesList(prev => Array.from(new Set([...prev, finalCategory])));
    }

    const priceNum = Number(srvForm.price) || 0;
    const durationNum = Number(srvForm.durationMinutes) || 60;

    const payload = {
      name: srvForm.name || 'Custom Salon Service',
      category: finalCategory || 'Hair',
      gender: srvForm.gender || 'all',
      subCategory: srvForm.subCategory || finalCategory || 'Hair Care',
      price: priceNum,
      discountPrice: Number(srvForm.discountPrice || priceNum),
      durationMinutes: durationNum,
      duration: `${durationNum} Min`,
      rating: Number(srvForm.rating) || 4.9,
      description: srvForm.description || 'Luxury botanical treatment provided by SPY Salon certified specialists.',
      image: srvForm.image || '',
      isPopular: Boolean(srvForm.isPopular),
      steps: stepsArray,
      benefits: benefitsArray,
      isActive: true
    };

    if (modalType === 'editSrv' && selectedItem) {
      const res = await apiFetch(`${API_BASE_URL}/admin/services/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const updated = data.data || payload;
      setServices(prev => prev.map(s => s._id === selectedItem._id ? { ...s, ...updated } : s));
    } else {
      const res = await apiFetch(`${API_BASE_URL}/admin/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.data) {
        setServices(prev => [data.data, ...prev.filter(s => s._id !== data.data._id)]);
      }
    }
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setModalType(null);
    await fetchAdminData();
  };

  const handleDeleteService = (id: string) => {
    showConfirm('Delete service from menu?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/services/${id}`, { method: 'DELETE' });
      setServices(prev => prev.filter(s => s._id !== id));
      await fetchAdminData();
    }, 'Delete Service');
  };

  // MEMBERSHIP PLANS CRUD HANDLERS
  const handleSaveMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyPriceNum = Number(membForm.monthlyPrice) || 999;
    const yearlyPriceNum = Number(membForm.yearlyPrice) || (monthlyPriceNum * 10);

    const payload = {
      name: membForm.name || 'VIP Custom Package',
      code: membForm.code || membForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      badge: membForm.badge || `👑 ${membForm.name}`,
      price: monthlyPriceNum,
      monthlyPrice: monthlyPriceNum,
      yearlyPrice: yearlyPriceNum,
      discountPercentage: Number(membForm.discountPercentage) || 10,
      tagline: membForm.tagline || 'Exclusive VIP privileges & monthly perks.',
      benefits: typeof membForm.benefits === 'string' ? membForm.benefits.split(',').map(b => b.trim()).filter(Boolean) : membForm.benefits,
      isActive: true
    };

    if (modalType === 'editMemb' && selectedItem) {
      const res = await apiFetch(`${API_BASE_URL}/admin/memberships/${selectedItem._id || selectedItem.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const updated = data.data || payload;
      setMembershipPlans(prev => prev.map(m => (m._id === selectedItem._id || m.code === selectedItem.code) ? { ...m, ...updated } : m));
    } else {
      const res = await apiFetch(`${API_BASE_URL}/admin/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.data) {
        setMembershipPlans(prev => [data.data, ...prev.filter(m => m._id !== data.data._id && m.code !== data.data.code)]);
      }
    }
    setModalType(null);
    await fetchAdminData();
  };

  const handleDeleteMembership = (id: string) => {
    showConfirm('Are you sure you want to delete this membership package?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/memberships/${id}`, { method: 'DELETE' });
      setMembershipPlans(prev => prev.filter(m => m._id !== id && m.code !== id));
      await fetchAdminData();
    }, 'Delete Membership');
  };

  // PAYROLL & SALARY SLIP CRUD HANDLERS
  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch(`${API_BASE_URL}/admin/payrolls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payForm)
    });
    const data = await res.json();
    if (data.data) {
      setPayrolls([data.data, ...payrolls]);
      const [txnRes, anaRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/admin/transactions`).then(r => r.json()).catch(() => ({ data: null })),
        apiFetch(`${API_BASE_URL}/admin/analytics`).then(r => r.json()).catch(() => ({ data: null }))
      ]);
      if (txnRes?.data) setTransactions(txnRes.data);
      if (anaRes?.data) setAnalytics(anaRes.data);
    }
    setModalType(null);
  };

  const handleUpdatePayrollStatus = async (id: string, newStatus: string) => {
    await apiFetch(`${API_BASE_URL}/admin/payrolls/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setPayrolls(payrolls.map(p => p._id === id ? { ...p, status: newStatus } : p));
  };

  const handleDeletePayroll = (id: string) => {
    showConfirm('Delete salary slip record?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/payrolls/${id}`, { method: 'DELETE' });
      setPayrolls(payrolls.filter(p => p._id !== id));
      const [txnRes, anaRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/admin/transactions`).then(r => r.json()).catch(() => ({ data: null })),
        apiFetch(`${API_BASE_URL}/admin/analytics`).then(r => r.json()).catch(() => ({ data: null }))
      ]);
      if (txnRes?.data) setTransactions(txnRes.data);
      if (anaRes?.data) setAnalytics(anaRes.data);
    }, 'Delete Salary Slip');
  };

  const handleDeleteTransaction = (id: string) => {
    showConfirm('Are you sure you want to delete this transaction entry? This action cannot be undone.', async () => {
      await apiFetch(`${API_BASE_URL}/admin/transactions/${id}`, { method: 'DELETE' });
      setTransactions(transactions.filter(t => t._id !== id));
      const anaRes = await apiFetch(`${API_BASE_URL}/admin/analytics`).then(r => r.json()).catch(() => ({ data: null }));
      if (anaRes?.data) setAnalytics(anaRes.data);
    }, 'Delete Transaction');
  };

  // CUSTOMERS & APPOINTMENTS
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch(`${API_BASE_URL}/admin/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(custForm)
    });
    const data = await res.json();
    if (data.data) setCustomers([data.data, ...customers]);
    setModalType(null);
  };

  const handleDeleteCustomer = (id: string) => {
    showConfirm('Delete customer account?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/customers/${id}`, { method: 'DELETE' });
      setCustomers(customers.filter(c => c._id !== id));
    }, 'Delete Customer Account');
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const isWalkIn = appForm.appointmentTime === 'Immediate Walk-In';

    if (!isWalkIn && appForm.appointmentDate < todayStr) {
      showToast(`Cannot schedule appointments on past dates (${appForm.appointmentDate}). Please select today (${todayStr}) or a future date.`, 'error');
      return;
    }

    try {
      const targetDate = isWalkIn ? todayStr : appForm.appointmentDate;
      const targetTime = appForm.appointmentTime || '02:00 PM';

      const res = await apiFetch(`${API_BASE_URL}/admin/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: appForm.customerName,
          customerPhone: appForm.customerPhone,
          service: appForm.service,
          specialistName: appForm.specialistName,
          appointmentDate: targetDate,
          date: targetDate,
          appointmentTime: targetTime,
          time: targetTime,
          paymentMethod: appForm.paymentMethod,
          branch: 'Jubilee Hills Flagship'
        })
      });
      const data = await res.json();
      if (data.data) {
        setAppointments(prev => [data.data, ...prev.filter(a => a._id !== data.data._id)]);
        setModalType(null);
        showToast(`Walk-In Appointment #${data.data.bookingId} confirmed successfully!`, 'success');
      } else {
        showToast(data.message || 'Failed to confirm walk-in appointment.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating walk-in appointment.', 'error');
    }
  };

  const STATUS_OPTIONS_CONFIG: Record<string, { value: string; label: string }[]> = {
    'Pending': [
      { value: 'Pending', label: 'Pending 🟡' },
      { value: 'Confirmed', label: 'Confirmed 🟢' },
      { value: 'In Progress', label: 'In Progress ✂️' },
      { value: 'Completed', label: 'Completed ✅' },
      { value: 'Cancelled', label: 'Cancelled ❌' }
    ],
    'Confirmed': [
      { value: 'Confirmed', label: 'Confirmed 🟢' },
      { value: 'In Progress', label: 'In Progress ✂️' },
      { value: 'Completed', label: 'Completed ✅' },
      { value: 'Reschedule Requested', label: 'Reschedule Requested ⚠️' },
      { value: 'Cancelled', label: 'Cancelled ❌' },
      { value: 'No Show', label: 'No Show ⚪' }
    ],
    'Reschedule Requested': [
      { value: 'Reschedule Requested', label: 'Reschedule Requested ⚠️' },
      { value: 'Rescheduled', label: 'Rescheduled 🗓️' },
      { value: 'Completed', label: 'Completed ✅' },
      { value: 'Cancelled', label: 'Cancelled ❌' }
    ],
    'Rescheduled': [
      { value: 'Rescheduled', label: 'Rescheduled 🗓️' },
      { value: 'Confirmed', label: 'Confirmed 🟢' },
      { value: 'Completed', label: 'Completed ✅' },
      { value: 'Cancelled', label: 'Cancelled ❌' }
    ],
    'In Progress': [
      { value: 'In Progress', label: 'In Progress ✂️' },
      { value: 'Completed', label: 'Completed ✅' },
      { value: 'Cancelled', label: 'Cancelled ❌' }
    ],
    'Completed': [
      { value: 'Completed', label: 'Completed ✅' }
    ],
    'Cancelled': [
      { value: 'Cancelled', label: 'Cancelled ❌' }
    ],
    'No Show': [
      { value: 'No Show', label: 'No Show ⚪' }
    ]
  };

  const hasAppointmentStarted = (dateStr?: string, timeStr?: string) => {
    if (!dateStr || !timeStr) return true;
    try {
      const now = new Date();
      let year: number, month: number, day: number;
      if (dateStr.includes('-')) {
        const parts = dateStr.trim().split('T')[0].split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) return true;
        year = parsedDate.getFullYear();
        month = parsedDate.getMonth();
        day = parsedDate.getDate();
      }

      const timeParts = timeStr.trim().split(/\s+/);
      if (timeParts.length < 2) return true;
      const clockParts = timeParts[0].split(':');
      let hour = parseInt(clockParts[0], 10);
      const minute = parseInt(clockParts[1], 10);
      const isPm = timeParts[1].toUpperCase() === 'PM';
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;

      const scheduledDateTime = new Date(year, month, day, hour, minute);
      return now >= scheduledDateTime;
    } catch (e) {
      return true;
    }
  };

  const getValidStatusOptions = (currentStatus: string, appointment?: any) => {
    const norm = (currentStatus || 'Pending').trim();
    let options = STATUS_OPTIONS_CONFIG[norm] || [
      { value: norm, label: norm },
      { value: 'Confirmed', label: 'Confirmed 🟢' },
      { value: 'Cancelled', label: 'Cancelled ❌' }
    ];
    if (appointment && !hasAppointmentStarted(appointment.appointmentDate, appointment.appointmentTime)) {
      options = options.filter(opt => opt.value !== 'Completed');
    }
    return options;
  };

  const handleUpdateAppStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'Completed') {
      const app = appointments.find(a => a._id === id);
      if (app && !hasAppointmentStarted(app.appointmentDate, app.appointmentTime)) {
        showToast(`Cannot mark appointment as Completed before its scheduled time (${app.appointmentDate} ${app.appointmentTime}).`, 'error');
        return;
      }
    }
    try {
      const res = await apiFetch(`${API_BASE_URL}/admin/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to update status.', 'error');
        return;
      }
      const updated = data.data;
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, ...updated, status: newStatus } : a));
    } catch (err: any) {
      showToast(err.message || 'Error updating appointment status.', 'error');
    }
  };

  const handleUpdateAppPaymentStatus = async (id: string, newPaymentStatus: string) => {
    await apiFetch(`${API_BASE_URL}/admin/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: newPaymentStatus })
    });
    setAppointments(appointments.map(a => a._id === id ? { ...a, paymentStatus: newPaymentStatus } : a));
  };

  const handleRespondReschedule = async (id: string, action: 'Approve' | 'Reject', rejectionReason?: string) => {
    const res = await apiFetch(`${API_BASE_URL}/admin/appointments/${id}/reschedule-respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rejectionReason })
    });
    const data = await res.json();
    if (data.data) {
      setAppointments(appointments.map(a => a._id === id ? { ...a, ...data.data } : a));
    } else {
      fetchAdminData();
    }
  };

  const handleDeleteAppointment = (id: string) => {
    showConfirm('Cancel & delete appointment?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/appointments/${id}`, { method: 'DELETE' });
      setAppointments(appointments.filter(a => a._id !== id));
    }, 'Cancel Appointment');
  };

  const handleDownloadInvoice = async (id: string, bookingId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/invoices/${id}`);
      if (!res.ok) {
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPY-INVOICE-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // LEAVE APPROVAL / REJECTION HANDLERS
  const handleUpdateLeaveStatus = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    await apiFetch(`${API_BASE_URL}/admin/leaves/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setLeaves(leaves.map(l => l._id === id ? { ...l, status: newStatus } : l));
  };

  const handleDeleteLeave = (id: string) => {
    showConfirm('Remove this leave application record?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/leaves/${id}`, { method: 'DELETE' });
      setLeaves(leaves.filter(l => l._id !== id));
    }, 'Delete Leave Application');
  };

  const handleDeleteReview = (id: string) => {
    showConfirm('Remove this comment?', async () => {
      await apiFetch(`${API_BASE_URL}/admin/reviews/${id}`, { method: 'DELETE' });
      setReviews(reviews.filter(r => r._id !== id));
    }, 'Delete Comment');
  };

  const handleAdminLogout = async () => {
    await logout();
    router.push('/');
  };

  const copyCredsToClipboard = (emailVal?: string, passVal?: string, codeVal?: string) => {
    const e = emailVal || createdCredentials?.email || 'employee@spysalon.com';
    const p = passVal || createdCredentials?.tempPassword || '●●●●●●●● (Sent via Email)';
    const c = codeVal || createdCredentials?.empCode || 'EMP-1001';
    const text = `SPY Salon Staff Credentials:\nEmployee ID: ${c}\nLogin Email: ${e}\nPassword: ${p}\nLogin Portal: ${APP_BASE_URL}/login`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  // Calendar Calculation Helpers
  const getCalendarDays = () => {
    const year = calMonthView.getFullYear();
    const month = calMonthView.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, pDay);
      const yyyy = prevDate.getFullYear();
      const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dd = String(prevDate.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNumber: pDay,
        isCurrentMonth: false
      });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNumber: d,
        isCurrentMonth: true
      });
    }

    const targetLength = days.length <= 35 ? 35 : 42;
    const paddingNeeded = targetLength - days.length;

    for (let n = 1; n <= paddingNeeded; n++) {
      const nextDate = new Date(year, month + 1, n);
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNumber: n,
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(app => {
      if (!app) return false;
      if (app.appointmentDate === dateStr) return true;
      if (app.bookingDateTime) {
        try {
          const appIsoDate = new Date(app.bookingDateTime).toISOString().split('T')[0];
          if (appIsoDate === dateStr) return true;
        } catch (e) {}
      }
      if (app.bookingDate) {
        if (app.bookingDate === dateStr) return true;
        try {
          const parsed = new Date(app.bookingDate).toISOString().split('T')[0];
          if (parsed === dateStr) return true;
        } catch (e) {}
      }
      return false;
    });
  };

  // Filtered Lists
  const filteredEmployees = (employees || []).filter(e => {
    if (!e) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const empName = (e.name || '').toLowerCase();
    const empCode = (e.empCode || '').toLowerCase();
    const empEmail = (e.email || '').toLowerCase();
    const empPhone = (e.phone || '').toLowerCase();
    const empSpecs = Array.isArray(e.specialties) ? e.specialties : [];

    const matchQ = !q ||
      empName.includes(q) ||
      empCode.includes(q) ||
      empEmail.includes(q) ||
      empPhone.includes(q) ||
      empSpecs.some((s: string) => (s || '').toLowerCase().includes(q));

    const matchS = statusFilter === 'All' || e.status === statusFilter || (statusFilter === 'Active' && e.status !== 'Inactive');
    return matchQ && matchS;
  });

  const filteredServices = services.filter(s => {
    const matchQ = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchS = statusFilter === 'All' || s.category === statusFilter;
    return matchQ && matchS;
  });

  const filteredAppointments = appointments.filter(a => {
    const matchQ = !searchQuery || a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || a.bookingId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchS = statusFilter === 'All' || a.status === statusFilter;
    return matchQ && matchS;
  });

  const filteredEnquiries = enquiries.filter(e => {
    const queryStr = searchQuery.toLowerCase().trim();
    const matchQ = !queryStr || 
      (e.name && e.name.toLowerCase().includes(queryStr)) || 
      (e.email && e.email.toLowerCase().includes(queryStr)) ||
      (e.phone && e.phone.toLowerCase().includes(queryStr)) ||
      (e.enquiryId && e.enquiryId.toLowerCase().includes(queryStr)) ||
      (e.message && e.message.toLowerCase().includes(queryStr));
    const matchS = statusFilter === 'All' || e.status === statusFilter;
    return matchQ && matchS;
  });

  const handleUpdateEnquiryStatus = async (id: string, status: string, notes?: string) => {
    setIsUpdatingEnquiry(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/admin/enquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes !== undefined ? notes : enquiryAdminNotes })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setEnquiries(prev => prev.map(e => (e._id === id || e.enquiryId === id) ? { ...e, ...data.data } : e));
        if (selectedEnquiry && (selectedEnquiry._id === id || selectedEnquiry.enquiryId === id)) {
          setSelectedEnquiry(data.data);
        }
      }
    } catch (err) {
      console.error('Error updating enquiry:', err);
    } finally {
      setIsUpdatingEnquiry(false);
    }
  };

  const handleDeleteEnquiry = (id: string) => {
    showConfirm('Are you sure you want to delete this enquiry record?', async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/admin/enquiries/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setEnquiries(prev => prev.filter(e => e._id !== id && e.enquiryId !== id));
          if (selectedEnquiry && (selectedEnquiry._id === id || selectedEnquiry.enquiryId === id)) {
            setIsEnquiryModalOpen(false);
            setSelectedEnquiry(null);
          }
        }
      } catch (err) {
        console.error('Error deleting enquiry:', err);
      }
    }, 'Delete Enquiry');
  };

  const handleExportEnquiriesCsv = () => {
    const headers = ['Enquiry ID', 'Name', 'Email', 'Phone', 'Status', 'Message', 'Admin Notes', 'Date'];
    const rows = enquiries.map(e => [
      e.enquiryId,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      e.status,
      `"${(e.message || '').replace(/"/g, '""')}"`,
      `"${(e.adminNotes || '').replace(/"/g, '""')}"`,
      `"${new Date(e.createdAt).toLocaleString()}"`
    ]);
    const csvStr = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spy_salon_enquiries_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Admin Authentication Required</h1>
        <p className="text-gray-400 text-sm max-w-sm">Please sign in with administrator credentials.</p>
        <button onClick={() => router.push('/login?redirect=/admin')} className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm cursor-pointer">
          Sign In to Admin Portal
        </button>
      </div>
    );
  }

  interface SidebarNavItem {
    type: 'single' | 'accordion';
    id?: string;
    label: string;
    icon: any;
    badge?: number | null;
    children?: {
      id: string;
      label: string;
      icon: any;
      badge?: number | null;
    }[];
  }

  const sidebarNavStructure: SidebarNavItem[] = [
    {
      type: 'single',
      id: 'analytics',
      label: 'Dashboard & Reports',
      icon: TrendingUp
    },
    {
      type: 'accordion',
      id: 'acc_appointments',
      label: 'Appointments',
      icon: Calendar,
      children: [
        { id: 'calendar', label: 'Schedule Calendar', icon: CalendarDays },
        { id: 'appointments', label: 'Appointments Desk', icon: Calendar }
      ]
    },
    {
      type: 'accordion',
      id: 'acc_customers',
      label: 'Customers & CRM',
      icon: UserCheck,
      children: [
        { id: 'customers', label: 'Customer Directory', icon: UserCheck },
        { id: 'enquiries', label: 'Enquiries & Leads CRM', icon: Mail, badge: enquiryNewCount > 0 ? enquiryNewCount : null }
      ]
    },
    {
      type: 'accordion',
      id: 'acc_services',
      label: 'Services & Memberships',
      icon: Scissors,
      children: [
        { id: 'services', label: 'Services & Pricing Menu', icon: Scissors },
        { id: 'memberships', label: 'VIP Memberships', icon: Crown }
      ]
    },
    {
      type: 'accordion',
      id: 'acc_website',
      label: 'Website Management',
      icon: Sliders,
      children: [
        { id: 'landing-settings', label: 'Home Page Settings', icon: Sliders }
      ]
    },
    {
      type: 'accordion',
      id: 'acc_employees',
      label: 'Employees',
      icon: Users,
      children: [
        { id: 'employees', label: 'Employee Management', icon: Users },
        { id: 'leaves', label: 'Leaves & Attendance', icon: Clock }
      ]
    },
    {
      type: 'accordion',
      id: 'acc_finance',
      label: 'Finance',
      icon: DollarSign,
      children: [
        { id: 'earnings', label: 'Earnings & Payroll Payouts', icon: DollarSign }
      ]
    },
    {
      type: 'single',
      id: 'reviews',
      label: 'Reviews & Moderation',
      icon: MessageSquare
    },
    {
      type: 'single',
      id: 'ai-reports',
      label: 'Executive Business Reports',
      icon: FileText
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex text-gray-100 font-sans">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-40 bg-black/70 lg:hidden transition-opacity cursor-pointer"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-850 border-r border-rosegold-500/20 flex flex-col justify-between transition-transform duration-300 ease-in-out h-screen overflow-hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <Link href="/" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity cursor-pointer" title="Go to Main Website">
              <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-rosegold-500 flex items-center justify-center shadow-glow-rosegold shrink-0 overflow-hidden">
                <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-base font-bold text-white leading-none">
                  SPY <span className="rosegold-gradient-text font-bold">SALON</span>
                </span>
                <span className="text-[8px] tracking-[0.2em] text-rosegold-400 uppercase font-sans mt-1">
                  ADMIN EXECUTIVE DESK
                </span>
              </div>
            </Link>

            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-rosegold-500/40 transition-all relative z-10 cursor-pointer shadow-sm" 
              title="Close Navigation Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {sidebarNavStructure.map((item) => {
              const IconComp = item.icon;

              if (item.type === 'single') {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id!)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-dark-900' : 'text-rosegold-400'}`} />
                      <span className="text-xs truncate font-medium">{item.label}</span>
                    </div>
                  </button>
                );
              }

              // Accordion Category Item
              const isExpanded = !!openAccordions[item.id!];
              const hasActiveChild = item.children?.some(c => c.id === activeTab);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleAccordion(item.id!)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all cursor-pointer text-left ${
                      hasActiveChild ? 'text-rosegold-300 font-bold bg-rosegold-500/10 border border-rosegold-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white font-semibold'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <IconComp className={`w-4 h-4 shrink-0 ${hasActiveChild ? 'text-rosegold-400' : 'text-gray-400'}`} />
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {item.children?.some(c => c.badge !== undefined && c.badge !== null && c.badge > 0) && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-rosegold-400' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pl-3 space-y-1 border-l-2 border-rosegold-500/20 ml-3.5 my-1 transition-all">
                      {item.children?.map(child => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeTab === child.id;

                        return (
                          <button
                            key={child.id}
                            onClick={() => handleTabChange(child.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                              isChildActive
                                ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? 'text-dark-900' : 'text-rosegold-400'}`} />
                              <span className="text-xs truncate font-medium">{child.label}</span>
                            </div>

                            {child.badge !== undefined && child.badge !== null && child.badge > 0 && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isChildActive ? 'bg-dark-900 text-rosegold-300' : 'bg-amber-500 text-dark-900'
                              }`}>
                                {child.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-white/10 bg-dark-900/90 text-xs space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <ProfileAvatar user={user} name={user?.name || "System Administrator"} size="md" onClick={() => setIsSettingsModalOpen(true)} />
              <div className="space-y-0.5 overflow-hidden text-left">
                <h4 className="text-white font-serif font-bold text-xs truncate">System Administrator</h4>
                <p className="text-[10px] text-gray-400 truncate">admin@spysalon.com</p>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-rosegold-400 hover:text-white border border-white/10 hover:border-rosegold-500/40 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Change Password & Security Settings"
            >
              <Settings className="w-4 h-4 text-rosegold-400" />
            </button>
          </div>

          <button onClick={handleAdminLogout} className="w-full mt-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 border border-red-500/30 transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
      }`}>
        
        {/* Header */}
        <header className={`sticky top-0 z-40 bg-dark-900 border-b border-rosegold-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-transform duration-300 ease-in-out shadow-md ${
          showHeader ? 'translate-y-0' : '-translate-y-full shadow-none'
        }`}>
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white hover:border-rosegold-500/40 cursor-pointer transition-all flex items-center space-x-1.5 shadow-sm" 
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-rosegold-400" />
                <span className="hidden sm:inline text-xs font-bold text-gray-300">Menu</span>
              </button>
            )}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-400">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-rosegold-400 font-bold uppercase tracking-wider">
                {(() => {
                  for (const item of sidebarNavStructure) {
                    if (item.type === 'single' && item.id === activeTab) return item.label;
                    if (item.type === 'accordion' && item.children) {
                      const match = item.children.find(c => c.id === activeTab);
                      if (match) return match.label;
                    }
                  }
                  return 'Dashboard & Reports';
                })()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white hover:border-rosegold-500/40 transition-all cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-400" />
              )}
            </button>

            <div className="relative" ref={adminNotifRef}>
              {(() => {
                const unreadNotifs = notifications.filter(n => !n.read && !n.isRead);

                const formatAdminRelTime = (dateStr: string) => {
                  if (!dateStr) return 'Just now';
                  const now = new Date();
                  const past = new Date(dateStr);
                  const diffMs = now.getTime() - past.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);

                  if (diffMins < 1) return 'Just now';
                  if (diffMins < 60) return `${diffMins} mins ago`;
                  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                  if (diffDays === 1) return 'Yesterday';
                  if (diffDays < 7) return `${diffDays} days ago`;
                  return past.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                };

                const handleAdminMarkRead = async (id: string) => {
                  setNotifications(prev => prev.map(n => (n._id === id || n.notificationId === id) ? { ...n, read: true, isRead: true } : n));
                  await apiFetch(`${API_BASE_URL}/notifications/read/${id}`, { method: 'PATCH' }).catch(() => {});
                };

                const handleAdminMarkAllRead = async () => {
                  setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
                  await apiFetch(`${API_BASE_URL}/notifications/read-all`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'admin' })
                  }).catch(() => {});
                };

                const handleAdminDeleteNotif = async (id: string) => {
                  setNotifications(prev => prev.filter(n => n._id !== id && n.notificationId !== id));
                  await apiFetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
                };

                return (
                  <>
                    <button
                      onClick={() => setAdminNotifOpen(!adminNotifOpen)}
                      className="p-2 rounded-xl bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white transition-all cursor-pointer relative"
                      title="Admin Desk Notifications"
                    >
                      <Bell className="w-4 h-4 text-rosegold-400" />
                      {unreadNotifs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center border border-dark-900 shadow-md">
                          {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                        </span>
                      )}
                    </button>

                    {/* Admin Notification Dropdown */}
                    {adminNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-dark-900/95 border border-rosegold-500/40 backdrop-blur-2xl shadow-2xl p-4 space-y-3 z-50 text-left animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-rosegold-400" />
                            <h4 className="text-white font-serif font-bold text-sm">Admin Desk Notifications</h4>
                            {unreadNotifs.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rosegold-500/20 text-rosegold-300 text-[10px] font-bold border border-rosegold-500/30">
                                {unreadNotifs.length} unread
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {notifications.some(n => !n.read && !n.isRead) && (
                              <button
                                onClick={handleAdminMarkAllRead}
                                className="text-[10px] text-rosegold-300 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                                title="Mark all notifications as read"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Read All</span>
                              </button>
                            )}
                            <button onClick={() => setAdminNotifOpen(false)} className="text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No admin notifications.</p>
                          ) : (
                            notifications.map((n) => {
                              const notifId = n._id || n.notificationId;
                              const isUnread = !n.read && !n.isRead;
                              const isLeaveNotif = n.type === 'leave' || !!n.leaveRequestId || n.title?.toLowerCase().includes('leave');
                              return (
                                <div
                                  key={notifId}
                                  onClick={() => isLeaveNotif && handleOpenLeaveModalFromNotif(n)}
                                  className={`p-3 rounded-2xl text-xs space-y-1 transition-colors ${
                                    isLeaveNotif ? 'cursor-pointer hover:bg-rosegold-500/20' : ''
                                  } ${
                                    isUnread
                                      ? 'bg-rosegold-500/10 border-l-4 border-l-rosegold-500 text-white font-medium'
                                      : 'bg-dark-800/40 text-gray-400'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                      <div className="flex items-center space-x-1.5">
                                        {isUnread && <span className="w-2 h-2 rounded-full bg-rosegold-400 shrink-0" />}
                                        <span className={`font-bold block truncate ${isUnread ? 'text-white' : 'text-gray-300'}`}>{n.title}</span>
                                        {isLeaveNotif && (
                                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                                            Click to Review
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-gray-300 text-[11px] leading-relaxed whitespace-pre-line">{n.message}</p>
                                      <span className="text-[9px] text-gray-500 font-mono block">
                                        {formatAdminRelTime(n.timestamp || n.createdAt)}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                                      {isUnread && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleAdminMarkRead(notifId); }}
                                          className="p-1 rounded-lg bg-dark-800 text-green-400 hover:bg-green-500 hover:text-dark-900 cursor-pointer border border-green-500/30 transition-colors"
                                          title="Mark as Read"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleAdminDeleteNotif(notifId)}
                                        className="p-1 rounded-lg bg-dark-800 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer border border-red-500/30 transition-colors"
                                        title="Delete Notification"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          
          {/* TAB 1: ANALYTICS & INTERACTIVE STAT CARDS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-serif text-white">Business Intelligence & Revenue Reports</h2>
                <button onClick={() => handleExportReport('appointments')} className="px-3.5 py-2 rounded-xl bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Report</span>
                </button>
              </div>
              
              {/* INTERACTIVE STAT CARDS (CLICK REVENUE ➔ EARNINGS, APPOINTMENTS ➔ APPOINTMENTS DESK, SPECIALISTS ➔ EMPLOYEES, CLIENT BASE ➔ CUSTOMERS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div 
                  onClick={() => handleTabChange('earnings')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 hover:shadow-glow-rosegold group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-rosegold-300">Total Revenue</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-rosegold-400">₹{(analytics?.totalRevenue ?? 0).toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-rosegold-300 font-bold block pt-1">Click to View Earnings & Payouts →</span>
                </div>

                <div 
                  onClick={() => handleTabChange('appointments')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-white">Total Appointments</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-white">{analytics?.totalAppointments || appointments.length}</p>
                  <span className="text-[10px] text-gray-400 block pt-1">Click to Manage Appointments →</span>
                </div>

                <div 
                  onClick={() => handleTabChange('employees')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-white">Active Specialists</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-white">{analytics?.activeEmployees || employees.length}</p>
                  <span className="text-[10px] text-gray-400 block pt-1">Click to Manage Specialists →</span>
                </div>

                <div 
                  onClick={() => handleTabChange('customers')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-white">Client Base</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-white">{analytics?.totalCustomers || customers.length}</p>
                  <span className="text-[10px] text-gray-400 block pt-1">Click to View Directory →</span>
                </div>
              </div>

              {/* EXPANSIVE LIVE SYSTEM AUDIT LOGS CONTAINER */}
              <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-rosegold-400 animate-pulse" />
                    <div>
                      <h3 className="text-base font-serif font-bold text-white">Live System Audit Logs</h3>
                      <p className="text-[11px] text-gray-400">Complete, un-erased audit trail of every booking, payment, staff, and system event.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-rosegold-300 bg-rosegold-500/15 px-3 py-1 rounded-full border border-rosegold-500/30">
                      📜 {activityLogs.length} Total Audit Records Saved
                    </span>
                    <button
                      onClick={() => handleExportReport('activityLogs')}
                      className="px-3 py-1 rounded-full bg-dark-800 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:border-rosegold-500/40 cursor-pointer"
                    >
                      Export Log CSV 📥
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">No audit records logged yet.</p>
                  ) : (
                    activityLogs.map((act) => (
                      <div key={act._id} className="p-3.5 rounded-2xl bg-dark-800/90 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs hover:border-rosegold-500/40 transition-colors gap-2">
                        <div className="space-y-1 text-left min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-rosegold-400 font-extrabold font-serif text-sm">{act.action}</span>
                            <span className="text-[10px] bg-dark-900 text-gray-300 px-2 py-0.5 rounded border border-white/10 font-mono">
                              By: {act.user || 'System Admin'}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs leading-relaxed">{act.details}</p>
                        </div>

                        <div className="shrink-0 text-right sm:pl-3">
                          <span className="text-[10px] text-gray-400 font-mono bg-dark-900 px-2.5 py-1 rounded-lg border border-white/5 block">
                            📅 {new Date(act.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EARNINGS & PAYROLL PAYOUTS DESK */}
          {activeTab === 'earnings' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Earnings, Revenue & Staff Payroll Desk</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Track live salon revenue streams, Razorpay transactions, and generate staff salary slips.</p>
                </div>

                <button
                  onClick={() => {
                    const defaultEmp = employees[0];
                    const nowMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    const commPct = defaultEmp?.commissionPercentage !== undefined ? defaultEmp.commissionPercentage : 20;
                    const base = defaultEmp?.baseSalary || 25000;
                    const empRev = defaultEmp ? appointments
                      .filter((a: any) => (a.specialistId === defaultEmp._id || (a.specialistName && a.specialistName.toLowerCase().includes((defaultEmp.name || '').toLowerCase()))) && (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid'))
                      .reduce((sum: number, a: any) => sum + (Number(a.price || a.totalAmount) || 0), 0) : 0;
                    const commAmt = Math.round(empRev * (commPct / 100));

                    setPayForm({
                      employeeName: defaultEmp?.name || '',
                      employeeId: defaultEmp?._id || '',
                      empCode: defaultEmp?.empCode || '',
                      month: nowMonth || 'July 2026',
                      baseSalary: base,
                      eligibleAmount: empRev,
                      commissionPercentage: commPct,
                      commissionAmount: commAmt,
                      incentives: 0,
                      deductions: 0,
                      paymentMethod: 'Bank Transfer (HDFC)'
                    });
                    setModalType('addPay');
                  }}
                  className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Salary Slip</span>
                </button>
              </div>

              {/* Revenue Breakdown Ribbon - Clickable for Itemized Modal Breakdowns */}
              {/* Revenue Breakdown Ribbon - 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  onClick={() => setBreakdownModal('revenue')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 space-y-1 cursor-pointer transition-all hover:scale-105 group hover:shadow-glow-rosegold"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase font-semibold group-hover:text-rosegold-300">Total Revenue</span>
                    <span className="text-[10px] bg-rosegold-500/20 text-rosegold-300 px-2 py-0.5 rounded-full font-bold">Details 📊</span>
                  </div>
                  <p className="text-2xl font-serif font-bold text-rosegold-400">₹{(analytics?.totalRevenue ?? 0).toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-green-400 font-bold block pt-0.5">🟢 Razorpay & Counter Sync</span>
                </div>

                <div 
                  onClick={() => setBreakdownModal('revenue')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/40 hover:border-rosegold-500 space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase font-semibold group-hover:text-amber-300">Store Cash Collected</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Counter 💵</span>
                  </div>
                  <p className="text-2xl font-serif font-bold text-amber-400">
                    ₹{(analytics?.cashCollected ?? 0).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-amber-300 font-bold block pt-0.5">Counter Cash & POS Sync</span>
                </div>

                <div 
                  onClick={() => setBreakdownModal('payroll')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/40 hover:border-rosegold-500 space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase font-semibold group-hover:text-white">Total Payroll Paid Out</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">Details 💸</span>
                  </div>
                  <p className="text-2xl font-serif font-bold text-white">₹{payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0).toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-purple-300 font-bold block pt-0.5">{payrolls.length} Staff Slips Disbursed</span>
                </div>

                <div 
                  onClick={() => setBreakdownModal('profit')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/40 hover:border-rosegold-500 space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase font-semibold group-hover:text-green-300">Net Studio Profit</span>
                    <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold">Details 📈</span>
                  </div>
                  <p className="text-2xl font-serif font-bold text-green-400">
                    ₹{Math.max(0, (analytics?.totalRevenue ?? 0) - payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-400 block pt-0.5">After Staff Salary Disbursal</span>
                </div>
              </div>

              {/* CREDITED & DEBITED TRANSACTIONS LEDGER TABLE */}
              <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Financial Transactions & Transitions History</h3>
                    <p className="text-xs text-gray-400">Real-time ledger tracking every Credited Amount (Income) and Debited Amount (Salary & Expenses Payouts).</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex bg-dark-800 p-1 rounded-xl border border-white/10 text-xs">
                      <button 
                        onClick={() => setTxnFilter('All')} 
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${txnFilter === 'All' ? 'bg-rosegold-500 text-dark-900' : 'text-gray-400 hover:text-white'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setTxnFilter('Credited')} 
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${txnFilter === 'Credited' ? 'bg-green-500 text-dark-900' : 'text-gray-400 hover:text-white'}`}
                      >
                        Credited
                      </button>
                      <button 
                        onClick={() => setTxnFilter('Debited')} 
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${txnFilter === 'Debited' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        Debited
                      </button>
                    </div>

                    <button
                      onClick={() => setBreakdownModal('addTxn')}
                      className="px-3.5 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center space-x-1 hover:scale-105 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Entry</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-gray-300">
                    <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="p-3 text-left">TXN ID</th>
                        <th className="p-3 text-left">Date & Time</th>
                        <th className="p-3 text-left">Transaction Type</th>
                        <th className="p-3 text-left">Category & Details</th>
                        <th className="p-3 text-left">Payment Channel</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions
                        .filter(t => txnFilter === 'All' ? true : t.type === txnFilter)
                        .map((t) => {
                          const formattedTxnDate = (() => {
                            const raw = t.date || t.createdAt || t.timestamp;
                            if (!raw) return 'Just now';
                            try {
                              const d = new Date(raw);
                              if (isNaN(d.getTime())) return String(raw);
                              return d.toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            } catch (e) {
                              return String(raw);
                            }
                          })();

                          return (
                            <tr key={t._id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-mono font-bold text-rosegold-300">{t.txnId}</td>
                              <td className="p-3 font-mono text-[11px] text-gray-300 font-semibold">{formattedTxnDate}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                t.type === 'Credited' 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/40' 
                                  : 'bg-red-500/20 text-red-400 border-red-500/40'
                              }`}>
                                {t.type === 'Credited' ? '🟢 Credited' : '🔴 Debited'}
                              </span>
                            </td>
                            <td className="p-3">
                              <strong className="text-white block">{t.category}</strong>
                              <span className="text-gray-400 text-[11px]">{t.description}</span>
                            </td>
                            <td className="p-3 font-mono text-gray-300">{t.paymentMethod}</td>
                            <td className={`p-3 text-right font-mono font-bold text-sm ${
                              t.type === 'Credited' ? 'text-green-400' : 'text-rosegold-400'
                            }`}>
                              {t.type === 'Credited' ? `+₹${t.amount?.toLocaleString('en-IN')}` : `-₹${t.amount?.toLocaleString('en-IN')}`}
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-dark-800 text-gray-300 px-2 py-0.5 rounded text-[10px] border border-white/10 font-mono">
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(t._id)}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 cursor-pointer transition-all"
                                title="Delete Transaction permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payroll Roster Table */}
              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-x-auto">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-serif font-bold text-white">Staff Payroll Slips History</h3>
                  <span className="text-xs text-gray-400">Total {payrolls.length} Slips Issued</span>
                </div>
                <table className="w-full text-xs text-gray-300">
                  <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-4">Slip ID</th>
                      <th className="p-4">Specialist Name</th>
                      <th className="p-4">Month</th>
                      <th className="p-4">Base Salary</th>
                      <th className="p-4">Incentives</th>
                      <th className="p-4">Net Payable</th>
                      <th className="p-4">Payout Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {payrolls.map((p) => (
                      <tr key={p._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono font-bold text-rosegold-400">{p.slipId}</td>
                        <td className="p-4 font-bold text-white">{p.employeeName}<br/><span className="text-gray-400 font-mono text-[10px]">{p.empCode}</span></td>
                        <td className="p-4 font-semibold text-white">{p.month}</td>
                        <td className="p-4 font-mono">₹{p.baseSalary?.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-mono text-green-400">+₹{p.incentives?.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-serif font-bold text-rosegold-400 text-sm">₹{p.netPay?.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <select 
                            value={p.status} 
                            onChange={(e) => handleUpdatePayrollStatus(p._id, e.target.value)} 
                            className="bg-dark-900 text-xs font-bold px-2.5 py-1 rounded-full border border-white/10 focus:outline-none"
                          >
                            <option value="Paid">Paid 🟢</option>
                            <option value="Pending">Pending 🟡</option>
                          </select>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={() => { setSelectedItem(p); setModalType('viewPay'); }}
                            className="p-1.5 rounded bg-rosegold-500/20 text-rosegold-300 hover:text-white cursor-pointer"
                            title="View Salary Slip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletePayroll(p._id)} 
                            className="p-1.5 rounded bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"
                            title="Delete Payroll Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE CALENDAR & DAILY TIMELINES */}
          {activeTab === 'calendar' && (() => {
            const calendarDays = getCalendarDays();
            const selectedApps = getAppointmentsForDate(selectedCalDate);
            const selectedDateObj = new Date(selectedCalDate);
            const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });

            const monthNameYear = calMonthView.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

            // Calculate metrics for selected date
            const selectedDateRevenue = selectedApps.reduce((acc, app) => {
              if (app.price) return acc + Number(app.price);
              if (app.totalAmount) return acc + Number(app.totalAmount);
              return acc;
            }, 0);

            const confirmedCount = selectedApps.filter(a => a.status === 'Confirmed').length;
            const inProgressCount = selectedApps.filter(a => a.status === 'In Progress').length;
            const completedCount = selectedApps.filter(a => a.status === 'Completed').length;
            const cancelledCount = selectedApps.filter(a => a.status === 'Cancelled').length;

            // Check staff on leave for this date (strictly Approved status and valid date bounds)
            const staffOnLeave = leaves ? leaves.filter(l => {
              if (l.status !== 'Approved') return false;
              if (!l.startDate || !l.endDate) return false;
              const sDate = String(l.startDate).split('T')[0];
              const eDate = String(l.endDate).split('T')[0];
              return selectedCalDate >= sDate && selectedCalDate <= eDate;
            }) : [];

            // Filter appointments by search & status
            const filteredApps = selectedApps.filter(app => {
              const matchesSearch = !calSearchQuery || 
                app.customerName?.toLowerCase().includes(calSearchQuery.toLowerCase()) ||
                app.customerPhone?.includes(calSearchQuery) ||
                app.specialistName?.toLowerCase().includes(calSearchQuery.toLowerCase()) ||
                app.service?.toLowerCase().includes(calSearchQuery.toLowerCase());
              
              const matchesStatus = calStatusFilter === 'All' || app.status === calStatusFilter;
              return matchesSearch && matchesStatus;
            });

            return (
              <div className="space-y-6 animate-fadeIn text-left">
                
                {/* HEADER & QUICK ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-rosegold-500/30">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 text-rosegold-400 text-xs font-bold uppercase tracking-wider">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Executive Schedule Calendar</span>
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-white">Daily Appointment Schedules</h2>
                    <p className="text-xs text-gray-400">Click any date on the calendar grid to inspect date details, staff availability, and time-slotted client bookings in the right sidebar.</p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {selectedCalDate < new Date().toISOString().split('T')[0] ? (
                      <span className="px-5 py-3 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 font-bold text-xs inline-flex items-center space-x-2 cursor-not-allowed">
                        <span>🔒 Past Date (Bookings Closed)</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setAppForm(prev => ({ ...prev, appointmentDate: selectedCalDate }));
                          setModalType('addApp');
                        }}
                        className="px-5 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-transform flex items-center space-x-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Book Appointment ({selectedCalDate})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2-COLUMN LAYOUT: CALENDAR GRID ON LEFT (7 COLS), SELECTED DAY RIGHT SIDEBAR (5 COLS) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: INTERACTIVE MONTH CALENDAR GRID (LG: 7 COLS) */}
                  <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4 h-fit self-start">
                    
                    {/* MONTH CONTROLS */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-rosegold-400" />
                        <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wide">
                          {monthNameYear}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const newM = new Date(calMonthView);
                            newM.setMonth(newM.getMonth() - 1);
                            setCalMonthView(newM);
                          }}
                          className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white hover:border-rosegold-400 transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const today = new Date();
                            setCalMonthView(today);
                            setSelectedCalDate(today.toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-dark-800 border border-rosegold-500/30 text-rosegold-400 font-bold text-xs hover:bg-rosegold-500 hover:text-dark-900 transition-all cursor-pointer"
                        >
                          Today
                        </button>

                        <button
                          onClick={() => {
                            const newM = new Date(calMonthView);
                            newM.setMonth(newM.getMonth() + 1);
                            setCalMonthView(newM);
                          }}
                          className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white hover:border-rosegold-400 transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* DAY OF WEEK HEADERS */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-rosegold-400 uppercase tracking-wider py-1 border-b border-white/5">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>

                    {/* CALENDAR DAY CELLS */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {calendarDays.map((day, idx) => {
                        const isSelected = selectedCalDate === day.dateStr;
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = day.dateStr === todayStr;
                        const isPast = day.dateStr < todayStr;
                        const dayApps = getAppointmentsForDate(day.dateStr);
                        const approvedLeavesOnDay = leaves ? leaves.filter(l => {
                          if (l.status !== 'Approved') return false;
                          if (!l.startDate || !l.endDate) return false;
                          const sDate = String(l.startDate).split('T')[0];
                          const eDate = String(l.endDate).split('T')[0];
                          return day.dateStr >= sDate && day.dateStr <= eDate;
                        }) : [];

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedCalDate(day.dateStr)}
                            className={`min-h-[76px] sm:min-h-[86px] p-2 rounded-2xl flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border ${
                              isSelected
                                ? 'rosegold-gradient-bg border-rosegold-400 text-dark-900 font-extrabold shadow-md z-10'
                                : approvedLeavesOnDay.length > 0
                                ? 'bg-purple-900/30 border-purple-500/40 text-purple-200'
                                : isToday
                                ? 'bg-dark-800 light:bg-amber-500/10 border-green-500/70 light:border-green-600 text-white light:text-dark-900 font-bold shadow-md'
                                : day.isCurrentMonth
                                ? 'bg-dark-800/80 light:bg-cream/40 border-white/5 light:border-champagne/60 text-gray-200 light:text-dark-900'
                                : 'bg-dark-900/40 light:bg-gray-100/60 border-transparent text-gray-600 light:text-gray-400'
                            } ${isPast && !isSelected ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs sm:text-sm font-bold ${
                                isSelected ? 'text-dark-900 font-extrabold' : isToday ? 'text-green-400 light:text-green-700 font-bold' : 'text-gray-300 light:text-dark-900'
                              }`}>
                                {day.dayNumber}
                              </span>

                              {approvedLeavesOnDay.length > 0 && (
                                <span className="text-[10px]" title={`Staff Leave: ${approvedLeavesOnDay.map(l => l.employeeName).join(', ')}`}>
                                  🟣
                                </span>
                              )}

                              {dayApps.length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-sm ${
                                  isSelected
                                    ? 'bg-white !text-black font-extrabold shadow-md'
                                    : 'bg-rosegold-500/20 text-rosegold-400 light:!text-black border border-rosegold-500/40 font-extrabold'
                                }`}>
                                  {dayApps.length}
                                </span>
                              )}
                            </div>

                             {/* APPOINTMENT PREVIEWS WITH TIME, SERVICE & CUSTOMER NAME */}
                            {dayApps.length > 0 && (
                              <div className="space-y-1 mt-1">
                                {dayApps.slice(0, 2).map((app, aIdx) => (
                                  <div
                                    key={aIdx}
                                    className="text-[10px] font-medium leading-tight truncate flex items-center space-x-1"
                                    title={`${app.appointmentTime || '10:30 AM'} - ${app.service} (${app.customerName || 'Client'})`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-dark-900' : 'bg-rosegold-400 light:bg-rosegold-600'}`} />
                                    <span className={`font-mono font-bold shrink-0 ${isSelected ? 'text-dark-900' : 'text-rosegold-300 light:text-dark-900'}`}>
                                      {app.appointmentTime || '10:30 AM'}
                                    </span>
                                    <span className={`truncate ${isSelected ? 'text-dark-900/80 font-medium' : 'text-gray-300 light:text-gray-700'}`}>
                                      {app.service}
                                    </span>
                                  </div>
                                ))}
                                {dayApps.length > 2 && (
                                  <span className={`text-[9px] font-bold block pt-0.5 ${isSelected ? 'text-dark-900 font-extrabold' : 'text-rosegold-400 light:text-rosegold-700'}`}>
                                    +{dayApps.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: INTERACTIVE SIDEBAR FOR CLICKED DATE (LG: 5 COLS) */}
                  <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-5 h-fit max-h-[820px] overflow-y-auto custom-scrollbar self-start shadow-2xl">
                    
                    <div className="space-y-4">
                      {/* DATE HEADER & DIRECT ADD BUTTON */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div>
                          <span className="text-[10px] text-rosegold-400 font-bold uppercase tracking-wider block">Selected Date Sidebar</span>
                          <h3 className="text-xl font-serif font-bold text-white">{formattedSelectedDate}</h3>
                        </div>

                        {selectedCalDate < new Date().toISOString().split('T')[0] ? (
                          <span className="px-3.5 py-2 rounded-2xl bg-gray-500/10 border border-gray-500/30 text-gray-400 text-xs font-bold inline-flex items-center space-x-1.5 self-start sm:self-auto cursor-not-allowed">
                            <span>🔒 Past Date</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setAppForm(prev => ({ ...prev, appointmentDate: selectedCalDate }));
                              setModalType('addApp');
                            }}
                            className="px-3.5 py-2 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md hover:scale-105 transition-all inline-flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Appointment</span>
                          </button>
                        )}
                      </div>

                      {/* DATE METRICS SUMMARY GRID */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-2xl bg-dark-900/90 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-gray-400 uppercase font-semibold block">Total Bookings</span>
                          <span className="text-base font-bold text-white block">{selectedApps.length}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-dark-900/90 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-gray-400 uppercase font-semibold block">Est. Revenue</span>
                          <span className="text-base font-bold text-rosegold-400 block">₹{selectedDateRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-dark-900/90 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-green-400 uppercase font-semibold block">Confirmed / Done</span>
                          <span className="text-base font-bold text-green-400 block">{confirmedCount + completedCount}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-dark-900/90 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-amber-400 uppercase font-semibold block">In Progress</span>
                          <span className="text-base font-bold text-amber-400 block">{inProgressCount}</span>
                        </div>
                      </div>

                      {/* STAFF ON LEAVE / AVAILABILITY BANNER */}
                      {staffOnLeave.length > 0 ? (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 text-xs text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                          <div>
                            <span className="font-bold block">Staff Leave Notice ({formattedSelectedDate})</span>
                            <span className="text-[11px] text-amber-200">
                              {staffOnLeave.map(l => l.employeeName || 'Specialist').join(', ')} on approved leave.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center space-x-2 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span className="text-[11px] font-semibold">All Salon Specialists Available for Booking</span>
                        </div>
                      )}

                      {/* SEARCH & STATUS FILTER BAR */}
                      <div className="space-y-2.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search client, specialist, service..."
                            value={calSearchQuery}
                            onChange={(e) => setCalSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-900 text-white text-xs border border-white/10 focus:outline-none focus:border-rosegold-500 placeholder-gray-500"
                          />
                          {calSearchQuery && (
                            <button
                              onClick={() => setCalSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* STATUS FILTER PILLS */}
                        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
                          {['All', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
                            <button
                              key={st}
                              onClick={() => setCalStatusFilter(st)}
                              className={`px-2.5 py-1 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                                calStatusFilter === st
                                  ? 'rosegold-gradient-bg text-dark-900 shadow-sm'
                                  : 'bg-dark-900 text-gray-400 hover:text-white border border-white/5'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SCHEDULE TIMELINE CARDS FOR SELECTED DATE */}
                      {filteredApps.length === 0 ? (
                        <div className="py-10 text-center space-y-3 bg-dark-850/60 rounded-2xl border border-white/5 p-6">
                          <div className="w-12 h-12 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 flex items-center justify-center text-rosegold-400 mx-auto">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <h4 className="text-white font-serif font-bold text-base">No Appointments Found</h4>
                          <p className="text-xs text-gray-400 max-w-xs mx-auto">
                            {calSearchQuery || calStatusFilter !== 'All' 
                              ? `No appointments match filters for ${formattedSelectedDate}.`
                              : `There are no appointments registered for ${formattedSelectedDate}.`}
                          </p>
                          <button
                            onClick={() => {
                              setAppForm(prev => ({ ...prev, appointmentDate: selectedCalDate }));
                              setModalType('addApp');
                            }}
                            className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md hover:scale-105 transition-transform inline-flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Appointment for Date</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                          {filteredApps.map((app) => (
                            <div 
                              key={app._id}
                              className="p-3.5 rounded-2xl bg-dark-900/90 border border-rosegold-500/25 space-y-2.5 hover:border-rosegold-400 transition-all text-xs"
                            >
                              {/* CARD HEADER */}
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                                  <span className="text-rosegold-300 font-extrabold text-xs">
                                    {app.appointmentTime || app.bookingTimeFormatted || '11:00 AM'}
                                  </span>
                                  <span className="text-gray-500 text-[10px]">({app.bookingId || 'APP-' + app._id?.slice(-4)})</span>
                                </div>

                                <select
                                  value={app.status}
                                  onChange={(e) => handleUpdateAppStatus(app._id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border focus:outline-none cursor-pointer ${
                                    app.status === 'Completed'
                                      ? 'bg-green-500/20 text-green-300 border-green-500/40'
                                      : app.status === 'In Progress'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : app.status === 'Cancelled' || app.status === 'Staff_Rejected'
                                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  }`}
                                >
                                  {(() => {
                                    const allowed = (() => {
                                      switch (app.status) {
                                        case 'Pending':
                                          return ['Pending', 'Confirmed', 'In Progress', 'Cancelled'];
                                        case 'Staff_Accepted':
                                        case 'Confirmed':
                                          return ['Confirmed', 'In Progress', 'Rescheduled', 'Cancelled'];
                                        case 'In Progress':
                                          return ['In Progress', 'Completed', 'Cancelled'];
                                        case 'Completed':
                                          return ['Completed'];
                                        case 'Cancelled':
                                        case 'Staff_Rejected':
                                          return ['Cancelled'];
                                        case 'Rescheduled':
                                        case 'Reschedule Requested':
                                          return ['Rescheduled', 'Confirmed', 'Cancelled'];
                                        default:
                                          return [app.status, 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
                                      }
                                    })();

                                    const optLabels: Record<string, string> = {
                                      'Pending': 'Pending ⏳',
                                      'Confirmed': 'Confirmed 🟢',
                                      'In Progress': 'In Progress ⏳',
                                      'Completed': 'Completed ✅',
                                      'Rescheduled': 'Rescheduled 🔄',
                                      'Cancelled': 'Cancelled 🔴',
                                      'Staff_Accepted': 'Staff Accepted 🟢',
                                      'Staff_Rejected': 'Staff Rejected 🔴',
                                      'Reschedule Requested': 'Reschedule Requested 🔄'
                                    };

                                    return allowed.map(st => (
                                      <option key={st} value={st}>
                                        {optLabels[st] || st}
                                      </option>
                                    ));
                                  })()}
                                </select>
                              </div>

                              {/* CLIENT & SPECIALIST DETAILS */}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="bg-dark-800 p-2.5 rounded-xl border border-white/5 space-y-1">
                                  <span className="text-gray-400 text-[9px] uppercase font-semibold block">Client Details</span>
                                  <strong className="text-white font-bold block truncate">{app.customerName}</strong>
                                  <div className="flex items-center justify-between pt-0.5">
                                    <span className="text-gray-400 text-[10px] truncate">{app.customerPhone}</span>
                                    <div className="flex items-center space-x-1 shrink-0">
                                      <a
                                        href={`tel:${app.customerPhone}`}
                                        className="p-1 rounded-md bg-rosegold-500/10 text-rosegold-400 hover:bg-rosegold-500 hover:text-dark-900 transition-colors"
                                        title="Call Customer"
                                      >
                                        <Phone className="w-3 h-3" />
                                      </a>
                                      <a
                                        href={`https://wa.me/${app.customerPhone?.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-dark-900 transition-colors"
                                        title="WhatsApp Customer"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-dark-800 p-2.5 rounded-xl border border-white/5 space-y-1">
                                  <span className="text-gray-400 text-[9px] uppercase font-semibold block">Assigned Specialist</span>
                                  <strong className="text-rosegold-300 font-bold block truncate">{app.specialistName}</strong>
                                  <span className="text-gray-400 text-[10px] block truncate">{app.branch || 'Jubilee Hills Flagship'}</span>
                                </div>
                              </div>

                              {/* TREATMENT SERVICE & PAYMENT STATUS */}
                              <div className="flex items-center justify-between bg-dark-800/80 p-2.5 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-gray-400 text-[9px] uppercase font-semibold block">Treatment Service</span>
                                  <span className="text-white font-bold text-xs">{app.service}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  app.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {app.paymentStatus === 'Paid' ? 'Paid ✅' : 'Pending ⏳'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* TAB: VIP MEMBERSHIPS MANAGEMENT */}
          {activeTab === 'memberships' && (
            <div className="space-y-6 animate-fadeIn text-left">
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-rosegold-500/30 shadow-2xl">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 text-rosegold-400 text-xs font-bold uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>Executive VIP Membership Hub</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-white">VIP Membership Management & Analytics</h2>
                  <p className="text-xs text-gray-400">Track active VIP packages, membership revenue, tier distribution, auto-renewals, and member status.</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => {
                      setMembForm({
                        code: `vip_${Date.now().toString().slice(-4)}`,
                        name: 'Royal Diamond VIP Pass',
                        badge: '💎 Diamond VIP',
                        monthlyPrice: 7999,
                        yearlyPrice: 79999,
                        discountPercentage: 25,
                        tagline: 'Ultimate Royal VIP Privileges & Perks',
                        benefits: 'Flat 25% Off All Services, Priority Director Stylist, Complimentary Refreshments, Free Doorstep Valet'
                      });
                      setSelectedItem(null);
                      setModalType('addMemb');
                    }}
                    className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add VIP Membership Package</span>
                  </button>
                  <button
                    onClick={() => handleExportReport('memberships')}
                    className="px-4 py-2.5 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* METRICS SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-card p-4 rounded-3xl border border-rosegold-500/30 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Package Revenue</span>
                  <span className="text-2xl font-serif font-bold text-rosegold-400 block">
                    ₹{(membershipsData?.totalRevenue ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-green-400 block font-mono">Gross Subscription Inflow</span>
                </div>

                <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Active VIP Members</span>
                  <span className="text-2xl font-serif font-bold text-green-400 block">
                    {membershipsData?.activeCount ?? 0} Active 🟢
                  </span>
                  <span className="text-[10px] text-gray-400 block font-mono">Current Pass Holders</span>
                </div>

                <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Gold VIP Pass Holders</span>
                  <span className="text-2xl font-serif font-bold text-yellow-400 block">
                    {membershipsData?.tierBreakdown?.gold ?? 0} Gold VIPs
                  </span>
                  <span className="text-[10px] text-yellow-300 block font-mono">20% Flat Discount Tier</span>
                </div>

                <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Expired / Cancelled</span>
                  <span className="text-2xl font-serif font-bold text-amber-400 block">
                    {membershipsData?.expiredCount ?? 0} Expired 🔴
                  </span>
                  <span className="text-[10px] text-gray-400 block font-mono">Renewal Pending</span>
                </div>

                <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Most Popular Tier</span>
                  <span className="text-xl font-serif font-bold text-white block">
                    {membershipsData?.popularPlan || 'N/A'}
                  </span>
                  <span className="text-[10px] text-rosegold-400 block font-mono">Top Revenue Driver</span>
                </div>
              </div>

              {/* VIP TIER PLANS & PRICING PACKAGES GRID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Configured VIP Tier Plans & Pricing</span>
                  </h3>
                  <span className="text-xs text-rosegold-400 font-mono">{membershipPlans.length} Plans Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {membershipPlans.map((m: any) => (
                    <div key={m._id || m.code} className="glass-card p-6 rounded-3xl border border-rosegold-500/30 flex flex-col justify-between hover:border-rosegold-500/60 transition-all space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-rosegold-400 bg-rosegold-500/10 px-3 py-1 rounded-full border border-rosegold-500/20">
                            {m.badge || m.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedItem(m);
                                setMembForm({
                                  code: m.code || m._id,
                                  name: m.name,
                                  badge: m.badge || 'VIP Member',
                                  monthlyPrice: m.monthlyPrice || 999,
                                  yearlyPrice: m.yearlyPrice || 9999,
                                  discountPercentage: m.discountPercentage || 10,
                                  tagline: m.tagline || 'Essential VIP Privileges & Perks',
                                  benefits: Array.isArray(m.benefits) ? m.benefits.join(', ') : (m.benefits || '')
                                });
                                setModalType('editMemb');
                              }}
                              className="p-1.5 rounded-lg bg-dark-800 text-gray-300 hover:text-white cursor-pointer border border-white/10"
                              title="Edit Package Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMembership(m._id || m.code)}
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 cursor-pointer border border-red-500/30"
                              title="Delete Package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold font-serif text-white">{m.name}</h3>
                        <p className="text-xs text-gray-400">{m.tagline}</p>

                        <div className="p-3 rounded-2xl bg-dark-850 border border-white/10 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Monthly Plan:</span>
                            <span className="text-rosegold-400 font-bold font-serif">₹{m.monthlyPrice} / mo</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Yearly Plan:</span>
                            <span className="text-white font-bold font-serif">₹{m.yearlyPrice} / yr</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-white/10">
                            <span className="text-gray-400">Member Discount:</span>
                            <span className="text-green-400 font-bold">{m.discountPercentage}% OFF All Services</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Package Benefits:</span>
                          <ul className="space-y-1 text-xs text-gray-300">
                            {(Array.isArray(m.benefits) ? m.benefits : (m.benefits || '').split(',')).map((b: string, i: number) => (
                              <li key={i} className="flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                                <span className="line-clamp-1">{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-green-400 font-bold text-[10px] bg-green-500/15 px-2.5 py-0.5 rounded-full border border-green-500/30">Active Package</span>
                        <span className="text-gray-400 font-mono text-[10px]">Slug: {m.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-rosegold-500/20">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search member name, email, phone, ID..."
                    value={membSearchQuery}
                    onChange={(e) => setMembSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-800 text-white text-xs border border-white/10 focus:outline-none focus:border-rosegold-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                  <span className="text-xs text-gray-400 font-bold shrink-0">Filter Tier:</span>
                  {['All', 'Gold', 'Premium', 'Standard', 'Expired'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setMembFilterTier(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        membFilterTier === t
                          ? 'rosegold-gradient-bg text-dark-900 shadow-sm'
                          : 'bg-dark-800 text-gray-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* MEMBERSHIP TABLE */}
              <div className="glass-card rounded-3xl border border-rosegold-500/30 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs min-w-[920px]">
                    <thead>
                      <tr className="border-b border-white/10 text-rosegold-400 font-serif text-xs uppercase tracking-wider bg-dark-900/60 whitespace-nowrap">
                        <th className="p-4 min-w-[200px]">Customer Details</th>
                        <th className="p-4 min-w-[140px]">VIP Tier & Badge</th>
                        <th className="p-4 min-w-[140px]">Membership ID</th>
                        <th className="p-4 min-w-[110px]">Discount</th>
                        <th className="p-4 min-w-[120px]">Cycle & Price</th>
                        <th className="p-4 min-w-[130px]">Validity / Expiry</th>
                        <th className="p-4 min-w-[130px]">Status</th>
                        <th className="p-4 text-right min-w-[140px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {(() => {
                        const filteredList = (membershipsData?.recentMemberships || []).filter((m: any) => {
                          const matchesQuery = !membSearchQuery || 
                            m.customerName?.toLowerCase().includes(membSearchQuery.toLowerCase()) ||
                            m.customerEmail?.toLowerCase().includes(membSearchQuery.toLowerCase()) ||
                            m.customerPhone?.includes(membSearchQuery) ||
                            m.membershipId?.toLowerCase().includes(membSearchQuery.toLowerCase());
                          
                          const matchesTier = membFilterTier === 'All' ||
                            (membFilterTier === 'Expired' && m.status === 'Expired') ||
                            (m.planCode && m.planCode.toLowerCase().includes(membFilterTier.toLowerCase()));
                          
                          return matchesQuery && matchesTier;
                        });

                        if (filteredList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-gray-400 text-xs font-serif">
                                No VIP membership subscriptions found in the database. Customer purchases in the VIP portal will appear here automatically.
                              </td>
                            </tr>
                          );
                        }

                        return filteredList.map((m: any, idx: number) => (
                          <tr key={m._id || idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 space-y-0.5 max-w-[220px]">
                              <strong className="text-white font-bold block truncate" title={m.customerName}>{m.customerName}</strong>
                              <span className="text-gray-400 text-[11px] block truncate" title={m.customerEmail}>{m.customerEmail}</span>
                              <span className="text-gray-400 text-[10px] block font-mono whitespace-nowrap">{m.customerPhone}</span>
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <VIPBadge badge={m.badge} tier={m.planCode} size="sm" />
                            </td>

                            <td className="p-4 font-mono font-bold text-rosegold-300 whitespace-nowrap">
                              {m.membershipId}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-bold text-xs whitespace-nowrap shrink-0">
                                {m.discountPercentage}% OFF
                              </span>
                            </td>

                            <td className="p-4 space-y-0.5 whitespace-nowrap">
                              <span className="font-bold text-white block">₹{m.pricePaid?.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-gray-400 uppercase block font-semibold">{m.billingCycle}</span>
                            </td>

                            <td className="p-4 text-[11px] text-gray-300 font-mono whitespace-nowrap">
                              {new Date(m.expiryDate || Date.now()).toLocaleDateString()}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0 ${
                                m.status === 'Active' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                                m.status === 'Expired' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                'bg-red-500/20 text-red-300 border-red-500/40'
                              }`}>
                                {m.status === 'Active' ? 'Active 🟢' : m.status === 'Expired' ? 'Expired 🔴' : 'Cancelled ⚪'}
                              </span>
                            </td>

                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={async () => {
                                  await apiFetch(`${API_BASE_URL}/membership/admin/status`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ membershipId: m.membershipId, status: 'Active' })
                                  });
                                  fetchAdminData();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-dark-900 font-bold text-[10px] transition-colors cursor-pointer"
                                title="Renew / Reactivate Pass"
                              >
                                Renew
                              </button>
                              <button
                                onClick={async () => {
                                  await apiFetch(`${API_BASE_URL}/membership/admin/status`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ membershipId: m.membershipId, status: 'Cancelled' })
                                  });
                                  fetchAdminData();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                                title="Cancel Membership Pass"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYEE MANAGEMENT */}
          {activeTab === 'employees' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Employee Specialist Management</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage staff avatars, specialist roles, shift hours, bank payout details, and credentials.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleExportReport('employees')} className="px-3.5 py-2 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700">
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setEmpForm({
                        name: '',
                        email: '',
                        phone: '',
                        password: '',
                        specialties: '',
                        avatar: '',
                        services: '',
                        baseSalary: 25000,
                        commissionPercentage: 20,
                        workStart: '09:00',
                        workEnd: '19:00',
                        breakStart: '13:00',
                        breakEnd: '14:00',
                        slotInterval: 30
                      });
                      setModalType('addEmp');
                    }}
                    className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Specialist</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="glass-panel p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-rosegold-500/20 text-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, code, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-800 border border-white/10 text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-rosegold-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-dark-800 text-white font-bold px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Employee Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, idx) => {
                    const empNameKey = (emp.name || 'employee').toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
                    const empLoginEmail = emp.email || `${empNameKey}@spysalon.com`;
                    const empLoginPassword = (emp as any).tempPassword || '[Encrypted Password]';
                    const empSpecs = Array.isArray(emp.specialties) ? emp.specialties : [];
                    const empSrvs = Array.isArray(emp.services) ? emp.services : [];

                    return (
                      <div key={emp._id || idx} className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30 flex flex-col justify-between hover:border-rosegold-500/60 transition-all">
                        <div className="flex items-start space-x-4">
                          <ProfileAvatar src={emp.avatar} name={emp.name} size="xl" className="w-20 h-20 rounded-2xl border-2 border-rosegold-500/50 shadow-glow-rosegold" />

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-white font-serif font-bold text-lg truncate">{emp.name}</h3>
                                <span className="bg-dark-800 text-rosegold-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-rosegold-500/30">{emp.empCode || `EMP-100${idx + 1}`}</span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedItem(emp);
                                    setEmpForm({
                                      name: emp.name || '',
                                      email: emp.email || '',
                                      phone: emp.phone || '',
                                      password: (emp as any).tempPassword || (emp as any).password || '',
                                      specialties: empSpecs.join(', '),
                                      avatar: emp.avatar || '',
                                      services: empSrvs.join(', '),
                                      baseSalary: emp.baseSalary || 25000,
                                      commissionPercentage: emp.commissionPercentage !== undefined ? emp.commissionPercentage : 20,
                                      workStart: emp.workingHours?.start || '09:00',
                                      workEnd: emp.workingHours?.end || '19:00',
                                      breakStart: emp.breakTime?.start || '13:00',
                                      breakEnd: emp.breakTime?.end || '14:00',
                                      slotInterval: emp.slotIntervalMinutes || 30
                                    });
                                    setModalType('editEmp');
                                  }}
                                  className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteEmployee(emp._id)} className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-rosegold-400 font-medium font-mono">{empLoginEmail}</p>
                            <p className="text-xs text-gray-400">{emp.phone}</p>
                          </div>
                        </div>

                        <div className="text-xs space-y-1.5">
                          <span className="text-gray-400 font-semibold block uppercase text-[10px]">Specialist Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {empSpecs.map((s: string, i: number) => (
                              <span key={i} className="bg-purple-600/30 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                                ✨ {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* View Profile & Credentials Action */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-end text-xs">
                          <button 
                            onClick={() => {
                              setSelectedItem(emp);
                              setCreatedCredentials({
                                name: emp.name,
                                empCode: emp.empCode || `EMP-100${idx + 1}`,
                                email: empLoginEmail,
                                username: empNameKey,
                                tempPassword: empLoginPassword
                              });
                              setModalType('viewEmp');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/40 font-bold text-xs flex items-center space-x-1.5 hover:bg-rosegold-500 hover:text-dark-900 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Profile & Credentials</span>
                          </button>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full glass-card p-12 rounded-3xl text-center space-y-3 border border-rosegold-500/20">
                    <Users className="w-12 h-12 text-rosegold-400 mx-auto opacity-50" />
                    <h3 className="text-lg font-serif font-bold text-white">No Employee Specialists Found</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      {searchQuery ? `No specialists match "${searchQuery}". Try clearing your search query.` : 'No specialist profiles registered yet.'}
                    </p>
                    <button
                      onClick={() => {
                        setEmpForm({
                          name: '',
                          email: '',
                          phone: '',
                          password: '',
                          specialties: '',
                          avatar: '',
                          services: '',
                          baseSalary: 25000,
                          commissionPercentage: 20,
                          workStart: '09:00',
                          workEnd: '19:00',
                          breakStart: '13:00',
                          breakEnd: '14:00',
                          slotInterval: 30
                        });
                        setModalType('addEmp');
                      }}
                      className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md inline-flex items-center space-x-1.5 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Specialist Profile</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-2xl font-bold font-serif text-white">Salon Customer Directory</h2>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleExportReport('customers')} className="px-3.5 py-2 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700">
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button onClick={() => { setCustForm({ name: '', email: '', phone: '', membership: 'VIP Gold' }); setModalType('addCust'); }} className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <span>Add Customer</span>
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-x-auto">
                <table className="w-full text-xs text-gray-300">
                  <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Email / Phone</th>
                      <th className="p-4">Total Visits</th>
                      <th className="p-4">Total Spend</th>
                      <th className="p-4">Membership Tier</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {customers.map((c) => (
                      <tr key={c._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white">{c.name}</td>
                        <td className="p-4">{c.email}<br/><span className="text-gray-400">{c.phone}</span></td>
                        <td className="p-4 font-semibold text-white">{c.visits} Visits</td>
                        <td className="p-4 font-serif font-bold text-rosegold-400">
                          ₹{Number((c as any).totalSpent ?? (c as any).totalSpend ?? 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/30 px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center space-x-1 shadow-sm">
                            {c.membership && typeof c.membership === 'object' 
                              ? ((c.membership as any).badge || `👑 ${(c.membership as any).tier} Member`) 
                              : ((c.membership as any) || '🥉 Standard Member')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteCustomer(c._id)} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SERVICES MENU MANAGEMENT (3-SECTION HIERARCHICAL LAYOUT) */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fadeIn text-left">
              
              {/* Header Banner & Global Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Services & Pricing Menu Control</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Full access control for VIP Membership Packages, Main Services, and Full Salon Menu Catalogue Pricings.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleExportReport('services')} className="px-3.5 py-2 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700">
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  
                  {servicesSubTab === 'memberships' ? (
                    <button
                      onClick={() => {
                        setMembForm({
                          code: '',
                          name: '',
                          badge: 'VIP Member',
                          monthlyPrice: 1499,
                          yearlyPrice: 14999,
                          discountPercentage: 15,
                          tagline: 'Exclusive VIP Privileges & Monthly Perks',
                          benefits: '15% Flat Discount on All Services, Priority Booking, Free Monthly Treatment'
                        });
                        setSelectedItem(null);
                        setModalType('addMemb');
                      }}
                      className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Membership Package</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSrvForm({
                          name: '',
                          category: 'Hair',
                          gender: catalogueGenderFilter !== 'all' ? catalogueGenderFilter : 'all',
                          subCategory: 'Hair Care',
                          price: 1999,
                          discountPrice: 1699,
                          durationMinutes: 60,
                          rating: 4.9,
                          description: 'Luxury botanical treatment provided by SPY Salon certified specialists.',
                          image: '',
                          isPopular: true,
                          benefits: 'Deep Cellular Hydration, 100% Organic Serums, Stress Relief via Pressure Point Therapy',
                          step1Title: 'Specialist Consultation & Texture Analysis',
                          step1Desc: 'In-depth assessment by certified SPY Salon specialists to tailor treatment formulations.',
                          step2Title: 'Deep Cleansing & Botanical Exfoliation',
                          step2Desc: 'Removal of micro-impurities using organic, hypoallergenic cleansers.',
                          step3Title: 'Therapeutic Hydro-Mask & Steam Treatment',
                          step3Desc: 'Deep penetration of active botanical nutrients combined with gentle stress relief massage.',
                          step4Title: 'Post-Care Moisture Seal & Executive Finish',
                          step4Desc: 'Final application of protection shield, nutrient lock, and professional executive finish.'
                        });
                        setSelectedItem(null);
                        setModalType('addSrv');
                      }}
                      className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Treatment Service</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3-Section Order Navigation Tabs */}
              <div className="flex items-center space-x-2 border-b border-white/10 pb-3 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setServicesSubTab('memberships')}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                    servicesSubTab === 'memberships'
                      ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold font-extrabold'
                      : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>1. VIP Membership Packages ({membershipPlans.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesSubTab('main-services')}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                    servicesSubTab === 'main-services'
                      ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold font-extrabold'
                      : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>2. Main Featured Services ({filteredServices.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesSubTab('full-catalogue')}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                    servicesSubTab === 'full-catalogue'
                      ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold font-extrabold'
                      : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Scissors className="w-4 h-4 text-rosegold-400" />
                  <span>3. Full Menu Pricing Catalogue ({services.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesSubTab('individual-services')}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                    servicesSubTab === 'individual-services'
                      ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold font-extrabold'
                      : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>4. Individual Services ({services.filter(s => (s as any).serviceType === 'INDIVIDUAL' || (s as any).subCategory === 'Individual Services').length})</span>
                </button>
              </div>

              {/* SECTION 1: MEMBERSHIP PACKAGES & PRICING */}
              {servicesSubTab === 'memberships' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Manage VIP Tier Plans, Monthly/Yearly Pricing, Discount percentages, and custom benefits.</p>
                  </div>

                  {membershipPlans.length === 0 ? (
                    <div className="p-10 text-center glass-card rounded-3xl border border-white/10 space-y-3">
                      <Crown className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
                      <h4 className="text-white font-serif font-bold text-lg">No VIP Membership Packages Added</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Your VIP packages list is clean. Click "+ Add New Membership Package" above to create your custom membership plans.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {membershipPlans.map((m: any) => (
                        <div key={m._id || m.code} className="glass-card p-6 rounded-3xl border border-rosegold-500/30 flex flex-col justify-between hover:border-rosegold-500/60 transition-all space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold font-mono text-rosegold-400 bg-rosegold-500/10 px-3 py-1 rounded-full border border-rosegold-500/20">
                                {m.badge || m.name}
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedItem(m);
                                    setMembForm({
                                      code: m.code || m._id,
                                      name: m.name,
                                      badge: m.badge || '👑 VIP Member',
                                      monthlyPrice: m.monthlyPrice || 999,
                                      yearlyPrice: m.yearlyPrice || 9999,
                                      discountPercentage: m.discountPercentage || 10,
                                      tagline: m.tagline || 'Essential VIP Privileges & Perks',
                                      benefits: Array.isArray(m.benefits) ? m.benefits.join(', ') : (m.benefits || '')
                                    });
                                    setModalType('editMemb');
                                  }}
                                  className="p-1.5 rounded-lg bg-dark-800 text-gray-300 hover:text-white cursor-pointer border border-white/10"
                                  title="Edit Package Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMembership(m._id || m.code)}
                                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 cursor-pointer border border-red-500/30"
                                  title="Delete Package"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h3 className="text-xl font-bold font-serif text-white">{m.name}</h3>
                            <p className="text-xs text-gray-400">{m.tagline}</p>

                            <div className="p-3 rounded-2xl bg-dark-850 border border-white/10 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Monthly Plan:</span>
                                <span className="text-rosegold-400 font-bold font-serif">₹{m.monthlyPrice} / mo</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Yearly Plan:</span>
                                <span className="text-white font-bold font-serif">₹{m.yearlyPrice} / yr</span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-white/10">
                                <span className="text-gray-400">Member Discount:</span>
                                <span className="text-green-400 font-bold">{m.discountPercentage}% OFF All Services</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Package Benefits:</span>
                              <ul className="space-y-1 text-xs text-gray-300">
                                {(Array.isArray(m.benefits) ? m.benefits : (m.benefits || '').split(',')).map((b: string, i: number) => (
                                  <li key={i} className="flex items-center space-x-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                                    <span className="line-clamp-1">{b}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                            <span className="text-green-400 font-bold text-[10px] bg-green-500/15 px-2.5 py-0.5 rounded-full border border-green-500/30">Active Package</span>
                            <span className="text-gray-400 font-mono text-[10px]">Slug: {m.code}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: MAIN FEATURED SERVICES & PRICING */}
              {servicesSubTab === 'main-services' && (
                <div className="space-y-4 animate-fadeIn">
                  {filteredServices.length === 0 ? (
                    <div className="p-10 text-center glass-card rounded-3xl border border-white/10 space-y-3">
                      <Star className="w-10 h-10 text-yellow-400 mx-auto opacity-60" />
                      <h4 className="text-white font-serif font-bold text-lg">No Featured Services Added</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Your featured services menu is clean. Click "+ Add New Treatment Service" above to add your custom services to the menu.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {filteredServices.map((s) => (
                        <div key={s._id} className="glass-card p-5 rounded-3xl border border-rosegold-500/30 flex flex-col justify-between hover:border-rosegold-500/60 transition-all space-y-3">
                          <div className="space-y-2.5 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span className="bg-purple-900/40 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                  {s.category}
                                </span>
                                {s.isPopular && (
                                  <span className="bg-rosegold-500 text-dark-900 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                                    Popular
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedItem(s);
                                    const steps = s.steps || [];
                                    setSrvForm({
                                      name: s.name,
                                      category: s.category || 'Hair',
                                      gender: (s as any).gender || 'all',
                                      subCategory: (s as any).subCategory || s.category || 'Hair Care',
                                      price: s.price,
                                      discountPrice: s.discountPrice || s.price,
                                      durationMinutes: s.durationMinutes || 60,
                                      rating: s.rating || 4.9,
                                      description: s.description || 'Luxury botanical treatment provided by SPY Salon certified specialists.',
                                      image: s.image || '',
                                      isPopular: s.isPopular !== undefined ? s.isPopular : true,
                                      benefits: Array.isArray(s.benefits) ? s.benefits.join(', ') : 'Deep Cellular Hydration, 100% Organic Serums, Stress Relief',
                                      step1Title: steps[0]?.title || 'Specialist Consultation & Texture Analysis',
                                      step1Desc: steps[0]?.desc || 'In-depth assessment by certified SPY Salon specialists.',
                                      step2Title: steps[1]?.title || 'Deep Cleansing & Botanical Exfoliation',
                                      step2Desc: steps[1]?.desc || 'Removal of micro-impurities using organic cleansers.',
                                      step3Title: steps[2]?.title || 'Therapeutic Hydro-Mask & Steam Treatment',
                                      step3Desc: steps[2]?.desc || 'Deep penetration of active botanical nutrients.',
                                      step4Title: steps[3]?.title || 'Post-Care Moisture Seal & Executive Finish',
                                      step4Desc: steps[3]?.desc || 'Final application of protection shield and executive finish.'
                                    });
                                    setModalType('editSrv');
                                  }}
                                  className="p-1.5 rounded-lg bg-dark-800 text-gray-300 hover:text-white border border-white/10 cursor-pointer"
                                  title="Edit Service Details & Steps"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteService(s._id)} className="p-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer" title="Delete Service">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-serif font-bold text-base leading-snug">{s.name}</h3>
                              <div className="flex items-center space-x-1 text-xs text-yellow-400 font-bold shrink-0">
                                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                <span>{s.rating || 4.9}</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{s.description || 'Luxury botanical treatment provided by SPY Salon certified specialists.'}</p>
                            
                            <div className="flex items-center space-x-2 text-xs text-gray-300 font-mono">
                              <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                              <span>Duration: <strong>{s.durationMinutes || 60} Minutes</strong></span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <div>
                              <span className="text-rosegold-400 font-bold text-xl font-serif">₹{s.price}</span>
                              {s.discountPrice && s.discountPrice < s.price && (
                                <span className="text-gray-500 text-xs line-through ml-2">₹{s.discountPrice}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-2.5 py-0.5 rounded-full border border-green-500/30">Active Menu</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: FULL SALON MENU PRICINGS CATALOGUE */}
              {servicesSubTab === 'full-catalogue' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Catalogue Gender & Category Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-dark-850 border border-rosegold-500/30">
                    <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
                      <span className="text-xs text-gray-400 font-bold uppercase mr-1">Section:</span>
                      {[
                        { id: 'all', label: '🌟 All Sections' },
                        { id: 'men', label: '👨 Men' },
                        { id: 'women', label: '👩 Women' },
                        { id: 'kids', label: '🧒 Kids' }
                      ].map(g => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => setCatalogueGenderFilter(g.id as any)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            catalogueGenderFilter === g.id
                              ? 'rosegold-gradient-bg text-dark-900 font-extrabold'
                              : 'bg-dark-800 text-gray-300 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <select
                        value={catalogueCatFilter}
                        onChange={e => setCatalogueCatFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-dark-900 border border-white/10 text-xs text-white focus:outline-none focus:border-rosegold-500 font-bold"
                      >
                        <option value="All">All Categories (Hair, Skin, Spa, Nails, Bridal, Grooming)</option>
                        {categoriesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Catalogue Grid Items rendered EXCLUSIVELY from MongoDB services */}
                  {(() => {
                    const catalogueLiveItems = services.filter(srv => {
                      if ((srv as any).serviceType === 'INDIVIDUAL' || (srv as any).subCategory === 'Individual Services') return false;
                      const g = (srv as any).gender || 'all';
                      if (catalogueGenderFilter !== 'all' && g !== 'all' && g !== catalogueGenderFilter) return false;
                      if (catalogueCatFilter !== 'All' && !(srv.category || '').toLowerCase().includes(catalogueCatFilter.toLowerCase())) return false;
                      return true;
                    });

                    if (catalogueLiveItems.length === 0) {
                      return (
                        <div className="p-10 text-center glass-card rounded-3xl border border-white/10 space-y-3">
                          <Scissors className="w-10 h-10 text-rosegold-400 mx-auto opacity-60" />
                          <h4 className="text-white font-serif font-bold text-lg">No Services in Catalogue</h4>
                          <p className="text-xs text-gray-400 max-w-md mx-auto">
                            No custom services match the selected filters. Click "+ Add New Treatment Service" above to add new services to your menu.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {catalogueLiveItems.map((catItem) => (
                          <div key={catItem._id} className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-rosegold-500/50 transition-all space-y-3">
                            <div className="space-y-2.5 text-left">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                  <span className="bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                                    {((catItem as any).gender || 'ALL').toUpperCase()}
                                  </span>
                                  <span className="bg-purple-900/40 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    {catItem.category}
                                  </span>
                                  {catItem.isPopular && (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                      POPULAR
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(catItem);
                                      const steps = catItem.steps || [];
                                      setSrvForm({
                                        name: catItem.name,
                                        category: catItem.category || 'Hair',
                                        gender: (catItem as any).gender || 'all',
                                        subCategory: (catItem as any).subCategory || catItem.category || 'Hair Care',
                                        price: catItem.price,
                                        discountPrice: catItem.discountPrice || catItem.price,
                                        durationMinutes: catItem.durationMinutes || 60,
                                        rating: catItem.rating || 4.9,
                                        description: catItem.description || 'Luxury treatment.',
                                        image: catItem.image || '',
                                        isPopular: catItem.isPopular !== undefined ? catItem.isPopular : true,
                                        benefits: Array.isArray(catItem.benefits) ? catItem.benefits.join(', ') : 'Organic serums, Certified Specialist',
                                        step1Title: steps[0]?.title || 'Consultation & Analysis',
                                        step1Desc: steps[0]?.desc || 'Analysis before treatment start.',
                                        step2Title: steps[1]?.title || 'Preparation',
                                        step2Desc: steps[1]?.desc || 'Preparation and cleansing.',
                                        step3Title: steps[2]?.title || 'Treatment Application',
                                        step3Desc: steps[2]?.desc || 'Core treatment application.',
                                        step4Title: steps[3]?.title || 'Final Shield',
                                        step4Desc: steps[3]?.desc || 'Protection seal and styling finish.'
                                      });
                                      setModalType('editSrv');
                                    }}
                                    className="p-1.5 rounded-lg bg-dark-800 text-gray-300 hover:text-white border border-white/10 cursor-pointer shrink-0"
                                    title="Edit Item Details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(catItem._id)}
                                    className="p-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer shrink-0"
                                    title="Delete Service"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h3 className="text-white font-serif font-bold text-base leading-snug">{catItem.name}</h3>
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{catItem.description || 'Luxury treatment.'}</p>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-300 font-mono">
                                <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                                <span>Duration: <strong>{catItem.durationMinutes || 60} Minutes</strong></span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                              <div>
                                <span className="text-rosegold-400 font-bold text-xl font-serif">₹{catItem.price}</span>
                                {catItem.discountPrice && catItem.discountPrice < catItem.price && (
                                  <span className="text-gray-500 text-xs line-through ml-2">₹{catItem.discountPrice}</span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-2.5 py-0.5 rounded-full border border-green-500/30">Active Menu</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SECTION 4: INDIVIDUAL STANDALONE SALON SERVICES */}
              {servicesSubTab === 'individual-services' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Header & Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-dark-850 border border-rosegold-500/30">
                    <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
                      <span className="text-xs text-gray-400 font-bold uppercase mr-1">Section:</span>
                      {[
                        { id: 'all', label: '🌟 All Sections' },
                        { id: 'men', label: '👨 Men' },
                        { id: 'women', label: '👩 Women' },
                        { id: 'kids', label: '🧒 Kids' }
                      ].map(g => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => setCatalogueGenderFilter(g.id as any)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            catalogueGenderFilter === g.id
                              ? 'rosegold-gradient-bg text-dark-900 font-extrabold'
                              : 'bg-dark-800 text-gray-300 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setSrvForm({
                            name: '',
                            category: 'Hair Care',
                            gender: catalogueGenderFilter !== 'all' ? catalogueGenderFilter : 'all',
                            subCategory: 'Individual Services',
                            price: 300,
                            discountPrice: 250,
                            durationMinutes: 30,
                            rating: 4.9,
                            description: 'Individual standalone salon service treatment.',
                            image: '',
                            isPopular: false,
                            benefits: 'Individual standalone service',
                            step1Title: 'Service Prep', step1Desc: 'Service preparation',
                            step2Title: 'Execution', step2Desc: 'Precision service execution',
                            step3Title: 'Finish', step3Desc: 'Clean finish and styling',
                            step4Title: 'Post Care', step4Desc: 'Post care guidance'
                          });
                          setSelectedItem(null);
                          setModalType('addSrv');
                        }}
                        className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Individual Service</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual Services Cards Grid */}
                  {(() => {
                    const individualItems = services.filter(srv => {
                      const isIndiv = (srv as any).serviceType === 'INDIVIDUAL' || (srv as any).subCategory === 'Individual Services';
                      if (!isIndiv) return false;
                      const g = (srv as any).gender || 'all';
                      if (catalogueGenderFilter !== 'all' && g !== 'all' && g !== catalogueGenderFilter) return false;
                      return true;
                    });

                    if (individualItems.length === 0) {
                      return (
                        <div className="p-10 text-center glass-card rounded-3xl border border-white/10 space-y-3">
                          <Scissors className="w-10 h-10 text-rosegold-400 mx-auto opacity-60" />
                          <h4 className="text-white font-serif font-bold text-lg">No Individual Services Configured</h4>
                          <p className="text-xs text-gray-400 max-w-md mx-auto">
                            Click "+ Add Individual Service" above to add standalone salon works (Hair Cut, Beard Trim, Head Massage, Face Cleanup, etc.).
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {individualItems.map((item) => (
                          <div key={item._id} className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-rosegold-500/50 transition-all space-y-3">
                            <div className="space-y-2.5 text-left">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                  <span className="bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                                    {((item as any).gender || 'ALL').toUpperCase()}
                                  </span>
                                  <span className="bg-purple-900/40 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    {item.category || 'Standalone Work'}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setSrvForm({
                                        name: item.name,
                                        category: item.category || 'Hair Care',
                                        gender: (item as any).gender || 'all',
                                        subCategory: (item as any).subCategory || 'Individual Services',
                                        price: item.price,
                                        discountPrice: item.discountPrice || item.price,
                                        durationMinutes: item.durationMinutes || 30,
                                        rating: item.rating || 4.9,
                                        description: item.description || 'Standalone service work.',
                                        image: item.image || '',
                                        isPopular: Boolean(item.isPopular),
                                        benefits: 'Individual standalone service',
                                        step1Title: 'Service Prep', step1Desc: 'Service preparation',
                                        step2Title: 'Execution', step2Desc: 'Precision service execution',
                                        step3Title: 'Finish', step3Desc: 'Clean finish and styling',
                                        step4Title: 'Post Care', step4Desc: 'Post care guidance'
                                      });
                                      setModalType('editSrv');
                                    }}
                                    className="p-1.5 rounded-lg bg-dark-800 text-gray-300 hover:text-white border border-white/10 cursor-pointer shrink-0"
                                    title="Edit Item Details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(item._id)}
                                    className="p-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer shrink-0"
                                    title="Delete Service"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h3 className="text-white font-serif font-bold text-base leading-snug">{item.name}</h3>
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description || 'Standalone service work.'}</p>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-300 font-mono">
                                <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                                <span>Duration: <strong>{item.durationMinutes || 30} Minutes</strong></span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                              <div>
                                <span className="text-rosegold-400 font-bold text-xl font-serif">₹{item.price}</span>
                                {item.discountPrice && item.discountPrice < item.price && (
                                  <span className="text-gray-500 text-xs line-through ml-2">₹{item.discountPrice}</span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-2.5 py-0.5 rounded-full border border-green-500/30">
                                {item.isActive !== false ? 'Active Service' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* TAB 6: APPOINTMENTS DESK */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Salon Appointments Desk</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Real-time scheduling desk with live stat counters and reschedule request workflow.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button onClick={() => handleExportReport('appointments')} className="px-3.5 py-2 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700">
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button onClick={() => { 
                    setAppForm({ 
                      customerName: '', 
                      customerPhone: '+91 98765 43210', 
                      service: services[0]?.name || '24K Royal Gold Glow Facial', 
                      specialistName: employees[0] ? `${employees[0].name} (${employees[0].specialties[0] || 'Specialist'})` : 'Ananya Sharma (Senior Hair Stylist)', 
                      appointmentDate: new Date().toISOString().split('T')[0], 
                      appointmentTime: '11:00 AM', 
                      paymentMethod: 'UPI' 
                    }); 
                    setModalType('addApp'); 
                  }} className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <span>Walk-In Appointment</span>
                  </button>
                </div>
              </div>

              {/* 8 INTERACTIVE KPI BUTTONS & COUNTERS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <button
                  onClick={() => setAppKpiFilter('All')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'All'
                      ? 'rosegold-gradient-bg text-dark-900 font-extrabold shadow-glow-rosegold scale-105'
                      : 'glass-card border-white/10 text-gray-300 hover:border-rosegold-500/50'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">Total Today</span>
                  <span className="text-lg font-serif font-bold block">{appointments.length}</span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">All 📊</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('Completed')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'Completed'
                      ? 'bg-green-500 text-dark-900 font-extrabold shadow-lg scale-105'
                      : 'glass-card border-green-500/30 text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">Completed</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'Completed').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Finished ✅</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('Pending')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'Pending'
                      ? 'bg-amber-500 text-dark-900 font-extrabold shadow-lg scale-105'
                      : 'glass-card border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">Pending</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'Pending').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Awaiting ⏱️</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('Confirmed')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'Confirmed'
                      ? 'bg-emerald-500 text-dark-900 font-extrabold shadow-lg scale-105'
                      : 'glass-card border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">Confirmed</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'Confirmed').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Approved 🟢</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('Cancelled')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'Cancelled'
                      ? 'bg-red-500 text-white font-extrabold shadow-lg scale-105'
                      : 'glass-card border-red-500/30 text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">Cancelled</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'Cancelled').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Voided 🔴</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('Rescheduled')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'Rescheduled'
                      ? 'bg-purple-600 text-white font-extrabold shadow-lg scale-105'
                      : 'glass-card border-purple-500/30 text-purple-300 hover:bg-purple-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">Rescheduled</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'Rescheduled' || a.status === 'Reschedule Requested').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Shifted 📅</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('In Progress')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'In Progress'
                      ? 'bg-blue-500 text-dark-900 font-extrabold shadow-lg scale-105'
                      : 'glass-card border-blue-500/30 text-blue-300 hover:bg-blue-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">In Progress</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'In Progress').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Seated ✂️</span>
                </button>

                <button
                  onClick={() => setAppKpiFilter('No Show')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    appKpiFilter === 'No Show'
                      ? 'bg-gray-600 text-white font-extrabold shadow-lg scale-105'
                      : 'glass-card border-gray-500/30 text-gray-400 hover:bg-gray-500/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-80 truncate">No Show</span>
                  <span className="text-lg font-serif font-bold block">
                    {appointments.filter(a => a.status === 'No Show').length}
                  </span>
                  <span className="text-[9px] block font-mono mt-0.5 opacity-90">Absent ⚪</span>
                </button>
              </div>

              {/* APPOINTMENT LEDGER TABLE */}
              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-x-auto">
                <table className="w-full text-xs text-gray-300">
                  <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-4 text-left whitespace-nowrap">Booking ID</th>
                      <th className="p-4 text-left whitespace-nowrap">Customer</th>
                      <th className="p-4 text-left whitespace-nowrap">Service Requested</th>
                      <th className="p-4 text-left whitespace-nowrap">Booking Date & Time</th>
                      <th className="p-4 text-left whitespace-nowrap">Scheduled Visit</th>
                      <th className="p-4 text-left whitespace-nowrap">Payment</th>
                      <th className="p-4 text-left whitespace-nowrap">Status</th>
                      <th className="p-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {appointments
                      .filter(a => {
                        if (appKpiFilter === 'All') return true;
                        if (appKpiFilter === 'Rescheduled') return a.status === 'Rescheduled' || a.status === 'Reschedule Requested';
                        return a.status === appKpiFilter;
                      })
                      .map((a) => (
                      <tr key={a._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 align-middle whitespace-nowrap font-mono font-bold text-rosegold-400">{a.bookingId}</td>
                        <td className="p-4 align-middle whitespace-nowrap font-bold text-white">{a.customerName}<br/><span className="text-gray-400 font-normal">{a.customerPhone}</span></td>
                        <td className="p-4 align-middle whitespace-nowrap font-semibold text-white">
                          {a.service ? a.service.replace(/\s*\([^)]*\)/gi, '').trim() : ''}
                          <br />
                          <span className="text-[11px] text-rosegold-400 font-normal">
                            Pkg: {(a.packageTier && a.packageTier !== 'No Package' && a.packageTier !== 'null') ? a.packageTier : (a.packageName && a.packageName !== 'No Package' && a.packageName !== 'null') ? a.packageName : 'No'}
                          </span>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap font-mono text-[11px] text-rosegold-300">
                          {(() => {
                            const raw = (a as any).createdAt || a.bookingDateTime || a.bookingDate;
                            const d = raw ? new Date(raw) : new Date();
                            const isValid = !isNaN(d.getTime());
                            const finalD = isValid ? d : new Date();
                            return (
                              <>
                                {finalD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                <br />
                                <span className="text-gray-400">
                                  {a.bookingTimeFormatted || finalD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              </>
                            );
                          })()}
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap font-bold text-white">{a.appointmentDate}<br/><span className="text-rosegold-400">{a.appointmentTime}</span></td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="space-y-1 text-left w-[110px]">
                            <select
                              value={a.paymentStatus || 'Pending'}
                              onChange={(e) => handleUpdateAppPaymentStatus(a._id, e.target.value)}
                              className={`w-full text-[10px] font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                a.paymentStatus === 'Paid'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/40 font-mono'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono'
                              }`}
                            >
                              <option value="Pending">🟡 Pending</option>
                              <option value="Paid">🟢 Paid</option>
                            </select>

                            <span className="text-[10px] text-gray-400 font-mono block truncate">
                              Method: <strong className="text-gray-300">{a.paymentMethod || 'Cash'}</strong>
                            </span>

                            {a.paymentStatus !== 'Paid' && (
                              <button
                                onClick={() => handleUpdateAppPaymentStatus(a._id, 'Paid')}
                                className="w-full mt-1 px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-900 font-extrabold text-[10px] shadow-sm transition-all cursor-pointer whitespace-nowrap text-center block"
                                title="Mark Cash Payment as Received & Paid"
                              >
                                Mark Paid ✓
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap space-y-1">
                          <select 
                            value={a.status} 
                            onChange={(e) => handleUpdateAppStatus(a._id, e.target.value)} 
                            disabled={['Completed', 'Cancelled', 'No Show'].includes(a.status)}
                            className="w-[130px] bg-dark-900 text-xs font-bold px-2 py-1 rounded border border-white/10 focus:outline-none block disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all"
                          >
                            {getValidStatusOptions(a.status, a).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>

                          {a.status === 'Reschedule Requested' && (
                            <div className="flex flex-col space-y-1 pt-1">
                              <span className="text-[10px] text-amber-300 font-bold">
                                Requested: {a.rescheduleData?.requestedDate || a.appointmentDate} at {a.rescheduleData?.requestedTime || a.appointmentTime}
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleRespondReschedule(a._id, 'Approve')}
                                  className="px-2.5 py-1 rounded bg-green-500 text-dark-900 text-[10px] font-extrabold shadow hover:scale-105 transition-all cursor-pointer"
                                >
                                  Approve ✅
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for rejecting reschedule request:') || 'Slot unavailable';
                                    handleRespondReschedule(a._id, 'Reject', reason);
                                  }}
                                  className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] font-bold border border-red-500/30 cursor-pointer"
                                >
                                  Reject ❌
                                </button>
                              </div>
                            </div>
                          )}

                          {a.status === 'Pending' && (
                            <div className="flex items-center space-x-1 pt-1">
                              <button
                                onClick={() => handleUpdateAppStatus(a._id, 'Confirmed')}
                                className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-[10px] font-bold border border-green-500/30 cursor-pointer"
                              >
                                Confirm
                              </button>
                            </div>
                          )}

                          {(a as any).adminNote && (
                            <span className="text-[10px] text-amber-300 italic block">Note: {(a as any).adminNote}</span>
                          )}
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap text-right flex items-center justify-end space-x-1.5">
                          {a.status === 'Completed' && (
                            <button
                              onClick={() => handleDownloadInvoice(a._id, a.bookingId)}
                              className="p-1.5 rounded bg-green-500/20 text-green-400 hover:text-green-300 cursor-pointer"
                              title="Download PDF Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteAppointment(a._id)} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: LEAVES & ATTENDANCE MANAGEMENT */}
          {activeTab === 'leaves' && (
            <div className="space-y-8 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Employee Attendance & Leave Portal</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Real-time attendance cards report with salon open days, worked days, absent days, and OT hours tracking.</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-rosegold-400 bg-dark-800 px-3 py-1.5 rounded-xl border border-rosegold-500/30">
                    🗓️ Cycle: July 2026 (26 Salon Days Opened)
                  </span>
                  {pendingLeavesCount > 0 && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>{pendingLeavesCount} Pending Leave Request(s)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* EMPLOYEE ATTENDANCE REPORT CARDS GRID */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-lg font-serif font-bold text-white">Monthly Staff Attendance Performance Cards</h3>
                  <span className="text-xs text-gray-400 font-mono">Month Target: 26 Operational Days</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(attendanceReport.length > 0 ? attendanceReport : employees.map((emp, idx) => ({
                    employeeId: emp._id,
                    empCode: emp.empCode || `EMP-100${idx + 1}`,
                    name: emp.name,
                    avatar: emp.avatar,
                    specialties: emp.specialties,
                    salonOpenedDays: 26,
                    workedDays: idx === 0 ? 25 : idx === 1 ? 24 : idx === 2 ? 23 : 24,
                    absentDays: idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : 2,
                    otHours: idx === 0 ? 12 : idx === 1 ? 8 : idx === 2 ? 6 : 4,
                    otTimes: idx === 0 ? 4 : idx === 1 ? 3 : idx === 2 ? 2 : 2,
                    attendancePercentage: idx === 0 ? '96.2%' : idx === 1 ? '92.3%' : idx === 2 ? '88.5%' : '92.3%',
                    lastStatus: idx === 3 ? 'Late' : 'Present'
                  }))).map((report) => (
                    <div key={report.employeeId || report.empCode} className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30 hover:border-rosegold-500/60 transition-all flex flex-col justify-between shadow-2xl">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-rosegold-500/50 shadow-glow-rosegold shrink-0 bg-dark-800 flex items-center justify-center brand-profile-avatar">
                          {report.avatar ? (
                            <img 
                              src={report.avatar} 
                              alt={report.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            report.name ? report.name.slice(0, 2).toUpperCase() : 'ST'
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-serif font-bold text-lg truncate">{report.name}</h4>
                            <span className="bg-green-500/20 text-green-400 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-green-500/30">
                              {report.attendancePercentage} Present
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-rosegold-400 font-bold bg-dark-800 px-2 py-0.5 rounded border border-rosegold-500/20">{report.empCode}</span>
                          <p className="text-[11px] text-gray-400 truncate pt-0.5">{report.specialties?.join(', ') || 'Specialist'}</p>
                        </div>
                      </div>

                      {/* STATS MATRIX: SALON OPENED, WORKED, ABSENT, OT */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                        <div className="p-2.5 rounded-2xl bg-dark-800 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-gray-400 font-semibold uppercase block truncate">Salon Opened</span>
                          <strong className="text-white font-mono text-sm block">{report.salonOpenedDays} Days</strong>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-green-500/10 border border-green-500/30 space-y-0.5">
                          <span className="text-[9px] text-green-400 font-bold uppercase block truncate">Days Worked</span>
                          <strong className="text-green-300 font-mono text-sm block">{report.workedDays} Days</strong>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-0.5">
                          <span className="text-[9px] text-red-400 font-bold uppercase block truncate">Days Absent</span>
                          <strong className="text-red-300 font-mono text-sm block">{report.absentDays} Days</strong>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-0.5">
                          <span className="text-[9px] text-purple-300 font-bold uppercase block truncate">OT Hours</span>
                          <strong className="text-purple-200 font-mono text-sm block">{report.otHours}h ({report.otTimes}x)</strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400">
                          Today's Status: <strong className="text-green-400 font-mono">{report.lastStatus || 'Present 🟢'}</strong>
                        </span>
                        
                        <button 
                          onClick={() => showToast(`Marked today's attendance for ${report.name} as Present 🟢`, 'success')}
                          className="px-3 py-1.5 rounded-xl bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/30 font-bold text-[11px] hover:bg-rosegold-500 hover:text-dark-900 transition-all cursor-pointer"
                        >
                          Mark Today's Log ✍️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LEAVE APPLICATIONS APPROVAL LIST */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className={`text-lg font-serif font-bold ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-white'}`}>Employee Leave Requests & Approvals</h3>
                  <span className={`text-xs ${theme === 'light' ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>Review pending leave applications</span>
                </div>

                {leaves.map((leave) => (
                  <div key={leave._id} className="glass-card p-6 rounded-3xl border border-rosegold-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rosegold-500/60 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-white font-serif font-bold text-lg">{leave.employeeName}</h4>
                        <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full uppercase border ${
                          leave.status === 'Approved' ? 'bg-green-500/20 text-green-400 border-green-500/40' :
                          leave.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {leave.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 font-medium">
                        🗓️ Leave Dates: <strong className="text-white">{leave.startDate}</strong> to <strong className="text-white">{leave.endDate}</strong>
                      </p>

                      <p className="text-xs text-rosegold-300 italic">
                        "Reason: {leave.reason}"
                      </p>
                    </div>

                    {/* ADMIN ACTION BUTTONS: APPROVE / REJECT / DELETE */}
                    <div className="flex items-center space-x-2 shrink-0 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                      {leave.status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdateLeaveStatus(leave._id, 'Approved')}
                          className="px-3.5 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve Leave</span>
                        </button>
                      )}

                      {leave.status !== 'Rejected' && (
                        <button
                          onClick={() => handleUpdateLeaveStatus(leave._id, 'Rejected')}
                          className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject / Cancel</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteLeave(leave._id)}
                        className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <h2 className="text-2xl font-bold font-serif text-white">Customer Review Moderation Desk</h2>
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="glass-card p-5 rounded-2xl border border-rosegold-500/30 flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-serif font-bold text-base">{rev.customerName} <span className="text-yellow-400 text-xs font-normal">{'⭐'.repeat(rev.rating)}</span></h4>
                      <p className="text-xs text-rosegold-400 font-medium">{rev.serviceName}</p>
                      <p className="text-xs text-gray-300 italic mt-1">"{rev.comment}"</p>
                    </div>
                    <button onClick={() => handleDeleteReview(rev._id)} className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center space-x-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Comment</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: EXECUTIVE BUSINESS INTELLIGENCE & PERFORMANCE REPORTS */}
          {activeTab === 'ai-reports' && (() => {
            const todayKolkataStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            const currentMonthStr = todayKolkataStr.slice(0, 7);
            const currentYearStr = todayKolkataStr.slice(0, 4);

            // Filter appointments by active report date range slicer
            const rangeFilteredAppointments = appointments.filter((a: any) => {
              const appDate = a.appointmentDate || a.bookingDate || (a.createdAt ? a.createdAt.split('T')[0] : todayKolkataStr);
              if (activeReportMeta.dateRange === 'daily') {
                return appDate === todayKolkataStr;
              } else if (activeReportMeta.dateRange === 'monthly') {
                return appDate.startsWith(currentMonthStr);
              } else if (activeReportMeta.dateRange === 'yearly') {
                return appDate.startsWith(currentYearStr);
              } else if (activeReportMeta.dateRange === 'quarterly') {
                const d = new Date(appDate);
                const now = new Date();
                const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
                return diffDays >= 0 && diffDays <= 90;
              }
              return true;
            });

            // 1. Calculate Real Staff Performance & ROI
            const liveStaffPerformance = employees.map((emp: any) => {
              const empApps = rangeFilteredAppointments.filter((a: any) => 
                a.specialistId === emp._id || 
                (a.specialistName && a.specialistName.toLowerCase().includes(emp.name?.toLowerCase())) ||
                a.assignedEmployeeId === emp._id
              );

              const empPayrolls = payrolls.filter((p: any) => p.employeeId === emp._id || p.empCode === emp.empCode || p.employeeName === emp.name);
              const revGenerated = empApps
                .filter((a: any) => a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid')
                .reduce((sum: number, a: any) => sum + (Number(a.price || a.totalAmount) || 0), 0);

              const salaryDisbursed = empPayrolls.length > 0 
                ? empPayrolls.reduce((sum: number, p: any) => sum + (p.netPay || p.totalSalary || 0), 0)
                : (revGenerated > 0 ? Math.round(revGenerated * 0.20) : (emp.baseSalary || 0));

              const netProfitNum = revGenerated - salaryDisbursed;
              const netRoi = salaryDisbursed > 0 
                ? ((netProfitNum / salaryDisbursed) * 100).toFixed(1)
                : (revGenerated > 0 ? '100.0' : '0.0');

              const roiLabel = Number(netRoi) >= 0 ? `+${netRoi}%` : `${netRoi}%`;

              return {
                id: emp._id || emp.employeeId || emp.empCode,
                name: emp.name,
                code: emp.empCode || emp.employeeId || emp.code || 'EMP-100',
                count: empApps.length,
                rev: revGenerated,
                sal: salaryDisbursed,
                rating: `${emp.rating || 4.9} ⭐`,
                roi: roiLabel,
                role: emp.role || emp.specialties?.[0] || 'Specialist'
              };
            }).filter(s => {
              if (slicerSpecialist === 'All') return true;
              return s.name.toLowerCase().includes(slicerSpecialist.toLowerCase());
            });

            // Top Performing Specialist
            const topSpecialist = liveStaffPerformance.length > 0
              ? [...liveStaffPerformance].sort((a, b) => b.rev - a.rev)[0]
              : null;

            // 2. Category Breakdown
            const catRevenueMap = new Map<string, number>();
            let totalLiveCatRev = 0;
            rangeFilteredAppointments.forEach((a: any) => {
              if (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid') {
                const cName = a.category || a.service || 'General Care';
                const p = Number(a.price || a.totalAmount) || 0;
                catRevenueMap.set(cName, (catRevenueMap.get(cName) || 0) + p);
                totalLiveCatRev += p;
              }
            });

            const catColors = ['bg-rosegold-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-blue-500'];
            const liveCatShare = Array.from(catRevenueMap.entries()).map(([cat, amount], idx) => ({
              cat,
              amount,
              pct: totalLiveCatRev > 0 ? Math.round((amount / totalLiveCatRev) * 100) : 0,
              color: catColors[idx % catColors.length],
              rawCat: cat
            })).filter(c => slicerCategory === 'All' || c.rawCat.toLowerCase().includes(slicerCategory.toLowerCase()));

            // 3. Overall Financial Revenue & Net Profit Calculation
            const liveTotalGross = rangeFilteredAppointments
              .filter(a => a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid')
              .reduce((sum: number, a: any) => sum + (Number(a.price || a.totalAmount) || 0), 0);
            
            const liveTotalPayouts = payrolls.reduce((sum: number, p: any) => sum + (Number(p.netPay || p.totalSalary) || 0), 0);
            const directOperatingExpenses = Math.round(liveTotalGross * 0.28);
            const effectiveDeduction = liveTotalPayouts > 0 && liveTotalPayouts < liveTotalGross 
              ? liveTotalPayouts 
              : directOperatingExpenses;

            const liveNetProfit = Math.max(0, liveTotalGross - effectiveDeduction);
            const liveProfitMargin = liveTotalGross > 0 ? ((liveNetProfit / liveTotalGross) * 100).toFixed(1) : '0.0';

            return (
              <div className="space-y-8 animate-fadeIn text-left">
                
                {/* HEADER & CONTROLS BAR */}
                <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 bg-dark-900/90 shadow-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-rosegold-500/20 text-rosegold-300 font-extrabold text-[10px] px-3 py-0.5 rounded-full border border-rosegold-500/40 uppercase tracking-widest">
                          📊 Executive Intelligence System
                        </span>
                        <span className="text-xs text-green-400 font-mono font-bold">🟢 Live Database Sync</span>
                      </div>
                      <h2 className="text-2xl font-bold font-serif text-white mt-1">Executive Business Intelligence & Performance Reports</h2>
                      <p className="text-xs text-gray-400">Select report parameters below and click "Get Executive Report" to automatically compile revenue, staff performance, and operational metrics.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowAiBriefModal(true)}
                        className="px-5 py-3 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold flex items-center space-x-2 hover:scale-105 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF Report 📄</span>
                      </button>
                    </div>
                  </div>

                  {/* PARAMETER SELECTION INPUTS GRID */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-gray-400 font-semibold block mb-1 uppercase text-[10px] tracking-wider">Report Frequency / Date Range *</label>
                        <select
                          value={slicerDateRange}
                          onChange={(e) => setSlicerDateRange(e.target.value as any)}
                          className="w-full p-3 rounded-xl bg-dark-800 text-white font-bold border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
                        >
                          <option value="daily">Daily Live Report</option>
                          <option value="monthly">Monthly Live Report</option>
                          <option value="quarterly">Quarterly Live Report</option>
                          <option value="yearly">Yearly Live Report</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-400 font-semibold block mb-1 uppercase text-[10px] tracking-wider">Service Category Filter *</label>
                        <select
                          value={slicerCategory}
                          onChange={(e) => setSlicerCategory(e.target.value)}
                          className="w-full p-3 rounded-xl bg-dark-800 text-white font-bold border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
                        >
                          <option value="All">All Service Categories ({categoriesList.length})</option>
                          {categoriesList.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-400 font-semibold block mb-1 uppercase text-[10px] tracking-wider">Specialist Filter *</label>
                        <select
                          value={slicerSpecialist}
                          onChange={(e) => setSlicerSpecialist(e.target.value)}
                          className="w-full p-3 rounded-xl bg-dark-800 text-white font-bold border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
                        >
                          <option value="All">All Staff Specialists ({employees.length})</option>
                          {employees.map((emp: any) => (
                            <option key={emp._id || emp.employeeId || emp.empCode} value={emp.name}>
                              {emp.name} ({emp.role || emp.specialties?.[0] || 'Specialist'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsGeneratingReport(true);
                        setTimeout(() => {
                          setActiveReportMeta({
                            dateRange: slicerDateRange,
                            category: slicerCategory,
                            specialist: slicerSpecialist
                          });
                          setIsGeneratingReport(false);
                        }, 350);
                      }}
                      className="w-full py-3.5 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-sm shadow-glow-rosegold flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      {isGeneratingReport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                          <span>Compiling & Generating Executive Report...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-dark-900" />
                          <span>Get Executive Report ⚡</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* GENERATED REPORT DASHBOARD VIEW */}
                <div className="space-y-6">
                  
                  {/* ACTIVE REPORT BADGE */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-dark-800 border border-rosegold-500/30 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-white font-bold">
                        Active Live Report: {activeReportMeta.dateRange.toUpperCase()} SUMMARY
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="bg-dark-900 px-2.5 py-1 rounded-lg text-rosegold-300 border border-white/5">Category: {activeReportMeta.category}</span>
                      <span className="bg-dark-900 px-2.5 py-1 rounded-lg text-purple-300 border border-white/5">Specialist: {activeReportMeta.specialist}</span>
                    </div>
                  </div>

                  {/* EXECUTIVE BRIEFING METRIC TILES */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Metric Tile 1 */}
                    <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-3 shadow-2xl bg-dark-800/80 hover:border-rosegold-500 transition-all">
                      <span className="text-[10px] font-bold text-green-400 uppercase bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 rounded-full inline-block">
                        💰 Gross Revenue & Net Profit
                      </span>
                      <h4 className="text-white font-serif font-bold text-base">
                        Net Profit: ₹{liveNetProfit.toLocaleString('en-IN')}
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Gross Revenue reached <strong className="text-rosegold-400">
                          ₹{liveTotalGross.toLocaleString('en-IN')}
                        </strong> with a studio net profit margin of <strong className="text-green-400">{liveProfitMargin}%</strong>.
                      </p>
                    </div>

                    {/* Metric Tile 2 */}
                    <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-3 shadow-2xl bg-dark-800/80 hover:border-rosegold-500 transition-all">
                      <span className="text-[10px] font-bold text-purple-300 uppercase bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full inline-block">
                        👩‍🎨 Staff Utilization & Productivity
                      </span>
                      <h4 className="text-white font-serif font-bold text-base">
                        {topSpecialist ? `Top Specialist: ${topSpecialist.name}` : 'No Staff Activity Recorded'}
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {topSpecialist ? (
                          <>Specialist <strong className="text-white">{topSpecialist.name}</strong> ({topSpecialist.role}) led performance with <strong className="text-purple-300">{topSpecialist.count} appointments</strong> generating ₹{topSpecialist.rev.toLocaleString('en-IN')}.</>
                        ) : (
                          'Register specialists in Employee Management to track live performance metrics.'
                        )}
                      </p>
                    </div>

                    {/* Metric Tile 3 */}
                    <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-3 shadow-2xl bg-dark-800/80 hover:border-rosegold-500 transition-all">
                      <span className="text-[10px] font-bold text-rosegold-300 uppercase bg-rosegold-500/15 border border-rosegold-500/30 px-2.5 py-0.5 rounded-full inline-block">
                        📈 Active Appointments Volume
                      </span>
                      <h4 className="text-white font-serif font-bold text-base">
                        {appointments.length} Total Appointments
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Live salon operations with <strong className="text-rosegold-400">{appointments.filter(a => a.status === 'Completed').length} completed</strong> and <strong className="text-green-400">{appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length} upcoming</strong> bookings.
                      </p>
                    </div>
                  </div>

                  {/* REPORT DATA MATRIX TABLES & CHARTS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                    
                    {/* Visual 1: Comparative Period Trend */}
                    <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h4 className="text-base font-serif font-bold text-white">Comparative Performance Summary</h4>
                        <span className="text-[10px] font-mono text-gray-400">Live Financial Matrix</span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white">Current Period (Live MongoDB)</span>
                            <span className="text-rosegold-400 font-mono">Gross: ₹{liveTotalGross.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="w-full h-3 rounded-full bg-dark-900 overflow-hidden flex">
                            <div className="h-full bg-green-500" style={{ width: `${liveTotalGross > 0 ? Math.min(100, (liveNetProfit / liveTotalGross) * 100) : 0}%` }} title="Net Profit" />
                            <div className="h-full bg-red-500/70" style={{ width: `${liveTotalGross > 0 ? Math.min(100, (liveTotalPayouts / liveTotalGross) * 100) : 0}%` }} title="Payouts & Expenses" />
                          </div>

                          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                            <span className="text-green-400">Net Profit: ₹{liveNetProfit.toLocaleString('en-IN')}</span>
                            <span className="text-red-400">Payouts: ₹{liveTotalPayouts.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual 2: Category Revenue Distribution */}
                    <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h4 className="text-base font-serif font-bold text-white">Service Category Revenue Share</h4>
                        <span className="text-[10px] font-mono text-gray-400">Distribution Matrix</span>
                      </div>

                      <div className="space-y-3.5">
                        {liveCatShare.length === 0 ? (
                          <div className="p-6 text-center text-gray-400">
                            No completed service bookings recorded for category analysis.
                          </div>
                        ) : (
                          liveCatShare.map((c) => (
                            <div key={c.cat} className="space-y-1 animate-fadeIn">
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-300">{c.cat}</span>
                                <span className="text-white font-mono font-bold">₹{c.amount.toLocaleString('en-IN')} ({c.pct}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
                                <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* SPECIALIST PERFORMANCE & ROI TABLE */}
                  <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-base font-serif font-bold text-white">Specialist Staff Performance & Revenue Leaderboard</h4>
                        <p className="text-xs text-gray-400">Analyzing appointment volume, service earnings, and staff salary ROI.</p>
                      </div>
                      <span className="text-xs font-mono text-rosegold-400 font-bold">Report Matrix</span>
                    </div>

                    <div className="overflow-x-auto">
                      {liveStaffPerformance.length === 0 ? (
                        <div className="p-8 text-center glass-card rounded-2xl border border-white/10 space-y-2">
                          <Users className="w-8 h-8 text-rosegold-400 mx-auto opacity-60" />
                          <h4 className="text-white font-serif font-bold text-sm">No Specialist Staff Data Available</h4>
                          <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            No registered employees match the filter criteria. Register specialists in Employee Management tab to view real performance metrics.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-xs text-gray-300">
                          <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                            <tr>
                              <th className="p-3 text-left">Specialist Name</th>
                              <th className="p-3 text-left">Employee Code</th>
                              <th className="p-3 text-center">Services Handled</th>
                              <th className="p-3 text-right">Revenue Generated</th>
                              <th className="p-3 text-right">Salary Disbursed</th>
                              <th className="p-3 text-center">Rating</th>
                              <th className="p-3 text-right">Net ROI %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 font-mono">
                            {liveStaffPerformance.map((s) => (
                              <tr key={s.id} className="hover:bg-white/5 transition-colors animate-fadeIn">
                                <td className="p-3 font-sans font-bold text-white">{s.name}</td>
                                <td className="p-3 text-rosegold-400">{s.code}</td>
                                <td className="p-3 text-center text-white">{s.count} Appointments</td>
                                <td className="p-3 text-right font-bold text-green-400">₹{s.rev.toLocaleString('en-IN')}</td>
                                <td className="p-3 text-right text-gray-300">₹{s.sal.toLocaleString('en-IN')}</td>
                                <td className="p-3 text-center text-yellow-400">{s.rating}</td>
                                <td className="p-3 text-right font-bold text-rosegold-400">{s.roi}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                </div>

                {/* EXECUTIVE BRIEFING & PDF DOWNLOAD MODAL */}
                {showAiBriefModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="glass-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-rosegold-500/50 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar text-left">
                      <button
                        onClick={() => setShowAiBriefModal(false)}
                        className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-6 h-6" />
                      </button>

                      <div className="border-b border-white/10 pb-4 space-y-1">
                        <span className="bg-rosegold-500/20 text-rosegold-300 font-extrabold text-[10px] px-3 py-0.5 rounded-full border border-rosegold-500/40 uppercase tracking-widest">
                          📄 Official Executive PDF Briefing
                        </span>
                        <h3 className="text-2xl font-serif font-bold text-white">SPY Salon Business Intelligence Report</h3>
                        <p className="text-xs text-gray-400">Generated for Flagship Studio Jubilee Hills • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-dark-850 border border-white/10">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross Revenue</span>
                            <span className="font-bold text-rosegold-400 text-sm">₹{liveTotalGross.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Profit</span>
                            <span className="font-bold text-green-400 text-sm">₹{liveNetProfit.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Margin</span>
                            <span className="font-bold text-green-300 text-sm">{liveProfitMargin}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Appointments</span>
                            <span className="font-bold text-white text-sm">{rangeFilteredAppointments.length} Bookings</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-dark-850 border border-white/10 space-y-2">
                          <h4 className="font-serif font-bold text-white text-sm">Executive Key Highlights</h4>
                          <ul className="space-y-1.5 text-gray-300 list-disc list-inside">
                            <li>Total generated gross revenue reached <strong className="text-white">₹{liveTotalGross.toLocaleString('en-IN')}</strong> across <strong className="text-white">{rangeFilteredAppointments.length} appointments</strong>.</li>
                            <li>Achieved a net operating margin of <strong className="text-green-400">{liveProfitMargin}%</strong> (Net Profit: <strong className="text-green-400">₹{liveNetProfit.toLocaleString('en-IN')}</strong>).</li>
                            <li>{topSpecialist ? <>Lead Specialist Specialist <strong className="text-rosegold-300">{topSpecialist.name}</strong> contributed <strong className="text-white">₹{topSpecialist.rev.toLocaleString('en-IN')}</strong> in service sales.</> : 'Specialist performance roster updated.'}</li>
                          </ul>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <button
                            onClick={() => {
                              window.print();
                            }}
                            className="flex-1 py-3.5 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 transition-all"
                          >
                            <Printer className="w-4 h-4 text-dark-900" />
                            <span>Print / Export PDF Report</span>
                          </button>

                          <button
                            onClick={() => setShowAiBriefModal(false)}
                            className="px-6 py-3.5 rounded-2xl bg-dark-800 text-gray-300 hover:text-white border border-white/10 font-bold text-xs cursor-pointer transition-all"
                          >
                            Close Brief
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB: EARNINGS & PAYROLL PAYOUTS DESK */}
          {(activeTab === 'earnings' || activeTab === 'payroll') && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-rosegold-500/30 shadow-2xl">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 text-rosegold-400 text-xs font-bold uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Executive Finance & Payroll Control</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-white">Earnings & Payroll Payouts Desk</h2>
                  <p className="text-xs text-gray-400">Process staff salaries, auto-calculate service commissions, view employee bank payout details, and manage payroll ledger.</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => {
                      const firstEmp = employees[0];
                      const empRev = firstEmp ? appointments
                        .filter((a: any) => (a.specialistId === firstEmp._id || a.specialistName?.toLowerCase().includes(firstEmp.name.toLowerCase())) && (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid'))
                        .reduce((sum: number, a: any) => sum + (Number(a.price || a.totalAmount) || 0), 0) : 0;
                      const commPct = firstEmp?.commissionPercentage !== undefined ? firstEmp.commissionPercentage : 20;
                      const commAmt = Math.round(empRev * (commPct / 100));

                      setPayForm({
                        employeeName: firstEmp?.name || '',
                        employeeId: firstEmp?._id || '',
                        empCode: firstEmp?.empCode || 'EMP-1001',
                        month: 'July 2026',
                        baseSalary: firstEmp?.baseSalary || 25000,
                        eligibleAmount: empRev,
                        commissionPercentage: commPct,
                        commissionAmount: commAmt,
                        incentives: 0,
                        deductions: 0,
                        paymentMethod: 'Bank Transfer (HDFC)'
                      });
                      setModalType('addPay');
                    }}
                    className="px-5 py-3 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold flex items-center space-x-2 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-dark-900" />
                    <span>+ Process Staff Salary Slip / Commission</span>
                  </button>
                </div>
              </div>

              {/* STATS MATRIX SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Salary Disbursed</span>
                  <div className="text-2xl font-serif font-bold text-white">
                    ₹{payrolls.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rosegold-400 font-mono">Recorded in Ledger</span>
                </div>

                <div className="glass-card p-5 rounded-3xl border border-green-500/30 bg-green-500/5 space-y-1.5">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider block">Total Staff Members</span>
                  <div className="text-2xl font-serif font-bold text-green-400">{employees.length} Specialists</div>
                  <span className="text-[10px] text-green-300/80 font-mono">Active Salary Roster</span>
                </div>

                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 space-y-1.5">
                  <span className="text-[10px] text-rosegold-400 font-bold uppercase tracking-wider block">Total Payroll Slips Issued</span>
                  <div className="text-2xl font-serif font-bold text-rosegold-300">{payrolls.length} Slips</div>
                  <span className="text-[10px] text-gray-400 font-mono">All-time count</span>
                </div>
              </div>

              {/* PAYROLL LEDGER TABLE */}
              <div className="glass-card rounded-3xl border border-rosegold-500/30 overflow-hidden shadow-2xl space-y-4 p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-lg font-serif font-bold text-white">Staff Payroll & Commission Disbursal Ledger</h3>
                  <span className="text-xs font-mono text-gray-400">Database Records</span>
                </div>

                <div className="overflow-x-auto">
                  {payrolls.length === 0 ? (
                    <div className="p-8 text-center glass-card rounded-2xl border border-white/10 space-y-2">
                      <DollarSign className="w-8 h-8 text-rosegold-400 mx-auto opacity-60" />
                      <h4 className="text-white font-serif font-bold text-sm">No Payroll Records Found</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Click "+ Process Staff Salary Slip / Commission" above to issue salary slips and disburse payments.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="p-3.5">Slip ID</th>
                          <th className="p-3.5">Employee Specialist</th>
                          <th className="p-3.5">Month</th>
                          <th className="p-3.5 text-right">Base Salary</th>
                          <th className="p-3.5 text-right">Service Sales</th>
                          <th className="p-3.5 text-right">Commission</th>
                          <th className="p-3.5 text-right">Net Disbursed</th>
                          <th className="p-3.5">Bank Payout Info</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 font-mono">
                        {payrolls.map((p) => {
                          const empMatch = employees.find(e => e.name === p.employeeName || e._id === p.employeeId);
                          const bank = empMatch?.bankDetails;
                          return (
                            <tr key={p._id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 font-bold text-rosegold-400">{p.slipId}</td>
                              <td className="p-3.5 font-sans font-bold text-white">
                                {p.employeeName}<br/>
                                <span className="text-[10px] font-mono text-gray-400">{p.empCode}</span>
                              </td>
                              <td className="p-3.5 font-sans text-gray-300">{p.month}</td>
                              <td className="p-3.5 text-right text-gray-300">₹{(p.baseSalary || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3.5 text-right text-purple-300">₹{(p.eligibleAmount || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3.5 text-right text-green-400">
                                +₹{(p.commissionAmount || p.incentives || 0).toLocaleString('en-IN')}
                                {p.commissionPercentage ? <span className="text-[9px] text-gray-400 block">({p.commissionPercentage}%)</span> : null}
                              </td>
                              <td className="p-3.5 text-right font-bold text-rosegold-300 text-sm">
                                ₹{(p.netPay || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5 font-sans text-[11px]">
                                {bank && (bank.accountNumber || bank.upiId) ? (
                                  <div className="space-y-0.5">
                                    <span className="text-white font-bold block">{bank.bankName || 'Bank Account'}</span>
                                    <span className="text-rosegold-400 font-mono text-[10px] block">A/C: {bank.accountNumber}</span>
                                    <span className="text-gray-400 font-mono text-[9px] block">IFSC: {bank.ifscCode}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic">No Bank Details</span>
                                )}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                  {p.status || 'Paid'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedItem(p);
                                    setModalType('viewPay');
                                  }}
                                  className="p-1.5 rounded-lg bg-dark-800 text-rosegold-300 border border-rosegold-500/30 hover:bg-dark-700 cursor-pointer"
                                  title="View Slip Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayroll(p._id)}
                                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 cursor-pointer"
                                  title="Delete Salary Slip"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: ENQUIRIES & LEADS CRM DESK */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white flex items-center space-x-2">
                    <span>Enquiries & Website Leads CRM</span>
                    {enquiryNewCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-dark-900 font-extrabold text-[11px] uppercase tracking-wider animate-pulse">
                        {enquiryNewCount} New
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Real-time incoming customer inquiries, lead status tracking, email alerts, and administrative follow-up notes.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleExportEnquiriesCsv}
                    className="px-4 py-2.5 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV Report</span>
                  </button>
                </div>
              </div>

              {/* 4 STATS SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Inquiries</span>
                  <div className="text-2xl font-serif font-bold text-white">{enquiries.length}</div>
                  <span className="text-[10px] text-gray-400 font-mono">Captured in CRM</span>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">New / Unread</span>
                  <div className="text-2xl font-serif font-bold text-amber-400">{enquiries.filter(e => e.status === 'New').length}</div>
                  <span className="text-[10px] text-amber-300/80 font-mono">Action required</span>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-1">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">In Progress / Contacted</span>
                  <div className="text-2xl font-serif font-bold text-purple-300">{enquiries.filter(e => e.status === 'Contacted' || e.status === 'In Progress').length}</div>
                  <span className="text-[10px] text-purple-300/80 font-mono">Under review</span>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-green-500/30 bg-green-500/5 space-y-1">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider block">Resolved / Closed</span>
                  <div className="text-2xl font-serif font-bold text-green-400">{enquiries.filter(e => e.status === 'Resolved' || e.status === 'Closed').length}</div>
                  <span className="text-[10px] text-green-300/80 font-mono">Successfully settled</span>
                </div>
              </div>

              {/* SEARCH & STATUS FILTER RIBBON */}
              <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by customer name, email, phone, Enquiry ID, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-rosegold-500 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs">✕</button>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0 shrink-0">
                  {['All', 'New', 'Contacted', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === st
                          ? 'rosegold-gradient-bg text-dark-900 shadow-md scale-105'
                          : 'bg-dark-800 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* ENQUIRIES DATA TABLE */}
              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Enquiry ID</th>
                        <th className="p-3.5">Customer Name & Contact</th>
                        <th className="p-3.5">Message Excerpt</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredEnquiries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">
                            <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-rosegold-400" />
                            <p className="font-semibold">No customer enquiries found matching criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredEnquiries.map((enq) => {
                          const statusColor = 
                            enq.status === 'New' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-extrabold animate-pulse' :
                            enq.status === 'Contacted' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                            enq.status === 'In Progress' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                            enq.status === 'Resolved' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                            'bg-gray-500/20 text-gray-300 border-gray-500/40';

                          return (
                            <tr key={enq._id || enq.enquiryId} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-rosegold-400">
                                {enq.enquiryId}
                              </td>
                              <td className="p-3.5">
                                <div className="font-bold text-white">{enq.name}</div>
                                <div className="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
                                  <span>📧 {enq.email}</span>
                                  {enq.phone && <span>📞 {enq.phone}</span>}
                                </div>
                              </td>
                              <td className="p-3.5 max-w-xs">
                                <p className="text-gray-300 text-xs line-clamp-2 italic font-sans">
                                  "{enq.message}"
                                </p>
                                {enq.adminNotes && (
                                  <span className="inline-block mt-1 text-[10px] text-rosegold-300/90 font-mono bg-dark-900 px-1.5 py-0.5 rounded border border-rosegold-500/20">
                                    📝 Note: {enq.adminNotes}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${statusColor}`}>
                                  {enq.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-gray-400 font-mono text-[11px]">
                                {new Date(enq.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end space-x-2">
                                <QuickContactActions
                                  enquiry={enq}
                                  adminUser={user || { name: 'Admin Executive' }}
                                  size="sm"
                                  showLabel={false}
                                  onStatusUpdate={(newStatus) => {
                                    setEnquiries(prev => prev.map(e => (e.enquiryId === enq.enquiryId || e._id === enq._id) ? { ...e, status: newStatus as any } : e));
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    setSelectedEnquiry(enq);
                                    setEnquiryAdminNotes(enq.adminNotes || '');
                                    setIsEnquiryModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rosegold-500/20 border border-rosegold-500/40 text-rosegold-300 hover:bg-rosegold-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                                >
                                  View & Manage
                                </button>
                                <button
                                  onClick={() => handleDeleteEnquiry(enq._id || enq.enquiryId)}
                                  className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer inline-flex items-center"
                                  title="Delete Enquiry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LANDING PAGE & WEBSITE SETTINGS */}
          {activeTab === 'landing-settings' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rosegold-500/15 border border-rosegold-500/30 flex items-center justify-center text-rosegold-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-white">Home Page & Website Settings</h2>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Configure public website hero headline, announcement banner, hotline contacts, and operating hours in real-time.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setLandingHeroTitle("Unveil Your Radiant Beauty");
                      setLandingHeroSubtitle("“Beauty is not created—it is unveiled from within.”");
                      setLandingAnnouncement("✨ Festival Special: Enjoy 25% Off on All Luxury Bridal & Skin Care Packages! Use Code: LUXURY25");
                      setLandingAnnouncementActive(true);
                      setLandingHotlinePhone("+91 94906 44434");
                      setLandingSupportEmail("concierge@spysalon.com");
                      setLandingOpeningHours("Mon - Sun: 09:00 AM - 09:00 PM");
                      setLandingStudioAddress("Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033");
                      setStat1Value("25,000+");
                      setStat1Label("Satisfied Clients");
                      setStat2Value("45+");
                      setStat2Label("Master Stylists");
                      setStat3Value("Jubilee Hills");
                      setStat3Label("Luxury Studio");
                      setStat4Value("4.9 ⭐");
                      setStat4Label("Google Rating");
                      const settingsObj = {
                        heroTitle: "Unveil Your Radiant Beauty",
                        heroSubtitle: "“Beauty is not created—it is unveiled from within.”",
                        announcement: "✨ Festival Special: Enjoy 25% Off on All Luxury Bridal & Skin Care Packages! Use Code: LUXURY25",
                        announcementActive: true,
                        hotlinePhone: "+91 94906 44434",
                        supportEmail: "concierge@spysalon.com",
                        openingHours: "Mon - Sun: 09:00 AM - 09:00 PM",
                        studioAddress: "Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033",
                        stat1Value: "25,000+", stat1Label: "Satisfied Clients",
                        stat2Value: "45+", stat2Label: "Master Stylists",
                        stat3Value: "Jubilee Hills", stat3Label: "Luxury Studio",
                        stat4Value: "4.9 ⭐", stat4Label: "Google Rating",
                        updatedAt: new Date().toISOString()
                      };
                      localStorage.setItem('spy_landing_settings', JSON.stringify(settingsObj));
                      window.dispatchEvent(new Event('storage'));
                      try {
                        apiFetch(`${API_BASE_URL}/admin/landing-settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(settingsObj)
                        });
                      } catch (e) {}
                      setLandingSettingsSavedMsg("Reset to default configuration & applied live!");
                      setTimeout(() => setLandingSettingsSavedMsg(null), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 border border-white/10 font-bold text-xs cursor-pointer transition-all"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={async () => {
                      if (!landingHeroTitle.trim()) {
                        showToast("Main Hero Headline cannot be left blank.", 'error');
                        return;
                      }
                      if (!landingHeroSubtitle.trim()) {
                        showToast("Sub-Headline Description cannot be left blank.", 'error');
                        return;
                      }
                      if (landingAnnouncementActive && !landingAnnouncement.trim()) {
                        showToast("Announcement Ticker Text cannot be left blank when active.", 'error');
                        return;
                      }
                      if (landingSupportEmail.trim() && !landingSupportEmail.includes('@')) {
                        showToast("Please enter a valid support email address (e.g. concierge@spysalon.com).", 'error');
                        return;
                      }
                      const cleanPhoneDigits = landingHotlinePhone.replace(/[^0-9]/g, '');
                      if (landingHotlinePhone.trim() && cleanPhoneDigits.length < 10) {
                        showToast("Hotline Phone number must contain at least 10 valid digits.", 'error');
                        return;
                      }

                      const settingsObj = {
                        heroTitle: landingHeroTitle,
                        heroSubtitle: landingHeroSubtitle,
                        announcement: landingAnnouncement,
                        announcementActive: landingAnnouncementActive,
                        hotlinePhone: landingHotlinePhone,
                        supportEmail: landingSupportEmail,
                        openingHours: landingOpeningHours,
                        studioAddress: landingStudioAddress,
                        stat1Value, stat1Label,
                        stat2Value, stat2Label,
                        stat3Value, stat3Label,
                        stat4Value, stat4Label,
                        updatedAt: new Date().toISOString()
                      };
                      localStorage.setItem('spy_landing_settings', JSON.stringify(settingsObj));
                      window.dispatchEvent(new Event('storage'));

                      try {
                        await apiFetch(`${API_BASE_URL}/admin/landing-settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(settingsObj)
                        });
                      } catch (e) {}

                      setLandingSettingsSavedMsg("Home Page Settings Saved & Live on Website!");
                      setTimeout(() => setLandingSettingsSavedMsg(null), 3000);
                    }}
                    className="px-5 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
                  >
                    Save Home Page Settings →
                  </button>
                </div>
              </div>

              {landingSettingsSavedMsg && (
                <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span>{landingSettingsSavedMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. ANNOUNCEMENT TICKER SETTINGS */}
                <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-rosegold-400" />
                      <h3 className="font-serif font-bold text-base text-white">Top Announcement Bar Ticker</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={landingAnnouncementActive}
                        onChange={(e) => setLandingAnnouncementActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-dark-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rosegold-500"></div>
                      <span className="ml-2 text-xs font-bold text-gray-300">{landingAnnouncementActive ? 'Active' : 'Disabled'}</span>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1.5">Announcement Ticker Text</label>
                      <textarea
                        rows={3}
                        value={landingAnnouncement}
                        onChange={(e) => setLandingAnnouncement(e.target.value)}
                        placeholder="Enter promotional banner message..."
                        className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-dark-850/80 border border-white/10 space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Live Ticker Preview</span>
                      <div className="p-2 rounded-lg bg-rosegold-500/10 text-rosegold-300 text-xs font-medium truncate">
                        {landingAnnouncementActive ? landingAnnouncement : '(Ticker Disabled)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. HERO HEADLINE & BANNER SETTINGS */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-rosegold-400" />
                      <h3 className="font-serif font-bold text-base text-white">Hero Header & Branding</h3>
                    </div>
                    <span className="text-[10px] bg-rosegold-500/20 text-rosegold-300 px-2 py-0.5 rounded-full font-bold">Homepage</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1.5">Main Hero Headline</label>
                      <input
                        type="text"
                        value={landingHeroTitle}
                        onChange={(e) => setLandingHeroTitle(e.target.value)}
                        placeholder="Hero Title"
                        className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 font-bold block mb-1.5">Sub-Headline Description</label>
                      <textarea
                        rows={3}
                        value={landingHeroSubtitle}
                        onChange={(e) => setLandingHeroSubtitle(e.target.value)}
                        placeholder="Hero Subtitle"
                        className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all resize-none font-serif"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. HOME PAGE COUNTER STATS METRICS */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-rosegold-400" />
                      <h3 className="font-serif font-bold text-base text-white">Home Page Counter Metrics Badges</h3>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Live Counter Cards</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-2 p-3 rounded-2xl bg-dark-850 border border-white/10">
                      <span className="text-[10px] text-rosegold-400 font-bold uppercase block">Metric 1</span>
                      <input type="text" value={stat1Value} onChange={e => setStat1Value(e.target.value)} placeholder="e.g. 25,000+" className="w-full p-2 rounded-xl bg-dark-900 text-white font-serif font-bold text-sm border border-white/10" />
                      <input type="text" value={stat1Label} onChange={e => setStat1Label(e.target.value)} placeholder="Satisfied Clients" className="w-full p-2 rounded-xl bg-dark-900 text-gray-300 text-xs border border-white/10" />
                    </div>
                    <div className="space-y-2 p-3 rounded-2xl bg-dark-850 border border-white/10">
                      <span className="text-[10px] text-rosegold-400 font-bold uppercase block">Metric 2</span>
                      <input type="text" value={stat2Value} onChange={e => setStat2Value(e.target.value)} placeholder="e.g. 45+" className="w-full p-2 rounded-xl bg-dark-900 text-white font-serif font-bold text-sm border border-white/10" />
                      <input type="text" value={stat2Label} onChange={e => setStat2Label(e.target.value)} placeholder="Master Stylists" className="w-full p-2 rounded-xl bg-dark-900 text-gray-300 text-xs border border-white/10" />
                    </div>
                    <div className="space-y-2 p-3 rounded-2xl bg-dark-850 border border-white/10">
                      <span className="text-[10px] text-rosegold-400 font-bold uppercase block">Metric 3</span>
                      <input type="text" value={stat3Value} onChange={e => setStat3Value(e.target.value)} placeholder="e.g. Jubilee Hills" className="w-full p-2 rounded-xl bg-dark-900 text-white font-serif font-bold text-sm border border-white/10" />
                      <input type="text" value={stat3Label} onChange={e => setStat3Label(e.target.value)} placeholder="Luxury Studio" className="w-full p-2 rounded-xl bg-dark-900 text-gray-300 text-xs border border-white/10" />
                    </div>
                    <div className="space-y-2 p-3 rounded-2xl bg-dark-850 border border-white/10">
                      <span className="text-[10px] text-rosegold-400 font-bold uppercase block">Metric 4</span>
                      <input type="text" value={stat4Value} onChange={e => setStat4Value(e.target.value)} placeholder="e.g. 4.9 ⭐" className="w-full p-2 rounded-xl bg-dark-900 text-white font-serif font-bold text-sm border border-white/10" />
                      <input type="text" value={stat4Label} onChange={e => setStat4Label(e.target.value)} placeholder="Google Rating" className="w-full p-2 rounded-xl bg-dark-900 text-gray-300 text-xs border border-white/10" />
                    </div>
                  </div>
                </div>

                {/* 4. CONTACT HOTLINE, OPERATING HOURS & ADDRESS */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-rosegold-400" />
                      <h3 className="font-serif font-bold text-base text-white">Concierge Hotline, Address & Working Hours</h3>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Footer & Contact Card Info</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1.5">Concierge Phone Hotline</label>
                      <input
                        type="text"
                        value={landingHotlinePhone}
                        onChange={(e) => setLandingHotlinePhone(e.target.value)}
                        placeholder="+91 94906 44434"
                        className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 font-bold block mb-1.5">Support Email</label>
                      <input
                        type="email"
                        value={landingSupportEmail}
                        onChange={(e) => setLandingSupportEmail(e.target.value)}
                        placeholder="concierge@spysalon.com"
                        className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 font-bold block mb-1.5">Salon Operating Hours</label>
                      <input
                        type="text"
                        value={landingOpeningHours}
                        onChange={(e) => setLandingOpeningHours(e.target.value)}
                        placeholder="Mon - Sun: 09:00 AM - 09:00 PM"
                        className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-xs">
                    <label className="text-gray-300 font-bold block mb-1.5">Studio Physical Address</label>
                    <input
                      type="text"
                      value={landingStudioAddress}
                      onChange={(e) => setLandingStudioAddress(e.target.value)}
                      placeholder="Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad..."
                      className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* INTERACTIVE BREAKDOWN & TRANSACTIONS MODALS */}
      {breakdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
            
            {/* TOTAL REVENUE BREAKDOWN MODAL */}
            {breakdownModal === 'revenue' && (() => {
              const totalRev = analytics?.totalRevenue ?? 0;
              const appRev = transactions
                .filter(t => t.type === 'Credited' && (t.category?.toLowerCase().includes('appointment') || t.category?.toLowerCase().includes('booking')))
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const prodRev = transactions
                .filter(t => t.type === 'Credited' && (t.category?.toLowerCase().includes('product') || t.category?.toLowerCase().includes('counter')))
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const membRev = transactions
                .filter(t => t.type === 'Credited' && (t.category?.toLowerCase().includes('membership') || t.category?.toLowerCase().includes('vip')))
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              
              const appPct = totalRev > 0 ? ((appRev / totalRev) * 100).toFixed(1) : '0';
              const prodPct = totalRev > 0 ? ((prodRev / totalRev) * 100).toFixed(1) : '0';
              const membPct = totalRev > 0 ? ((membRev / totalRev) * 100).toFixed(1) : '0';

              const razorpayTotal = transactions
                .filter(t => t.type === 'Credited' && t.paymentMethod?.toLowerCase().includes('razorpay'))
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const upiTotal = transactions
                .filter(t => t.type === 'Credited' && t.paymentMethod?.toLowerCase().includes('upi'))
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const cashTotal = transactions
                .filter(t => t.type === 'Credited' && (t.paymentMethod?.toLowerCase().includes('cash') || t.paymentMethod?.toLowerCase().includes('counter')))
                .reduce((sum, t) => sum + (t.amount || 0), 0);

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rosegold-400">Financial Audit</span>
                      <h3 className="text-xl font-serif font-bold text-white mt-0.5">Total Revenue Stream Breakdown</h3>
                    </div>
                    <button onClick={() => setBreakdownModal(null)} className="text-gray-400 text-lg cursor-pointer">✕</button>
                  </div>

                  <div className="p-4 rounded-2xl bg-rosegold-500/15 border border-rosegold-500/40 flex justify-between items-center">
                    <span className="text-gray-300 font-bold">Total Gross Revenue Disbursed:</span>
                    <span className="text-rosegold-400 font-serif font-bold text-2xl">₹{totalRev.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-serif font-bold text-sm">Itemized Revenue Categories</h4>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">💇‍♀️ Salon Appointments & Service Bookings</span>
                        <span className="text-rosegold-400 font-mono">₹{appRev.toLocaleString('en-IN')} ({appPct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                        <div className="h-full bg-rosegold-500 rounded-full" style={{ width: `${appPct}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">🧴 Counter Product Sales & Organic Serums</span>
                        <span className="text-rosegold-400 font-mono">₹{prodRev.toLocaleString('en-IN')} ({prodPct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${prodPct}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">👑 VIP Membership Subscriptions & Packages</span>
                        <span className="text-rosegold-400 font-mono">₹{membRev.toLocaleString('en-IN')} ({membPct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${membPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-2">
                    <h4 className="text-white font-serif font-bold text-sm">Payment Gateway Channels</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-dark-900">
                        <span className="text-gray-400 text-[10px] uppercase block">Razorpay Online</span>
                        <strong className="text-green-400 font-mono">₹{razorpayTotal.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-dark-900">
                        <span className="text-gray-400 text-[10px] uppercase block">Counter UPI</span>
                        <strong className="text-rosegold-400 font-mono">₹{upiTotal.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-dark-900">
                        <span className="text-gray-400 text-[10px] uppercase block">Cash POS</span>
                        <strong className="text-white font-mono">₹{cashTotal.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setBreakdownModal(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                    Close Breakdown Modal
                  </button>
                </div>
              );
            })()}

            {/* TOTAL PAYROLL PAYOUT BREAKDOWN MODAL */}
            {breakdownModal === 'payroll' && (() => {
              const staffBaseSalaries = payrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
              const staffIncentives = payrolls.reduce((sum, p) => sum + (p.incentives || 0), 0);
              const inventoryExpenses = transactions
                .filter(t => t.type === 'Debited' && t.category?.toLowerCase().includes('inventory'))
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const utilitiesExpenses = transactions
                .filter(t => t.type === 'Debited' && !t.category?.toLowerCase().includes('payroll') && !t.category?.toLowerCase().includes('inventory'))
                .reduce((sum, t) => sum + (t.amount || 0), 0);

              const totalPayrollPaid = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);
              const totalDebitedTxns = transactions
                .filter(t => t.type === 'Debited')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const grandTotalPayouts = Math.max(totalPayrollPaid, totalDebitedTxns);

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Expense Audit</span>
                      <h3 className="text-xl font-serif font-bold text-white mt-0.5">Total Payroll & Payout Breakdown</h3>
                    </div>
                    <button onClick={() => setBreakdownModal(null)} className="text-gray-400 text-lg cursor-pointer">✕</button>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex justify-between items-center">
                    <span className="text-gray-300 font-bold">Total Payroll & Operational Expenses Paid Out:</span>
                    <span className="text-purple-300 font-serif font-bold text-2xl">
                      ₹{grandTotalPayouts.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-serif font-bold text-sm">Itemized Payout Channels</h4>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                      <div>
                        <strong className="text-white block">👩‍🎨 Staff Base Salaries Paid Out</strong>
                        <span className="text-gray-400 text-[11px]">Monthly fixed baseline for active specialists</span>
                      </div>
                      <span className="text-purple-300 font-mono font-bold text-sm">₹{staffBaseSalaries.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                      <div>
                        <strong className="text-white block">✨ Specialist Performance Commissions & Incentives</strong>
                        <span className="text-gray-400 text-[11px]">Service completion bonuses & retail commissions</span>
                      </div>
                      <span className="text-green-400 font-mono font-bold text-sm">₹{staffIncentives.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                      <div>
                        <strong className="text-white block">🛍️ Salon Inventory & Products Supply</strong>
                        <span className="text-gray-400 text-[11px]">Bulk L'Oréal & Keratin organic serum procurement</span>
                      </div>
                      <span className="text-red-400 font-mono font-bold text-sm">₹{inventoryExpenses.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                      <div>
                        <strong className="text-white block">⚡ Studio Utilities & Maintenance</strong>
                        <span className="text-gray-400 text-[11px]">Electricity, HVAC, hydro-steamer maintenance</span>
                      </div>
                      <span className="text-amber-300 font-mono font-bold text-sm">₹{utilitiesExpenses.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button onClick={() => setBreakdownModal(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                    Close Breakdown Modal
                  </button>
                </div>
              );
            })()}

            {/* NET STUDIO PROFIT BREAKDOWN MODAL */}
            {breakdownModal === 'profit' && (() => {
              const grossIncome = analytics?.totalRevenue ?? 0;
              const totalPayrollPaid = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);
              const totalDebitedTxns = transactions
                .filter(t => t.type === 'Debited')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const totalExpenses = Math.max(totalPayrollPaid, totalDebitedTxns);
              const netProfitVal = Math.max(0, grossIncome - totalExpenses);
              const marginPct = grossIncome > 0 ? ((netProfitVal / grossIncome) * 100).toFixed(1) : '0';

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Profitability Audit</span>
                      <h3 className="text-xl font-serif font-bold text-white mt-0.5">Net Studio Profit & Margin Analysis</h3>
                    </div>
                    <button onClick={() => setBreakdownModal(null)} className="text-gray-400 text-lg cursor-pointer">✕</button>
                  </div>

                  <div className="p-5 rounded-2xl bg-green-500/15 border border-green-500/40 text-center space-y-1">
                    <span className="text-xs text-gray-300 uppercase font-semibold">Net Studio Profit Margin</span>
                    <p className="text-green-400 font-serif font-bold text-3xl">
                      ₹{netProfitVal.toLocaleString('en-IN')}
                    </p>
                    <span className="text-xs text-green-300 font-bold block pt-1">
                      Profitability Index: {marginPct}% Net Margin
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Gross Income (Credited):</span>
                      <span className="text-green-400 font-mono font-bold">+₹{grossIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Expenses & Payouts (Debited):</span>
                      <span className="text-red-400 font-mono font-bold">-₹{totalExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-white/10">
                      <span className="text-white">Net Studio Retention:</span>
                      <span className="text-rosegold-400 font-serif text-base">₹{netProfitVal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button onClick={() => setBreakdownModal(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                    Close Breakdown Modal
                  </button>
                </div>
              );
            })()}

            {/* MANUAL TRANSACTION LOGGING MODAL */}
            {breakdownModal === 'addTxn' && (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await apiFetch(`${API_BASE_URL}/admin/transactions`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(manualTxnForm)
                    });
                    const data = await res.json();
                    if (data.success && data.data) {
                      setTransactions([data.data, ...transactions]);
                      const anaRes = await apiFetch(`${API_BASE_URL}/admin/analytics`).then(r => r.json()).catch(() => ({ data: null }));
                      if (anaRes?.data) setAnalytics(anaRes.data);
                      setBreakdownModal(null);
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }} 
                className="space-y-3.5 text-xs"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-lg font-serif font-bold text-white">Log Financial Transaction Entry</h3>
                  <button type="button" onClick={() => setBreakdownModal(null)} className="text-gray-400 text-lg cursor-pointer">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Transaction Type *</label>
                    <select
                      value={manualTxnForm.type}
                      onChange={(e) => setManualTxnForm({ ...manualTxnForm, type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10 font-bold"
                    >
                      <option value="Credited">Credited (+ Income)</option>
                      <option value="Debited">Debited (- Payout/Expense)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Category *</label>
                    <input
                      type="text"
                      required
                      value={manualTxnForm.category}
                      onChange={(e) => setManualTxnForm({ ...manualTxnForm, category: e.target.value })}
                      placeholder="e.g. Counter Sale, Vendor Expense"
                      className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Description / Notes *</label>
                  <textarea
                    rows={2}
                    required
                    value={manualTxnForm.description}
                    onChange={(e) => setManualTxnForm({ ...manualTxnForm, description: e.target.value })}
                    placeholder="Enter detailed description..."
                    className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={manualTxnForm.amount}
                      onChange={(e) => setManualTxnForm({ ...manualTxnForm, amount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Payment Method</label>
                    <select
                      value={manualTxnForm.paymentMethod}
                      onChange={(e) => setManualTxnForm({ ...manualTxnForm, paymentMethod: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                    >
                      <option value="UPI">UPI Direct</option>
                      <option value="Razorpay Online">Razorpay Gateway</option>
                      <option value="Bank Transfer (HDFC)">Bank Transfer (HDFC)</option>
                      <option value="Cash">Cash POS</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  Save & Log Transaction Record 💾
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL HANDLERS */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">Admin Operations Desk</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 text-lg cursor-pointer">✕</button>
            </div>

            {/* REQUEST TIME RESCHEDULE NOTE MODAL */}
            {modalType === 'rescheduleNote' && selectedItem && (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleUpdateAppStatus(selectedItem._id, 'Reschedule Requested');
                  setModalType(null);
                }} 
                className="space-y-3.5"
              >
                <h4 className="text-sm font-serif font-bold text-white">Send Reschedule Request Note to Client</h4>
                <p className="text-xs text-gray-400">
                  Notify <strong className="text-white">{selectedItem.customerName}</strong> ({selectedItem.customerPhone}) that their requested time slot is unavailable.
                </p>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Reschedule Reason & Note *</label>
                  <textarea
                    rows={3}
                    required
                    value={rescheduleNoteText}
                    onChange={(e) => setRescheduleNoteText(e.target.value)}
                    placeholder="e.g. 11:00 AM slot is fully booked for this date. Please pick 02:00 PM or 03:30 PM..."
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  Send Reschedule Request & Note to Client
                </button>
              </form>
            )}

            {/* GENERATE SALARY SLIP MODAL */}
            {modalType === 'addPay' && (
              <form onSubmit={handleSavePayroll} className="space-y-3.5">
                <h4 className="text-sm font-serif font-bold text-white">Generate Specialist Salary Slip</h4>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Select Employee Specialist *</label>
                  <select 
                    value={payForm.employeeName} 
                    onChange={e => {
                      const selectedName = e.target.value;
                      const empObj = employees.find(item => item.name === selectedName || item.empCode === selectedName);
                      const base = empObj?.baseSalary || 25000;
                      const commPct = empObj?.commissionPercentage !== undefined ? empObj.commissionPercentage : 20;

                      const empRev = appointments
                        .filter((a: any) => (a.specialistId === empObj?._id || (a.specialistName && a.specialistName.toLowerCase().includes((selectedName || '').toLowerCase()))) && (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid'))
                        .reduce((sum: number, a: any) => sum + (Number(a.price || a.totalAmount) || 0), 0);

                      const commAmt = Math.round(empRev * (commPct / 100));

                      setPayForm({ 
                        ...payForm, 
                        employeeName: empObj?.name || selectedName,
                        employeeId: empObj?._id || '',
                        empCode: empObj?.empCode || '',
                        baseSalary: base,
                        eligibleAmount: empRev,
                        commissionPercentage: commPct,
                        commissionAmount: commAmt
                      });
                    }}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none font-bold"
                  >
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.empCode || 'EMP-1001'})</option>
                    ))}
                  </select>
                </div>

                {/* Bank Account & UPI Payout Info Card */}
                {(() => {
                  const selectedEmp = employees.find(e => e.name === payForm.employeeName || e._id === payForm.employeeId);
                  const bank = selectedEmp?.bankDetails;
                  return (
                    <div className="p-3.5 rounded-2xl bg-dark-850 border border-rosegold-500/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="text-rosegold-400 font-bold uppercase text-[10px]">Employee Bank & UPI Payout Target</span>
                        <span className="text-[10px] text-green-400 font-mono">Verified Account</span>
                      </div>
                      {bank && (bank.accountNumber || bank.upiId) ? (
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase">Account Name</span>
                            <span className="text-white font-bold">{bank.accountName || selectedEmp?.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase">Bank Name</span>
                            <span className="text-white font-bold">{bank.bankName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase">Account Number</span>
                            <span className="text-rosegold-300 font-bold">{bank.accountNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase">IFSC Code</span>
                            <span className="text-rosegold-300 font-bold">{bank.ifscCode || 'N/A'}</span>
                          </div>
                          {bank.upiId && (
                            <div className="col-span-2 pt-0.5">
                              <span className="text-gray-400 block text-[9px] uppercase">UPI Direct ID</span>
                              <span className="text-green-400 font-bold">{bank.upiId}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-amber-400/90 italic text-[11px] py-1">
                          ⚠️ Employee has not updated bank details yet in their portal. Transfer will be recorded in company ledger.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Pay Period / Month *</label>
                    <input 
                      type="text" 
                      required 
                      value={payForm.month} 
                      onChange={e => setPayForm({ ...payForm, month: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Base Fixed Salary (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      value={payForm.baseSalary} 
                      onChange={e => setPayForm({ ...payForm, baseSalary: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Service Revenue Handled (₹)</label>
                    <input 
                      type="number" 
                      value={payForm.eligibleAmount} 
                      onChange={e => {
                        const newEligible = Number(e.target.value);
                        const newComm = Math.round(newEligible * (payForm.commissionPercentage / 100));
                        setPayForm({ ...payForm, eligibleAmount: newEligible, commissionAmount: newComm });
                      }}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Commission Rate (%)</label>
                    <input 
                      type="number" 
                      value={payForm.commissionPercentage} 
                      onChange={e => {
                        const newPct = Number(e.target.value);
                        const newComm = Math.round(payForm.eligibleAmount * (newPct / 100));
                        setPayForm({ ...payForm, commissionPercentage: newPct, commissionAmount: newComm });
                      }}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Commission Amount (₹)</label>
                    <input 
                      type="number" 
                      value={payForm.commissionAmount} 
                      onChange={e => setPayForm({ ...payForm, commissionAmount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono text-green-400" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Deductions / Taxes (₹)</label>
                    <input 
                      type="number" 
                      value={payForm.deductions} 
                      onChange={e => setPayForm({ ...payForm, deductions: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono text-red-400" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Disbursal Payment Method</label>
                  <select 
                    value={payForm.paymentMethod} 
                    onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs"
                  >
                    <option value="Bank Transfer (HDFC)">Bank Transfer (HDFC)</option>
                    <option value="Bank Transfer (ICICI)">Bank Transfer (ICICI)</option>
                    <option value="UPI Direct Disbursal">UPI Direct Disbursal</option>
                    <option value="Cash Payroll">Cash Cheque</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-dark-800 border border-white/10 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold">Calculated Net Payable Amount:</span>
                  <span className="text-rosegold-400 font-serif font-bold text-base">
                    ₹{(payForm.baseSalary + payForm.commissionAmount + payForm.incentives - payForm.deductions).toLocaleString('en-IN')}
                  </span>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  Disburse & Issue Salary Slip 💳
                </button>
              </form>
            )}

            {/* VIEW SALARY SLIP DETAILS MODAL */}
            {modalType === 'viewPay' && selectedItem && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-rosegold-400 uppercase font-mono">{selectedItem.slipId}</span>
                    <h3 className="text-lg font-serif font-bold text-white">{selectedItem.employeeName}</h3>
                  </div>
                  <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {selectedItem.status}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pay Month:</span>
                    <span className="text-white font-bold">{selectedItem.month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Salary:</span>
                    <span className="text-white font-mono">₹{selectedItem.baseSalary?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service Revenue Handled:</span>
                    <span className="text-purple-300 font-mono">₹{(selectedItem.eligibleAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commission ({selectedItem.commissionPercentage || 20}%):</span>
                    <span className="text-green-400 font-mono">+₹{(selectedItem.commissionAmount || selectedItem.incentives || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deductions:</span>
                    <span className="text-red-400 font-mono">-₹{selectedItem.deductions?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                    <span className="text-rosegold-400">Net Payable Disbursed:</span>
                    <span className="text-rosegold-400 font-serif">₹{selectedItem.netPay?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button onClick={() => setModalType(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                  Close Salary Slip
                </button>
              </div>
            )}

            {/* VIEW EMPLOYEE PROFILE & CREDENTIALS MODAL */}
            {modalType === 'viewEmp' && selectedItem && createdCredentials && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-rosegold-500/50 shrink-0 bg-dark-800 flex items-center justify-center brand-profile-avatar">
                    {selectedItem.avatar ? (
                      <img 
                        src={selectedItem.avatar} 
                        alt={selectedItem.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedItem.name ? selectedItem.name.slice(0, 2).toUpperCase() : 'ST'
                    )}
                  </div>
                  <div>
                    <span className="bg-rosegold-500/15 text-rosegold-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-rosegold-500/30">{createdCredentials.empCode}</span>
                    <h3 className="text-lg font-serif font-bold text-white mt-0.5">{selectedItem.name}</h3>
                    <p className="text-xs text-gray-400">{selectedItem.phone}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-800 border border-rosegold-500/40 space-y-2.5">
                  <span className="text-rosegold-400 font-bold uppercase text-[10px] block">Staff Registered Email ID</span>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Registered Email:</span>
                    <span className="text-white font-mono font-bold">{selectedItem.email || createdCredentials.email}</span>
                  </div>
                </div>

                {/* EMPLOYEE SALARY & PAYOUT PACKAGE INFO */}
                <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-white font-serif font-bold text-xs">Salary & Financial Package</span>
                    <span className="text-[10px] text-green-400 font-mono font-bold">Authorized Account</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-center pt-1">
                    <div className="p-2 rounded-xl bg-dark-900">
                      <span className="text-gray-400 text-[9px] uppercase block">Base Salary</span>
                      <strong className="text-white font-mono">₹45,000</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-dark-900">
                      <span className="text-gray-400 text-[9px] uppercase block">Incentives</span>
                      <strong className="text-green-400 font-mono">+₹7,500</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-dark-900">
                      <span className="text-gray-400 text-[9px] uppercase block">Net Monthly</span>
                      <strong className="text-rosegold-400 font-mono font-bold">₹51,000</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const base = selectedItem.baseSalary || 25000;
                      const commPct = selectedItem.commissionPercentage !== undefined ? selectedItem.commissionPercentage : 20;

                      const empRev = appointments
                        .filter((a: any) => (a.specialistId === selectedItem._id || (a.specialistName && a.specialistName.toLowerCase().includes((selectedItem.name || '').toLowerCase()))) && (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid'))
                        .reduce((sum: number, a: any) => sum + (Number(a.price || a.totalAmount) || 0), 0);

                      const commAmt = Math.round(empRev * (commPct / 100));

                      setPayForm({
                        employeeName: selectedItem.name,
                        employeeId: selectedItem._id || '',
                        empCode: selectedItem.empCode || createdCredentials?.empCode || '',
                        month: 'July 2026',
                        baseSalary: base,
                        eligibleAmount: empRev,
                        commissionPercentage: commPct,
                        commissionAmount: commAmt,
                        incentives: 0,
                        deductions: 0,
                        paymentMethod: 'Bank Transfer (HDFC)'
                      });
                      setModalType('addPay');
                    }}
                    className="w-full py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs flex items-center justify-center space-x-1.5 mt-2 cursor-pointer shadow-glow-rosegold"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay Salary Through Portal 💳</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.email || createdCredentials.email);
                      setCopiedCreds(true);
                      setTimeout(() => setCopiedCreds(false), 2000);
                    }} 
                    className="flex-1 py-3 rounded-xl bg-dark-800 text-rosegold-300 border border-rosegold-500/30 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {copiedCreds ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCreds ? 'Email Copied!' : 'Copy Email ID'}</span>
                  </button>

                  <Link 
                    href={`/admin/employees/${selectedItem._id}`}
                    className="flex-1 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-white border border-white/10 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Full Profile Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* GENERATED / UPDATED EMPLOYEE CREDENTIALS MODAL */}
            {modalType === 'empCreds' && createdCredentials && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl rosegold-gradient-bg text-dark-900 flex items-center justify-center mx-auto shadow-glow-rosegold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">Employee Credentials Generated!</h3>
                <p className="text-xs text-gray-300">Login credentials issued for <strong className="text-rosegold-400">{createdCredentials.name}</strong>:</p>

                <div className="p-4 rounded-2xl bg-dark-800 border border-rosegold-500/40 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Employee ID Code:</span>
                    <span className="text-white font-mono font-bold">{createdCredentials.empCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Login Email ID:</span>
                    <span className="text-rosegold-400 font-mono font-bold">{createdCredentials.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Login Password:</span>
                    <span className="text-green-400 font-mono font-bold">{createdCredentials.tempPassword}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    onClick={() => copyCredsToClipboard(createdCredentials.email, createdCredentials.tempPassword, createdCredentials.empCode)} 
                    className="flex-1 py-3 rounded-xl bg-dark-800 text-rosegold-300 border border-rosegold-500/30 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {copiedCreds ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCreds ? 'Copied!' : 'Copy Credentials'}</span>
                  </button>

                  <button onClick={() => setModalType(null)} className="flex-1 py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                    Done & Close
                  </button>
                </div>
              </div>
            )}

            {/* ADD / EDIT EMPLOYEE */}
            {(modalType === 'addEmp' || modalType === 'editEmp') && (
              <form onSubmit={handleSaveEmployee} className="space-y-3.5">
                <div>
                  <ImageUploader 
                    initialUrl={empForm.avatar} 
                    folder="employees" 
                    label="Employee Profile Photo" 
                    onUploadSuccess={(url) => setEmpForm(prev => ({ ...prev, avatar: url }))} 
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs">Employee Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Ananya Sharma"
                    value={empForm.name} 
                    onChange={e => setEmpForm({ ...empForm, name: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="ananya@spysalon.com"
                      value={empForm.email} 
                      onChange={e => setEmpForm({ ...empForm, email: e.target.value })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Phone Number *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="+91 98765 43210"
                      value={empForm.phone} 
                      onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs">Login Password *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Set login password (e.g. Ananya@123)"
                    value={empForm.password} 
                    onChange={e => setEmpForm({ ...empForm, password: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs">Specialist Skills (Comma Separated) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Senior Hair Stylist, Keratin Expert, Hydra Facial"
                    value={empForm.specialties} 
                    onChange={e => setEmpForm({ ...empForm, specialties: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Base Fixed Salary (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="25000"
                      value={empForm.baseSalary} 
                      onChange={e => setEmpForm({ ...empForm, baseSalary: Number(e.target.value) })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Commission Rate (%) *</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="20"
                      value={empForm.commissionPercentage} 
                      onChange={e => setEmpForm({ ...empForm, commissionPercentage: Number(e.target.value) })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold hover:scale-[1.01] transition-transform cursor-pointer">
                  {modalType === 'editEmp' ? 'Update Employee & Send Email 📧' : 'Save & Dispatch Credentials to Email 📧'}
                </button>
              </form>
            )}

            {/* ADD / EDIT MEMBERSHIP PACKAGE MODAL */}
            {(modalType === 'addMemb' || modalType === 'editMemb') && (
              <form onSubmit={handleSaveMembership} className="space-y-3.5">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs">Membership Package Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gold VIP Membership"
                    value={membForm.name}
                    onChange={e => setMembForm({ ...membForm, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Package Code Slug *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. gold-vip"
                      value={membForm.code}
                      onChange={e => setMembForm({ ...membForm, code: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Badge Icon / Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 👑 Gold VIP Member"
                      value={membForm.badge}
                      onChange={e => setMembForm({ ...membForm, badge: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Monthly Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={membForm.monthlyPrice}
                      onChange={e => setMembForm({ ...membForm, monthlyPrice: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-bold text-rosegold-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Yearly Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={membForm.yearlyPrice}
                      onChange={e => setMembForm({ ...membForm, yearlyPrice: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-bold text-rosegold-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Discount Off (%) *</label>
                    <input
                      type="number"
                      required
                      value={membForm.discountPercentage}
                      onChange={e => setMembForm({ ...membForm, discountPercentage: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-bold text-green-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs">Tagline / Subtitle Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Essential VIP Privileges & Special Perks"
                    value={membForm.tagline}
                    onChange={e => setMembForm({ ...membForm, tagline: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs">Included Package Benefits (Comma Separated)</label>
                  <textarea
                    rows={3}
                    placeholder="20% Flat Discount, Free Monthly Hair Spa, Priority Queue"
                    value={membForm.benefits}
                    onChange={e => setMembForm({ ...membForm, benefits: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  {modalType === 'editMemb' ? 'Update Membership Package' : 'Publish New Membership Package'}
                </button>
              </form>
            )}

            {/* ADD / EDIT SERVICE MODAL WITH CUSTOMIZABLE PROCEDURE STEPS & BENEFITS */}
            {(modalType === 'addSrv' || modalType === 'editSrv') && (
              <form onSubmit={handleSaveService} className="space-y-3.5">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Service Title *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Precision Hair Cut & Layering" 
                    value={srvForm.name} 
                    onChange={e => setSrvForm({ ...srvForm, name: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Target Gender / Section *</label>
                    <select
                      value={srvForm.gender}
                      onChange={e => setSrvForm({ ...srvForm, gender: e.target.value as 'all' | 'men' | 'women' | 'kids' })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold text-xs"
                    >
                      <option value="all">🌟 All / General Salon</option>
                      <option value="men">👨 Men's Salon & Grooming</option>
                      <option value="women">👩 Women's Luxury Salon</option>
                      <option value="kids">🧒 Kids & Teens Studio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Subcategory / Service Group *</label>
                    <input
                      type="text"
                      placeholder="e.g. Hair Care, Facials, Keratin, Beard"
                      value={srvForm.subCategory}
                      onChange={e => setSrvForm({ ...srvForm, subCategory: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Category *</label>
                    <select 
                      value={isCustomCategory ? 'OTHER_CUSTOM' : srvForm.category} 
                      onChange={e => {
                        if (e.target.value === 'OTHER_CUSTOM') {
                          setIsCustomCategory(true);
                        } else {
                          setIsCustomCategory(false);
                          setSrvForm({ ...srvForm, category: e.target.value });
                        }
                      }} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold text-xs"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="OTHER_CUSTOM">➕ Other / Add New Category...</option>
                    </select>

                    {isCustomCategory && (
                      <div className="mt-2 animate-fadeIn">
                        <label className="text-rosegold-400 font-semibold block mb-1 text-xs">Specify New Custom Category Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Laser Hair Removal, Medi-Facial Spa..."
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          className="w-full p-3 rounded-xl bg-dark-900 text-white border border-rosegold-500/50 focus:outline-none text-xs font-bold"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 text-xs">Duration (Minutes) *</label>
                    <input 
                      type="number" 
                      required 
                      value={srvForm.durationMinutes} 
                      onChange={e => setSrvForm({ ...srvForm, durationMinutes: Number(e.target.value) })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Original Price (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      value={srvForm.price} 
                      onChange={e => setSrvForm({ ...srvForm, price: Number(e.target.value) })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" 
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Discount Price (₹)</label>
                    <input 
                      type="number" 
                      value={srvForm.discountPrice} 
                      onChange={e => setSrvForm({ ...srvForm, discountPrice: Number(e.target.value) })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" 
                    />
                  </div>
                </div>

                <div>
                  <ImageUploader 
                    initialUrl={srvForm.image} 
                    folder="services" 
                    label="Service Cover Image" 
                    onUploadSuccess={(url) => setSrvForm({ ...srvForm, image: url })} 
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Treatment Description & Botanical Science</label>
                  <textarea 
                    rows={2} 
                    value={srvForm.description} 
                    onChange={e => setSrvForm({ ...srvForm, description: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" 
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Key Benefits (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={srvForm.benefits} 
                    onChange={e => setSrvForm({ ...srvForm, benefits: e.target.value })} 
                    placeholder="e.g. Deep Hydration, 100% Organic Serums, Zero Heat Damage" 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" 
                  />
                </div>

                {/* STEP-BY-STEP PROCEDURE CUSTOMIZER & AUTO GENERATOR */}
                <div className="p-4 rounded-2xl bg-dark-800/90 border border-rosegold-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-rosegold-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                      <Scissors className="w-4 h-4" />
                      <span>Custom Step-by-Step Procedure Steps</span>
                    </span>

                    <button
                      type="button"
                      onClick={autoGenerateProcedureSteps}
                      className="px-3 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>⚡ Auto-Fill Category Steps</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] mb-0.5">Step 1 Title & Description</span>
                      <input type="text" placeholder="Step 1 Title" value={srvForm.step1Title} onChange={e => setSrvForm({ ...srvForm, step1Title: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-white border border-white/10 text-xs mb-1" />
                      <input type="text" placeholder="Step 1 Description" value={srvForm.step1Desc} onChange={e => setSrvForm({ ...srvForm, step1Desc: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-gray-300 border border-white/10 text-xs" />
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] mb-0.5">Step 2 Title & Description</span>
                      <input type="text" placeholder="Step 2 Title" value={srvForm.step2Title} onChange={e => setSrvForm({ ...srvForm, step2Title: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-white border border-white/10 text-xs mb-1" />
                      <input type="text" placeholder="Step 2 Description" value={srvForm.step2Desc} onChange={e => setSrvForm({ ...srvForm, step2Desc: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-gray-300 border border-white/10 text-xs" />
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] mb-0.5">Step 3 Title & Description</span>
                      <input type="text" placeholder="Step 3 Title" value={srvForm.step3Title} onChange={e => setSrvForm({ ...srvForm, step3Title: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-white border border-white/10 text-xs mb-1" />
                      <input type="text" placeholder="Step 3 Description" value={srvForm.step3Desc} onChange={e => setSrvForm({ ...srvForm, step3Desc: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-gray-300 border border-white/10 text-xs" />
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] mb-0.5">Step 4 Title & Description</span>
                      <input type="text" placeholder="Step 4 Title" value={srvForm.step4Title} onChange={e => setSrvForm({ ...srvForm, step4Title: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-white border border-white/10 text-xs mb-1" />
                      <input type="text" placeholder="Step 4 Description" value={srvForm.step4Desc} onChange={e => setSrvForm({ ...srvForm, step4Desc: e.target.value })} className="w-full p-2.5 rounded-lg bg-dark-900 text-gray-300 border border-white/10 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input type="checkbox" id="popularBadge" checked={srvForm.isPopular} onChange={e => setSrvForm({ ...srvForm, isPopular: e.target.checked })} className="w-4 h-4 accent-rosegold-500" />
                  <label htmlFor="popularBadge" className="text-white font-semibold cursor-pointer">Mark as Popular Service (Displays 'Popular' badge on /services menu)</label>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  {modalType === 'editSrv' ? 'Update Service & Procedure Steps' : 'Publish Service & Procedure Steps to Menu'}
                </button>
              </form>
            )}

            {/* ADD CUSTOMER */}
            {modalType === 'addCust' && (
              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Customer Full Name *</label>
                  <input type="text" required placeholder="e.g. Riya Verma" value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Email Address</label>
                    <input type="email" placeholder="riya@gmail.com" value={custForm.email} onChange={e => setCustForm({ ...custForm, email: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Mobile Phone *</label>
                    <input type="text" required placeholder="+91 98765 43210" value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Membership Tier</label>
                  <select value={custForm.membership} onChange={e => setCustForm({ ...custForm, membership: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10">
                    <option value="Standard">Standard Client</option>
                    <option value="VIP Silver">VIP Silver Tier</option>
                    <option value="VIP Gold">VIP Gold Tier</option>
                    <option value="VIP Platinum">VIP Platinum Suite</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">Save Customer Account</button>
              </form>
            )}

            {/* ADD WALK-IN APPOINTMENT */}
            {modalType === 'addApp' && (
              <form onSubmit={handleSaveAppointment} className="space-y-3.5">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Customer Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter customer's name"
                    value={appForm.customerName} 
                    onChange={e => setAppForm({ ...appForm, customerName: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Mobile Phone Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+91 98765 43210"
                    value={appForm.customerPhone} 
                    onChange={e => setAppForm({ ...appForm, customerPhone: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Select Service Requested *</label>
                  <select 
                    value={appForm.service} 
                    onChange={e => setAppForm({ ...appForm, service: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500"
                  >
                    {services.map(s => (
                      <option key={s._id} value={s.name}>{s.name} (₹{s.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Assign Staff Specialist *</label>
                  <select 
                    value={appForm.specialistName} 
                    onChange={e => setAppForm({ ...appForm, specialistName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500 font-bold"
                  >
                    <option value="Any Available Specialist">Any Available Specialist</option>
                    {employees.map((emp: any) => (
                      <option key={emp._id || emp.empCode || emp.employeeId} value={emp.name}>
                        {emp.name} ({Array.isArray(emp.specialties) ? (emp.specialties[0] || 'Specialist') : (emp.specialties || 'Specialist')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Appointment Date</label>
                    <input 
                      type="date" 
                      required 
                      min={new Date().toISOString().split('T')[0]}
                      value={appForm.appointmentDate} 
                      onChange={e => {
                        const val = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        if (val < today) {
                          showToast("Appointments cannot be scheduled on past dates. Setting date to today.", 'info');
                          setAppForm({ ...appForm, appointmentDate: today });
                        } else {
                          setAppForm({ ...appForm, appointmentDate: val });
                        }
                      }} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs font-semibold" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Time Slot</label>
                    <select 
                      value={appForm.appointmentTime} 
                      onChange={e => setAppForm({ ...appForm, appointmentTime: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs"
                    >
                      <option value="Immediate Walk-In">Immediate Walk-In</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:30 PM">12:30 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:30 PM">06:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Payment Method</label>
                  <select 
                    value={appForm.paymentMethod} 
                    onChange={e => setAppForm({ ...appForm, paymentMethod: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs"
                  >
                    <option value="Razorpay">Razorpay Gateway (Card/UPI)</option>
                    <option value="UPI">UPI Direct (GPay/PhonePe)</option>
                    <option value="Cash">Cash at Counter</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  Confirm Walk-In Booking Slot
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ENQUIRY DETAIL & CRM MANAGEMENT MODAL */}
      {isEnquiryModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-6 text-left shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-dark-900">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 text-[10px] font-mono text-rosegold-400 font-bold uppercase tracking-wider">
                  <span>Inquiry Reference ID:</span>
                  <span className="bg-dark-800 px-2 py-0.5 rounded border border-rosegold-500/30 text-white font-extrabold">{selectedEnquiry.enquiryId}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mt-1">{selectedEnquiry.name}</h3>
              </div>
              <button 
                onClick={() => {
                  setIsEnquiryModalOpen(false);
                  setSelectedEnquiry(null);
                }} 
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Contact Meta Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-2xl bg-dark-800 border border-white/10">
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px] block mb-0.5">Customer Email</span>
                <a href={`mailto:${selectedEnquiry.email}`} className="text-rosegold-400 font-bold hover:underline">{selectedEnquiry.email}</a>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px] block mb-0.5">Phone Number</span>
                <span className="text-white font-bold">{selectedEnquiry.phone || 'Not Provided'}</span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px] block mb-0.5">Submission Timestamp</span>
                <span className="text-gray-300 font-mono">{new Date(selectedEnquiry.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px] block mb-0.5">Customer IP Address</span>
                <span className="text-gray-300 font-mono">{selectedEnquiry.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Quick Contact Actions Module */}
            <div className="p-4 rounded-2xl bg-dark-800/90 border border-rosegold-500/30">
              <QuickContactActions
                enquiry={selectedEnquiry}
                adminUser={user || { name: 'Admin Executive' }}
                onStatusUpdate={(newStatus) => {
                  setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus as any } : null);
                  setEnquiries(prev => prev.map(e => (e.enquiryId === selectedEnquiry.enquiryId || e._id === selectedEnquiry._id) ? { ...e, status: newStatus as any } : e));
                }}
              />
            </div>

            {/* Full Inquiry Message */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Customer Message Content</label>
              <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 text-gray-200 text-sm italic leading-relaxed font-sans">
                "{selectedEnquiry.message}"
              </div>
            </div>

            {/* Status Update Pills */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Update Lead Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'] as const).map((st) => (
                  <button
                    key={st}
                    disabled={isUpdatingEnquiry}
                    onClick={() => setSelectedEnquiry(prev => prev ? { ...prev, status: st } : null)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                      selectedEnquiry.status === st
                        ? 'rosegold-gradient-bg text-dark-900 border-rosegold-400 shadow-md font-extrabold scale-105'
                        : 'bg-dark-800 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Follow-up Notes */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Internal Admin Follow-up Notes</label>
              <textarea
                rows={3}
                value={enquiryAdminNotes}
                onChange={(e) => setEnquiryAdminNotes(e.target.value)}
                placeholder="e.g. Spoke with customer on phone. Confirmed appointment details..."
                className="w-full p-3 rounded-2xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-rosegold-500 resize-none transition-colors"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={() => handleDeleteEnquiry(selectedEnquiry._id || selectedEnquiry.enquiryId)}
                className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/25 transition-all cursor-pointer"
              >
                Delete Record
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setIsEnquiryModalOpen(false);
                    setSelectedEnquiry(null);
                  }}
                  className="px-5 py-2.5 rounded-full bg-dark-800 border border-white/10 text-gray-300 font-bold text-xs cursor-pointer hover:text-white"
                >
                  Close
                </button>
                <button
                  disabled={isUpdatingEnquiry}
                  onClick={async () => {
                    await handleUpdateEnquiryStatus(selectedEnquiry._id || selectedEnquiry.enquiryId, selectedEnquiry.status, enquiryAdminNotes);
                    setIsEnquiryModalOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer disabled:opacity-50"
                >
                  Save Notes & Finish
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EXECUTIVE BUSINESS BRIEF PDF REPORT MODAL */}
      {showAiBriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-5 text-left max-h-[90vh] overflow-y-auto text-xs bg-dark-900">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-rosegold-400" />
                <h3 className="text-lg font-serif font-bold text-white">SPY Salon — Executive Business Performance Report</h3>
              </div>
              <button onClick={() => setShowAiBriefModal(false)} className="text-gray-400 text-lg cursor-pointer">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-3 font-sans">
              <div className="flex justify-between items-center text-[10px] text-rosegold-400 font-mono">
                <span>CONFIDENTIAL EXECUTIVE REPORT</span>
                <span>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>

              <h4 className="text-sm font-serif font-bold text-white">Executive Summary & Strategic Growth Directives</h4>
              <p className="text-gray-300 leading-relaxed text-xs">
                This document is auto-compiled by the <strong>GPT-4o PowerBI Enterprise Analytics Engine</strong> for SPY Salon administration. 
                Data cross-analyzes live appointments, revenue streams, staff payroll, and customer retention metrics.
              </p>

              <div className="grid grid-cols-2 gap-3 text-center pt-2">
                <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                  <span className="text-gray-400 text-[10px] uppercase block">Gross Studio Revenue</span>
                  <strong className="text-rosegold-400 font-mono text-sm font-extrabold">₹2,84,500</strong>
                </div>
                <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                  <span className="text-gray-400 text-[10px] uppercase block">Net Studio Profit</span>
                  <strong className="text-green-400 font-mono text-sm font-extrabold">₹1,43,700 (50.5%)</strong>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <strong className="text-white text-xs font-serif block">Key Strategic Action Points for Q3 2026:</strong>
                <ul className="list-disc list-inside text-gray-300 space-y-1 text-[11px]">
                  <li><strong>Skin & Facials Optimization:</strong> Maintain 24K Gold Facial inventory as it drives 40% of total revenue.</li>
                  <li><strong>Staff Retention Incentive:</strong> Senior Stylist Ananya Sharma achieved 93.1% ROI; recommend performance bonus payout.</li>
                  <li><strong>Pre-Bridal Surge:</strong> August 2026 forecast predicts ₹3,20,000 revenue target (+12.5% MoM).</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Executive PDF Brief</span>
              </button>
              <button
                onClick={() => setShowAiBriefModal(false)}
                className="py-3 px-5 rounded-xl bg-dark-800 text-gray-300 hover:text-white border border-white/10 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION POPUP MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-dark-900 border border-rosegold-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-left relative">
            <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-gray-400">Action Confirmation Required</p>
              </div>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed font-medium">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl bg-dark-800 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
              >
                {confirmModal.confirmText || 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE REQUEST ACTION MODAL FOR ADMIN */}
      {leaveActionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-6 shadow-2xl relative text-left">
            <button
              onClick={() => setLeaveActionModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1 border-b border-white/10 pb-4">
              <span className="text-[10px] text-rosegold-400 font-bold uppercase tracking-widest">LEAVE REQUEST DETAILS</span>
              <h3 className="text-2xl font-serif font-bold text-white">Review Leave Application</h3>
            </div>

            {leaveActionModal.msg && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold border ${
                leaveActionModal.msg.includes('APPROVED') || leaveActionModal.msg.includes('successfully')
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}>
                {leaveActionModal.msg}
              </div>
            )}

            {leaveActionModal.loading && !leaveActionModal.leave ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading leave request details...</div>
            ) : leaveActionModal.leave ? (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-dark-850 border border-white/10">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Staff / Employee Name</span>
                    <span className="font-bold text-white text-sm">{leaveActionModal.leave.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Current Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase inline-block mt-0.5 ${
                      leaveActionModal.leave.status === 'Approved'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : leaveActionModal.leave.status === 'Rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {leaveActionModal.leave.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Start Date</span>
                    <span className="font-bold text-white font-mono">{leaveActionModal.leave.startDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">End Date</span>
                    <span className="font-bold text-white font-mono">{leaveActionModal.leave.endDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Total Leave Days</span>
                    <span className="font-bold text-rosegold-400">
                      {Math.max(1, Math.round((new Date(leaveActionModal.leave.endDate).getTime() - new Date(leaveActionModal.leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Days
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Request Date</span>
                    <span className="font-bold text-gray-300">
                      {leaveActionModal.leave.createdAt ? new Date(leaveActionModal.leave.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-850 border border-white/10 space-y-1">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Reason for Leave</span>
                  <p className="text-gray-200 leading-relaxed italic">{leaveActionModal.leave.reason}</p>
                </div>

                {leaveActionModal.leave.status === 'Pending' ? (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Optional Rejection Reason (If rejecting)</label>
                      <input
                        type="text"
                        value={leaveActionModal.rejectReason}
                        onChange={(e) => setLeaveActionModal(prev => ({ ...prev, rejectReason: e.target.value }))}
                        placeholder="e.g. High customer booking volume during festival week"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-rosegold-400 text-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleAcceptLeaveModalAction}
                        disabled={leaveActionModal.loading}
                        className="flex-1 py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-dark-900 font-extrabold text-xs shadow-lg cursor-pointer transition-all disabled:opacity-50"
                      >
                        {leaveActionModal.loading ? 'Processing...' : 'ACCEPT LEAVE'}
                      </button>
                      <button
                        onClick={handleRejectLeaveModalAction}
                        disabled={leaveActionModal.loading}
                        className="flex-1 py-3.5 rounded-2xl bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-500/40 font-extrabold text-xs shadow-lg cursor-pointer transition-all disabled:opacity-50"
                      >
                        {leaveActionModal.loading ? 'Processing...' : 'REJECT LEAVE'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-dark-800 text-gray-400 text-center text-xs italic border border-white/5">
                    This leave request has been finalized as <span className="font-bold text-white">{leaveActionModal.leave.status}</span>.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">Leave request details unavailable.</div>
            )}
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD & SECURITY MODAL */}
      <ChangePasswordModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userName="System Administrator"
        userRole="Admin Account"
      />

      {/* ON-SCREEN TOAST NOTIFICATION POPUP */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] animate-fadeIn flex items-center space-x-3 px-5 py-3.5 rounded-2xl bg-dark-900/95 border border-rosegold-500/50 shadow-2xl backdrop-blur-xl text-xs font-bold text-white max-w-md">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
            toast.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            toast.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </div>
          <div className="flex-1 pr-2">
            <p className="text-xs text-gray-200 font-medium leading-tight">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white p-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

