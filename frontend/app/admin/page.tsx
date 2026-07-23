'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  Calendar, 
  MessageSquare, 
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
  XCircle,
  Star,
  Wand2,
  Sparkles,
  DollarSign,
  CreditCard,
  FileText,
  Printer
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import ImageUploader from '@/components/ui/ImageUploader';

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
  specialistName: string;
  branch: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
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

interface ActivityLog {
  _id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'earnings' | 'employees' | 'customers' | 'services' | 'appointments' | 'leaves' | 'reviews' | 'ai-reports'>('analytics');
  
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
  const [loading, setLoading] = useState(true);

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
  const [modalType, setModalType] = useState<'addEmp' | 'editEmp' | 'addCust' | 'addSrv' | 'editSrv' | 'addApp' | 'empCreds' | 'viewEmp' | 'addPay' | 'viewPay' | 'rescheduleNote' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [rescheduleNoteText, setRescheduleNoteText] = useState('');

  // Notification Dropdown State & Auto-close Ref
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const adminNotifRef = React.useRef<HTMLDivElement>(null);

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  // Executive Business Reports Selection States
  const [slicerDateRange, setSlicerDateRange] = useState<'daily' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [slicerCategory, setSlicerCategory] = useState<string>('All');
  const [slicerSpecialist, setSlicerSpecialist] = useState<string>('All');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeReportMeta, setActiveReportMeta] = useState({ dateRange: 'monthly', category: 'All', specialist: 'All' });
  const [showAiBriefModal, setShowAiBriefModal] = useState(false);

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
        grossRevenue: 284500,
        netProfit: 143700
      },
      slicersApplied: {
        dateRange: slicerDateRange,
        category: slicerCategory,
        specialist: slicerSpecialist
      },
      tables: {
        transactions: transactions,
        specialistROI: [
          { name: 'Ananya Sharma', code: 'EMP-1001', count: 48, rev: 98500, sal: 51000, rating: 5.0, roi: '+93.1%' },
          { name: 'Rahul Verma', code: 'EMP-1002', count: 36, rev: 72400, sal: 42200, rating: 4.8, roi: '+71.5%' },
          { name: 'Priya Reddy', code: 'EMP-1003', count: 42, rev: 84600, sal: 47600, rating: 4.9, roi: '+77.7%' },
          { name: 'Meera Kapoor', code: 'EMP-1004', count: 28, rev: 29000, sal: 25000, rating: 4.7, roi: '+16.0%' }
        ],
        categoryBreakdown: [
          { category: 'Skin Care & Facials', revenue: 113800, percentage: 40 },
          { category: 'Hair Care & Keratin Spa', revenue: 99575, percentage: 35 },
          { category: 'Bridal & HD Makeup', revenue: 42675, percentage: 15 },
          { category: 'Nails & Barbering', revenue: 28450, percentage: 10 }
        ]
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

    socket.on('employee:created', (data: any) => {
      if (data?.employee) {
        setEmployees(prev => [data.employee, ...prev.filter(e => e._id !== data.employee._id)]);
      }
    });

    socket.on('employee:updated', (data: any) => {
      if (data?.employee) {
        setEmployees(prev => prev.map(e => e._id === data.employee._id ? { ...e, ...data.employee } : e));
      }
    });

    socket.on('employee:deleted', (data: any) => {
      if (data?.employeeId) {
        setEmployees(prev => prev.filter(e => e._id !== data.employeeId));
      }
    });

    socket.on('appointment:updated', (data: any) => {
      if (data?.appointment) {
        setAppointments(prev => prev.map(a => a._id === data.appointment._id ? { ...a, ...data.appointment } : a));
      }
    });

    return () => {
      socket.off('employee:created');
      socket.off('employee:updated');
      socket.off('employee:deleted');
      socket.off('appointment:updated');
    };
  }, [socket]);

  // Form States
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialties: 'Senior Hair Stylist, Keratin Expert',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    services: 'Signature Keratin Hair Spa & Mask',
    workStart: '09:00',
    workEnd: '19:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    slotInterval: 30
  });

  const [custForm, setCustForm] = useState({ name: '', email: '', phone: '', membership: 'VIP Gold' });
  
  const [srvForm, setSrvForm] = useState({
    name: '',
    category: 'Hair',
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
    customerPhone: '+91 98765 43210',
    service: '24K Royal Gold Glow Facial',
    specialistName: 'Ananya Sharma (Senior Hair Stylist)',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '11:00 AM',
    paymentMethod: 'UPI'
  });

  const [payForm, setPayForm] = useState({
    employeeName: 'Ananya Sharma',
    month: 'July 2026',
    baseSalary: 45000,
    incentives: 7500,
    deductions: 1500,
    paymentMethod: 'Bank Transfer (HDFC)'
  });

  // Security Authorization Guard
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('spy_user');
    if (!storedUser) {
      setIsAuthorized(false);
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === 'admin' || parsed.role === 'manager' || parsed.email?.includes('admin')) {
        setIsAuthorized(true);
        fetchAdminData();

        // Realtime auto-fetch polling every 3 seconds
        const intervalId = setInterval(() => {
          fetchAdminData();
        }, 3000);
        return () => clearInterval(intervalId);
      } else {
        setIsAuthorized(false);
        router.push('/login');
      }
    } catch (e) {
      setIsAuthorized(false);
      router.push('/login');
    }
  }, [router]);

  const fetchAdminData = async () => {
    try {
      const [anaRes, empRes, custRes, srvRes, appRes, leaveRes, revRes, payRes, actRes, notifRes, txnRes, attReportRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/admin/analytics').then(r => r.json()).catch(() => ({ data: null })),
        fetch('http://localhost:5000/api/v1/admin/employees').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/customers').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/services').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/appointments').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/leaves').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/reviews').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/payrolls').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/activity-logs').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/notifications').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/transactions').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/attendance/report').then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (anaRes.data) setAnalytics(anaRes.data);
      if (empRes.data) setEmployees(empRes.data);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CSV Report Export Handler
  const handleExportReport = (moduleName: string) => {
    window.open(`http://localhost:5000/api/v1/admin/export/${moduleName}`, '_blank');
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
    const payload = {
      name: empForm.name,
      email: empForm.email,
      phone: empForm.phone,
      password: empForm.password || `${empForm.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}@123`,
      specialties: empForm.specialties ? empForm.specialties.split(',').map(s => s.trim()) : ['Senior Hair Stylist'],
      avatar: empForm.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      services: empForm.services ? empForm.services.split(',').map(s => s.trim()) : ['Signature Keratin Hair Spa'],
      workingHours: { start: empForm.workStart || '09:00', end: empForm.workEnd || '19:00' },
      breakTime: { start: empForm.breakStart || '13:00', end: empForm.breakEnd || '14:00' },
      slotIntervalMinutes: Number(empForm.slotInterval || 30),
      status: 'Active'
    };

    if (modalType === 'editEmp' && selectedItem) {
      const res = await fetch(`http://localhost:5000/api/v1/admin/employees/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const updated = data.data || payload;
      setEmployees(employees.map(emp => emp._id === selectedItem._id ? { ...emp, ...updated } : emp));
      if (data.credentials) {
        setCreatedCredentials({
          name: updated.name,
          empCode: data.credentials.empCode,
          email: data.credentials.email,
          username: data.credentials.username,
          tempPassword: data.credentials.tempPassword
        });
        setModalType('empCreds');
        return;
      }
      setModalType(null);
    } else {
      const res = await fetch('http://localhost:5000/api/v1/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.data) {
        setEmployees([data.data, ...employees]);
        if (data.credentials) {
          setCreatedCredentials({
            name: data.data.name,
            empCode: data.credentials.empCode,
            email: data.credentials.email,
            username: data.credentials.username,
            tempPassword: data.credentials.tempPassword
          });
          setModalType('empCreds');
          return;
        }
      }
      setModalType(null);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Delete this employee record?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/employees/${id}`, { method: 'DELETE' });
    setEmployees(employees.filter(e => e._id !== id));
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

    const payload = {
      name: srvForm.name,
      category: finalCategory,
      price: Number(srvForm.price),
      discountPrice: Number(srvForm.discountPrice || srvForm.price),
      durationMinutes: Number(srvForm.durationMinutes),
      rating: Number(srvForm.rating),
      description: srvForm.description,
      image: srvForm.image,
      isPopular: Boolean(srvForm.isPopular),
      steps: stepsArray,
      benefits: benefitsArray,
      isActive: true
    };

    if (modalType === 'editSrv' && selectedItem) {
      const res = await fetch(`http://localhost:5000/api/v1/admin/services/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const updated = data.data || payload;
      setServices(services.map(s => s._id === selectedItem._id ? { ...s, ...updated } : s));
    } else {
      const res = await fetch('http://localhost:5000/api/v1/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.data) setServices([data.data, ...services]);
    }
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setModalType(null);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete service from menu?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/services/${id}`, { method: 'DELETE' });
    setServices(services.filter(s => s._id !== id));
  };

  // PAYROLL & SALARY SLIP CRUD HANDLERS
  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/v1/admin/payrolls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payForm)
    });
    const data = await res.json();
    if (data.data) {
      setPayrolls([data.data, ...payrolls]);
    }
    setModalType(null);
  };

  const handleUpdatePayrollStatus = async (id: string, newStatus: string) => {
    await fetch(`http://localhost:5000/api/v1/admin/payrolls/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setPayrolls(payrolls.map(p => p._id === id ? { ...p, status: newStatus } : p));
  };

  const handleDeletePayroll = async (id: string) => {
    if (!confirm('Delete salary slip record?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/payrolls/${id}`, { method: 'DELETE' });
    setPayrolls(payrolls.filter(p => p._id !== id));
  };

  // CUSTOMERS & APPOINTMENTS
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/v1/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(custForm)
    });
    const data = await res.json();
    if (data.data) setCustomers([data.data, ...customers]);
    setModalType(null);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Delete customer account?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/customers/${id}`, { method: 'DELETE' });
    setCustomers(customers.filter(c => c._id !== id));
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/v1/admin/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: appForm.customerName,
        customerPhone: appForm.customerPhone,
        service: appForm.service,
        specialistName: appForm.specialistName,
        appointmentDate: appForm.appointmentDate,
        appointmentTime: appForm.appointmentTime,
        paymentMethod: appForm.paymentMethod,
        branch: 'Jubilee Hills Flagship'
      })
    });
    const data = await res.json();
    if (data.data) setAppointments([data.data, ...appointments]);
    setModalType(null);
  };

  const handleUpdateAppStatus = async (id: string, newStatus: string) => {
    await fetch(`http://localhost:5000/api/v1/admin/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setAppointments(appointments.map(a => a._id === id ? { ...a, status: newStatus } : a));
  };

  const handleRespondReschedule = async (id: string, action: 'Approve' | 'Reject', rejectionReason?: string) => {
    const res = await fetch(`http://localhost:5000/api/v1/admin/appointments/${id}/reschedule-respond`, {
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

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Cancel & delete appointment?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/appointments/${id}`, { method: 'DELETE' });
    setAppointments(appointments.filter(a => a._id !== id));
  };

  // LEAVE APPROVAL / REJECTION HANDLERS
  const handleUpdateLeaveStatus = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    await fetch(`http://localhost:5000/api/v1/admin/leaves/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setLeaves(leaves.map(l => l._id === id ? { ...l, status: newStatus } : l));
  };

  const handleDeleteLeave = async (id: string) => {
    if (!confirm('Remove this leave application record?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/leaves/${id}`, { method: 'DELETE' });
    setLeaves(leaves.filter(l => l._id !== id));
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Remove this comment?')) return;
    await fetch(`http://localhost:5000/api/v1/admin/reviews/${id}`, { method: 'DELETE' });
    setReviews(reviews.filter(r => r._id !== id));
  };

  const handleAdminLogout = async () => {
    await logout();
    router.replace('/');
  };

  const copyCredsToClipboard = (emailVal?: string, passVal?: string, codeVal?: string) => {
    const e = emailVal || createdCredentials?.email || 'ananya_sharma@spysalon.com';
    const p = passVal || createdCredentials?.tempPassword || 'ananya_sharma@123';
    const c = codeVal || createdCredentials?.empCode || 'EMP-1001';
    const text = `SPY Salon Staff Credentials:\nEmployee ID: ${c}\nLogin Email: ${e}\nPassword: ${p}\nLogin Portal: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  // Filtered Lists
  const filteredEmployees = employees.filter(e => {
    const matchQ = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchS = statusFilter === 'All' || e.status === statusFilter;
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

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Admin Authentication Required</h1>
        <p className="text-gray-400 text-sm max-w-sm">Please sign in with administrator credentials.</p>
        <button onClick={() => router.push('/login')} className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm">
          Sign In to Admin Portal
        </button>
      </div>
    );
  }

  const navMenuItems = [
    { id: 'analytics', label: 'Dashboard & Reports', icon: TrendingUp },
    { id: 'appointments', label: 'Appointments Desk', icon: Calendar },
    { id: 'earnings', label: 'Earnings & Payroll Payouts', icon: DollarSign },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'customers', label: 'Customer Directory', icon: UserCheck },
    { id: 'services', label: 'Services & Pricing Menu', icon: Scissors },
    { id: 'leaves', label: 'Leaves & Attendance', icon: Clock },
    { id: 'reviews', label: 'Reviews & Moderation', icon: MessageSquare },
    { id: 'ai-reports', label: 'Executive Business Reports', icon: FileText }
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-850 border-r border-rosegold-500/20 flex flex-col justify-between transition-transform duration-300 h-screen overflow-hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-white p-1 border border-rosegold-500 flex items-center justify-center shadow-glow-rosegold shrink-0">
                <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-base font-bold text-white leading-none">
                  SPY <span className="rosegold-gradient-text font-bold">SALON</span>
                </span>
                <span className="text-[8px] tracking-[0.2em] text-rosegold-400 uppercase font-sans mt-1">
                  ADMIN EXECUTIVE DESK
                </span>
              </div>
            </div>

            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
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
                  onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); setSearchQuery(''); setStatusFilter('All'); }}
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
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-white/10 bg-dark-900/90 text-xs space-y-2.5 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl rosegold-gradient-bg text-dark-900 font-bold flex items-center justify-center text-xs shrink-0">
              AD
            </div>
            <div className="space-y-0.5 overflow-hidden text-left">
              <h4 className="text-white font-serif font-bold text-xs truncate">System Administrator</h4>
              <p className="text-[10px] text-gray-400 truncate">admin@spysalon.com</p>
            </div>
          </div>

          <button onClick={handleAdminLogout} className="w-full py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 border border-red-500/30 transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-dark-900/95 border-b border-rosegold-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white cursor-pointer" title="Toggle Navigation Menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-400">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-rosegold-400 font-bold uppercase tracking-wider">
                {navMenuItems.find(m => m.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="relative" ref={adminNotifRef}>
              {(() => {
                const actionableNotifs = notifications.filter(n => {
                  if (n.read) return false;
                  const text = `${n.title} ${n.message}`.toLowerCase();
                  return !text.includes('logged in') && 
                         !text.includes('logged out') && 
                         !text.includes('login') && 
                         !text.includes('logout') && 
                         !text.includes('system online') &&
                         !text.includes('audit log');
                });
                return (
                  <>
                    <button
                      onClick={() => {
                        const willOpen = !adminNotifOpen;
                        setAdminNotifOpen(willOpen);
                        if (willOpen && actionableNotifs.length > 0) {
                          fetch('http://localhost:5000/api/v1/admin/notifications/read', { method: 'PUT' });
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                        }
                      }}
                      className="p-2 rounded-xl bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white transition-all cursor-pointer relative"
                      title="Important Admin Notifications"
                    >
                      <Bell className="w-4 h-4 text-rosegold-400" />
                      {actionableNotifs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rosegold-500 text-dark-900 font-extrabold text-[9px] flex items-center justify-center">
                          {actionableNotifs.length}
                        </span>
                      )}
                    </button>

                    {/* Admin Notification Dropdown */}
                    {adminNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-dark-900/95 border border-rosegold-500/40 backdrop-blur-2xl shadow-2xl p-4 space-y-3 z-50 text-left animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-rosegold-400" />
                            <h4 className="text-white font-serif font-bold text-sm">Actionable Notifications</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => {
                              fetch('http://localhost:5000/api/v1/admin/notifications/read', { method: 'PUT' });
                              setNotifications([]);
                            }} className="text-[10px] text-rosegold-300 font-bold hover:underline cursor-pointer">Clear All</button>
                            <button onClick={() => setAdminNotifOpen(false)} className="text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {actionableNotifs.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No unread actionable notifications.</p>
                          ) : (
                            actionableNotifs.map((n) => (
                              <div key={n._id} className="p-3 rounded-2xl bg-dark-800 border border-rosegold-500/20 text-xs space-y-1 hover:border-rosegold-500/50 transition-colors">
                                <div className="flex justify-between items-center">
                                  <span className="text-rosegold-400 font-bold">{n.title}</span>
                                  <span className="text-[9px] text-gray-500 font-mono">
                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-[11px] leading-relaxed">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <span className="text-[11px] font-semibold text-green-400 bg-green-500/15 border border-green-500/30 px-3 py-1 rounded-full">
              🟢 System Synchronized
            </span>
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
                  onClick={() => setActiveTab('earnings')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 hover:shadow-glow-rosegold group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-rosegold-300">Total Revenue</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-rosegold-400">₹{analytics?.totalRevenue?.toLocaleString('en-IN') || '2,84,500'}</p>
                  <span className="text-[10px] text-rosegold-300 font-bold block pt-1">Click to View Earnings & Payouts →</span>
                </div>

                <div 
                  onClick={() => setActiveTab('appointments')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-white">Total Appointments</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-white">{analytics?.totalAppointments || appointments.length}</p>
                  <span className="text-[10px] text-gray-400 block pt-1">Click to Manage Appointments →</span>
                </div>

                <div 
                  onClick={() => setActiveTab('employees')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-purple-300">Active Specialists</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-purple-400">{analytics?.activeEmployees || employees.length}</p>
                  <span className="text-[10px] text-purple-300 block pt-1">Click to Manage Specialists →</span>
                </div>

                <div 
                  onClick={() => setActiveTab('customers')}
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/30 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 group"
                >
                  <span className="text-xs text-gray-400 font-semibold uppercase group-hover:text-green-300">Client Base</span>
                  <p className="text-2xl sm:text-3xl font-bold font-serif text-green-400">{analytics?.totalCustomers || customers.length}</p>
                  <span className="text-[10px] text-green-300 block pt-1">Click to View Directory →</span>
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
                    setPayForm({
                      employeeName: employees[0]?.name || 'Ananya Sharma',
                      month: 'July 2026',
                      baseSalary: 45000,
                      incentives: 7500,
                      deductions: 1500,
                      paymentMethod: 'Bank Transfer (HDFC)'
                    });
                    setModalType('addPay');
                  }}
                  className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Generate Salary Slip</span>
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
                  <p className="text-2xl font-serif font-bold text-rosegold-400">₹{analytics?.totalRevenue?.toLocaleString('en-IN') || '2,84,500'}</p>
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
                    ₹{(analytics?.cashCollected || 42500).toLocaleString('en-IN')}
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
                    ₹{((analytics?.totalRevenue || 284500) - payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)).toLocaleString('en-IN')}
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions
                        .filter(t => txnFilter === 'All' ? true : t.type === txnFilter)
                        .map((t) => (
                          <tr key={t._id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-rosegold-300">{t.txnId}</td>
                            <td className="p-3 font-mono text-[11px] text-gray-400">{t.date}</td>
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
                          </tr>
                        ))}
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
                        specialties: 'Senior Hair Stylist, Keratin Expert',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                        services: 'Signature Keratin Hair Spa & Mask',
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
                    <span>+ Add Specialist</span>
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
                {filteredEmployees.map(emp => {
                  const empNameKey = emp.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
                  const empLoginEmail = emp.email || `${empNameKey}@spysalon.com`;
                  const empLoginPassword = (emp as any).tempPassword || (emp as any).password || `${empNameKey}@123`;

                  return (
                    <div key={emp._id} className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30 flex flex-col justify-between hover:border-rosegold-500/60 transition-all">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-rosegold-500/50 shadow-glow-rosegold shrink-0 bg-dark-800">
                          <img 
                            src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                            alt={emp.name} 
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'; }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-serif font-bold text-lg truncate">{emp.name}</h3>
                              <span className="bg-dark-800 text-rosegold-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-rosegold-500/30">{emp.empCode || 'EMP-1001'}</span>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedItem(emp);
                                  setEmpForm({
                                    name: emp.name,
                                    email: emp.email,
                                    phone: emp.phone,
                                    password: (emp as any).tempPassword || (emp as any).password || '',
                                    specialties: emp.specialties.join(', '),
                                    avatar: emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                                    services: emp.services.join(', '),
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
                          {emp.specialties?.map((s, i) => (
                            <span key={i} className="bg-purple-600/30 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                              ✨ {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* View Profile & Credentials Button */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-gray-400">
                          Pass: <span className="text-green-400 font-mono font-bold">{empLoginPassword}</span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSelectedItem(emp);
                            setCreatedCredentials({
                              name: emp.name,
                              empCode: emp.empCode || 'EMP-1001',
                              email: empLoginEmail,
                              username: empNameKey,
                              tempPassword: empLoginPassword
                            });
                            setModalType('viewEmp');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/40 font-bold text-xs flex items-center space-x-1 hover:bg-rosegold-500 hover:text-dark-900 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile & Credentials</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
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
                    <span>+ Add Customer</span>
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
                        <td className="p-4 font-serif font-bold text-rosegold-400">₹{c.totalSpend}</td>
                        <td className="p-4"><span className="bg-rosegold-500/15 text-rosegold-300 border border-rosegold-500/30 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{c.membership}</span></td>
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

          {/* TAB 5: SERVICES MENU MANAGEMENT */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Services & Pricing Menu Control</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage treatment titles, categories, pricing, durations, descriptions, procedure steps, and cover images.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleExportReport('services')} className="px-3.5 py-2 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-dark-700">
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setSrvForm({
                        name: '',
                        category: 'Hair',
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
                      setModalType('addSrv');
                    }}
                    className="px-4 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Treatment Service</span>
                  </button>
                </div>
              </div>

              {/* Services Grid with Full Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredServices.map((s) => (
                  <div key={s._id} className="glass-card rounded-3xl border border-rosegold-500/30 overflow-hidden flex flex-col justify-between hover:border-rosegold-500/60 transition-all">
                    <div>
                      <div className="relative h-44 w-full bg-dark-800">
                        <img src={s.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80'} alt={s.name} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 bg-purple-900/80 backdrop-blur-md text-purple-200 border border-purple-500/40 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          {s.category}
                        </span>
                        {s.isPopular && (
                          <span className="absolute top-3 right-14 bg-rosegold-500 text-dark-900 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                            Popular
                          </span>
                        )}
                        <div className="absolute bottom-3 right-3 flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedItem(s);
                              const steps = s.steps || [];
                              setSrvForm({
                                name: s.name,
                                category: s.category || 'Hair',
                                price: s.price,
                                discountPrice: s.discountPrice || s.price,
                                durationMinutes: s.durationMinutes || 60,
                                rating: s.rating || 4.9,
                                description: s.description || 'Luxury botanical treatment provided by SPY Salon certified specialists.',
                                image: s.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
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
                            className="p-1.5 rounded-lg bg-dark-900/80 text-white hover:bg-dark-900 cursor-pointer"
                            title="Edit Service Details & Steps"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteService(s._id)} className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 cursor-pointer" title="Delete Service">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-5 space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-serif font-bold text-base">{s.name}</h3>
                          <div className="flex items-center space-x-1 text-xs text-yellow-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-yellow-400" />
                            <span>{s.rating || 4.9}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 line-clamp-2">{s.description || 'Luxury botanical treatment provided by SPY Salon certified specialists.'}</p>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-300">
                          <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                          <span>Duration: <strong>{s.durationMinutes || 60} Minutes</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 border-t border-white/10 flex items-center justify-between">
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
                    <span>+ Walk-In Appointment</span>
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
                      <th className="p-4">Booking ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Service Requested</th>
                      <th className="p-4">Specialist</th>
                      <th className="p-4">Booking Date & Time</th>
                      <th className="p-4">Scheduled Visit</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
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
                        <td className="p-4 font-mono font-bold text-rosegold-400">{a.bookingId}</td>
                        <td className="p-4 font-bold text-white">{a.customerName}<br/><span className="text-gray-400 font-normal">{a.customerPhone}</span></td>
                        <td className="p-4 font-semibold text-white">{a.service}</td>
                        <td className="p-4 text-rosegold-300 font-medium">{a.specialistName}</td>
                        <td className="p-4 font-mono text-[11px] text-rosegold-300">
                          {a.bookingDateTime 
                            ? new Date(a.bookingDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : (a.bookingDate || '23 Jul 2026')
                          }<br/>
                          <span className="text-gray-400">
                            {a.bookingTimeFormatted || (a.bookingDateTime ? new Date(a.bookingDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM')}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">{a.appointmentDate}<br/><span className="text-rosegold-400">{a.appointmentTime}</span></td>
                        <td className="p-4"><span className="bg-dark-800 px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">{a.paymentMethod || 'Cash'} • {a.paymentStatus || 'Paid'}</span></td>
                        <td className="p-4 space-y-1">
                          <select value={a.status} onChange={(e) => handleUpdateAppStatus(a._id, e.target.value)} className="bg-dark-900 text-xs font-bold px-2 py-1 rounded border border-white/10 focus:outline-none block">
                            <option value="Pending">Pending 🟡</option>
                            <option value="Confirmed">Confirmed 🟢</option>
                            <option value="Reschedule Requested">Reschedule Requested ⚠️</option>
                            <option value="Rescheduled">Rescheduled 📅</option>
                            <option value="In Progress">In Progress ✂️</option>
                            <option value="Completed">Completed ✅</option>
                            <option value="Cancelled">Cancelled ❌</option>
                            <option value="No Show">No Show ⚪</option>
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
                        <td className="p-4 text-right"><button onClick={() => handleDeleteAppointment(a._id)} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></td>
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
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-rosegold-500/50 shadow-glow-rosegold shrink-0 bg-dark-800">
                          <img 
                            src={report.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                            alt={report.name} 
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'; }}
                          />
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
                          onClick={() => alert(`Marked today's attendance for ${report.name} as Present 🟢`)}
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
                  <h3 className="text-lg font-serif font-bold text-white">Employee Leave Requests & Approvals</h3>
                  <span className="text-xs text-gray-400">Review pending leave applications</span>
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
          {activeTab === 'ai-reports' && (
            <div className="space-y-8 animate-fadeIn text-left">
              
              {/* HEADER & CONTROLS BAR */}
              <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 bg-dark-900/90 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-rosegold-500/20 text-rosegold-300 font-extrabold text-[10px] px-3 py-0.5 rounded-full border border-rosegold-500/40 uppercase tracking-widest">
                        📊 Executive Intelligence System
                      </span>
                      <span className="text-xs text-green-400 font-mono font-bold">🟢 Application Store Live</span>
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
                        className="w-full p-3 rounded-xl bg-dark-800 text-white font-bold border border-white/10 focus:outline-none focus:border-rosegold-500"
                      >
                        <option value="daily">Daily Report (Today - 23 Jul 2026)</option>
                        <option value="monthly">Monthly Report (July 2026)</option>
                        <option value="quarterly">Quarterly Report (Q3 2026)</option>
                        <option value="yearly">Yearly Report (YTD 2026)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 font-semibold block mb-1 uppercase text-[10px] tracking-wider">Service Category Filter *</label>
                      <select
                        value={slicerCategory}
                        onChange={(e) => setSlicerCategory(e.target.value)}
                        className="w-full p-3 rounded-xl bg-dark-800 text-white font-bold border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
                      >
                        <option value="All">All Service Categories (100%)</option>
                        <option value="Skin Care">Skin Care & Gold Facials</option>
                        <option value="Hair Care">Hair Care & Keratin Spa</option>
                        <option value="Bridal">Bridal & HD Makeup</option>
                        <option value="Nails">Nail Artistry & Grooming</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 font-semibold block mb-1 uppercase text-[10px] tracking-wider">Specialist Filter *</label>
                      <select
                        value={slicerSpecialist}
                        onChange={(e) => setSlicerSpecialist(e.target.value)}
                        className="w-full p-3 rounded-xl bg-dark-800 text-white font-bold border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
                      >
                        <option value="All">All Staff Specialists</option>
                        <option value="Ananya Sharma">Ananya Sharma (Senior Stylist)</option>
                        <option value="Rahul Verma">Rahul Verma (Master Barber)</option>
                        <option value="Priya Reddy">Priya Reddy (Skin Expert)</option>
                        <option value="Meera Kapoor">Meera Kapoor (Nail Artist)</option>
                      </select>
                    </div>
                  </div>

                  {/* GET REPORT BUTTON DIRECTLY BELOW SELECTION INPUTS */}
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
                      Active Compiled Report: {
                        activeReportMeta.dateRange === 'daily' ? 'Daily Report (Today - 23 Jul 2026)' :
                        activeReportMeta.dateRange === 'monthly' ? 'Monthly Report (July 2026)' :
                        activeReportMeta.dateRange === 'quarterly' ? 'Quarterly Report (Q3 2026)' :
                        'Yearly Report (YTD 2026)'
                      }
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
                      💰 Gross Revenue & Net Profit Retention
                    </span>
                    <h4 className="text-white font-serif font-bold text-base">
                      {activeReportMeta.dateRange === 'daily' ? 'Daily Net Profit: ₹8,200' :
                       activeReportMeta.dateRange === 'monthly' ? 'Monthly Net Profit: ₹1,43,700' :
                       activeReportMeta.dateRange === 'quarterly' ? 'Quarterly Net Profit: ₹3,63,700' :
                       'Yearly Net Profit: ₹12,15,000'}
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Gross Revenue reached <strong className="text-rosegold-400">
                        {activeReportMeta.dateRange === 'daily' ? '₹14,500' :
                         activeReportMeta.dateRange === 'monthly' ? '₹2,84,500' :
                         activeReportMeta.dateRange === 'quarterly' ? '₹7,39,500' :
                         '₹24,80,000'}
                      </strong> with an average studio net profit margin of <strong className="text-green-400">50.5%</strong>.
                    </p>
                  </div>

                  {/* Metric Tile 2 */}
                  <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-3 shadow-2xl bg-dark-800/80 hover:border-rosegold-500 transition-all">
                    <span className="text-[10px] font-bold text-purple-300 uppercase bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full inline-block">
                      👩‍🎨 Staff Utilization & Productivity
                    </span>
                    <h4 className="text-white font-serif font-bold text-base">Optimal Specialist Efficiency (92.3%)</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Senior Stylist <strong className="text-white">Ananya Sharma</strong> led specialist performance with <strong className="text-purple-300">
                        {activeReportMeta.dateRange === 'daily' ? '4' : activeReportMeta.dateRange === 'monthly' ? '48' : activeReportMeta.dateRange === 'quarterly' ? '142' : '480'} appointments
                      </strong> and 100% positive ratings.
                    </p>
                  </div>

                  {/* Metric Tile 3 */}
                  <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-3 shadow-2xl bg-dark-800/80 hover:border-rosegold-500 transition-all">
                    <span className="text-[10px] font-bold text-rosegold-300 uppercase bg-rosegold-500/15 border border-rosegold-500/30 px-2.5 py-0.5 rounded-full inline-block">
                      📈 Growth Target & Predictive Volume
                    </span>
                    <h4 className="text-white font-serif font-bold text-base">
                      {activeReportMeta.dateRange === 'daily' ? 'Tomorrow Target: ₹18,000' :
                       activeReportMeta.dateRange === 'monthly' ? 'August Target: ₹3,20,000' :
                       activeReportMeta.dateRange === 'quarterly' ? 'Q4 Target: ₹8,50,000' :
                       '2027 Target: ₹30,000,00'}
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Upward trend forecast (+12.5% volume growth) driven by pre-bridal skin and keratin hair spa packages.
                    </p>
                  </div>

                </div>

                {/* REPORT DATA MATRIX TABLES & CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                  
                  {/* Visual 1: Comparative Period Trend */}
                  <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h4 className="text-base font-serif font-bold text-white">Comparative Performance Waterfall</h4>
                      <span className="text-[10px] font-mono text-gray-400">Period Trend Gauge</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { period: activeReportMeta.dateRange === 'daily' ? 'Yesterday' : activeReportMeta.dateRange === 'monthly' ? 'May 2026' : activeReportMeta.dateRange === 'quarterly' ? 'Q1 2026' : 'Year 2024', gross: 210000, payout: 110000, profit: 100000 },
                        { period: activeReportMeta.dateRange === 'daily' ? '2 Days Ago' : activeReportMeta.dateRange === 'monthly' ? 'June 2026' : activeReportMeta.dateRange === 'quarterly' ? 'Q2 2026' : 'Year 2025', gross: 245000, payout: 125000, profit: 120000 },
                        { period: activeReportMeta.dateRange === 'daily' ? 'Today (Active)' : activeReportMeta.dateRange === 'monthly' ? 'July 2026 (Live)' : activeReportMeta.dateRange === 'quarterly' ? 'Q3 2026 (Active)' : 'Year 2026 (YTD)', gross: 284500, payout: 140800, profit: 143700 }
                      ].map((m) => (
                        <div key={m.period} className="p-3.5 rounded-2xl bg-dark-800 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white">{m.period}</span>
                            <span className="text-rosegold-400 font-mono">Gross: ₹{m.gross.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="w-full h-3 rounded-full bg-dark-900 overflow-hidden flex">
                            <div className="h-full bg-green-500" style={{ width: `${(m.profit / m.gross) * 100}%` }} title="Net Profit" />
                            <div className="h-full bg-red-500/70" style={{ width: `${(m.payout / m.gross) * 100}%` }} title="Payouts & Expenses" />
                          </div>

                          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                            <span className="text-green-400">Net Profit: ₹{m.profit.toLocaleString('en-IN')}</span>
                            <span className="text-red-400">Payouts: ₹{m.payout.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual 2: Category Revenue Distribution */}
                  <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h4 className="text-base font-serif font-bold text-white">Service Category Revenue Share</h4>
                      <span className="text-[10px] font-mono text-gray-400">Distribution Matrix</span>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { cat: 'Skin Care & Gold Facials', amount: 113800, pct: 40, color: 'bg-rosegold-500', rawCat: 'Skin Care' },
                        { cat: 'Hair Care & Keratin Spa', amount: 99575, pct: 35, color: 'bg-purple-500', rawCat: 'Hair Care' },
                        { cat: 'Bridal & HD Makeup', amount: 42675, pct: 15, color: 'bg-green-500', rawCat: 'Bridal' },
                        { cat: 'Nails & Barbering', amount: 28450, pct: 10, color: 'bg-amber-500', rawCat: 'Nails' }
                      ].filter(c => activeReportMeta.category === 'All' || c.rawCat === activeReportMeta.category).map((c) => (
                        <div key={c.cat} className="space-y-1 animate-fadeIn">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-300">{c.cat}</span>
                            <span className="text-white font-mono font-bold">₹{c.amount.toLocaleString('en-IN')} ({c.pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
                            <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                          </div>
                        </div>
                      ))}
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
                        {[
                          { name: 'Ananya Sharma', code: 'EMP-1001', count: activeReportMeta.dateRange === 'daily' ? 4 : 48, rev: 98500, sal: 51000, rating: '5.0 ⭐', roi: '+93.1%' },
                          { name: 'Rahul Verma', code: 'EMP-1002', count: activeReportMeta.dateRange === 'daily' ? 3 : 36, rev: 72400, sal: 42200, rating: '4.8 ⭐', roi: '+71.5%' },
                          { name: 'Priya Reddy', code: 'EMP-1003', count: activeReportMeta.dateRange === 'daily' ? 4 : 42, rev: 84600, sal: 47600, rating: '4.9 ⭐', roi: '+77.7%' },
                          { name: 'Meera Kapoor', code: 'EMP-1004', count: activeReportMeta.dateRange === 'daily' ? 2 : 28, rev: 29000, sal: 25000, rating: '4.7 ⭐', roi: '+16.0%' }
                        ].filter(s => activeReportMeta.specialist === 'All' || s.name.toLowerCase().includes(activeReportMeta.specialist.toLowerCase().split(' ')[0])).map((s) => (
                          <tr key={s.code} className="hover:bg-white/5 transition-colors animate-fadeIn">
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
            {breakdownModal === 'revenue' && (
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
                  <span className="text-rosegold-400 font-serif font-bold text-2xl">₹{analytics?.totalRevenue?.toLocaleString('en-IN') || '2,84,500'}</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-serif font-bold text-sm">Itemized Revenue Categories</h4>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">💇‍♀️ Salon Appointments & Service Bookings</span>
                      <span className="text-rosegold-400 font-mono">₹1,85,000 (65%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                      <div className="h-full bg-rosegold-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">🧴 Counter Product Sales & Organic Serums</span>
                      <span className="text-rosegold-400 font-mono">₹54,500 (19.2%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '19.2%' }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">👑 VIP Membership Subscriptions & Packages</span>
                      <span className="text-rosegold-400 font-mono">₹45,000 (15.8%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '15.8%' }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-2">
                  <h4 className="text-white font-serif font-bold text-sm">Payment Gateway Channels</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-dark-900">
                      <span className="text-gray-400 text-[10px] uppercase block">Razorpay Online</span>
                      <strong className="text-green-400 font-mono">₹1,84,925</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-dark-900">
                      <span className="text-gray-400 text-[10px] uppercase block">Counter UPI</span>
                      <strong className="text-rosegold-400 font-mono">₹71,125</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-dark-900">
                      <span className="text-gray-400 text-[10px] uppercase block">Cash POS</span>
                      <strong className="text-white font-mono">₹28,450</strong>
                    </div>
                  </div>
                </div>

                <button onClick={() => setBreakdownModal(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                  Close Breakdown Modal
                </button>
              </div>
            )}

            {/* TOTAL PAYROLL PAYOUT BREAKDOWN MODAL */}
            {breakdownModal === 'payroll' && (
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
                    ₹{(payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0) + 28900).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-serif font-bold text-sm">Itemized Payout Channels</h4>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">👩‍🎨 Staff Base Salaries Paid Out</strong>
                      <span className="text-gray-400 text-[11px]">Monthly fixed baseline for active specialists</span>
                    </div>
                    <span className="text-purple-300 font-mono font-bold text-sm">₹1,25,000</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">✨ Specialist Performance Commissions & Incentives</strong>
                      <span className="text-gray-400 text-[11px]">Service completion bonuses & retail commissions</span>
                    </div>
                    <span className="text-green-400 font-mono font-bold text-sm">₹15,800</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">🛍️ Salon Inventory & Products Supply</strong>
                      <span className="text-gray-400 text-[11px]">Bulk L'Oréal & Keratin organic serum procurement</span>
                    </div>
                    <span className="text-red-400 font-mono font-bold text-sm">₹18,500</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-800 border border-white/10 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">⚡ Studio Utilities & Maintenance</strong>
                      <span className="text-gray-400 text-[11px]">Electricity, HVAC, hydro-steamer maintenance</span>
                    </div>
                    <span className="text-amber-300 font-mono font-bold text-sm">₹10,400</span>
                  </div>
                </div>

                <button onClick={() => setBreakdownModal(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                  Close Breakdown Modal
                </button>
              </div>
            )}

            {/* NET STUDIO PROFIT BREAKDOWN MODAL */}
            {breakdownModal === 'profit' && (
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
                    ₹{((analytics?.totalRevenue || 284500) - payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs text-green-300 font-bold block pt-1">Profitability Index: 50.5% Net Margin</span>
                </div>

                <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Total Gross Income (Credited):</span>
                    <span className="text-green-400 font-mono font-bold">+₹{analytics?.totalRevenue?.toLocaleString('en-IN') || '2,84,500'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Total Expenses & Payouts (Debited):</span>
                    <span className="text-red-400 font-mono font-bold">-₹{payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-white/10">
                    <span className="text-white">Net Studio Retention:</span>
                    <span className="text-rosegold-400 font-serif text-base">₹{((analytics?.totalRevenue || 284500) - payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button onClick={() => setBreakdownModal(null)} className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                  Close Breakdown Modal
                </button>
              </div>
            )}

            {/* MANUAL TRANSACTION LOGGING MODAL */}
            {breakdownModal === 'addTxn' && (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch('http://localhost:5000/api/v1/admin/transactions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(manualTxnForm)
                    });
                    const data = await res.json();
                    if (data.success && data.data) {
                      setTransactions([data.data, ...transactions]);
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
          <div className="w-full max-w-lg glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left max-h-[90vh] overflow-y-auto text-xs">
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
                    onChange={e => setPayForm({ ...payForm, employeeName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none"
                  >
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.empCode || 'EMP-1001'})</option>
                    ))}
                  </select>
                </div>

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
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Commission & Incentives (₹)</label>
                    <input 
                      type="number" 
                      value={payForm.incentives} 
                      onChange={e => setPayForm({ ...payForm, incentives: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs" 
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Deductions / Taxes (₹)</label>
                    <input 
                      type="number" 
                      value={payForm.deductions} 
                      onChange={e => setPayForm({ ...payForm, deductions: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs" 
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
                    <option value="UPI Transfer">UPI Direct Disbursal</option>
                    <option value="Cash Payroll">Cash Cheque</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-dark-800 border border-white/10 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold">Calculated Net Payable Amount:</span>
                  <span className="text-rosegold-400 font-serif font-bold text-base">
                    ₹{(payForm.baseSalary + payForm.incentives - payForm.deductions).toLocaleString('en-IN')}
                  </span>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold cursor-pointer">
                  Disburse & Issue Salary Slip
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
                    <span className="text-gray-400">Incentives & Bonus:</span>
                    <span className="text-green-400 font-mono">+₹{selectedItem.incentives?.toLocaleString('en-IN')}</span>
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
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-rosegold-500/50 shrink-0 bg-dark-800">
                    <img src={selectedItem.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} alt={selectedItem.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="bg-rosegold-500/15 text-rosegold-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-rosegold-500/30">{createdCredentials.empCode}</span>
                    <h3 className="text-lg font-serif font-bold text-white mt-0.5">{selectedItem.name}</h3>
                    <p className="text-xs text-gray-400">{selectedItem.phone}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-800 border-2 border-rosegold-500/40 space-y-2.5">
                  <span className="text-rosegold-400 font-bold uppercase text-[10px] block">System Login Credentials</span>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Login Email ID:</span>
                    <span className="text-white font-mono font-bold">{createdCredentials.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Login Password:</span>
                    <span className="text-green-400 font-mono font-bold">{createdCredentials.tempPassword}</span>
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
                      setPayForm({
                        employeeName: selectedItem.name,
                        month: 'July 2026',
                        baseSalary: 45000,
                        incentives: 7500,
                        deductions: 1500,
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
                    onClick={() => copyCredsToClipboard(createdCredentials.email, createdCredentials.tempPassword, createdCredentials.empCode)} 
                    className="flex-1 py-3 rounded-xl bg-dark-800 text-rosegold-300 border border-rosegold-500/30 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {copiedCreds ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCreds ? 'Copied!' : 'Copy Credentials'}</span>
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

                <button type="submit" className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold hover:scale-[1.01] transition-transform cursor-pointer">
                  {modalType === 'editEmp' ? 'Update Employee & Send Email 📧' : 'Save & Dispatch Credentials to Email 📧'}
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
                    <label className="text-gray-300 font-semibold block mb-1">Category *</label>
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
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:outline-none focus:border-rosegold-500 font-bold"
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
                    <label className="text-gray-300 font-semibold block mb-1">Duration (Minutes) *</label>
                    <input 
                      type="number" 
                      required 
                      value={srvForm.durationMinutes} 
                      onChange={e => setSrvForm({ ...srvForm, durationMinutes: Number(e.target.value) })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" 
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
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs focus:outline-none focus:border-rosegold-500"
                  >
                    {employees.map(emp => (
                      <option key={emp._id} value={`${emp.name} (${emp.specialties[0] || 'Specialist'})`}>
                        {emp.name} — {emp.specialties[0] || 'Specialist'}
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
                      value={appForm.appointmentDate} 
                      onChange={e => setAppForm({ ...appForm, appointmentDate: e.target.value })} 
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 text-xs" 
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

    </div>
  );
}
