'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EmployeeSkeleton } from '@/components/common/Skeleton';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Scissors, 
  Sparkles, 
  LogOut, 
  Lock, 
  Menu, 
  X, 
  ChevronRight, 
  Coffee, 
  CheckSquare, 
  Plus, 
  TrendingUp, 
  Award,
  Edit3,
  DollarSign,
  Building,
  CreditCard,
  Printer,
  FileText,
  Check,
  Home,
  Sun,
  Moon,
  Bell,
  Trash2,
  CheckCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import EmployeeCalendarModule from '@/components/employee/EmployeeCalendarModule';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import ProfileAvatar from '@/components/common/ProfileAvatar';
import { validateForm, validateName, validatePhone, validateIFSC, validateUPI, validateRequired, validateDate } from '@/lib/validation';

interface AssignedAppointment {
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
  paymentStatus?: string;
  paymentMethod?: string;
  bookingDateTime?: string;
  bookingDate?: string;
  bookingTimeFormatted?: string;
  notes?: string;
}

interface LeaveRequest {
  _id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface AttendanceLog {
  _id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: string;
  attendanceState?: 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';
  attendanceType?: 'NOT_FINALIZED' | 'FULL_DAY' | 'HALF_DAY' | 'LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKLY_OFF';
  breaks?: Array<{
    _id?: string;
    start: string;
    end: string | null;
    duration?: number;
  }>;
  totalBreakDuration?: number;
  totalShiftDuration?: number;
  effectiveWorkingDuration?: number;
}

interface SalarySlip {
  _id: string;
  slipId: string;
  employeeName: string;
  empCode: string;
  month: string;
  baseSalary: number;
  incentives: number;
  deductions: number;
  netPay: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

interface NotificationItem {
  _id?: string;
  notificationId: string;
  userId?: string;
  email?: string;
  role?: string;
  title: string;
  message: string;
  type?: string;
  icon?: string;
  priority?: string;
  isRead: boolean;
  link?: string;
  bookingId?: string;
  appointmentId?: string;
  createdAt: string;
}

const getTodayISTStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function EmployeeDashboardContent() {
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const tabFromUrl = searchParams?.get('tab');
  const validTabs = ['queue', 'calendar', 'clockin', 'payrolls', 'bank', 'leaves', 'schedule', 'performance'];
  const activeTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : 'queue';

  const handleTabChange = (newTab: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    router.replace(`/employee?tab=${newTab}`, { scroll: false });
  };

  // Shift & Queue Control States
  const [shiftStatus, setShiftStatus] = useState<'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT' | 'ON_LEAVE'>('NOT_CLOCKED_IN');
  const [attLoading, setAttLoading] = useState<boolean>(false);
  const [queueFilter, setQueueFilter] = useState<'All' | 'In Queue' | 'Completed'>('All');

  // Data States
  const [appointments, setAppointments] = useState<AssignedAppointment[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [payrolls, setPayrolls] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState<boolean>(false);

  // Security Check
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Form States for Leave Request & Notes
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [selectedApp, setSelectedApp] = useState<AssignedAppointment | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [notesEdit, setNotesEdit] = useState('');

  // Walk-In Appointment State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    customerName: '',
    customerPhone: '+91 98765 43210',
    service: 'Signature Keratin Hair Spa & Mask',
    paymentMethod: 'Cash',
    notes: 'Direct Walk-In Client added by Stylist Desk.'
  });

  // Staff Manual Customer Entry State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Female',
    address: ''
  });
  const [customerSubmitting, setCustomerSubmitting] = useState(false);

  const handleCreateCustomerByStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      showToast('Customer full name is required', 'error');
      return;
    }
    if (!customerForm.phone.trim()) {
      showToast('Customer phone number is required', 'error');
      return;
    }

    try {
      setCustomerSubmitting(true);
      const res = await apiFetch(`${API_BASE_URL}/employee/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      setCustomerSubmitting(false);

      if (res.ok && data.data) {
        showToast(`Customer profile for "${data.data.name}" created successfully!`, 'success');
        const createdCust = data.data;
        setCustomerForm({ name: '', phone: '', email: '', gender: 'Female', address: '' });
        setCustomerModalOpen(false);
        setWalkInForm(prev => ({
          ...prev,
          customerName: createdCust.name,
          customerPhone: createdCust.phone
        }));
      } else {
        showToast(data.message || 'Failed to create customer record', 'error');
      }
    } catch (err: any) {
      setCustomerSubmitting(false);
      showToast(err.message || 'Error creating customer record', 'error');
    }
  };

  const formatRelativeTime = (dateStr: string) => {
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

  const fetchNotifications = async () => {
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      const queryParams = new URLSearchParams({
        role: 'employee',
        ...(userId ? { userId: String(userId) } : {}),
        ...(user?.email ? { email: String(user.email) } : {})
      });

      const res = await apiFetch(`${API_BASE_URL}/notifications?${queryParams.toString()}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setNotifications(json.data);
        const unread = json.data.filter((n: NotificationItem) => !n.isRead).length;
        setUnreadNotifCount(unread);
      }
    } catch (e) {
      console.error('Error fetching employee notifications:', e);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => (n._id === id || n.notificationId === id) ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
      await apiFetch(`${API_BASE_URL}/notifications/read/${id}`, { method: 'PATCH' });
    } catch (e) {
      fetchNotifications();
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
      await apiFetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'employee', userId: userId ? String(userId) : undefined })
      });
    } catch (e) {
      fetchNotifications();
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      setNotifications(prev => {
        const target = prev.find(n => n._id === id || n.notificationId === id);
        if (target && !target.isRead) {
          setUnreadNotifCount(u => Math.max(0, u - 1));
        }
        return prev.filter(n => n._id !== id && n.notificationId !== id);
      });
      await apiFetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {
      fetchNotifications();
    }
  };

  // Bank & UPI Details State
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: ''
  });
  const [bankSaved, setBankSaved] = useState(false);

  useEffect(() => {
    if (user) {
      const bd = (user as any).bankDetails || {};
      setBankForm({
        accountName: bd.accountName || user.name || '',
        accountNumber: bd.accountNumber || '',
        ifscCode: bd.ifscCode || '',
        bankName: bd.bankName || '',
        upiId: bd.upiId || ''
      });
    }
  }, [user]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const userId = (user as any)?._id || (user as any)?.id;
    if (userId) {
      socket.emit('join_room', `room:user_${userId}`);
    }
    socket.emit('join_room', 'room:employee');

    socket.on('appointment:updated', (data: any) => {
      const app = data?.appointment || data;
      if (app?._id) {
        setAppointments(prev => prev.map(a => a._id === app._id ? { ...a, ...app } : a));
      }
    });

    socket.on('appointment:created', (data: any) => {
      const app = data?.appointment || data;
      if (app?._id) {
        setAppointments(prev => [app, ...prev.filter(a => a._id !== app._id)]);
      }
    });

    socket.on('appointment:new', (data: any) => {
      const app = data?.appointment || data;
      if (app?._id) {
        setAppointments(prev => [app, ...prev.filter(a => a._id !== app._id)]);
      }
    });

    socket.on('leave:updated', (data: any) => {
      if (data?.leave) {
        setLeaves(prev => prev.map(l => l._id === data.leave._id ? { ...l, ...data.leave } : l));
      }
    });

    socket.on('notification:new', (notif: NotificationItem) => {
      if (notif.userId && userId && String(notif.userId) !== String(userId)) {
        return; // Not for this employee
      }
      setNotifications(prev => [notif, ...prev.filter(n => n.notificationId !== notif.notificationId)]);
      if (!notif.isRead) {
        setUnreadNotifCount(prev => prev + 1);
      }
    });

    socket.on('notifications:updated', () => fetchNotifications());
    socket.on('notifications:read_all', () => fetchNotifications());
    socket.on('notifications:deleted', () => fetchNotifications());

    return () => {
      socket.off('appointment:updated');
      socket.off('appointment:created');
      socket.off('appointment:new');
      socket.off('leave:updated');
      socket.off('notification:new');
      socket.off('notifications:updated');
      socket.off('notifications:read_all');
      socket.off('notifications:deleted');
    };
  }, [socket, user]);

  // On-screen Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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

    setIsAuthorized(true);
    fetchEmployeeData();
    fetchNotifications();

    // Background sync every 15 seconds (supplemented by Socket.IO real-time events)
    const intervalId = setInterval(() => {
      fetchEmployeeData();
      fetchNotifications();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [user, isLoading, router]);

  const fetchEmployeeData = async () => {
    try {
      const [appRes, leaveRes, attRes, payRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/employee/appointments`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/employee/leaves`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/employee/attendance`).then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch(`${API_BASE_URL}/employee/payrolls`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (appRes.data) setAppointments(appRes.data);
      if (leaveRes.data) setLeaves(leaveRes.data);
      if (attRes.data) {
        setAttendance(attRes.data);
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        
        // Check if employee has an Approved leave for today
        const approvedLeaveToday = (leaveRes.data || []).find((l: any) => 
          l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr
        );

        if (approvedLeaveToday) {
          setShiftStatus('ON_LEAVE');
        } else {
          const todayRecords = attRes.data.filter((a: any) => a.date === todayStr);
          if (todayRecords.length > 0) {
            const mostRecent = todayRecords[0];
            if (mostRecent.attendanceState) {
              setShiftStatus(mostRecent.attendanceState);
            } else if (mostRecent.clockOut) {
              setShiftStatus('CLOCKED_OUT');
            } else {
              setShiftStatus('CLOCKED_IN');
            }
          } else {
            setShiftStatus('NOT_CLOCKED_IN');
          }
        }
      }
      if (payRes.data) setPayrolls(payRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  // Update Service Status (In Progress, Completed, Cancelled, Staff_Accepted, Staff_Rejected)
  const handleUpdateStatus = async (id: string, newStatus: string, rejectionReason?: string) => {
    if (newStatus === 'Completed') {
      const app = appointments.find(a => a._id === id);
      if (app && !hasAppointmentStarted(app.appointmentDate, app.appointmentTime)) {
        showToast(`Cannot mark appointment as Completed before its scheduled time (${app.appointmentDate} ${app.appointmentTime}).`, 'error');
        return;
      }
    }
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejectionReason })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to update appointment status.', 'error');
        return;
      }
      const updated = data.data;
      setAppointments(appointments.map(a => a._id === id ? { ...a, ...updated, status: newStatus } : a));
    } catch (e: any) {
      showToast(e.message || 'Error updating appointment status.', 'error');
    }
  };

  const handleMarkPaymentPaid = async (id: string) => {
    const app = appointments.find(a => a._id === id);
    const canComplete = app ? hasAppointmentStarted(app.appointmentDate, app.appointmentTime) : true;
    const updateBody: any = { paymentStatus: 'Paid', paymentMethod: 'Cash' };
    if (canComplete) {
      updateBody.status = 'Completed';
    }
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAppointments(appointments.map(a => a._id === id ? { ...a, ...data.data } : a));
        showToast(canComplete ? 'Payment marked as Paid & Appointment Completed!' : 'Payment marked as Paid!', 'success');
      } else {
        showToast(data.message || 'Failed to update payment status.', 'error');
      }
    } catch (e) {
      fetchEmployeeData();
    }
  };

  // Update Notes
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await apiFetch(`${API_BASE_URL}/employee/appointments/${selectedApp._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesEdit })
      });
      setAppointments(appointments.map(a => a._id === selectedApp._id ? { ...a, notes: notesEdit } : a));
      setSelectedApp(null);
    } catch (e) {
      setSelectedApp(null);
    }
  };

  // Save Bank & UPI Payout Details
  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${API_BASE_URL}/employee/bank-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bankForm, email: user?.email })
      });
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 2500);
    } catch (e) {
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 2500);
    }
  };

  // Walk-In Client Submission Handler
  const handleSaveWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.customerName || !walkInForm.service) {
      showToast('Please fill in customer name and service.', 'error');
      return;
    }
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/walk-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: walkInForm.customerName,
          customerPhone: walkInForm.customerPhone,
          service: walkInForm.service,
          paymentMethod: walkInForm.paymentMethod,
          notes: walkInForm.notes
        })
      });
      const data = await res.json();
      if (data.data) {
        setAppointments(prev => [data.data, ...prev.filter(a => a._id !== data.data._id)]);
        setWalkInModalOpen(false);
        setWalkInForm({
          customerName: '',
          customerPhone: '+91 98765 43210',
          service: 'Signature Keratin Hair Spa & Mask',
          paymentMethod: 'Cash',
          notes: 'Direct Walk-In Client added by Stylist Desk.'
        });
        showToast(`Walk-In Client ${data.data.customerName} seated successfully! (#${data.data.bookingId})`, 'success');
      } else {
        showToast(data.message || 'Failed to record walk-in appointment.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording walk-in client. Please try again.', 'error');
    }
  };

  // Clock-in & Shift Control Actions
  const handleClockIn = async () => {
    if (attLoading) return;
    setAttLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: user?.name })
      });
      const data = await res.json();
      if (data.data) {
        setAttendance(prev => [data.data, ...prev.filter(a => a.date !== data.data.date)]);
        setShiftStatus(data.data.attendanceState || 'CLOCKED_IN');
      } else if (data.message) {
        showToast(data.message, 'info');
      }
    } catch (e: any) {
      showToast(e.message || 'Error clocking in. Please try again.', 'error');
    } finally {
      setAttLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (attLoading) return;
    setAttLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/start-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.data) {
        setAttendance(prev => prev.map(a => a.date === data.data.date ? data.data : a));
        setShiftStatus('ON_BREAK');
      } else if (data.message) {
        showToast(data.message, 'info');
      }
    } catch (e: any) {
      showToast(e.message || 'Error starting break. Please try again.', 'error');
    } finally {
      setAttLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (attLoading) return;
    setAttLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/end-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.data) {
        setAttendance(prev => prev.map(a => a.date === data.data.date ? data.data : a));
        setShiftStatus('CLOCKED_IN');
      } else if (data.message) {
        showToast(data.message, 'info');
      }
    } catch (e: any) {
      showToast(e.message || 'Error ending break. Please try again.', 'error');
    } finally {
      setAttLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (attLoading) return;
    if (shiftStatus === 'ON_BREAK') {
      showToast('Please end your break before clocking out.', 'error');
      return;
    }
    setAttLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.data) {
        setAttendance(prev => prev.map(a => a.date === data.data.date ? data.data : a));
        setShiftStatus('CLOCKED_OUT');
      } else if (data.message) {
        showToast(data.message, 'info');
      }
    } catch (e: any) {
      showToast(e.message || 'Error clocking out. Please try again.', 'error');
    } finally {
      setAttLoading(false);
    }
  };

  // Leave Request Submission (CRUD)
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayIST = getTodayISTStr();
    if (leaveForm.startDate < todayIST) {
      showToast(`Leave start date cannot be in the past (${leaveForm.startDate}). Please select today (${todayIST}) or a future date.`, 'error');
      return;
    }

    const { isValid, errors } = validateForm(leaveForm, {
      startDate: [validateDate('Start date')],
      endDate: [validateDate('End date')],
      reason: [validateRequired('Leave reason')]
    });

    if (!isValid) {
      const firstErr = Object.values(errors)[0];
      showToast(firstErr || 'Please fill in required leave details.', 'error');
      return;
    }

    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leaveForm, employeeName: user?.name || 'Ananya Sharma' })
      });
      const data = await res.json();
      if (data.data) {
        setLeaves([data.data, ...leaves]);
        setLeaveForm({ startDate: '', endDate: '', reason: '' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-rosegold-400 font-serif animate-pulse">
        SPY Salon Staff Desk Loading...
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Employee Sign In Required</h1>
        <p className="text-gray-400 text-sm max-w-sm">Please sign in with your staff credentials to open your assigned service queue and shift schedule.</p>
        <button
          onClick={() => router.push('/login?redirect=/employee')}
          className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm cursor-pointer"
        >
          Sign In to Employee Portal
        </button>
      </div>
    );
  }

  const navMenuItems = [
    { id: 'queue', label: "Today's Service Queue", icon: Scissors, badge: appointments.length },
    { id: 'calendar', label: 'My Calendar', icon: Calendar, badge: null },
    { id: 'clockin', label: 'Clock-In & Attendance', icon: CheckSquare, badge: null },
    { id: 'payrolls', label: 'My Salary Slips & Payouts', icon: FileText, badge: payrolls.length },
    { id: 'bank', label: 'Bank & UPI Account Details', icon: Building, badge: null },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar, badge: leaves.filter(l => l.status === 'Pending').length },
    { id: 'schedule', label: 'My Shift & Breaktime', icon: Clock, badge: null },
    { id: 'performance', label: 'Commission & Performance', icon: Award, badge: null }
  ];

  const employeeName = user?.name || 'Staff Specialist';

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-800/95 border-r border-rosegold-500/20 backdrop-blur-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out h-screen overflow-hidden ${
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
                  STAFF STYLIST PORTAL
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

          <nav className="space-y-1 text-xs font-semibold">
            {navMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-rosegold-500/20 text-rosegold-300 font-bold border border-rosegold-500/30' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <IconComp className="w-4 h-4 text-rosegold-400" />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-rosegold-500/30 text-rosegold-200 border border-rosegold-500/40' : 'bg-rosegold-500/20 text-rosegold-300 border border-rosegold-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-white/10 bg-dark-900/90 text-xs space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <ProfileAvatar user={user} name={employeeName} size="md" onClick={() => setIsSettingsModalOpen(true)} />
              <div className="space-y-0.5 overflow-hidden text-left">
                <h4 className="text-white font-serif font-bold text-xs truncate">{employeeName}</h4>
                <p className="text-[10px] text-rosegold-400 truncate">Senior Hair & Skin Specialist</p>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-rosegold-400 hover:text-white border border-white/10 hover:border-rosegold-500/40 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Change Security Password & Settings"
            >
              <Settings className="w-4 h-4 text-rosegold-400" />
            </button>
          </div>

          <button
            onClick={() => { setSidebarOpen(false); handleLogout(); }}
            className="w-full mt-2 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 border border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
      }`}>
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-rosegold-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between">
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
              <span className="text-gray-400">Employee Desk</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-rosegold-400 font-bold uppercase tracking-wider">
                {navMenuItems.find(m => m.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {/* NOTIFICATIONS DROPDOWN BUTTON & PANEL */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white hover:border-rosegold-500/40 transition-all cursor-pointer flex items-center justify-center relative mr-1"
                title="View Staff Notifications"
              >
                <Bell className="w-4 h-4 text-rosegold-400" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-dark-900 shadow-md">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION PANEL DROPDOWN */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[420px] max-h-[calc(100vh-120px)] flex flex-col bg-[#141012] border-2 border-rosegold-500/50 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.98)] z-[99999] overflow-hidden text-left ring-2 ring-black/90 p-4 space-y-3 notif-panel-dropdown">
                  <div className="border-b border-white/10 pb-3 flex items-center justify-between notif-panel-header shrink-0">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-rosegold-400" />
                      <h4 className="text-white font-serif font-bold text-sm notif-panel-title">Staff Notifications</h4>
                      {unreadNotifCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rosegold-500/20 text-rosegold-300 text-[10px] font-bold border border-rosegold-500/30">
                          {unreadNotifCount} unread
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {notifications.some(n => !n.isRead) && (
                        <button
                          onClick={handleMarkAllNotifsRead}
                          className="text-[10px] text-rosegold-300 hover:text-white font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Read All</span>
                        </button>
                      )}
                      <button
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-gray-400 hover:text-white text-xs cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                        title="Close Notifications"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[calc(100vh-220px)] sm:max-h-[420px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1.5 shrink flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 space-y-1 bg-[#181316] rounded-2xl border border-white/5">
                        <Bell className="w-6 h-6 text-gray-500 mx-auto opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const notifId = n._id || n.notificationId;
                        return (
                          <div
                            key={notifId}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all relative ${
                              !n.isRead 
                                ? 'bg-[#221a1e] border-l-4 border-l-rosegold-400 border-rosegold-500/30 text-white shadow-md notif-card-unread' 
                                : 'bg-[#181316] border-l-4 border-l-gray-600 border-white/10 text-gray-300 opacity-90 notif-card-read'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-rosegold-400 animate-pulse shrink-0" />
                                  )}
                                  <strong className={`text-xs block font-bold truncate notif-item-title ${!n.isRead ? 'text-white' : 'text-gray-200'}`}>
                                    {n.title}
                                  </strong>
                                </div>
                                <p className="text-[11px] text-gray-200 leading-relaxed font-sans whitespace-pre-line notif-item-message">
                                  {n.message}
                                </p>
                                <span className="text-[9.5px] text-rosegold-400 font-mono block pt-0.5 font-bold notif-item-time">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                                {!n.isRead && (
                                  <button
                                    onClick={() => handleMarkNotifRead(notifId)}
                                    className="p-1 rounded-lg bg-dark-800 text-green-400 hover:bg-green-500 hover:text-dark-900 cursor-pointer border border-green-500/30 transition-colors"
                                    title="Mark as Read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotif(notifId)}
                                  className="p-1 rounded-lg bg-dark-800 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer border border-red-500/30 transition-colors"
                                  title="Delete Notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white hover:border-rosegold-500/40 transition-all cursor-pointer flex items-center justify-center mr-1"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-400" />
              )}
            </button>

            {shiftStatus === 'NOT_CLOCKED_IN' ? (
              <button
                onClick={handleClockIn}
                disabled={attLoading}
                className="px-4 py-2 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{attLoading ? 'Clocking In...' : 'Check In Shift 🟢'}</span>
              </button>
            ) : shiftStatus === 'CLOCKED_IN' ? (
              <>
                <button
                  onClick={handleStartBreak}
                  disabled={attLoading}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Start Break ☕</span>
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={attLoading}
                  className="px-3.5 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>Clock Out 🔴</span>
                </button>
              </>
            ) : shiftStatus === 'ON_BREAK' ? (
              <>
                <button
                  onClick={handleEndBreak}
                  disabled={attLoading}
                  className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer animate-pulse disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>End Break ⏱️</span>
                </button>
              </>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-bold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Shift Completed</span>
              </span>
            )}
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          
          {/* TAB: MY CALENDAR MODULE */}
          {activeTab === 'calendar' && (
            <EmployeeCalendarModule
              user={user}
              appointments={appointments}
              attendance={attendance}
              leaves={leaves}
              payrolls={payrolls}
              onSubmitLeave={form => {
                setLeaveForm(form);
                handleSubmitLeave({ preventDefault: () => {} } as any);
              }}
            />
          )}

          {/* TAB 1: TODAY'S ASSIGNED SERVICE QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-6 animate-fadeIn text-left">
              
              {/* FULL-WIDTH WORKLOAD & QUEUE CONTROL CARD */}
              <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-5 bg-dark-800/80 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        shiftStatus === 'ON_BREAK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        shiftStatus === 'CLOCKED_IN' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        shiftStatus === 'CLOCKED_OUT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {shiftStatus === 'ON_BREAK' ? '☕ On Break' : shiftStatus === 'CLOCKED_IN' ? '🟢 Shift Active' : shiftStatus === 'CLOCKED_OUT' ? '🏁 Shift Completed' : '⚪ Shift Inactive'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Stylist Shift Workload</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-white mt-1">Assigned Client Queue & Workload Control</h3>
                  </div>

                  <div className="flex items-center space-x-2 self-start md:self-auto flex-wrap gap-y-2">
                    <button
                      onClick={() => {
                        setCustomerForm({ name: '', phone: '', email: '', gender: 'Female', address: '' });
                        setCustomerModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-dark-700 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>+ New Customer Entry</span>
                    </button>

                    <button
                      onClick={() => {
                        setWalkInForm({
                          customerName: '',
                          customerPhone: '+91 98765 43210',
                          service: 'Signature Keratin Hair Spa & Mask',
                          paymentMethod: 'Cash',
                          notes: 'Direct Walk-In Client added by Stylist Desk.'
                        });
                        setWalkInModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-105 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Walk-In Client</span>
                    </button>
                  </div>
                </div>

                {/* Metric Summary Counters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Clients Assigned Today</span>
                    <span className="text-2xl font-serif font-bold text-white block">{appointments.length} Clients</span>
                    <span className="text-[10px] text-rosegold-400 block font-mono">Total Workload Schedule</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Clients Completed</span>
                    <span className="text-2xl font-serif font-bold text-green-400 block">
                      {appointments.filter(a => a.status === 'Completed').length} Completed ✅
                    </span>
                    <span className="text-[10px] text-green-400 block font-mono">Service Billed & Fulfilled</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">In Queue / Remaining</span>
                    <span className="text-2xl font-serif font-bold text-rosegold-400 block">
                      {appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length} In Queue ⏱️
                    </span>
                    <span className="text-[10px] text-purple-300 block font-mono">Pending Next Service</span>
                  </div>
                </div>

                {/* Queue Filter Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 font-bold uppercase text-[10px]">Queue Filter:</span>
                    <div className="flex bg-dark-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
                      <button
                        onClick={() => setQueueFilter('All')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          queueFilter === 'All' ? 'rosegold-gradient-bg text-dark-900' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        All Assigned ({appointments.length})
                      </button>
                      <button
                        onClick={() => setQueueFilter('In Queue')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          queueFilter === 'In Queue' ? 'bg-amber-500 text-dark-900' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        In Queue ({appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length})
                      </button>
                      <button
                        onClick={() => setQueueFilter('Completed')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          queueFilter === 'Completed' ? 'bg-green-500 text-dark-900' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Completed ({appointments.filter(a => a.status === 'Completed').length})
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-gray-400">
                    Showing {
                      appointments.filter(a => {
                        if (queueFilter === 'Completed') return a.status === 'Completed';
                        if (queueFilter === 'In Queue') return a.status !== 'Completed' && a.status !== 'Cancelled';
                        return true;
                      }).length
                    } assigned clients
                  </span>
                </div>
              </div>

              {/* APPOINTMENTS QUEUE LIST */}
              <div className="space-y-4">
                {appointments
                  .filter(a => {
                    if (queueFilter === 'Completed') return a.status === 'Completed';
                    if (queueFilter === 'In Queue') return a.status !== 'Completed' && a.status !== 'Cancelled';
                    return true;
                  })
                  .map((app) => (
                  <div key={app._id} className="glass-card p-5 rounded-3xl border border-rosegold-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                      <div>
                        <span className="text-xs text-rosegold-400 font-bold font-mono">Booking ID: {app.bookingId}</span>
                        <h3 className="text-lg font-serif font-bold text-white">
                          {app.service}
                          <span className="text-xs text-rosegold-400 font-normal font-sans ml-2">
                            ({app.packageTier || app.packageName || 'No Package'})
                          </span>
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        {app.status === 'Pending' && (
                          <div className="flex items-center space-x-1.5 mr-1">
                            <button
                              onClick={() => handleUpdateStatus(app._id, 'Staff_Accepted')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-900 font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1"
                              title="Accept this appointment request"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejecting appointment (optional):') || 'Specialist unavailable';
                                handleUpdateStatus(app._id, 'Staff_Rejected', reason);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs transition-all cursor-pointer flex items-center space-x-1"
                              title="Reject this appointment request"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {app.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaymentPaid(app._id)}
                            className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-400 text-dark-900 font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>Mark as Paid (Cash 💵)</span>
                          </button>
                        )}

                        <span className="text-xs text-gray-400">Status:</span>
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                          disabled={['Completed', 'Cancelled', 'No Show'].includes(app.status)}
                          className="w-[130px] bg-dark-800 text-xs font-bold text-white px-3 py-1.5 rounded-xl border border-rosegold-500/30 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all"
                        >
                          {getValidStatusOptions(app.status, app).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-gray-400 text-[10px] uppercase font-semibold block">Client Name</span>
                        <span className="text-white font-bold block">{app.customerName}</span>
                        <span className="text-gray-400 text-[11px] block">{app.customerPhone}</span>
                      </div>

                      {/* BOOKING TIME (NEVER OVERWRITTEN) */}
                      <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-gray-400 text-[10px] uppercase font-semibold block">Booking Date & Time</span>
                        <span className="text-rosegold-300 font-bold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                          <span>
                            {(() => {
                              const raw = (app as any).createdAt || app.bookingDateTime || app.bookingDate;
                              const d = raw ? new Date(raw) : new Date();
                              const isValid = !isNaN(d.getTime());
                              const finalD = isValid ? d : new Date();
                              return `${finalD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • ${app.bookingTimeFormatted || finalD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                            })()}
                          </span>
                        </span>
                      </div>

                      {/* SCHEDULED SALON VISIT TIME */}
                      <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-gray-400 text-[10px] uppercase font-semibold block">Scheduled Visit</span>
                        <span className="text-white font-bold flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                          <span>{app.appointmentDate} at {app.appointmentTime}</span>
                        </span>
                      </div>

                      <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1 flex flex-col justify-between">
                        <div>
                          <span className="text-gray-400 text-[10px] uppercase font-semibold block">Notes & Preferences</span>
                          <p className="text-gray-300 text-[11px] italic truncate">{app.notes || 'No special requests.'}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedApp(app); setNotesEdit(app.notes || ''); }}
                          className="text-xs text-rosegold-400 font-bold hover:underline self-start pt-1 cursor-pointer"
                        >
                          Edit Client Notes →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CLOCK-IN & ATTENDANCE */}
          {activeTab === 'clockin' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs text-rosegold-400 font-bold uppercase tracking-wider">Attendance Clock-in</span>
                  <h3 className="text-xl font-serif font-bold text-white">Log Today's Shift Entrance</h3>
                  <p className="text-xs text-gray-400">
                    {shiftStatus === 'CLOCKED_IN' 
                      ? 'Shift in progress. Log break or clock out below.'
                      : shiftStatus === 'ON_BREAK'
                      ? 'Currently on break. Click End Break when returning to desk.'
                      : shiftStatus === 'CLOCKED_OUT'
                      ? "Today's shift completed. Great work!"
                      : shiftStatus === 'ON_LEAVE'
                      ? 'You are currently on approved leave today. Clock-in is restricted during leave.'
                      : 'Clock in every morning upon entering the Jubilee Hills Flagship studio.'
                    }
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {shiftStatus === 'ON_LEAVE' ? (
                    <span className="px-5 py-3 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-extrabold flex items-center space-x-2 shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                      <span>🟣 On Approved Leave Today (Clock-In Blocked)</span>
                    </span>
                  ) : shiftStatus === 'NOT_CLOCKED_IN' ? (
                    <button
                      onClick={handleClockIn}
                      disabled={attLoading}
                      className="px-6 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-105 transition-transform flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>{attLoading ? 'Clocking In...' : 'Clock In Now'}</span>
                    </button>
                  ) : shiftStatus === 'CLOCKED_IN' ? (
                    <>
                      <button
                        onClick={handleStartBreak}
                        disabled={attLoading}
                        className="px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Start Break ☕</span>
                      </button>
                      <button
                        onClick={handleCheckOut}
                        disabled={attLoading}
                        className="px-5 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        <span>Clock Out 🔴</span>
                      </button>
                    </>
                  ) : shiftStatus === 'ON_BREAK' ? (
                    <>
                      <button
                        onClick={handleEndBreak}
                        disabled={attLoading}
                        className="px-5 py-3 rounded-full bg-green-500 hover:bg-green-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer animate-pulse disabled:opacity-50"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>End Break ⏱️</span>
                      </button>
                    </>
                  ) : (
                    <span className="px-5 py-3 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-bold flex items-center space-x-1.5">
                      <Check className="w-4 h-4" />
                      <span>Shift Completed</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-x-auto">
                <table className="w-full text-xs text-gray-300">
                  <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Clock In</th>
                      <th className="p-4">Clock Out</th>
                      <th className="p-4">Breaks & Work Duration</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {attendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white">{rec.date}</td>
                        <td className="p-4 text-green-400 font-semibold">{rec.clockIn}</td>
                        <td className="p-4 text-gray-300 font-semibold">{rec.clockOut ? rec.clockOut : '—'}</td>
                        <td className="p-4 text-left">
                          {rec.breaks && rec.breaks.length > 0 ? (
                            <div className="space-y-1 text-[11px]">
                              {rec.breaks.map((b, idx) => (
                                <div key={idx} className="flex items-center space-x-1.5 text-amber-300/90 font-mono">
                                  <Coffee className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>Break {idx + 1}: {b.start} → {b.end ? b.end : 'In Progress'}</span>
                                  {b.duration ? <span className="text-gray-400">({b.duration}m)</span> : null}
                                </div>
                              ))}
                              {rec.totalBreakDuration ? (
                                <div className="text-[10px] text-gray-400 pt-0.5 border-t border-white/10">
                                  Total Breaks: {rec.totalBreakDuration} mins | Effective Work: {rec.effectiveWorkingDuration || 0} mins
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic text-[11px]">No breaks taken</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rec.attendanceState === 'ON_BREAK'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : rec.attendanceType === 'FULL_DAY' || rec.status === 'Present'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : rec.attendanceType === 'HALF_DAY' || rec.status === 'Half Day'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {rec.attendanceState === 'ON_BREAK' 
                              ? 'ON BREAK' 
                              : rec.attendanceType === 'FULL_DAY'
                              ? 'FULL DAY (1.0d)'
                              : rec.attendanceType === 'HALF_DAY'
                              ? 'HALF DAY (0.5d)'
                              : rec.clockOut 
                              ? 'COMPLETED' 
                              : 'WORKING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY SLIPS & PAYOUTS */}
          {activeTab === 'payrolls' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div>
                <h2 className="text-2xl font-bold font-serif text-white">Monthly Salary Slips & Bank Payouts</h2>
                <p className="text-xs text-gray-400 mt-0.5">View and download your official studio salary slips and net commission payouts.</p>
              </div>

              <div className="space-y-4">
                {payrolls.map((slip) => (
                  <div key={slip._id} className="glass-card p-6 rounded-3xl border border-rosegold-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="bg-rosegold-500/15 text-rosegold-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded border border-rosegold-500/30">{slip.slipId}</span>
                        <h4 className="text-white font-serif font-bold text-lg">{slip.month} Salary Slip</h4>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-300 pt-1">
                        <span>Base: <strong className="text-white">₹{slip.baseSalary?.toLocaleString('en-IN')}</strong></span>
                        <span>Incentives: <strong className="text-green-400">+₹{slip.incentives?.toLocaleString('en-IN')}</strong></span>
                        <span>Deductions: <strong className="text-red-400">-₹{slip.deductions?.toLocaleString('en-IN')}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Net Disbursed</span>
                        <span className="text-xl font-bold font-serif text-rosegold-400">₹{slip.netPay?.toLocaleString('en-IN')}</span>
                      </div>

                      <button
                        onClick={() => setSelectedSlip(slip)}
                        className="px-4 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Salary Slip</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BANK ACCOUNT & UPI PAYOUT DETAILS */}
          {activeTab === 'bank' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div>
                <h2 className={`text-2xl font-bold font-serif ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-white'}`}>Bank Account & UPI Payout Settings</h2>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>Keep your bank account and UPI details updated for automatic monthly salary disbursement.</p>
              </div>

              {bankSaved && (
                <div className="p-4 rounded-2xl bg-green-900/40 border border-green-500/50 text-green-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Bank & UPI Payout account details saved successfully! Updated in Admin Payout Roster.</span>
                </div>
              )}

              <form onSubmit={handleSaveBankDetails} className={`p-6 sm:p-8 rounded-3xl border max-w-2xl space-y-4 text-xs shadow-2xl ${theme === 'light' ? 'bg-amber-100/40 border-amber-900/20' : 'bg-dark-850/90 border-rosegold-500/30'}`}>
                <div>
                  <label className={`font-bold block mb-1 text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Account Holder Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={bankForm.accountName} 
                    onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} 
                    className={`w-full p-3 rounded-xl font-bold text-xs border transition-all focus:outline-none focus:border-rosegold-500 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-gray-100 text-dark-900 border-gray-300'}`} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`font-bold block mb-1 text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Bank Account Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.accountNumber} 
                      onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} 
                      className={`w-full p-3 rounded-xl font-mono font-bold text-xs border transition-all focus:outline-none focus:border-rosegold-500 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-gray-100 text-dark-900 border-gray-300'}`} 
                    />
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>IFSC Code *</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.ifscCode} 
                      onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })} 
                      className={`w-full p-3 rounded-xl font-mono font-bold text-xs border transition-all focus:outline-none focus:border-rosegold-500 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-gray-100 text-dark-900 border-gray-300'}`} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`font-bold block mb-1 text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Bank Name & Branch</label>
                    <input 
                      type="text" 
                      value={bankForm.bankName} 
                      onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} 
                      className={`w-full p-3 rounded-xl font-bold text-xs border transition-all focus:outline-none focus:border-rosegold-500 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-gray-100 text-dark-900 border-gray-300'}`} 
                    />
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>UPI ID (For Fast Disbursal)</label>
                    <input 
                      type="text" 
                      value={bankForm.upiId} 
                      onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} 
                      className={`w-full p-3 rounded-xl font-mono font-bold text-xs border transition-all focus:outline-none focus:border-rosegold-500 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-gray-100 text-dark-900 border-gray-300'}`} 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-white font-extrabold text-xs uppercase tracking-wider shadow-glow-rosegold cursor-pointer"
                >
                  Save Bank & UPI Account Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: LEAVE REQUESTS CRUD */}
          {activeTab === 'leaves' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <h2 className={`text-2xl font-bold font-serif ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-white'}`}>Leave Requests & Application Desk</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submit New Leave Form */}
                <form onSubmit={handleSubmitLeave} className={`p-6 rounded-3xl border space-y-4 text-xs ${theme === 'light' ? 'bg-amber-100/40 border-amber-900/20 shadow-md' : 'glass-card border-rosegold-500/30'}`}>
                  <h3 className={`text-base font-serif font-bold ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-white'}`}>Apply for Leave</h3>
                  
                  <div>
                    <label className={`font-bold block mb-1 uppercase text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Start Date *</label>
                    <input
                      type="date"
                      required
                      min={getTodayISTStr()}
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className={`w-full p-3 rounded-xl border text-xs font-bold ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-dark-800 border-white/10 text-white'}`}
                    />
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 uppercase text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>End Date *</label>
                    <input
                      type="date"
                      required
                      min={leaveForm.startDate || getTodayISTStr()}
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className={`w-full p-3 rounded-xl border text-xs font-bold ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-dark-800 border-white/10 text-white'}`}
                    />
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 uppercase text-xs ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Reason *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Personal travel or medical appointment..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className={`w-full p-3 rounded-xl border text-xs font-bold resize-none ${theme === 'light' ? 'bg-white text-gray-900 border-gray-400 focus:bg-white placeholder-gray-500' : 'bg-dark-800 border-white/10 text-white'}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl rosegold-gradient-bg text-white font-extrabold text-xs shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Submit Leave Request
                  </button>
                </form>

                {/* Leaves History Table */}
                <div className="md:col-span-2 space-y-3">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-rosegold-400'}`}>Leave Application Status</span>
                  {leaves.map((leave) => (
                    <div key={leave._id} className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300 shadow-sm' : 'glass-card border-rosegold-500/30'}`}>
                      <div className="space-y-0.5">
                        <span className={`font-bold block ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-white'}`}>{leave.startDate} to {leave.endDate}</span>
                        <span className={`block ${theme === 'light' ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>Reason: {leave.reason}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase ${
                        leave.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        leave.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHIFT SCHEDULE & BREAKTIME */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <h2 className="text-2xl font-bold font-serif text-white">My Shift Schedule & Breaktime</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl rosegold-gradient-bg text-dark-900 flex items-center justify-center font-bold">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-white">Working Shift Hours</h3>
                      <p className="text-xs text-rosegold-400 font-bold">09:00 AM – 07:00 PM (10 Hours)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    You are assigned to the primary Jubilee Hills Flagship studio. Please report 15 minutes before your shift start time.
                  </p>
                </div>

                <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold">
                      <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-white">Mandatory Breaktime</h3>
                      <p className="text-xs text-purple-300 font-bold">01:00 PM – 02:00 PM (1 Hour)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    No online appointment bookings will be locked during your designated 1-hour afternoon breaktime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: COMMISSION & PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <h2 className="text-2xl font-bold font-serif text-white">Stylist Performance & Commission Metrics</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 text-center space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Services Completed</span>
                  <p className="text-3xl font-bold font-serif text-white">28</p>
                </div>
                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 text-center space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Estimated Commission</span>
                  <p className="text-3xl font-bold font-serif text-rosegold-400">₹14,200</p>
                </div>
                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 text-center space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Client Rating</span>
                  <p className="text-3xl font-bold font-serif text-yellow-400">4.9 ⭐</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* SALARY SLIP VIEW MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-white text-gray-900 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 text-left relative">
            <button onClick={() => setSelectedSlip(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg">✕</button>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <span className="text-xs font-bold text-rosegold-500 uppercase tracking-widest block">SPY Salon BOTANICAL STUDIO</span>
                <h2 className="text-xl font-serif font-bold text-gray-900">Official Salary Slip</h2>
              </div>
              <span className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1 rounded-full uppercase">
                {selectedSlip.status}
              </span>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-4">
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Employee Name</span>
                <span className="font-bold text-gray-900 text-sm">{selectedSlip.employeeName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Employee Code</span>
                <span className="font-mono font-bold text-gray-800 text-sm">{selectedSlip.empCode}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Pay Period</span>
                <span className="font-semibold text-gray-800">{selectedSlip.month}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Disbursement Date</span>
                <span className="font-semibold text-gray-800">{selectedSlip.paymentDate}</span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Base Fixed Salary</span>
                <span className="font-bold font-mono">₹{selectedSlip.baseSalary?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Performance Incentives & Commission</span>
                <span className="font-bold font-mono text-green-600">+₹{selectedSlip.incentives?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Professional Tax & Deductions</span>
                <span className="font-bold font-mono text-red-500">-₹{selectedSlip.deductions?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-serif font-bold text-gray-900 border-t-2 border-gray-900">
                <span>Net Disbursed Salary</span>
                <span className="text-rosegold-500">₹{selectedSlip.netPay?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2">
              <span>Paid via: <strong>{selectedSlip.paymentMethod}</strong></span>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center space-x-1.5 hover:bg-gray-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Salary Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CLIENT NOTES MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif font-bold text-white">Edit Client Preference Notes</h3>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Notes for {selectedApp.customerName}</label>
                <textarea
                  rows={4}
                  value={notesEdit}
                  onChange={(e) => setNotesEdit(e.target.value)}
                  placeholder="Hair texture preferences, skin sensitivities, or special requests..."
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setSelectedApp(null)} className="px-4 py-2 rounded-xl bg-dark-800 text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-bold">
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALK-IN CLIENT APPOINTMENT MODAL */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif font-bold text-white">Record Walk-In Client Appointment</h3>
              <button onClick={() => setWalkInModalOpen(false)} className="text-gray-400 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveWalkIn} className="space-y-3">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter walk-in client name"
                  value={walkInForm.customerName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={walkInForm.customerPhone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customerPhone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Service Requested *</label>
                <input
                  type="text"
                  required
                  placeholder="Service title"
                  value={walkInForm.service}
                  onChange={(e) => setWalkInForm({ ...walkInForm, service: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Payment Option</label>
                <select
                  value={walkInForm.paymentMethod}
                  onChange={(e) => setWalkInForm({ ...walkInForm, paymentMethod: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                >
                  <option value="Cash">Cash at Counter</option>
                  <option value="UPI">UPI Direct</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Stylist Service Notes</label>
                <textarea
                  rows={2}
                  value={walkInForm.notes}
                  onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setWalkInModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-dark-800 text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold cursor-pointer">
                  Seat & Record Walk-In Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MANUAL CUSTOMER ENTRY MODAL */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-rosegold-400" />
                <h3 className="text-base font-serif font-bold text-white">Manual Customer Account Entry</h3>
              </div>
              <button onClick={() => setCustomerModalOpen(false)} className="text-gray-400 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCustomerByStaff} className="space-y-3">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="radhika@example.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Gender</label>
                  <select
                    value={customerForm.gender}
                    onChange={(e) => setCustomerForm({ ...customerForm, gender: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                  >
                    <option value="Female">Female 👩</option>
                    <option value="Male">Male 👨</option>
                    <option value="Other">Other 🌟</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">City / Area</label>
                  <input
                    type="text"
                    placeholder="Jubilee Hills"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850 border border-white/10 text-[11px] text-gray-400 space-y-1">
                <span>Account Credentials Info:</span>
                <p className="text-white font-mono">Temp Pass: Spy@[Last4DigitsOfPhone]</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setCustomerModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-dark-800 text-gray-300 cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customerSubmitting}
                  className="px-6 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold cursor-pointer hover:scale-105 transition-all shadow-glow-rosegold disabled:opacity-50"
                >
                  {customerSubmitting ? 'Creating Profile...' : 'Save & Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD & SECURITY MODAL */}
      <ChangePasswordModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userName={employeeName}
        userRole="Stylist Specialist"
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

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={<EmployeeSkeleton />}>
      <EmployeeDashboardContent />
    </Suspense>
  );
}

