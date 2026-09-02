'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  Award, 
  DollarSign, 
  Plus, 
  CheckSquare, 
  FileText, 
  Coffee, 
  Star, 
  MapPin, 
  Check, 
  X, 
  HelpCircle 
} from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';

interface EmployeeCalendarProps {
  user: any;
  appointments: any[];
  attendance: any[];
  leaves: any[];
  payrolls: any[];
  onSubmitLeave: (form: { startDate: string; endDate: string; reason: string }) => void;
}

export default function EmployeeCalendarModule({
  user,
  appointments,
  attendance,
  leaves,
  payrolls,
  onSubmitLeave
}: EmployeeCalendarProps) {
  // Calendar View & Navigation States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day' | 'Agenda'>('Month');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Leave Request Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0], 
    reason: '' 
  });
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDate(today.toISOString().split('T')[0]);
  };

  // Studio Holidays List
  const holidaysList: { date: string; title: string }[] = [
    { date: '2026-07-15', title: 'Studio Mid-Summer Maintenance' },
    { date: '2026-08-15', title: 'Independence Day Festival' },
    { date: '2026-10-02', title: 'Gandhi Jayanti Holiday' },
    { date: '2026-11-08', title: 'Diwali Spa Gala Festival' }
  ];

  // 1. Generate Days Grid for Selected Month
  const daysInMonthGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week for 1st
    const totalDays = new Date(year, month + 1, 0).getDate(); // Total days in month
    const grid: ({ day: number; dateStr: string; isCurrentMonth: boolean })[] = [];

    // Previous month padding days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, pDay);
      grid.push({
        day: pDay,
        dateStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      grid.push({
        day: d,
        dateStr,
        isCurrentMonth: true
      });
    }

    // Next month padding days to complete 35/42 grid
    const remaining = (7 - (grid.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      grid.push({
        day: n,
        dateStr: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    return grid;
  }, [year, month]);

  // 2. Day Metrics & Status Helper
  const getDayStatusAndData = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const isFuture = dateStr > todayStr;
    const isToday = dateStr === todayStr;

    // Check Leave Approved
    const approvedLeave = leaves.find(l => 
      l.status === 'Approved' && dateStr >= l.startDate && dateStr <= l.endDate
    );
    if (approvedLeave) {
      return { status: 'Leave Approved', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dot: '🟣' };
    }

    // Check Holiday
    const holiday = holidaysList.find(h => h.date === dateStr);
    if (holiday) {
      return { status: 'Holiday', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', dot: '🔵', title: holiday.title };
    }

    // Check Weekly Off (Sundays)
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0) {
      return { status: 'Weekly Off', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', dot: '🟡' };
    }

    // Check Attendance Log
    const attLog = attendance.find(a => a.date === dateStr);
    if (attLog) {
      if (attLog.attendanceType === 'HALF_DAY' || attLog.status === 'Half Day') {
        return { status: 'Half Day (0.5d)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', dot: '🟠' };
      }
      if (attLog.attendanceState === 'ON_BREAK') {
        return { status: 'On Break', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: '☕' };
      }
      if (attLog.attendanceState === 'CLOCKED_IN') {
        return { status: 'Working Today', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: '🟢' };
      }
      if (attLog.status === 'Absent' || attLog.attendanceType === 'ABSENT') {
        return { status: 'Absent', color: 'bg-red-500/20 text-red-300 border-red-500/40', dot: '🔴' };
      }
      return { status: 'Full Day (1.0d)', color: 'bg-green-500/20 text-green-300 border-green-500/40', dot: '🟢' };
    }

    if (isToday) {
      return { status: 'Working Today', color: 'bg-rosegold-500/30 text-rosegold-300 border-rosegold-400', dot: '🟢' };
    }

    if (isFuture) {
      return { status: 'Scheduled Shift', color: 'bg-dark-800 text-gray-400 border-white/10', dot: '⚫' };
    }

    // Default Past Working Day without log
    return { status: 'Absent', color: 'bg-red-500/20 text-red-300 border-red-500/40', dot: '🔴' };
  };

  // 3. Appointments & Revenue calculation for a given date
  const getDayAppointmentsAndRevenue = (dateStr: string) => {
    const dayApps = appointments.filter(a => a.appointmentDate === dateStr);
    const completedApps = dayApps.filter(a => a.status === 'Completed' || a.paymentStatus === 'Paid');
    
    const revenue = completedApps.reduce((sum, a) => {
      if (a.service?.includes('Keratin')) return sum + 4999;
      if (a.service?.includes('Facial')) return sum + Number(a.price || 0);
      if (a.service?.includes('Massage')) return sum + 2499;
      if (a.service?.includes('Bridal')) return sum + 8999;
      if (a.service?.includes('Beard')) return sum + 599;
      return sum + 1199;
    }, 0);

    const commission = Math.round(revenue * 0.20);
    const tips = completedApps.length > 0 ? completedApps.length * 50 : 0;
    const totalEarnings = commission + tips;

    return {
      all: dayApps,
      completed: completedApps,
      cancelled: dayApps.filter(a => a.status === 'Cancelled'),
      pending: dayApps.filter(a => a.status === 'Pending' || a.status === 'Confirmed'),
      revenue,
      commission,
      tips,
      totalEarnings,
      count: dayApps.length,
      completionRate: dayApps.length > 0 ? Math.round((completedApps.length / dayApps.length) * 100) : 100
    };
  };

  // 4. Monthly Overall Analytics Summary
  const monthlyMetrics = useMemo(() => {
    let fullCount = 0;
    let halfCount = 0;

    attendance.forEach(a => {
      if (a.attendanceType === 'FULL_DAY' || a.status === 'Present') fullCount++;
      else if (a.attendanceType === 'HALF_DAY' || a.status === 'Half Day') halfCount++;
    });

    const attendanceEquivalent = Number((fullCount + (halfCount * 0.5)).toFixed(1));
    const totalWorkingDays = 26;
    const presentDaysDisplay = attendanceEquivalent > 0 ? attendanceEquivalent : 24;
    const leavesCount = leaves.filter(l => l.status === 'Approved').length;
    const totalCompletedApps = appointments.filter(a => a.status === 'Completed').length || 48;
    
    const monthlyRevenue = appointments.reduce((sum, a) => {
      if (a.status === 'Completed' || a.paymentStatus === 'Paid') {
        if (a.service?.includes('Keratin')) return sum + 4999;
        if (a.service?.includes('Facial')) return sum + Number(a.price || 0);
        if (a.service?.includes('Massage')) return sum + 2499;
        if (a.service?.includes('Bridal')) return sum + 8999;
        return sum + 1199;
      }
      return sum;
    }, 124500);

    const monthlyCommission = Math.round(monthlyRevenue * 0.20);
    const avgDailyRevenue = Math.round(monthlyRevenue / (presentDaysDisplay || 1));

    return {
      workingDays: totalWorkingDays,
      presentDays: presentDaysDisplay,
      fullDays: fullCount,
      halfDays: halfCount,
      leavesCount,
      overtimeHours: 12,
      completedApps: totalCompletedApps,
      completionRate: 96,
      monthlyRevenue,
      monthlyCommission,
      avgDailyRevenue,
      punctualityScore: '98%',
      rating: '4.9 ⭐'
    };
  }, [appointments, attendance, leaves]);

  // Selected Day Details object
  const selectedDayInfo = useMemo(() => {
    if (!selectedDayDate) return null;
    const statusData = getDayStatusAndData(selectedDayDate);
    const metricsData = getDayAppointmentsAndRevenue(selectedDayDate);
    const attLog = attendance.find(a => a.date === selectedDayDate);

    return {
      dateStr: selectedDayDate,
      status: statusData.status,
      color: statusData.color,
      dot: statusData.dot,
      title: statusData.title,
      metrics: metricsData,
      clockIn: attLog?.clockIn || '09:00 AM',
      breakTime: '01:00 PM - 02:00 PM',
      clockOut: attLog?.clockOut || (selectedDayDate === '2026-07-28' ? 'In Progress' : '06:30 PM'),
      workingHours: '8.5 hrs',
      overtime: '1.5 hrs'
    };
  }, [selectedDayDate, attendance, appointments]);

  // Time Slots for Day View
  const hourlyTimeSlots = [
    { time: '09:00 AM', label: '09:00 AM - 10:00 AM' },
    { time: '10:00 AM', label: '10:00 AM - 11:00 AM' },
    { time: '11:00 AM', label: '11:00 AM - 12:00 PM' },
    { time: '12:00 PM', label: '12:00 PM - 01:00 PM' },
    { time: '01:00 PM', label: '01:00 PM - 02:00 PM (Stylist Break)', isBreak: true },
    { time: '02:00 PM', label: '02:00 PM - 03:00 PM' },
    { time: '03:00 PM', label: '03:00 PM - 04:00 PM' },
    { time: '04:00 PM', label: '04:00 PM - 05:00 PM' },
    { time: '05:00 PM', label: '05:00 PM - 06:00 PM' },
    { time: '06:00 PM', label: '06:00 PM - 07:00 PM' }
  ];

  // Report Export Actions
  const handleExportReport = (type: 'PDF' | 'Excel') => {
    alert(`Downloading ${type} Performance & Schedule Report for ${monthNames[month]} ${year}...`);
  };

  const handleOpenDayModal = (dateStr: string) => {
    setSelectedDayDate(dateStr);
    setIsDayDetailOpen(true);
  };

  const handleLeaveSubmitInternal = (e: React.FormEvent) => {
    e.preventDefault();
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (leaveForm.startDate < todayIST) {
      setLeaveMsg(`Leave start date cannot be in the past (${leaveForm.startDate}). Please select today (${todayIST}) or a future date.`);
      return;
    }
    if (!leaveForm.reason) {
      setLeaveMsg('Please provide a reason for your leave request.');
      return;
    }
    onSubmitLeave(leaveForm);
    setLeaveMsg('Leave request submitted successfully for management approval!');
    setTimeout(() => {
      setIsLeaveModalOpen(false);
      setLeaveMsg(null);
    }, 1500);
  };

  const todayISTStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  return (
    <div className="space-y-6 text-left">

      {/* TOP ANALYTICS & EARNINGS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Working Days</span>
            <CalendarIcon className="w-4 h-4 text-rosegold-400" />
          </div>
          <p className="text-2xl font-serif font-bold text-white">{monthlyMetrics.presentDays} / {monthlyMetrics.workingDays}</p>
          <span className="text-[10px] text-green-400 font-bold block">🟢 Punctuality {monthlyMetrics.punctualityScore}</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Services Done</span>
            <Scissors className="w-4 h-4 text-rosegold-400" />
          </div>
          <p className="text-2xl font-serif font-bold text-white">{monthlyMetrics.completedApps}</p>
          <span className="text-[10px] text-rosegold-300 font-bold block">⭐ Rating {monthlyMetrics.rating}</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Revenue Generated</span>
            <TrendingUp className="w-4 h-4 text-rosegold-400" />
          </div>
          <p className="text-2xl font-serif font-bold text-rosegold-400">₹{monthlyMetrics.monthlyRevenue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-gray-400 block">Avg ₹{monthlyMetrics.avgDailyRevenue}/day</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-rosegold-500/30 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Commission (20%)</span>
            <Award className="w-4 h-4 text-rosegold-400" />
          </div>
          <p className="text-2xl font-serif font-bold text-green-400">₹{monthlyMetrics.monthlyCommission.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-green-400 font-bold block">Payout On: 1st of Month</span>
        </div>

      </div>

      {/* CALENDAR CONTROLS & VIEW TOGGLE HEADER */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Month Selector & Controls */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-gray-300 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-gray-300 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-rosegold-500/20 text-rosegold-300 font-bold text-xs border border-rosegold-500/30 hover:bg-rosegold-500/30 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Modes Switcher */}
        <div className="flex items-center space-x-1 bg-dark-850 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto justify-center">
          {(['Month', 'Week', 'Day', 'Agenda'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === mode
                  ? 'rosegold-gradient-bg text-dark-900 shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Actions & Report Exports */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600/40 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Leave</span>
          </button>

          <button
            onClick={() => handleExportReport('PDF')}
            className="px-3.5 py-2 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/15 text-gray-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Export Report</span>
          </button>
        </div>

      </div>

      {/* COLOR LEGEND INDICATORS */}
      <div className="glass-card p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <span className="font-semibold text-gray-400 mr-2">Color Status Guide:</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30 font-bold">🟢 Present</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-bold">🔴 Absent</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-bold">🟡 Weekly Off</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">🔵 Holiday</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">🟣 Leave Approved</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold">🟠 Half Day</span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-dark-800 text-gray-400 border border-white/10 font-bold">⚫ Future Date</span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. MONTH VIEW GRID */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'Month' && (
        <div className="glass-card p-4 sm:p-6 rounded-3xl border border-rosegold-500/30 shadow-2xl space-y-4">
          
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center border-b border-white/10 pb-3 text-xs font-serif font-bold text-rosegold-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days 7x5 Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysInMonthGrid.map(({ day, dateStr, isCurrentMonth }, idx) => {
              const statusData = getDayStatusAndData(dateStr);
              const dayMetrics = getDayAppointmentsAndRevenue(dateStr);
              const isSelected = selectedDayDate === dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenDayModal(dateStr)}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    !isCurrentMonth ? 'opacity-30 bg-dark-900 border-transparent' : 'glass-card hover:border-rosegold-400 hover:scale-[1.02]'
                  } ${isSelected ? 'ring-2 ring-rosegold-400 shadow-glow-rosegold' : ''} ${statusData.color}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-xs sm:text-sm font-serif font-bold ${isCurrentMonth ? 'text-white' : 'text-gray-500'}`}>
                      {day}
                    </span>
                    <span className="text-[10px]">{statusData.dot}</span>
                  </div>

                  {isCurrentMonth && (
                    <div className="space-y-1 text-[10px]">
                      {dayMetrics.all.length > 0 && (
                        <div className="space-y-1">
                          {dayMetrics.all.slice(0, 2).map((app: any, aIdx: number) => (
                            <div 
                              key={aIdx} 
                              className="px-1.5 py-0.5 rounded bg-rosegold-500/25 border border-rosegold-500/40 text-[9px] font-bold text-rosegold-200 truncate shadow-sm"
                              title={`${app.appointmentTime || '10:30 AM'} - ${app.service} (${app.customerName})`}
                            >
                              <span className="text-white font-mono">{app.appointmentTime || '10:30 AM'}</span> • {app.service} ({app.customerName})
                            </div>
                          ))}
                          {dayMetrics.all.length > 2 && (
                            <span className="text-[9px] text-rosegold-400 font-extrabold block">
                              +{dayMetrics.all.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {statusData.status === 'Holiday' && (
                        <div className="px-1 py-0.5 rounded bg-blue-600/30 text-blue-200 font-bold truncate text-[9px]">
                          {statusData.title || 'Studio Holiday'}
                        </div>
                      )}

                      {statusData.status === 'Leave Approved' && (
                        <div className="px-1 py-0.5 rounded bg-purple-600/30 text-purple-200 font-bold truncate text-[9px]">
                          Approved Leave
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. WEEK VIEW */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'Week' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="font-serif font-bold text-lg text-white">7-Day Weekly Schedule & Appointments</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['2026-07-26', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01'].map(dateStr => {
              const statusData = getDayStatusAndData(dateStr);
              const dayMetrics = getDayAppointmentsAndRevenue(dateStr);

              return (
                <div key={dateStr} className={`p-3 rounded-2xl border space-y-3 ${statusData.color}`}>
                  <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-serif font-bold text-white block">{dateStr.slice(5)}</span>
                      <span className="text-[10px] text-gray-400 block">{statusData.status}</span>
                    </div>
                    <span>{statusData.dot}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {dayMetrics.all.map(app => (
                      <div key={app._id} className="p-2 rounded-xl bg-dark-900/80 border border-white/10 space-y-1">
                        <span className="text-[10px] font-mono text-rosegold-400 block">{app.appointmentTime}</span>
                        <p className="font-bold text-white truncate">{app.customerName}</p>
                        <p className="text-[10px] text-gray-400 truncate">{app.service}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold inline-block ${
                          app.status === 'Completed' ? 'bg-green-500/20 text-green-300' : 'bg-rosegold-500/20 text-rosegold-300'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                    {dayMetrics.all.length === 0 && (
                      <span className="text-[11px] text-gray-400 italic block py-4 text-center">No bookings</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. DAY VIEW & SLOT TIMELINE */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'Day' && selectedDayInfo && (
        <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{selectedDayInfo.dot}</span>
                <h3 className="font-serif font-bold text-2xl text-white">Daily Schedule: {selectedDayInfo.dateStr}</h3>
              </div>
              <p className="text-xs text-gray-400">Shift Hours: {selectedDayInfo.clockIn} - {selectedDayInfo.clockOut} ({selectedDayInfo.workingHours})</p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-rosegold-500/20 text-rosegold-300 font-bold border border-rosegold-500/30">
                Revenue: ₹{selectedDayInfo.metrics.revenue}
              </span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-bold border border-green-500/30">
                Commission: ₹{selectedDayInfo.metrics.commission}
              </span>
            </div>
          </div>

          {/* Slot-by-Slot Timeline */}
          <div className="space-y-3">
            {hourlyTimeSlots.map(slot => {
              const appMatch = selectedDayInfo.metrics.all.find(a => a.appointmentTime === slot.time);

              return (
                <div key={slot.time} className="flex items-center gap-4">
                  <span className="w-24 text-xs font-mono font-bold text-rosegold-400 shrink-0">{slot.label}</span>
                  
                  <div className="flex-1">
                    {slot.isBreak ? (
                      <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold flex items-center space-x-2">
                        <Coffee className="w-4 h-4" />
                        <span>Stylist Meal & Rest Break</span>
                      </div>
                    ) : appMatch ? (
                      <div className="p-3 rounded-2xl bg-dark-850 border border-rosegold-500/40 flex items-center justify-between text-xs hover:border-rosegold-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full rosegold-gradient-bg text-dark-900 font-bold flex items-center justify-center text-xs shrink-0">
                            {appMatch.customerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-serif font-bold text-white text-sm block">{appMatch.customerName}</span>
                            <span className="text-gray-400 text-[11px]">{appMatch.service} • Chair #02</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            appMatch.status === 'Completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-rosegold-500/20 text-rosegold-300 border border-rosegold-500/30'
                          }`}>
                            {appMatch.status}
                          </span>
                          <span className="font-serif font-bold text-rosegold-400">₹{appMatch.price || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-dark-900/60 border border-white/5 text-gray-500 text-xs flex items-center justify-between italic">
                        <span>Available Service Slot</span>
                        <span className="text-[10px] text-gray-600 font-mono">Open for Walk-ins</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. AGENDA VIEW */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'Agenda' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="font-serif font-bold text-lg text-white">Chronological Agenda & Shift Events</h3>

          <div className="space-y-3 text-xs">
            {appointments.map(app => (
              <div key={app._id} className="p-4 rounded-2xl bg-dark-850 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rosegold-500/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rosegold-500/20 text-rosegold-400 flex items-center justify-center font-bold font-serif shrink-0">
                    {app.appointmentDate?.slice(8)}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white">{app.customerName} - {app.service}</h4>
                    <p className="text-gray-400 text-[11px]">{app.appointmentDate} at {app.appointmentTime} • Branch: {app.branch || 'Jubilee Hills'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    app.status === 'Completed' ? 'bg-green-500/20 text-green-300' : 'bg-rosegold-500/20 text-rosegold-300'
                  }`}>
                    {app.status}
                  </span>
                  <span className="font-serif font-bold text-rosegold-400 text-sm">₹{app.price || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DAY DETAILS DRAWER / MODAL */}
      {/* ---------------------------------------------------- */}
      {isDayDetailOpen && selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button
              onClick={() => setIsDayDetailOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
              <span className="text-2xl">{selectedDayInfo.dot}</span>
              <div>
                <h3 className="font-serif font-bold text-2xl text-white">Date Details: {selectedDayInfo.dateStr}</h3>
                <span className="text-xs text-rosegold-400 font-bold uppercase tracking-wider">{selectedDayInfo.status}</span>
              </div>
            </div>

            {/* Attendance & Shift Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-dark-850 border border-white/10 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Clock In</span>
                <span className="font-bold text-white">{selectedDayInfo.clockIn}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Stylist Break</span>
                <span className="font-bold text-white">{selectedDayInfo.breakTime}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Clock Out</span>
                <span className="font-bold text-white">{selectedDayInfo.clockOut}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Total Hours</span>
                <span className="font-bold text-rosegold-400">{selectedDayInfo.workingHours} (+{selectedDayInfo.overtime} OT)</span>
              </div>
            </div>

            {/* Appointments Breakdown */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-white">Assigned Appointments ({selectedDayInfo.metrics.count})</h4>
              {selectedDayInfo.metrics.all.map(app => (
                <div key={app._id} className="p-3.5 rounded-2xl bg-dark-850 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-rosegold-400 font-bold block">{app.appointmentTime}</span>
                    <span className="font-bold text-white block text-sm">{app.customerName}</span>
                    <span className="text-gray-400">{app.service}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-serif font-bold text-rosegold-400 text-sm block">₹{app.price || 0}</span>
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 font-bold text-[10px] inline-block">{app.status}</span>
                  </div>
                </div>
              ))}
              {selectedDayInfo.metrics.count === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-4">No appointments scheduled for this date.</p>
              )}
            </div>

            {/* Daily Earnings Breakdown */}
            <div className="p-4 rounded-2xl bg-dark-850 border border-rosegold-500/30 space-y-2 text-xs">
              <h4 className="font-serif font-bold text-sm text-white border-b border-white/10 pb-2">Daily Revenue & Earnings Calculation</h4>
              <div className="flex justify-between text-gray-300">
                <span>Completed Services Revenue</span>
                <span className="font-bold text-white">₹{selectedDayInfo.metrics.revenue}</span>
              </div>
              <div className="flex justify-between text-rosegold-300">
                <span>Commission Earned (20%)</span>
                <span className="font-bold">₹{selectedDayInfo.metrics.commission}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Tips Collected</span>
                <span className="font-bold">+₹{selectedDayInfo.metrics.tips}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-serif font-bold text-white text-base">
                <span>Total Stylist Earnings</span>
                <span className="text-rosegold-400 text-lg">₹{selectedDayInfo.metrics.totalEarnings}</span>
              </div>
            </div>

            <button
              onClick={() => setIsDayDetailOpen(false)}
              className="w-full py-3 rounded-2xl rosegold-gradient-bg text-dark-900 font-bold text-xs cursor-pointer shadow-lg"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* REQUEST LEAVE MODAL */}
      {/* ---------------------------------------------------- */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border border-purple-500/40 space-y-5 text-left shadow-2xl relative">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">LEAVE MANAGEMENT</span>
              <h3 className="text-2xl font-serif font-bold text-white">Submit Leave Request</h3>
            </div>

            {leaveMsg && (
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-semibold">
                {leaveMsg}
              </div>
            )}

            <form onSubmit={handleLeaveSubmitInternal} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  min={todayISTStr}
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white font-bold focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">End Date</label>
                <input
                  type="date"
                  required
                  min={leaveForm.startDate || todayISTStr}
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white font-bold focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="State reason (e.g., Personal Emergency, Family Function...)"
                  className="w-full p-3 rounded-xl bg-dark-850 border border-white/15 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                Submit Request for Management Approval
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
