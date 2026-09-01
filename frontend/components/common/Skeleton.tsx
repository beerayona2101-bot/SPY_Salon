'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

// 1. Base Shimmer Block
export default function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    rect: 'h-32 w-full rounded-2xl',
    circle: 'h-12 w-12 rounded-full',
  };
  
  return (
    <div className={`shimmer ${variantClasses[variant]} ${className}`} />
  );
}

// 2. Catalogue Skeleton Layout
export function PricingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-pulse text-left">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-6 w-48 mx-auto rounded-full" />
        <Skeleton className="h-10 w-96 mx-auto" />
        <Skeleton className="h-4 w-full mx-auto" />
        <Skeleton className="h-12 w-80 mx-auto rounded-full mt-4" />
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6 relative">
        {/* Left Sidebar Category Skeletons */}
        <div className="w-full lg:w-[280px] bg-dark-850 p-4 rounded-3xl border border-white/5 space-y-4 shrink-0">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Middle Sidebar Services List Skeletons */}
        <div className="w-full lg:w-[340px] bg-dark-850 p-4 rounded-3xl border border-white/5 space-y-4 shrink-0">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-between">
                <div className="space-y-2 flex-1 mr-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Details Panel Skeleton */}
        <div className="flex-1 w-full bg-dark-850 p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-full md:w-48 h-48 rounded-2xl" />
            <div className="flex-1 space-y-4 py-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex space-x-3 pt-2">
                <Skeleton className="h-10 w-24 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Gallery Masonry Skeleton Layout
export function GallerySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-pulse text-left">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <Skeleton className="h-6 w-44 mx-auto rounded-full" />
        <Skeleton className="h-10 w-80 mx-auto" />
        <Skeleton className="h-4 w-full mx-auto" />
      </div>

      <div className="flex items-center justify-center space-x-2 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-dark-850 rounded-2xl overflow-hidden border border-white/5">
            <Skeleton className="h-64 w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Admin Dashboard Skeleton Layout
export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-dark-900 flex text-left animate-pulse">
      {/* Sidebar Placeholder */}
      <div className="hidden md:flex flex-col w-64 bg-dark-950 border-r border-white/5 p-4 space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Panel Placeholder */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 space-y-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        {/* 4 Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-dark-850 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          ))}
        </div>

        {/* Tab Selection Row */}
        <div className="flex space-x-2 border-b border-white/5 pb-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-t-lg rounded-b-none" />
          ))}
        </div>

        {/* Content Table Area */}
        <div className="bg-dark-850 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Employee Desk Skeleton Layout
export function EmployeeSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Profile & Status Panel */}
        <div className="bg-dark-850 p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns Appointments Scheduler */}
        <div className="lg:col-span-2 bg-dark-850 p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-44" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Booking Engine Wizard Skeleton Layout
export function BookingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-pulse text-left">
      {/* Steps Progress Header */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      <div className="bg-dark-850 p-6 sm:p-8 rounded-3xl border border-white/5 space-y-8">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>

        {/* Outlets Selection Grid (Step 1 Sim) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-dark-800 border border-white/5 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full rounded-xl mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
