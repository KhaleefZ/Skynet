// Utility functions

import { clsx, type ClassValue } from 'clsx';

// Conditionally join class names (install clsx if needed, or use simple version below)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Simple cn alternative without clsx dependency
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Format date for display (e.g., "Jan 2026")
export function formatPeriod(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Format date range (e.g., "Jan - Mar 2026")
export function formatPeriodRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  return `${startMonth} - ${endMonth}`;
}

// Format full date (e.g., "January 15, 2026")
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'dropped':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get trend icon and color
export function getTrendDisplay(trend: 'improving' | 'declining' | 'stable'): {
  icon: string;
  color: string;
  label: string;
} {
  switch (trend) {
    case 'improving':
      return { icon: '↑', color: 'text-green-600', label: 'Improving' };
    case 'declining':
      return { icon: '↓', color: 'text-red-600', label: 'Declining' };
    case 'stable':
      return { icon: '→', color: 'text-gray-600', label: 'Stable' };
  }
}

// Render star rating as string
export function renderStars(rating: number): string {
  const filled = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return filled + empty;
}
