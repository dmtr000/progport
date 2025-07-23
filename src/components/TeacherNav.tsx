import React from 'react';
import { NavLink } from 'react-router-dom';

const TeacherNav: React.FC = () => {
  return (
    <nav className="bg-white shadow mb-8">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          <NavLink
            to="/teacher/students"
            className={({ isActive }) =>
              `py-4 px-2 border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`
            }
          >
            Ученики
          </NavLink>
          <NavLink
            to="/teacher/courses"
            className={({ isActive }) =>
              `py-4 px-2 border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`
            }
          >
            Курсы
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default TeacherNav; 