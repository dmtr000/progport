export const getLevelVariant = (level: string): 'primary' | 'secondary' | 'warning' => {
  switch (level.toLowerCase()) {
    case 'beginner': return 'primary';
    case 'intermediate': return 'secondary';
    case 'advanced': return 'warning';
    default: return 'primary';
  }
};

export const getLevelText = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'beginner': return 'Начинающий';
    case 'intermediate': return 'Средний';
    case 'advanced': return 'Продвинутый';
    default: return 'Начинающий';
  }
};

export const formatEnrolledCount = (count?: number): string => {
  if (count === undefined || count === null) {
    return '0';
  }
  return count.toLocaleString('ru-RU');
};