import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  size = 'md',
  showValue = false,
  animated = false,
  className = '',
}) => {
  // Ensure value is a number and normalize it
  const normalizedValue = typeof value === 'number' 
    ? Math.min(Math.max(value, 0), 100)
    : 0;


  const variantStyles = {
    default: 'bg-gray-600',
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const animationStyle = animated ? 'transition-all duration-500 ease-in-out' : '';

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${variantStyles[variant]} ${sizeStyles[size]} ${animationStyle} rounded-full`}
          style={{ width: `${normalizedValue}%` }}
          role="progressbar"
          aria-valuenow={normalizedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showValue && (
        <span className="mt-1 text-xs text-gray-500">{Math.round(normalizedValue)}%</span>
      )}
    </div>
  );
};

export default ProgressBar;