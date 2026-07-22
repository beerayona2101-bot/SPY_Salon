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
  DollarSign,
  CreditCard,
  FileText,
  Printer
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'earnings' | 'employees' | 'customers' | 'services' | 'appointments' | 'leaves' | 'reviews' | 'branches'>('analytics');
  
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
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal Controls
  const [modalType, setModalType] = useState<'addEmp' | 'editEmp' | 'addCust' | 'addSrv' | 'editSrv' | 'addApp' | 'empCreds' | 'viewEmp' | 'addPay' | 'viewPay' | 'rescheduleNote' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [rescheduleNoteText, setRescheduleNoteText] = useState('');

  // Notification Dropdown State & Auto-close Ref
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const adminNotifRef = React.useRef<HTMLDivElement>(null);

  // Dynamic Category State & Custom Category Input
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'Hair Care', 'Skin Care', 'Body Spa', 'Nail Artistry', 'Bridal & Makeup', 'Barbering & Grooming'
  ]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminNotifRef.current && !adminNotifRef.current.contains(event.target as Node)) {
        setAdminNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form States
  const [empForm, setEmpForm] = useState({
    name: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    email: '',
    phone: '',
    specialties: 'Senior Hair Stylist, Keratin Expert',
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
      const [anaRes, empRes, custRes, srvRes, appRes, leaveRes, revRes, payRes, actRes, notifRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/admin/analytics').then(r => r.json()).catch(() => ({ data: null })),
        fetch('http://localhost:5000/api/v1/admin/employees').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/customers').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/services').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/appointments').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/leaves').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/reviews').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/payrolls').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/activity-logs').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:5000/api/v1/admin/notifications').then(r => r.json()).catch(() => ({ data: [] }))
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
      avatar: empForm.avatar,
      email: empForm.email,
      phone: empForm.phone,
      specialties: empForm.specialties.split(',').map(s => s.trim()),
      services: empForm.services.split(',').map(s => s.trim()),
      workingHours: { start: empForm.workStart, end: empForm.workEnd },
      breakTime: { start: empForm.breakStart, end: empForm.breakEnd },
      slotIntervalMinutes: Number(empForm.slotInterval),
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

  const handleAdminLogout = () => {
    localStorage.removeItem('spy_user');
    localStorage.removeItem('spy_token');
    router.push('/login');
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

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  const navMenuItems = [
    { id: 'analytics', label: 'Dashboard & Reports', icon: TrendingUp, badge: null },
    { id: 'earnings', label: 'Earnings & Payroll Payouts', icon: DollarSign, badge: payrolls.length },
    { id: 'employees', label: 'Employee Management', icon: Users, badge: employees.length },
    { id: 'customers', label: 'Customer Directory', icon: UserCheck, badge: customers.length },
    { id: 'services', label: 'Services & Pricing Menu', icon: Scissors, badge: services.length },
    { id: 'appointments', label: 'Appointments Desk', icon: Calendar, badge: appointments.length },
    { id: 'leaves', label: 'Leaves & Attendance', icon: Clock, badge: pendingLeavesCount },
    { id: 'reviews', label: 'Reviews & Moderation', icon: MessageSquare, badge: reviews.length },
    { id: 'branches', label: 'Salon Branches & Settings', icon: Building, badge: null }
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex text-gray-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-800/95 border-r border-rosegold-500/20 backdrop-blur-2xl flex flex-col justify-between transition-transform duration-300 h-screen overflow-hidden ${
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
        <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-rosegold-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-300 hover:text-white">
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
              <button
                onClick={() => setAdminNotifOpen(!adminNotifOpen)}
                className="p-2 rounded-xl bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white transition-all cursor-pointer relative"
                title="Admin Notifications"
              >
                <Bell className="w-4 h-4 text-rosegold-400" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rosegold-500 text-dark-900 font-extrabold text-[9px] flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Admin Notification Dropdown */}
              {adminNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-dark-900/95 border border-rosegold-500/40 backdrop-blur-2xl shadow-2xl p-4 space-y-3 z-50 text-left animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-rosegold-400" />
                      <h4 className="text-white font-serif font-bold text-sm">System & Booking Notifications</h4>
                    </div>
                    <button onClick={() => setAdminNotifOpen(false)} className="text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className="p-3 rounded-2xl bg-dark-800 border border-white/10 text-xs space-y-1">
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
                  className="glass-card p-5 rounded-3xl border border-rosegold-500/40 hover:border-rosegold-500 text-center space-y-1 cursor-pointer transition-all hover:scale-105 shadow-glow-rosegold group"
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

              <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
                <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
                  <Activity className="w-4 h-4 text-rosegold-400" />
                  <h3 className="text-base font-serif font-bold text-white">Live System Audit Logs</h3>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {activityLogs.map((act) => (
                    <div key={act._id} className="p-3 rounded-2xl bg-dark-800/80 border border-white/5 flex items-start justify-between text-xs">
                      <div>
                        <span className="text-rosegold-400 font-bold block">{act.action}</span>
                        <p className="text-gray-300">{act.details}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
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

              {/* Revenue Breakdown Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Total Revenue Disbursed</span>
                  <p className="text-2xl font-serif font-bold text-rosegold-400">₹{analytics?.totalRevenue?.toLocaleString('en-IN') || '2,84,500'}</p>
                  <span className="text-[10px] text-green-400 font-bold">🟢 Razorpay & Counter Collections Sync</span>
                </div>

                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Total Payroll Paid Out</span>
                  <p className="text-2xl font-serif font-bold text-white">₹{payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0).toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-purple-300 font-bold">{payrolls.length} Staff Slips Disbursed</span>
                </div>

                <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Net Studio Profit</span>
                  <p className="text-2xl font-serif font-bold text-green-400">
                    ₹{((analytics?.totalRevenue || 284500) - payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-400">After Staff Salary Disbursal</span>
                </div>
              </div>

              {/* Payroll Roster Table */}
              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-x-auto">
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
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                        email: '',
                        phone: '',
                        specialties: 'Senior Hair Stylist, Keratin Expert',
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
                  const empLoginEmail = `${empNameKey}@spysalon.com`;
                  const empLoginPassword = `${empNameKey}@123`;

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
                                    avatar: emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                                    email: emp.email,
                                    phone: emp.phone,
                                    specialties: emp.specialties.join(', '),
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
                <h2 className="text-2xl font-bold font-serif text-white">Salon Appointments Desk</h2>
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

              <div className="glass-card rounded-2xl border border-rosegold-500/30 overflow-x-auto">
                <table className="w-full text-xs text-gray-300">
                  <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-4">Booking ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Service Requested</th>
                      <th className="p-4">Specialist</th>
                      <th className="p-4">Schedule</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAppointments.map((a) => (
                      <tr key={a._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono font-bold text-rosegold-400">{a.bookingId}</td>
                        <td className="p-4 font-bold text-white">{a.customerName}<br/><span className="text-gray-400 font-normal">{a.customerPhone}</span></td>
                        <td className="p-4 font-semibold text-white">{a.service}</td>
                        <td className="p-4 text-rosegold-300 font-medium">{a.specialistName}</td>
                        <td className="p-4">{a.appointmentDate}<br/><span className="text-gray-400">{a.appointmentTime}</span></td>
                        <td className="p-4"><span className="bg-dark-800 px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">{a.paymentMethod || 'Cash'} • {a.paymentStatus || 'Paid'}</span></td>
                        <td className="p-4 space-y-1">
                          <select value={a.status} onChange={(e) => handleUpdateAppStatus(a._id, e.target.value)} className="bg-dark-900 text-xs font-bold px-2 py-1 rounded border border-white/10 focus:outline-none block">
                            <option value="Pending">Pending 🟡</option>
                            <option value="Confirmed">Confirmed 🟢</option>
                            <option value="Reschedule Requested">Reschedule Requested ⚠️</option>
                            <option value="Completed">Completed ✅</option>
                            <option value="Cancelled">Cancelled ❌</option>
                          </select>

                          {a.status === 'Pending' && (
                            <div className="flex items-center space-x-1 pt-1">
                              <button
                                onClick={() => handleUpdateAppStatus(a._id, 'Confirmed')}
                                className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-[10px] font-bold border border-green-500/30 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(a);
                                  setRescheduleNoteText(`Requested slot ${a.appointmentTime} on ${a.appointmentDate} is unavailable. Please select another slot.`);
                                  setModalType('rescheduleNote');
                                }}
                                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold border border-amber-500/30 cursor-pointer"
                              >
                                Reschedule
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
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-white">Employee Leaves & Approval Desk</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Review, approve, or reject employee leave applications in real time.</p>
                </div>
                {pendingLeavesCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>{pendingLeavesCount} Pending Leave Applications</span>
                  </span>
                )}
              </div>

              <div className="space-y-4">
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

          {/* TAB 9: SALON BRANCHES */}
          {activeTab === 'branches' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <h2 className="text-2xl font-bold font-serif text-white">Salon Branches & Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-2">
                  <span className="text-xs text-rosegold-400 font-bold uppercase">Flagship Branch</span>
                  <h3 className="text-lg font-bold text-white font-serif">SPY Salon - Jubilee Hills</h3>
                  <p className="text-xs text-gray-300">Road No. 36, Jubilee Hills, Hyderabad</p>
                </div>
                <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-2">
                  <span className="text-xs text-rosegold-400 font-bold uppercase">Tech Hub Branch</span>
                  <h3 className="text-lg font-bold text-white font-serif">SPY Salon - Gachibowli</h3>
                  <p className="text-xs text-gray-300">Financial District, Gachibowli, Hyderabad</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

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
                    className="flex-1 py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
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
              <form onSubmit={handleSaveEmployee} className="space-y-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Employee Full Name *</label>
                  <input type="text" required value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Profile Image / Avatar URL</label>
                  <input type="url" value={empForm.avatar} onChange={e => setEmpForm({ ...empForm, avatar: e.target.value })} placeholder="https://..." className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Email</label>
                    <input type="email" required value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Phone</label>
                    <input type="text" required value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Specialist Skills (Comma Separated)</label>
                  <input type="text" required value={empForm.specialties} onChange={e => setEmpForm({ ...empForm, specialties: e.target.value })} className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer">
                  {modalType === 'editEmp' ? 'Update Specialist & Credentials' : 'Save & Auto-Generate Credentials'}
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
                  <label className="text-gray-300 font-semibold block mb-1">Service Cover Image URL</label>
                  <input 
                    type="url" 
                    value={srvForm.image} 
                    onChange={e => setSrvForm({ ...srvForm, image: e.target.value })} 
                    placeholder="https://..." 
                    className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10" 
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

    </div>
  );
}
