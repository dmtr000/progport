import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false, bordered = true }) => (
  <div
    className={`
      bg-white rounded-lg overflow-hidden
      ${bordered ? 'border-2 border-gray-200' : ''}
      ${hoverable ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1' : 'shadow-sm'}
      ${className}
    `}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b-2 border-gray-200 ${className}`}>{children}</div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t-2 border-gray-200 ${className}`}>{children}</div>
);

interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
}

const CardImage: React.FC<CardImageProps> = ({ src, alt, className = '' }) => (
  <div className={`w-full ${className}`}>
    <img src={src} alt={alt} className="w-full h-48 object-cover" />
  </div>
);

export { Card, CardHeader, CardContent, CardFooter, CardImage };