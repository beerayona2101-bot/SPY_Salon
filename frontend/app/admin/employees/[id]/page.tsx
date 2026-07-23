'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Key, 
  Copy, 
  Check, 
  Scissors, 
  Calendar, 
  Edit3, 
  Lock,
  Sparkles
} from 'lucide-react';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/api/v1/admin/employees/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setEmployee(data.data);
          setCredentials(data.credentials || {
            empCode: data.data.empCode || 'EMP-1001',
            email: data.data.email || 'ananya_sharma@spysalon.com',
            username: data.data.username || 'ananya_sharma',
            tempPassword: data.data.tempPassword || 'ananya_sharma@123'
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyCredentials = () => {
    if (!credentials && !employee) return;
    const empEmail = credentials?.email || employee?.email || 'ananya_sharma@spysalon.com';
    const empPassword = credentials?.tempPassword || employee?.tempPassword || 'ananya_sharma@123';
    const text = `SPY Salon Employee Login Credentials:\nEmployee ID: ${credentials?.empCode || 'EMP-1001'}\nLogin Email ID: ${empEmail}\nPassword: ${empPassword}\nSign In URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-rosegold-400 font-serif animate-pulse">
        Loading Employee Profile & System Credentials...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-4 text-center px-4">
        <h2 className="text-2xl font-serif text-white font-bold">Employee Profile Not Found</h2>
        <Link href="/admin" className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs">
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  const loginEmail = credentials?.email || employee.email || 'ananya_sharma@spysalon.com';
  const loginPassword = credentials?.tempPassword || employee.tempPassword || 'ananya_sharma@123';

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-left">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button 
            onClick={() => router.push('/admin')} 
            className="flex items-center space-x-2 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-rosegold-400" />
            <span>Back to Admin Control Center</span>
          </button>
          
          <span className="text-xs font-bold text-green-400 bg-green-500/15 border border-green-500/30 px-3 py-1 rounded-full flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span>Active Employee Record</span>
          </span>
        </div>

        {/* Profile Card Header */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-rosegold-500/50 shadow-glow-rosegold shrink-0 bg-dark-800">
            <img 
              src={employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
              alt={employee.name} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rosegold-400 bg-rosegold-500/15 border border-rosegold-500/30 px-3 py-0.5 rounded-full">
                  {credentials?.empCode || employee.empCode || 'EMP-1001'}
                </span>
                <h1 className="text-3xl font-serif font-bold text-white mt-1">{employee.name}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-300">
              <div className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-rosegold-400" />
                <span>{loginEmail}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-rosegold-400" />
                <span>{employee.phone}</span>
              </div>
            </div>

            {/* Specialties Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {employee.specialties?.map((s: string, i: number) => (
                <span key={i} className="bg-purple-600/30 text-purple-200 border border-purple-500/30 px-3 py-0.5 rounded-full text-xs font-semibold">
                  ✨ {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SYSTEM LOGIN CREDENTIALS BOX */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-rosegold-500/50 space-y-4 bg-dark-800/90 shadow-glow-rosegold">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-rosegold-400" />
              <h2 className="text-lg font-serif font-bold text-white">System Login Credentials</h2>
            </div>
            
            <button 
              onClick={handleCopyCredentials}
              className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center space-x-1.5 hover:scale-105 transition-transform cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-1">
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Employee ID Code</span>
              <span className="text-white font-mono font-bold text-base">{credentials?.empCode || employee.empCode || 'EMP-1001'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-1">
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Login Email / Username</span>
              <span className="text-rosegold-400 font-mono font-bold text-base">{loginEmail}</span>
            </div>

            <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-1">
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Login Password</span>
              <span className="text-green-400 font-mono font-bold text-base">{loginPassword}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rosegold-500/10 border border-rosegold-500/30 text-xs text-rosegold-300">
            <strong>Login Protocol:</strong> Sign in at <a href="http://localhost:3000/login" target="_blank" rel="noreferrer" className="underline font-bold text-white">http://localhost:3000/login</a> using <strong>{loginEmail}</strong> and password <strong>{loginPassword}</strong> to access the Employee Portal.
          </div>
        </div>

        {/* WORK SHIFT & SKILLS BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Shift Schedule */}
          <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-rosegold-400" />
              <span>Shift Hours & Breaktime</span>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-dark-800 border border-white/5">
                <span className="text-gray-400 font-semibold">Working Hours</span>
                <span className="text-white font-bold">{employee.workingHours?.start || '09:00'} - {employee.workingHours?.end || '19:00'}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-dark-800 border border-white/5">
                <span className="text-gray-400 font-semibold">Break Time</span>
                <span className="text-rosegold-400 font-bold">{employee.breakTime?.start || '13:00'} - {employee.breakTime?.end || '14:00'}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-dark-800 border border-white/5">
                <span className="text-gray-400 font-semibold">Slot Duration</span>
                <span className="text-purple-300 font-bold">{employee.slotIntervalMinutes || 30} Minutes</span>
              </div>
            </div>
          </div>

          {/* Assigned Services */}
          <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center space-x-2">
              <Scissors className="w-4 h-4 text-rosegold-400" />
              <span>Assigned Salon Services</span>
            </h3>

            <div className="space-y-2">
              {employee.services?.map((srv: string, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-semibold">{srv}</span>
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Authorized</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* EMPLOYEE SALARY DETAILS & PAY SALARY PORTAL CARD */}
        <SalaryPortalSection employee={employee} credentials={credentials} />

      </div>
    </div>
  );
}

function SalaryPortalSection({ employee, credentials }: { employee: any, credentials: any }) {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [disbursedSuccess, setDisbursedSuccess] = useState(false);
  const [payForm, setPayForm] = useState({
    month: 'July 2026',
    baseSalary: 45000,
    incentives: 7500,
    deductions: 1500,
    paymentMethod: 'Bank Transfer (HDFC)'
  });

  const empCode = credentials?.empCode || employee.empCode || 'EMP-1001';
  const cleanName = (employee.name || 'employee').toLowerCase().replace(/[^a-z0-9]/g, '');

  const netPayable = payForm.baseSalary + payForm.incentives - payForm.deductions;

  const handleDisburseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/v1/admin/payrolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: employee.name,
          empCode,
          month: payForm.month,
          baseSalary: payForm.baseSalary,
          incentives: payForm.incentives,
          deductions: payForm.deductions,
          paymentMethod: payForm.paymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        setDisbursedSuccess(true);
        setPayModalOpen(false);
        setTimeout(() => setDisbursedSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-6 bg-dark-900/90 shadow-2xl text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rosegold-400">Staff Financials</span>
          <h2 className="text-xl font-serif font-bold text-white mt-0.5">Salary Package & Payout Portal</h2>
        </div>

        <button
          onClick={() => setPayModalOpen(true)}
          className="px-5 py-3 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Pay Salary Through Portal 💳</span>
        </button>
      </div>

      {disbursedSuccess && (
        <div className="p-4 rounded-2xl bg-green-500/20 border border-green-500/40 text-green-300 flex items-center justify-between animate-fadeIn">
          <div>
            <strong className="block text-white text-sm">🟢 Salary Disbursal Successful!</strong>
            <span>Issued net payout of ₹{netPayable.toLocaleString('en-IN')} for {payForm.month}. Debited entry added to dashboard ledger.</span>
          </div>
          <span className="text-xs font-mono font-bold bg-green-500/30 px-3 py-1 rounded-full text-white">STATUS: PAID</span>
        </div>
      )}

      {/* Salary Components Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
        <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">Monthly Base Fixed</span>
          <p className="text-white font-mono font-bold text-lg">₹{payForm.baseSalary.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">Performance Incentives</span>
          <p className="text-green-400 font-mono font-bold text-lg">+₹{payForm.incentives.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-white/10 space-y-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">Standard Deductions</span>
          <p className="text-red-400 font-mono font-bold text-lg">-₹{payForm.deductions.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rosegold-500/15 border border-rosegold-500/40 space-y-1">
          <span className="text-rosegold-300 font-bold uppercase text-[10px]">Total Net Monthly Payable</span>
          <p className="text-rosegold-400 font-serif font-bold text-xl">₹{netPayable.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Employee Bank Account Details */}
      <div className="p-5 rounded-2xl bg-dark-800/80 border border-white/10 space-y-3">
        <h4 className="text-white font-serif font-bold text-sm">Authorized Employee Bank Account & Payout Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
          <div>
            <span className="text-gray-500 text-[10px] uppercase block font-semibold">Bank Name</span>
            <strong className="text-white font-mono">HDFC Bank Flagship</strong>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block font-semibold">Account Number</span>
            <strong className="text-white font-mono">XXXX-XXXX-4821</strong>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block font-semibold">IFSC Code & UPI ID</span>
            <strong className="text-rosegold-400 font-mono">HDFC0001824 | {cleanName}@okhdfc</strong>
          </div>
        </div>
      </div>

      {/* Salary Disbursal Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">Salary Disbursal Portal</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleDisburseSalary} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-dark-800 border border-white/10">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Disbursing Salary For:</span>
                <strong className="text-white text-sm font-serif">{employee.name} ({empCode})</strong>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Pay Month / Cycle *</label>
                <input
                  type="text"
                  required
                  value={payForm.month}
                  onChange={(e) => setPayForm({ ...payForm, month: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={payForm.baseSalary}
                    onChange={(e) => setPayForm({ ...payForm, baseSalary: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Incentives (₹)</label>
                  <input
                    type="number"
                    value={payForm.incentives}
                    onChange={(e) => setPayForm({ ...payForm, incentives: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Payout Channel / Gateway</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-dark-800 text-white border border-white/10"
                >
                  <option value="Bank Transfer (HDFC)">Bank Transfer (HDFC Direct)</option>
                  <option value="Bank Transfer (ICICI)">Bank Transfer (ICICI Direct)</option>
                  <option value="Razorpay Salary Payout">Razorpay Instant Payout Portal</option>
                  <option value="UPI Transfer">UPI Transfer</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-rosegold-500/15 border border-rosegold-500/40 flex justify-between items-center font-bold">
                <span className="text-rosegold-300">Final Net Disbursal:</span>
                <span className="text-rosegold-400 font-serif text-lg">₹{netPayable.toLocaleString('en-IN')}</span>
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold cursor-pointer">
                Confirm & Disburse Salary Now 🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
