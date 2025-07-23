import React from 'react';
import CourseCard from './CourseCard';
import { Course } from '../../types';

interface CourseListProps {
  courses: Course[];
  title?: string;
  description?: string;
  className?: string;
  gridClasses?: string;
  isPopular?: boolean;
}

const CourseList: React.FC<CourseListProps> = ({
  courses,
  title,
  description,
  className = '',
  gridClasses = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  isPopular = false
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      <div className={`grid gap-6 ${gridClasses}`}>
        {courses.map((course) => (
          <CourseCard 
            key={course._id || course.id}
            course={course} 
            isPopular={isPopular}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseList;