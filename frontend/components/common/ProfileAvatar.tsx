'use client';

import React, { useState, useEffect } from 'react';

interface ProfileAvatarProps {
  src?: string | null;
  name?: string | null;
  user?: any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  onClick?: () => void;
  title?: string;
  showBorder?: boolean;
}

/**
 * Dynamically generate uppercase initials from a person's full name.
 * Examples:
 * "Vishnu Reddy" -> "VR"
 * "Vishnu"       -> "V"
 * "Super Admin"  -> "SA"
 */
export const getDynamicInitials = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return 'SP';
  const trimmed = name.trim();
  if (!trimmed) return 'SP';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (trimmed.length >= 2) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  return trimmed[0].toUpperCase();
};

export default function ProfileAvatar({
  src,
  name,
  user,
  size = 'md',
  className = '',
  onClick,
  title,
  showBorder = true
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Extract avatar URL from direct prop or user object variants
  const avatarUrl = src || user?.avatar || user?.avatarVariants?.navbar || user?.avatarVariants?.thumbnail || user?.avatarVariants?.card || user?.avatarVariants?.full || user?.profileImage || null;
  const userName = name || user?.name || user?.fullName || user?.employeeName || 'User';

  useEffect(() => {
    // Reset image error state whenever avatar URL changes
    setImageError(false);
  }, [avatarUrl]);

  const initials = getDynamicInitials(userName);

  // Map predefined size props to styling
  let sizeClasses = 'w-10 h-10 text-sm';
  let inlineStyle: React.CSSProperties = {};

  if (typeof size === 'number') {
    inlineStyle = { width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(10, Math.round(size * 0.38))}px` };
    sizeClasses = '';
  } else {
    switch (size) {
      case 'xs':
        sizeClasses = 'w-6 h-6 text-[10px]';
        break;
      case 'sm':
        sizeClasses = 'w-8 h-8 text-xs';
        break;
      case 'md':
        sizeClasses = 'w-10 h-10 text-sm';
        break;
      case 'lg':
        sizeClasses = 'w-12 h-12 text-base';
        break;
      case 'xl':
        sizeClasses = 'w-16 h-16 text-xl';
        break;
      case '2xl':
        sizeClasses = 'w-24 h-24 text-3xl sm:w-28 sm:h-28';
        break;
    }
  }

  const borderClass = showBorder ? 'border border-rosegold-500/40 shadow-md' : '';

  return (
    <div
      onClick={onClick}
      style={inlineStyle}
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-serif font-bold shrink-0 brand-profile-avatar bg-dark-800 text-rosegold-400 ${sizeClasses} ${borderClass} ${className} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      title={title || userName}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={userName}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="select-none leading-none tracking-wider font-extrabold uppercase text-rosegold-300">
          {initials}
        </span>
      )}
    </div>
  );
}
