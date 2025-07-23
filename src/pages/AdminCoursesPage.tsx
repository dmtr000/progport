import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Course } from '../types';
import { Upload, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

interface Exercise {
  title: string;
  description?: string;
  starterCode: string;
  testCases: TestCase[];
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Lesson {
  _id?: string;
  title: string;
  description?: string;
  content: string;
  duration?: string;
  order: number;
  exercise?: Exercise;
  completed?: boolean;
}

interface Module {
  _id?: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface CourseFormData {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration: string;
  modules: Module[];
  enrolled: number;
  imageUrl?: string;
}

const ExerciseForm: React.FC<{
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onDelete: () => void;
}> = ({ exercise, onChange, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const addTestCase = () => {
    onChange({
      ...exercise,
      testCases: [...exercise.testCases, { input: '', expectedOutput: '', description: '' }]
    });
  };

  const addHint = () => {
    onChange({
      ...exercise,
      hints: [...exercise.hints, '']
    });
  };

  return (
    <div className="border rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-medium text-blue-600"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="ml-2">Упражнение</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Название упражнения</label>
            <input
              type="text"
              value={exercise.title}
              onChange={(e) => onChange({ ...exercise, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Описание упражнения</label>
            <textarea
              value={exercise.description}
              onChange={(e) => onChange({ ...exercise, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Начальный код</label>
            <textarea
              value={exercise.starterCode}
              onChange={(e) => onChange({ ...exercise, starterCode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Сложность</label>
            <select
              value={exercise.difficulty}
              onChange={(e) => onChange({ ...exercise, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="easy">Легкая</option>
              <option value="medium">Средняя</option>
              <option value="hard">Сложная</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Тестовые случаи</label>
              <button
                type="button"
                onClick={addTestCase}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} className="inline mr-1" />
                Добавить тест
              </button>
            </div>
            <div className="space-y-4">
              {exercise.testCases.map((testCase, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <textarea
                    value={testCase.input}
                    onChange={(e) => {
                      const newTestCases = [...exercise.testCases];
                      newTestCases[index] = { ...testCase, input: e.target.value };
                      onChange({ ...exercise, testCases: newTestCases });
                    }}
                    placeholder="Входные данные"
                    className="px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                  <textarea
                    value={testCase.expectedOutput}
                    onChange={(e) => {
                      const newTestCases = [...exercise.testCases];
                      newTestCases[index] = { ...testCase, expectedOutput: e.target.value };
                      onChange({ ...exercise, testCases: newTestCases });
                    }}
                    placeholder="Ожидаемый результат"
                    className="px-3 py-2 border rounded-lg"
                    rows={2}
                    required
                  />
                  <input
                    type="text"
                    value={testCase.description}
                    onChange={(e) => {
                      const newTestCases = [...exercise.testCases];
                      newTestCases[index] = { ...testCase, description: e.target.value };
                      onChange({ ...exercise, testCases: newTestCases });
                    }}
                    placeholder="Описание теста"
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Подсказки</label>
              <button
                type="button"
                onClick={addHint}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} className="inline mr-1" />
                Добавить подсказку
              </button>
            </div>
            <div className="space-y-2">
              {exercise.hints.map((hint, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => {
                      const newHints = [...exercise.hints];
                      newHints[index] = e.target.value;
                      onChange({ ...exercise, hints: newHints });
                    }}
                    className="flex-grow text-sm"
                    placeholder={`Подсказка ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newHints = [...exercise.hints];
                      newHints.splice(index, 1);
                      onChange({ ...exercise, hints: newHints });
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModuleForm: React.FC<{
  module: Module;
  onUpdate: (updatedModule: Module) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ module, onUpdate, onDelete, onMoveUp, onMoveDown, isExpanded, onToggle }) => {
  const addLesson = () => {
    const newLessons = [...module.lessons];
    newLessons.push({
      title: '',
      description: '',
      content: '',
      duration: '30 минут',
      order: newLessons.length,
      completed: false
    });
    onUpdate({ ...module, lessons: newLessons });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <h4 className="font-medium">
            {module.title || `Модуль ${module.order + 1}`}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronUp size={16} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronDown size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="space-y-4">
            <input
              type="text"
              value={module.title}
              onChange={(e) => onUpdate({ ...module, title: e.target.value })}
              placeholder="Название модуля"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <textarea
              value={module.description || ''}
              onChange={(e) => onUpdate({ ...module, description: e.target.value })}
              placeholder="Описание модуля"
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="font-medium">Уроки</h5>
              <button
                type="button"
                onClick={addLesson}
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Добавить урок
              </button>
            </div>

            {module.lessons.map((lesson, index) => (
              <LessonForm
                key={lesson._id || index}
                lesson={lesson}
                onChange={(updatedLesson) => {
                  const newLessons = [...module.lessons];
                  newLessons[index] = updatedLesson;
                  onUpdate({ ...module, lessons: newLessons });
                }}
                onDelete={() => {
                  const newLessons = module.lessons.filter((_, i) => i !== index);
                  newLessons.forEach((l, i) => l.order = i);
                  onUpdate({ ...module, lessons: newLessons });
                }}
                onMoveUp={index > 0 ? () => {
                  const newLessons = [...module.lessons];
                  [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
                  newLessons.forEach((l, i) => l.order = i);
                  onUpdate({ ...module, lessons: newLessons });
                } : undefined}
                onMoveDown={index < module.lessons.length - 1 ? () => {
                  const newLessons = [...module.lessons];
                  [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
                  newLessons.forEach((l, i) => l.order = i);
                  onUpdate({ ...module, lessons: newLessons });
                } : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LessonForm: React.FC<{
  lesson: Lesson;
  onChange: (updatedLesson: Lesson) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}> = ({ lesson, onChange, onDelete, onMoveUp, onMoveDown }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const addExercise = () => {
    onChange({
      ...lesson,
      exercise: {
        title: '',
        description: '',
        starterCode: '',
        testCases: [],
        hints: [],
        difficulty: 'easy'
      }
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <h6 className="font-medium">
            {lesson.title || `Урок ${lesson.order + 1}`}
          </h6>
        </div>
        <div className="flex items-center gap-2">
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronUp size={16} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronDown size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <input
            type="text"
            value={lesson.title}
            onChange={(e) => onChange({ ...lesson, title: e.target.value })}
            placeholder="Название урока"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <textarea
            value={lesson.description || ''}
            onChange={(e) => onChange({ ...lesson, description: e.target.value })}
            placeholder="Описание урока"
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
          />
          <textarea
            value={lesson.content}
            onChange={(e) => onChange({ ...lesson, content: e.target.value })}
            placeholder="Содержание урока"
            className="w-full px-3 py-2 border rounded-lg whitespace-pre-wrap"
            rows={4}
            required
          />
          <input
            type="text"
            value={lesson.duration || ''}
            onChange={(e) => onChange({ ...lesson, duration: e.target.value })}
            placeholder="Продолжительность (например: 30 минут)"
            className="w-full px-3 py-2 border rounded-lg"
          />

          {!lesson.exercise ? (
            <button
              type="button"
              onClick={addExercise}
              className="text-blue-600 hover:text-blue-800"
            >
              Добавить практическое задание
            </button>
          ) : (
            <ExerciseForm
              exercise={lesson.exercise}
              onChange={(updatedExercise) => onChange({ ...lesson, exercise: updatedExercise })}
              onDelete={() => onChange({ ...lesson, exercise: undefined })}
            />
          )}
        </div>
      )}
    </div>
  );
};

const mapModuleData = (module: any) => {
  return {
    _id: module._id,
    title: module.title || '',
    description: module.description || '',
    order: module.order || 0,
    lessons: Array.isArray(module.lessons) ? module.lessons.map((lesson: any) => ({
      _id: lesson._id,
      title: lesson.title || '',
      description: lesson.description || '',
      content: lesson.content || '',
      duration: lesson.duration || '',
      order: lesson.order || 0,
      completed: lesson.completed || false,
      exercise: lesson.exercise ? {
        title: lesson.exercise.title || '',
        description: lesson.exercise.description || '',
        starterCode: lesson.exercise.starterCode || '',
        testCases: Array.isArray(lesson.exercise.testCases) 
          ? lesson.exercise.testCases.map((testCase: any) => ({
              input: testCase?.input || '',
              expectedOutput: testCase?.expectedOutput || '',
              description: testCase?.description || ''
            }))
          : [],
        hints: Array.isArray(lesson.exercise.hints) 
          ? lesson.exercise.hints.map((hint: any) => 
              typeof hint === 'string' ? hint : (hint?.text || '')
            )
          : [],
        difficulty: lesson.exercise.difficulty || 'easy'
      } : undefined
    })) : []
  };
};

const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseFormData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Состояния для отслеживания раскрытых элементов
  const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});
  const [expandedLessons, setExpandedLessons] = useState<{ [key: string]: boolean }>({});
  const [expandedExercises, setExpandedExercises] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/courses');
      setCourses(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке курсов');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверяем размер файла (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 5MB');
        return;
      }

      // Проверяем формат файла
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Поддерживаются только форматы JPEG, PNG, GIF и WEBP');
        return;
      }

      setImageFile(file);
      setError(null);

      // Создаем превью изображения
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setIsCreating(false);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      if (!imageFile) {
        setError('Пожалуйста, выберите изображение для курса');
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Token:', token);

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('courseData', JSON.stringify(editingCourse));

      console.log('Request URL:', axios.defaults.baseURL + '/courses');
      console.log('Request headers:', {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      });

      const response = await axios.post('/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response:', response.data);

      setCourses([...courses, response.data]);
      resetForm();
    } catch (err: any) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Ошибка при создании курса');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse._id) return;

    try {
      const token = localStorage.getItem('token');
      let updatedData: any = { ...editingCourse };
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('courseData', JSON.stringify(editingCourse));
        
        const response = await axios.put(`/courses/${editingCourse._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        updatedData = response.data;
      } else {
        const response = await axios.put(`/courses/${editingCourse._id}`, editingCourse, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        updatedData = response.data;
      }

      // Обновляем состояние с актуальными данными
      setCourses(prevCourses => prevCourses.map(course => 
        course._id === editingCourse._id ? {
          ...course,
          ...updatedData,
          id: updatedData._id || updatedData.id, // Обеспечиваем совместимость id
          _id: updatedData._id || updatedData.id // Обеспечиваем совместимость _id
        } : course
      ));
      
      resetForm();
      
      // Обновляем список курсов с сервера для получения актуальных данных
      await fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Ошибка при обновлении курса');
      console.error('Error updating course:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const id = courseId.startsWith('new') ? courseId : courseId.replace('course-', '');
      await axios.delete(`/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCourses(courses.filter(course => course._id !== id && course.id !== id));
      setError(null);
    } catch (err) {
      setError('Ошибка при удалении курса');
      console.error('Error deleting course:', err);
    }
  };

  const handleEditCourse = async (course: Course) => {
    try {

      // Загружаем полные данные курса с сервера
      const response = await axios.get(`/courses/${course._id || course.id}`);
      const fullCourseData = response.data;

      setIsCreating(false);
      const mappedModules = Array.isArray(fullCourseData.modules) 
        ? fullCourseData.modules.map(mapModuleData)
        : [];


      setEditingCourse({
        _id: fullCourseData._id || fullCourseData.id,
        title: fullCourseData.title,
        description: fullCourseData.description,
        level: fullCourseData.level,
        language: fullCourseData.language,
        duration: fullCourseData.duration,
        modules: mappedModules,
        enrolled: fullCourseData.enrolled || 0,
        imageUrl: fullCourseData.imageUrl
      });
      setImagePreview(fullCourseData.imageUrl);
    } catch (err) {
      console.error('Error loading full course data:', err);
      setError('Ошибка при загрузке данных курса');
    }
  };

  // Функции для управления раскрытием/сворачиванием
  const toggleModule = (moduleIndex: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleIndex]: !prev[moduleIndex]
    }));
  };

  const toggleLesson = (moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setExpandedLessons(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleExercise = (moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setExpandedExercises(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление курсами</h1>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingCourse({ 
              title: '', 
              description: '', 
              level: 'beginner', 
              language: '', 
              duration: '',
              modules: [],
              enrolled: 0
            });
            setImageFile(null);
            setImagePreview(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Создать курс
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {(isCreating || editingCourse) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg mt-16">
              <h2 className="text-2xl font-bold mb-4">
                {isCreating ? 'Создать новый курс' : 'Редактировать курс'}
              </h2>
              <form onSubmit={isCreating ? handleCreateSubmit : handleUpdateSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Изображение курса
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {(imagePreview || editingCourse?.imageUrl) ? (
                          <img
                            src={imagePreview || editingCourse?.imageUrl}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <Upload className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="course-image"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('course-image')?.click()}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isCreating ? 'Выбрать изображение' : 'Изменить изображение'}
                        </button>
                        {imageFile && (
                          <p className="mt-2 text-sm text-gray-600">
                            Выбрано: {imageFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название курса *
                    </label>
                    <input
                      type="text"
                      value={editingCourse?.title || ''}
                      onChange={(e) => setEditingCourse(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание *
                    </label>
                    <textarea
                      value={editingCourse?.description || ''}
                      onChange={(e) => setEditingCourse(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Уровень сложности *
                      </label>
                      <select
                        value={editingCourse?.level || 'beginner'}
                        onChange={(e) => setEditingCourse(prev => prev ? { 
                          ...prev, 
                          level: e.target.value as 'beginner' | 'intermediate' | 'advanced' 
                        } : null)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="beginner">Начальный</option>
                        <option value="intermediate">Средний</option>
                        <option value="advanced">Продвинутый</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Язык программирования *
                      </label>
                      <input
                        type="text"
                        value={editingCourse?.language || ''}
                        onChange={(e) => setEditingCourse(prev => prev ? { ...prev, language: e.target.value } : null)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Продолжительность *
                      </label>
                      <input
                        type="text"
                        value={editingCourse?.duration || ''}
                        onChange={(e) => setEditingCourse(prev => prev ? { ...prev, duration: e.target.value } : null)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="например: 1 неделя"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Модули курса</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourse(prev => {
                            if (!prev) return null;
                            const newModule: Module = {
                              title: '',
                              description: '',
                              order: prev.modules.length,
                              lessons: []
                            };
                            return {
                              ...prev,
                              modules: [...prev.modules, newModule]
                            };
                          });
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Добавить модуль
                      </button>
                    </div>

                    {editingCourse?.modules.map((module, moduleIndex) => (
                      <ModuleForm
                        key={module._id || moduleIndex}
                        module={module}
                        onUpdate={(updatedModule) => {
                          setEditingCourse(prev => {
                            if (!prev) return null;
                            const newModules = [...prev.modules];
                            newModules[moduleIndex] = updatedModule;
                            return { ...prev, modules: newModules };
                          });
                        }}
                        onDelete={() => {
                          setEditingCourse(prev => {
                            if (!prev) return null;
                            const newModules = prev.modules.filter((_, i) => i !== moduleIndex);
                            newModules.forEach((m, i) => m.order = i);
                            return { ...prev, modules: newModules };
                          });
                        }}
                        onMoveUp={moduleIndex > 0 ? () => {
                          setEditingCourse(prev => {
                            if (!prev) return null;
                            const newModules = [...prev.modules];
                            [newModules[moduleIndex - 1], newModules[moduleIndex]] = 
                            [newModules[moduleIndex], newModules[moduleIndex - 1]];
                            newModules.forEach((m, i) => m.order = i);
                            return { ...prev, modules: newModules };
                          });
                        } : undefined}
                        onMoveDown={moduleIndex < (editingCourse?.modules.length || 0) - 1 ? () => {
                          setEditingCourse(prev => {
                            if (!prev) return null;
                            const newModules = [...prev.modules];
                            [newModules[moduleIndex], newModules[moduleIndex + 1]] = 
                            [newModules[moduleIndex + 1], newModules[moduleIndex]];
                            newModules.forEach((m, i) => m.order = i);
                            return { ...prev, modules: newModules };
                          });
                        } : undefined}
                        isExpanded={expandedModules[moduleIndex] || false}
                        onToggle={() => toggleModule(moduleIndex)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isCreating ? 'Создать курс' : 'Сохранить изменения'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingCourse(null);
                      resetForm();
                    }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Курс
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Язык
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Длительность
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course._id}>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded object-cover"
                          src={course.imageUrl || '/default-course.png'}
                          alt={course.title}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        <div className="sm:hidden text-xs text-gray-500">
                          <div>Уровень: {course.level}</div>
                          <div>Язык: {course.language}</div>
                          <div>Длительность: {course.duration}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.level}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.language}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.duration}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCoursesPage; 