'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Home
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { API_BASE_URL } from '@/lib/api';

interface AssignedAppointment {
  _id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  service: string;
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
  clockOut: string;
  status: string;
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

export default function EmployeeDashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'clockin' | 'payrolls' | 'bank' | 'leaves' | 'schedule' | 'performance'>('queue');
  
  // Shift & Queue Control States
  const [shiftStatus, setShiftStatus] = useState<'Not Checked In' | 'Checked In' | 'On Break' | 'Checked Out'>('Not Checked In');
  const [queueFilter, setQueueFilter] = useState<'All' | 'In Queue' | 'Completed'>('All');

  // Data States
  const [appointments, setAppointments] = useState<AssignedAppointment[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [payrolls, setPayrolls] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSaveWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/employee/appointments/walkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...walkInForm,
          specialistName: user?.name ? `${user.name} (Stylist)` : 'Ananya Sharma (Senior Hair Stylist)'
        })
      });
      const data = await res.json();
      if (data.data) {
        setAppointments([data.data, ...appointments]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWalkInModalOpen(false);
    }
  };

  // Bank & UPI Details State
  const [bankForm, setBankForm] = useState({
    accountName: user?.name || 'Ananya Sharma',
    accountNumber: '50100293849201',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank, Jubilee Hills',
    upiId: 'ananya@okaxis'
  });
  const [bankSaved, setBankSaved] = useState(false);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('appointment:updated', (data: any) => {
      if (data?.appointment) {
        setAppointments(prev => prev.map(a => a._id === data.appointment._id ? { ...a, ...data.appointment } : a));
      }
    });

    socket.on('leave:updated', (data: any) => {
      if (data?.leave) {
        setLeaves(prev => prev.map(l => l._id === data.leave._id ? { ...l, ...data.leave } : l));
      }
    });

    return () => {
      socket.off('appointment:updated');
      socket.off('leave:updated');
    };
  }, [socket]);

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
      router.push('/employee/login');
      return;
    }

    setIsAuthorized(true);
    fetchEmployeeData();

    // Background sync every 15 seconds (supplemented by Socket.IO real-time events)
    const intervalId = setInterval(() => {
      fetchEmployeeData();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [user, isLoading, router]);

  const fetchEmployeeData = async () => {
    try {
      const [appRes, leaveRes, attRes, payRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employee/appointments`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/employee/leaves`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/employee/attendance`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/employee/payrolls`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (appRes.data) setAppointments(appRes.data);
      if (leaveRes.data) setLeaves(leaveRes.data);
      if (attRes.data) {
        setAttendance(attRes.data);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecords = attRes.data.filter((a: any) => a.date === todayStr);
        if (todayRecords.length > 0) {
          const mostRecent = todayRecords[0];
          if (mostRecent.clockOut === 'In Progress' || !mostRecent.clockOut) {
            setShiftStatus('Checked In');
          } else {
            setShiftStatus('Checked Out');
          }
        } else {
          setShiftStatus('Not Checked In');
        }
      }
      if (payRes.data) setPayrolls(payRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Update Service Status (In Progress, Completed, Cancelled)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE_URL}/employee/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setAppointments(appointments.map(a => a._id === id ? { ...a, status: newStatus } : a));
    } catch (e) {
      setAppointments(appointments.map(a => a._id === id ? { ...a, status: newStatus } : a));
    }
  };

  const handleMarkPaymentPaid = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/employee/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'Paid', paymentMethod: 'Cash', status: 'Completed' })
      });
      setAppointments(appointments.map(a => a._id === id ? { ...a, paymentStatus: 'Paid', status: 'Completed' } : a));
    } catch (e) {
      fetchEmployeeData();
    }
  };

  // Update Notes
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await fetch(`${API_BASE_URL}/employee/appointments/${selectedApp._id}/status`, {
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
      await fetch(`${API_BASE_URL}/employee/bank-details`, {
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

  // Clock-in & Shift Control Actions
  const handleClockIn = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employee/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: user?.name || 'Ananya Sharma' })
      });
      const data = await res.json();
      if (data.data) {
        setAttendance(prev => [data.data, ...prev.filter(a => a.date !== data.data.date)]);
      }
    } catch (e) {
      console.log('Clocked in');
    }
    setShiftStatus('Checked In');
  };

  const handleTakeBreak = () => {
    setShiftStatus(prev => prev === 'On Break' ? 'Checked In' : 'On Break');
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    try {
      await fetch(`${API_BASE_URL}/employee/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: user?.name || 'Ananya Sharma' })
      });
    } catch (e) {
      console.error('Clock-out API call error:', e);
    }

    setAttendance(prev => prev.map(a => {
      if (a.date === todayStr && (a.clockOut === 'In Progress' || !a.clockOut)) {
        return { ...a, clockOut: timeStr, status: 'Present' };
      }
      return a;
    }));

    setShiftStatus('Checked Out');
  };

  // Leave Request Submission (CRUD)
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/employee/leaves`, {
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
    router.replace('/');
  };

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Employee Sign In Required</h1>
        <p className="text-gray-400 text-sm max-w-sm">Please sign in with your staff credentials to open your assigned service queue and shift schedule.</p>
        <button
          onClick={() => router.push('/employee/login')}
          className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm"
        >
          Sign In to Employee Portal
        </button>
      </div>
    );
  }

  const navMenuItems = [
    { id: 'queue', label: "Today's Service Queue", icon: Scissors, badge: appointments.length },
    { id: 'clockin', label: 'Clock-In & Attendance', icon: CheckSquare, badge: null },
    { id: 'payrolls', label: 'My Salary Slips & Payouts', icon: FileText, badge: payrolls.length },
    { id: 'bank', label: 'Bank & UPI Account Details', icon: Building, badge: null },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar, badge: leaves.filter(l => l.status === 'Pending').length },
    { id: 'schedule', label: 'My Shift & Breaktime', icon: Clock, badge: null },
    { id: 'performance', label: 'Commission & Performance', icon: Award, badge: null }
  ];

  const employeeName = user?.name || 'Ananya Sharma';

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-800/95 border-r border-rosegold-500/20 backdrop-blur-2xl flex flex-col justify-between transition-transform duration-300 h-screen overflow-hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <Link href="/" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity cursor-pointer" title="Go to Main Website">
              <div className="w-9 h-9 rounded-xl bg-white p-1 border border-rosegold-500 flex items-center justify-center shadow-glow-rosegold shrink-0">
                <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
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
              className="text-gray-400 hover:text-white cursor-pointer"
              title="Close Sidebar"
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
                  onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-dark-900' : 'text-rosegold-400'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-dark-900 text-white' : 'bg-rosegold-500/20 text-rosegold-300 border border-rosegold-500/30'
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
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl border border-rosegold-500/40 overflow-hidden shrink-0 shadow-md bg-dark-800">
              <img 
                src={(user as any)?.image || (user as any)?.avatar || (user as any)?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                alt={employeeName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="space-y-0.5 overflow-hidden text-left">
              <h4 className="text-white font-serif font-bold text-xs truncate">{employeeName}</h4>
              <p className="text-[10px] text-rosegold-400 truncate">Senior Hair & Skin Specialist</p>
            </div>
          </div>

          <button
            onClick={() => { setSidebarOpen(false); handleLogout(); }}
            className="w-full py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 border border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Staff Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-rosegold-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-400">Employee Desk</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-rosegold-400 font-bold uppercase tracking-wider">
                {navMenuItems.find(m => m.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {shiftStatus === 'Not Checked In' || shiftStatus === 'Checked Out' ? (
              <button
                onClick={handleClockIn}
                className="px-4 py-2 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Check In Shift 🟢</span>
              </button>
            ) : shiftStatus === 'Checked In' ? (
              <>
                <button
                  onClick={handleTakeBreak}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Take Break ☕</span>
                </button>
                <button
                  onClick={handleCheckOut}
                  className="px-3.5 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>Check Out 🔴</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleTakeBreak}
                  className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer animate-pulse"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resume Work ⏱️</span>
                </button>
                <button
                  onClick={handleCheckOut}
                  className="px-3.5 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>Check Out 🔴</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          
          {/* TAB 1: TODAY'S ASSIGNED SERVICE QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-6 animate-fadeIn text-left">
              
              {/* FULL-WIDTH WORKLOAD & QUEUE CONTROL CARD */}
              <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-5 bg-dark-800/80 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        shiftStatus === 'On Break' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        shiftStatus === 'Checked In' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {shiftStatus === 'On Break' ? '☕ On Break' : shiftStatus === 'Checked In' ? '🟢 Shift Active' : '⚪ Shift Inactive'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Stylist Shift Workload</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-white mt-1">Assigned Client Queue & Workload Control</h3>
                  </div>

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
                    className="px-4 py-2.5 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-105 transition-all self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Walk-In Client</span>
                  </button>
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
                        <h3 className="text-lg font-serif font-bold text-white">{app.service}</h3>
                      </div>

                      <div className="flex items-center space-x-2">
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
                          className="bg-dark-800 text-xs font-bold text-white px-3 py-1.5 rounded-xl border border-rosegold-500/30 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="In Progress">In Progress ✂️</option>
                          <option value="Completed">Completed ✅</option>
                          <option value="Cancelled">Cancelled</option>
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
                            {app.bookingDateTime 
                              ? new Date(app.bookingDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : (app.bookingDate || '23 Jul 2026')
                            } • {app.bookingTimeFormatted || (app.bookingDateTime ? new Date(app.bookingDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM')}
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
                    {shiftStatus === 'Checked In' 
                      ? 'Shift in progress. Log break or check out below.'
                      : shiftStatus === 'On Break'
                      ? 'Currently on break. Click Resume Work when returning to desk.'
                      : shiftStatus === 'Checked Out'
                      ? 'Shift completed for today. Click Clock In to record a new shift entry.'
                      : 'Clock in every morning upon entering the Jubilee Hills Flagship studio.'
                    }
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {shiftStatus === 'Not Checked In' || shiftStatus === 'Checked Out' ? (
                    <button
                      onClick={handleClockIn}
                      className="px-6 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-105 transition-transform flex items-center space-x-2 cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Clock In Now</span>
                    </button>
                  ) : shiftStatus === 'Checked In' ? (
                    <>
                      <button
                        onClick={handleTakeBreak}
                        className="px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Take Break ☕</span>
                      </button>
                      <button
                        onClick={handleCheckOut}
                        className="px-5 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all"
                      >
                        <span>Check Out 🔴</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleTakeBreak}
                        className="px-5 py-3 rounded-full bg-green-500 hover:bg-green-400 text-dark-900 font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer animate-pulse"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Resume Work ⏱️</span>
                      </button>
                      <button
                        onClick={handleCheckOut}
                        className="px-5 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all"
                      >
                        <span>Check Out 🔴</span>
                      </button>
                    </>
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
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {attendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white">{rec.date}</td>
                        <td className="p-4 text-green-400 font-semibold">{rec.clockIn}</td>
                        <td className="p-4 text-gray-400">{rec.clockOut}</td>
                        <td className="p-4">
                          <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            {rec.status}
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
                <h2 className="text-2xl font-bold font-serif text-white">Bank Account & UPI Payout Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Keep your bank account and UPI details updated for automatic monthly salary disbursement.</p>
              </div>

              {bankSaved && (
                <div className="p-4 rounded-2xl bg-green-900/40 border border-green-500/50 text-green-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Bank & UPI Payout account details saved successfully! Updated in Admin Payout Roster.</span>
                </div>
              )}

              <form onSubmit={handleSaveBankDetails} className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 max-w-2xl space-y-4 text-xs">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Account Holder Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={bankForm.accountName} 
                    onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Bank Account Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.accountNumber} 
                      onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 font-mono text-xs focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">IFSC Code *</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.ifscCode} 
                      onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 font-mono text-xs focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Bank Name & Branch</label>
                    <input 
                      type="text" 
                      value={bankForm.bankName} 
                      onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">UPI ID (For Fast Disbursal)</label>
                    <input 
                      type="text" 
                      value={bankForm.upiId} 
                      onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 font-mono text-xs focus:outline-none focus:border-rosegold-500" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer"
                >
                  Save Bank & UPI Account Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: LEAVE REQUESTS CRUD */}
          {activeTab === 'leaves' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <h2 className="text-2xl font-bold font-serif text-white">Leave Requests & Application Desk</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submit New Leave Form */}
                <form onSubmit={handleSubmitLeave} className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4 text-xs">
                  <h3 className="text-base font-serif font-bold text-white">Apply for Leave</h3>
                  
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 uppercase">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 uppercase">End Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1 uppercase">Reason *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Personal travel or medical appointment..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md cursor-pointer"
                  >
                    Submit Leave Request
                  </button>
                </form>

                {/* Leaves History Table */}
                <div className="md:col-span-2 space-y-3">
                  <span className="text-xs text-rosegold-400 font-bold uppercase tracking-wider">Leave Application Status</span>
                  {leaves.map((leave) => (
                    <div key={leave._id} className="glass-card p-4 rounded-2xl border border-rosegold-500/30 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-white font-bold block">{leave.startDate} to {leave.endDate}</span>
                        <span className="text-gray-400 block">Reason: {leave.reason}</span>
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
                <span className="text-xs font-bold text-rosegold-500 uppercase tracking-widest block">SPY SALON BOTANICAL STUDIO</span>
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

    </div>
  );
}
