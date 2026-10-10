// components/map/SubwayStationIcon.tsx
'use client';

import React from 'react';
import { Train } from 'lucide-react';
import { getSubwayLineColor } from '@/shared/lib/icons/subway-colors';

interface SubwayStationIconProps {
  route?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SubwayStationIcon: React.FC<SubwayStationIconProps> = ({
  route = '',
  size = 'md',
  className = '',
}) => {
  const color = getSubwayLineColor(route);

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-12 h-12 p-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg ${className}`}
      style={{ backgroundColor: color }}
    >
      <Train className={`${iconSizes[size]} text-white`} />
    </div>
  );
};
