import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BookOpen, Award, Clock, Calendar, Activity, CheckCircle } from 'lucide-react';

interface StudentStats {
  lessons: {
    completed: number;
    total: number;
    completionRate: number;
  };
  exercises: {
    completed: number;
    total: number;
    completionRate: number;
  };
  courses: {
    completed: number;
    total: number;
    completionRate: number;
  };
  activity: {
    last30Days: number;
    lastActive: string | null;
    daysInactive: number | null;
  };
}

interface EnrolledCourse {
  courseId: string;
  title: string;
  completed: boolean;
  progress: {
    lessons: {
      completed: number;
      total: number;
    };
    exercises: {
      completed: number;
      total: number;
    };
  };
}

interface Student {
  _id: string;
  name: string;
  email: string;
  stats: StudentStats;
  enrolledCourses: EnrolledCourse[];
}

const TeacherStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/users/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Не удалось загрузить список учеников');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Нет данных';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityStatus = (daysInactive: number | null) => {
    if (daysInactive === null) return { text: 'Нет активности', color: 'gray' };
    if (daysInactive === 0) return { text: 'Сегодня', color: 'green' };
    if (daysInactive === 1) return { text: 'Вчера', color: 'blue' };
    if (daysInactive <= 7) return { text: 'На этой неделе', color: 'yellow' };
    return { text: 'Давно не заходил', color: 'red' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Статистика учеников</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Список учеников */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Список учеников</h2>
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student._id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedStudent?._id === student._id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedStudent(student)}
              >
                <h3 className="font-medium">{student.name}</h3>
                <p className="text-gray-600 text-sm">{student.email}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-blue-600">
                    Курсы: {student.stats.courses.completed}/{student.stats.courses.total}
                  </span>
                  <span className="text-green-600">
                    Уроки: {student.stats.lessons.completed}/{student.stats.lessons.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Детальная статистика */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Детальная статистика</h2>
          {selectedStudent ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-2">{selectedStudent.name}</h3>
                <p className="text-gray-600 mb-4">{selectedStudent.email}</p>
                
                {/* Основные показатели */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600">Прогресс по урокам</span>
                    </div>
                    <p className="text-2xl font-semibold text-blue-600">
                      {selectedStudent.stats.lessons.completionRate}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.stats.lessons.completed} из {selectedStudent.stats.lessons.total}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-gray-600">Выполнено упражнений</span>
                    </div>
                    <p className="text-2xl font-semibold text-green-600">
                      {selectedStudent.stats.exercises.completionRate}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.stats.exercises.completed} из {selectedStudent.stats.exercises.total}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-600">Завершено курсов</span>
                    </div>
                    <p className="text-2xl font-semibold text-purple-600">
                      {selectedStudent.stats.courses.completionRate}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.stats.courses.completed} из {selectedStudent.stats.courses.total}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Activity className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-gray-600">Активность</span>
                    </div>
                    <p className="text-2xl font-semibold text-yellow-600">
                      {selectedStudent.stats.activity.last30Days}
                    </p>
                    <p className="text-sm text-gray-500">действий за 30 дней</p>
                  </div>
                </div>

                {/* Информация об активности */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">Активность ученика</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Последняя активность:</span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedStudent.stats.activity.lastActive)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Статус:</span>
                      <span className={`text-sm font-medium text-${getActivityStatus(selectedStudent.stats.activity.daysInactive).color}-600`}>
                        {getActivityStatus(selectedStudent.stats.activity.daysInactive).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Прогресс по курсам */}
                <div>
                  <h4 className="font-medium mb-3">Прогресс по курсам</h4>
                  <div className="space-y-4">
                    {selectedStudent.enrolledCourses.map((course) => (
                      <div key={course.courseId} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{course.title}</h5>
                          {course.completed && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Завершен
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {/* Прогресс по урокам */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Уроки:</span>
                              <span>
                                {course.progress.lessons.completed} из {course.progress.lessons.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.round((course.progress.lessons.completed / course.progress.lessons.total) * 100)}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Прогресс по упражнениям */}
                          {course.progress.exercises.total > 0 && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Упражнения:</span>
                                <span>
                                  {course.progress.exercises.completed} из {course.progress.exercises.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${Math.round((course.progress.exercises.completed / course.progress.exercises.total) * 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Выберите ученика для просмотра детальной статистики
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentsPage; 