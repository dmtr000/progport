import React from 'react';
import { BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          {/* Лого */}
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold">ProgPort</span>
          </div>
          <p className="mt-2 text-sm text-gray-400 text-center">
            Развиваем новое поколение программистов с помощью увлекательного интерактивного обучения.
          </p>
          
          {/* Копирайт */}
          <div className="mt-6 pt-6 border-t border-gray-700 w-full">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} ProgPort. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;