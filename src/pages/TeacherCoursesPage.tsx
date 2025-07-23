import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

interface Module {
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  _id?: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  order: number;
  exercise?: {
    title: string;
    description: string;
    starterCode: string;
    testCases: Array<{
      input: string;
      expectedOutput: string;
      description: string;
    }>;
    hints: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    language: 'python' | 'javascript';
  };
}

interface Course {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  level: string;
  language: string;
  duration: string;
  modules: Module[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isOwner?: boolean;
}

const TeacherCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    language: 'python',
    duration: '1 неделя',
    modules: [] as Module[]
  });

  // Добавляем состояния для отслеживания раскрытых элементов
  const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});
  const [expandedLessons, setExpandedLessons] = useState<{ [key: string]: boolean }>({});
  const [expandedExercises, setExpandedExercises] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log('Fetching teacher courses...');
      const response = await api.get('/courses/teacher');
      console.log('Courses response:', response.data);
      setCourses(response.data);
    } catch (error: any) {
      console.error('Error details:', error);
      toast.error(error.response?.data?.message || 'Не удалось загрузить курсы');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Transform the form data to match the expected schema
      const transformedData = {
        ...formData,
        modules: formData.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            exercise: lesson.exercise ? {
              ...lesson.exercise,
              // Transform hints from {text, order} objects to strings array
              hints: lesson.exercise.hints.map(hint => hint.text)
            } : undefined
          }))
        }))
      };

      const formDataToSend = new FormData();
      formDataToSend.append('courseData', JSON.stringify(transformedData));
      
      if (fileInputRef.current?.files?.[0]) {
        formDataToSend.append('image', fileInputRef.current.files[0]);
      }

      let response;
      if (editingCourse) {
        response = await api.put(`/courses/${editingCourse._id}`, formDataToSend);
        toast.success('Курс успешно обновлен');
      } else {
        response = await api.post('/courses', formDataToSend);
        toast.success('Курс успешно создан');
      }

      console.log('Course saved:', response.data);
      setIsEditing(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      console.error('Error saving course:', error.response?.data);
      toast.error(error.response?.data?.message || 'Произошла ошибка при сохранении курса');
    }
  };

  const handleEdit = (course: Course) => {
    if (!course.isOwner) {
      toast.error('У вас нет прав на редактирование этого курса');
      return;
    }
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      level: course.level,
      language: course.language,
      duration: course.duration,
      modules: course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          exercise: lesson.exercise ? {
            ...lesson.exercise,
            // Transform hints from string array to object array with additional safety checks
            hints: (lesson.exercise.hints || []).map((hint, index) => {
              if (hint === null || hint === undefined) {
                return { text: '', order: index + 1 };
              }
              return {
                text: typeof hint === 'string' ? hint : (hint.text || ''),
                order: index + 1
              };
            })
          } : undefined
        }))
      }))
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      return;
    }

    try {
      setIsEditing(false);
      await api.delete(`/courses/${courseId}`);
      toast.success('Курс успешно удален');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось удалить курс');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      level: 'beginner',
      language: 'python',
      duration: '1 неделя',
      modules: []
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        {
          title: '',
          description: '',
          order: formData.modules.length + 1,
          lessons: []
        }
      ]
    });
  };

  const handleModuleChange = (index: number, field: string, value: string) => {
    const newModules = [...formData.modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setFormData({ ...formData, modules: newModules });
  };

  const handleDeleteModule = (index: number) => {
    const newModules = formData.modules.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      modules: newModules.map((module, i) => ({ ...module, order: i + 1 }))
    });
  };

  const handleAddLesson = (moduleIndex: number) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    module.lessons = [
      ...module.lessons,
      {
        title: '',
        description: '',
        content: '',
        duration: '30 минут',
        order: module.lessons.length + 1
      }
    ];
    setFormData({ ...formData, modules: newModules });
  };

  const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = { ...module.lessons[lessonIndex], [field]: value };
    module.lessons[lessonIndex] = lesson;
    setFormData({ ...formData, modules: newModules });
  };

  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    module.lessons = module.lessons
      .filter((_, i) => i !== lessonIndex)
      .map((lesson, i) => ({ ...lesson, order: i + 1 }));
    setFormData({ ...formData, modules: newModules });
  };

  const handleAddExercise = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    lesson.exercise = {
      title: '',
      description: '',
      starterCode: '',
      testCases: [],
      hints: [],
      difficulty: 'easy',
      language: 'python'
    };
    setFormData({ ...formData, modules: newModules });
  };

  const handleExerciseChange = (
    moduleIndex: number,
    lessonIndex: number,
    field: string,
    value: any
  ) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    if (lesson.exercise) {
      lesson.exercise = { ...lesson.exercise, [field]: value };
      setFormData({ ...formData, modules: newModules });
    }
  };

  const handleAddTestCase = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    if (lesson.exercise) {
      lesson.exercise.testCases = [
        ...lesson.exercise.testCases,
        { input: '', expectedOutput: '', description: '' }
      ];
      setFormData({ ...formData, modules: newModules });
    }
  };

  // Добавляем функцию для управления подсказками
  const handleAddHint = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    if (lesson.exercise) {
      lesson.exercise.hints = [...(lesson.exercise.hints || []), { text: '', order: lesson.exercise.hints.length + 1 }];
      setFormData({ ...formData, modules: newModules });
    }
  };

  const handleHintChange = (
    moduleIndex: number,
    lessonIndex: number,
    hintIndex: number,
    value: string
  ) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    if (lesson.exercise && lesson.exercise.hints) {
      lesson.exercise.hints[hintIndex] = { ...lesson.exercise.hints[hintIndex], text: value };
      setFormData({ ...formData, modules: newModules });
    }
  };

  const handleDeleteHint = (moduleIndex: number, lessonIndex: number, hintIndex: number) => {
    const newModules = [...formData.modules];
    const module = newModules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    if (lesson.exercise && lesson.exercise.hints) {
      lesson.exercise.hints = lesson.exercise.hints
        .filter((_, index) => index !== hintIndex)
        .map((hint, index) => ({ ...hint, order: index + 1 }));
      setFormData({ ...formData, modules: newModules });
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Управление курсами</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать курс
          </button>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto mt-16">
              <h2 className="text-xl font-semibold mb-4">
                {editingCourse ? 'Редактирование курса' : 'Создание нового курса'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название курса *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Изображение курса
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Уровень сложности *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Продолжительность *
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="например: 1 неделя"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Модули курса</h3>
                    <button
                      type="button"
                      onClick={handleAddModule}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Добавить модуль
                    </button>
                  </div>

                  {formData.modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border rounded-lg overflow-hidden">
                      <div 
                        className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleModule(moduleIndex)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`transform transition-transform ${expandedModules[moduleIndex] ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                          <h4 className="font-medium">
                            {module.title || `Модуль ${moduleIndex + 1}`}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModule(moduleIndex);
                            }}
                            className="text-red-600 hover:text-red-800 px-2 py-1"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>

                      {expandedModules[moduleIndex] && (
                        <div className="p-4 space-y-4">
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={module.title}
                              onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                              placeholder="Название модуля"
                              className="w-full px-3 py-2 border rounded-lg"
                              required
                            />
                            <textarea
                              value={module.description}
                              onChange={(e) => handleModuleChange(moduleIndex, 'description', e.target.value)}
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
                                onClick={() => handleAddLesson(moduleIndex)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                              >
                                Добавить урок
                              </button>
                            </div>

                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lessonIndex} className="border rounded-lg overflow-hidden">
                                <div 
                                  className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                                  onClick={() => toggleLesson(moduleIndex, lessonIndex)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`transform transition-transform ${expandedLessons[`${moduleIndex}-${lessonIndex}`] ? 'rotate-90' : ''}`}>
                                      ▶
                                    </span>
                                    <h6 className="font-medium">
                                      {lesson.title || `Урок ${lessonIndex + 1}`}
                                    </h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLesson(moduleIndex, lessonIndex);
                                      }}
                                      className="text-red-600 hover:text-red-800 px-2 py-1"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                </div>

                                {expandedLessons[`${moduleIndex}-${lessonIndex}`] && (
                                  <div className="p-4 space-y-4">
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'title', e.target.value)}
                                      placeholder="Название урока"
                                      className="w-full px-3 py-2 border rounded-lg"
                                      required
                                    />
                                    <textarea
                                      value={lesson.description}
                                      onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'description', e.target.value)}
                                      placeholder="Описание урока"
                                      className="w-full px-3 py-2 border rounded-lg"
                                      rows={2}
                                    />
                                    <textarea
                                      value={lesson.content}
                                      onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'content', e.target.value)}
                                      placeholder="Содержание урока"
                                      className="w-full px-3 py-2 border rounded-lg whitespace-pre-wrap"
                                      rows={4}
                                      required
                                    />
                                    <input
                                      type="text"
                                      value={lesson.duration}
                                      onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'duration', e.target.value)}
                                      placeholder="Продолжительность (например: 30 минут)"
                                      className="w-full px-3 py-2 border rounded-lg"
                                    />

                                    {!lesson.exercise ? (
                                      <button
                                        type="button"
                                        onClick={() => handleAddExercise(moduleIndex, lessonIndex)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Добавить практическое задание
                                      </button>
                                    ) : (
                                      <div className="border rounded-lg overflow-hidden">
                                        <div 
                                          className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                                          onClick={() => toggleExercise(moduleIndex, lessonIndex)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className={`transform transition-transform ${expandedExercises[`${moduleIndex}-${lessonIndex}`] ? 'rotate-90' : ''}`}>
                                              ▶
                                            </span>
                                            <h6 className="font-medium">
                                              {lesson.exercise.title || 'Практическое задание'}
                                            </h6>
                                          </div>
                                        </div>

                                        {expandedExercises[`${moduleIndex}-${lessonIndex}`] && (
                                          <div className="p-4 space-y-4">
                                            <input
                                              type="text"
                                              value={lesson.exercise.title}
                                              onChange={(e) => handleExerciseChange(moduleIndex, lessonIndex, 'title', e.target.value)}
                                              placeholder="Название задания"
                                              className="w-full px-3 py-2 border rounded-lg"
                                              required
                                            />
                                            <textarea
                                              value={lesson.exercise.description}
                                              onChange={(e) => handleExerciseChange(moduleIndex, lessonIndex, 'description', e.target.value)}
                                              placeholder="Описание задания"
                                              className="w-full px-3 py-2 border rounded-lg"
                                              rows={2}
                                            />
                                            <textarea
                                              value={lesson.exercise.starterCode}
                                              onChange={(e) => handleExerciseChange(moduleIndex, lessonIndex, 'starterCode', e.target.value)}
                                              placeholder="Начальный код"
                                              className="w-full px-3 py-2 border rounded-lg font-mono"
                                              rows={4}
                                              required
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                              <select
                                                value={lesson.exercise.difficulty}
                                                onChange={(e) => handleExerciseChange(moduleIndex, lessonIndex, 'difficulty', e.target.value)}
                                                className="px-3 py-2 border rounded-lg"
                                              >
                                                <option value="easy">Легкая</option>
                                                <option value="medium">Средняя</option>
                                                <option value="hard">Сложная</option>
                                              </select>
                                              <select
                                                value={lesson.exercise.language}
                                                onChange={(e) => handleExerciseChange(moduleIndex, lessonIndex, 'language', e.target.value)}
                                                className="px-3 py-2 border rounded-lg"
                                              >
                                                <option value="python">Python</option>
                                                <option value="javascript">JavaScript</option>
                                              </select>
                                            </div>

                                            <div className="space-y-2">
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium">Тестовые случаи</span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddTestCase(moduleIndex, lessonIndex)}
                                                  className="text-blue-600 hover:text-blue-800"
                                                >
                                                  Добавить тест
                                                </button>
                                              </div>
                                              {lesson.exercise.testCases.map((testCase, testIndex) => (
                                                <div key={testIndex} className="grid grid-cols-3 gap-2">
                                                  <textarea
                                                    value={testCase.input}
                                                    onChange={(e) => {
                                                      const newTestCases = [...lesson.exercise!.testCases];
                                                      newTestCases[testIndex] = { ...testCase, input: e.target.value };
                                                      handleExerciseChange(moduleIndex, lessonIndex, 'testCases', newTestCases);
                                                    }}
                                                    placeholder="Входные данные"
                                                    className="px-3 py-2 border rounded-lg"
                                                    rows={2}
                                                  />
                                                  <textarea
                                                    value={testCase.expectedOutput}
                                                    onChange={(e) => {
                                                      const newTestCases = [...lesson.exercise!.testCases];
                                                      newTestCases[testIndex] = { ...testCase, expectedOutput: e.target.value };
                                                      handleExerciseChange(moduleIndex, lessonIndex, 'testCases', newTestCases);
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
                                                      const newTestCases = [...lesson.exercise!.testCases];
                                                      newTestCases[testIndex] = { ...testCase, description: e.target.value };
                                                      handleExerciseChange(moduleIndex, lessonIndex, 'testCases', newTestCases);
                                                    }}
                                                    placeholder="Описание теста"
                                                    className="px-3 py-2 border rounded-lg"
                                                  />
                                                </div>
                                              ))}
                                            </div>

                                            {/* Секция подсказок */}
                                            <div className="space-y-4">
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium">Подсказки</span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddHint(moduleIndex, lessonIndex)}
                                                  className="text-blue-600 hover:text-blue-800"
                                                >
                                                  Добавить подсказку
                                                </button>
                                              </div>
                                              
                                              {lesson.exercise?.hints?.map((hint, hintIndex) => (
                                                <div key={hintIndex} className="flex items-start gap-2">
                                                  <div className="flex-grow">
                                                    <textarea
                                                      value={hint.text}
                                                      onChange={(e) => handleHintChange(moduleIndex, lessonIndex, hintIndex, e.target.value)}
                                                      placeholder={`Подсказка ${hintIndex + 1}`}
                                                      className="w-full px-3 py-2 border rounded-lg"
                                                      rows={2}
                                                    />
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteHint(moduleIndex, lessonIndex, hintIndex)}
                                                    className="text-red-600 hover:text-red-800 px-2"
                                                  >
                                                    Удалить
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingCourse ? 'Сохранить изменения' : 'Создать курс'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Нет доступных курсов. Создайте свой первый курс!
          </div>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow overflow-hidden">
              <img
                src={course.imageUrl || '/default-course-image.jpg'}
                alt={course.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-course-image.jpg';
                }}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-2">{course.description}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Автор: {course.createdBy?.name || 'Неизвестный автор'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {course.level === 'beginner' ? 'Начальный' : 
                     course.level === 'intermediate' ? 'Средний' : 'Продвинутый'}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {course.language}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    {course.duration}
                  </span>
                </div>
                {course.isOwner && (
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleEdit(course)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherCoursesPage; 