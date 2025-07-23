import React from 'react';
import { BookOpen, CheckCircle, MessageCircle, Award, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ActivityType } from '../types/dashboard';

interface IconConfig {
  Component: LucideIcon;
  color: string;
}

const iconMap: Record<ActivityType, IconConfig> = {
  course: {
    Component: BookOpen,
    color: 'text-blue-500'
  },
  exercise: {
    Component: CheckCircle,
    color: 'text-green-500'
  },
  forum: {
    Component: MessageCircle,
    color: 'text-purple-500'
  },
  achievement: {
    Component: Award,
    color: 'text-yellow-500'
  }
};

export const getActivityIcon = (type: ActivityType): JSX.Element => {
  const { Component, color } = iconMap[type];
  return React.createElement(Component, { className: `h-5 w-5 ${color}` });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? 'день' : 'дней'} назад`;
  if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? 'час' : 'часов'} назад`;
  if (diffMinutes > 0) return `${diffMinutes} ${diffMinutes === 1 ? 'минуту' : 'минут'} назад`;
  return 'только что';
};

// Для случаев, когда нужна точная дата
export const formatActivityDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};