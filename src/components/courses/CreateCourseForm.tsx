import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../ui/Button';
import { Upload } from 'lucide-react';

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface Exercise {
  title: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Lesson {
  title: string;
  description: string;
  content: string;
  duration: string;
  order: number;
  exercise?: Exercise;
  completed?: boolean;
}

interface Module {
  title: string;
  description: string;
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
}

const CreateCourseForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    level: 'beginner',
    language: '',
    duration: '',
    modules: [],
    enrolled: 0
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!imageFile) {
        throw new Error('Пожалуйста, выберите изображение для курса');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);
      formDataToSend.append('courseData', JSON.stringify(formData));

      const response = await axios.post('/courses', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/courses/${response.data._id}`);
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Ошибка при создании курса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Изображение курса
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {imagePreview ? (
              <img
                src={imagePreview}
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
            <div 
              onClick={() => document.getElementById('course-image')?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Выбрать изображение
            </div>
            {imageFile && (
              <p className="mt-2 text-sm text-gray-600">
                Выбрано: {imageFile.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название курса
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Уровень сложности
        </label>
        <select
          name="level"
          value={formData.level}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="beginner">Начинающий</option>
          <option value="intermediate">Средний</option>
          <option value="advanced">Продвинутый</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Язык программирования
        </label>
        <input
          type="text"
          name="language"
          value={formData.language}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Продолжительность
        </label>
        <input
          type="text"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          required
          placeholder="Например: 2 недели"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Модули курса</h3>
        <div className="space-y-4">
          {formData.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium">Модуль {moduleIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => {
                    const newModules = [...formData.modules];
                    newModules.splice(moduleIndex, 1);
                    setFormData(prev => ({ ...prev, modules: newModules }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Удалить
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Название модуля"
                  value={module.title}
                  onChange={(e) => {
                    const newModules = [...formData.modules];
                    newModules[moduleIndex] = { ...module, title: e.target.value };
                    setFormData(prev => ({ ...prev, modules: newModules }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Описание модуля"
                  value={module.description}
                  onChange={(e) => {
                    const newModules = [...formData.modules];
                    newModules[moduleIndex] = { ...module, description: e.target.value };
                    setFormData(prev => ({ ...prev, modules: newModules }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
                <input
                  type="number"
                  placeholder="Порядковый номер"
                  value={module.order}
                  onChange={(e) => {
                    const newModules = [...formData.modules];
                    newModules[moduleIndex] = { ...module, order: parseInt(e.target.value) };
                    setFormData(prev => ({ ...prev, modules: newModules }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />

                {/* Lessons Section */}
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Уроки</h5>
                  <div className="space-y-4">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h6 className="text-sm font-medium">Урок {lessonIndex + 1}</h6>
                          <button
                            type="button"
                            onClick={() => {
                              const newModules = [...formData.modules];
                              newModules[moduleIndex].lessons.splice(lessonIndex, 1);
                              setFormData(prev => ({ ...prev, modules: newModules }));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Удалить
                          </button>
                        </div>

                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Название урока"
                            value={lesson.title}
                            onChange={(e) => {
                              const newModules = [...formData.modules];
                              newModules[moduleIndex].lessons[lessonIndex] = {
                                ...lesson,
                                title: e.target.value
                              };
                              setFormData(prev => ({ ...prev, modules: newModules }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />

                          <textarea
                            placeholder="Описание урока"
                            value={lesson.description}
                            onChange={(e) => {
                              const newModules = [...formData.modules];
                              newModules[moduleIndex].lessons[lessonIndex] = {
                                ...lesson,
                                description: e.target.value
                              };
                              setFormData(prev => ({ ...prev, modules: newModules }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={2}
                          />

                          <textarea
                            placeholder="Содержание урока"
                            value={lesson.content}
                            onChange={(e) => {
                              const newModules = [...formData.modules];
                              newModules[moduleIndex].lessons[lessonIndex] = {
                                ...lesson,
                                content: e.target.value
                              };
                              setFormData(prev => ({ ...prev, modules: newModules }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={4}
                          />

                          <div className="flex space-x-4">
                            <input
                              type="text"
                              placeholder="Продолжительность"
                              value={lesson.duration}
                              onChange={(e) => {
                                const newModules = [...formData.modules];
                                newModules[moduleIndex].lessons[lessonIndex] = {
                                  ...lesson,
                                  duration: e.target.value
                                };
                                setFormData(prev => ({ ...prev, modules: newModules }));
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            />

                            <input
                              type="number"
                              placeholder="Порядковый номер"
                              value={lesson.order}
                              onChange={(e) => {
                                const newModules = [...formData.modules];
                                newModules[moduleIndex].lessons[lessonIndex] = {
                                  ...lesson,
                                  order: parseInt(e.target.value)
                                };
                                setFormData(prev => ({ ...prev, modules: newModules }));
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          {/* Exercise Section */}
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="text-sm font-medium text-gray-700">Упражнение</h6>
                              {!lesson.exercise ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newModules = [...formData.modules];
                                    newModules[moduleIndex].lessons[lessonIndex] = {
                                      ...lesson,
                                      exercise: {
                                        title: '',
                                        description: '',
                                        starterCode: '',
                                        testCases: [],
                                        hints: [],
                                        difficulty: 'easy'
                                      }
                                    };
                                    setFormData(prev => ({ ...prev, modules: newModules }));
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Добавить упражнение
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newModules = [...formData.modules];
                                    newModules[moduleIndex].lessons[lessonIndex] = {
                                      ...lesson,
                                      exercise: undefined
                                    };
                                    setFormData(prev => ({ ...prev, modules: newModules }));
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Удалить упражнение
                                </button>
                              )}
                            </div>

                            {lesson.exercise && (
                              <div className="space-y-4">
                                <input
                                  type="text"
                                  placeholder="Название упражнения"
                                  value={lesson.exercise.title}
                                  onChange={(e) => {
                                    const newModules = [...formData.modules];
                                    newModules[moduleIndex].lessons[lessonIndex] = {
                                      ...lesson,
                                      exercise: {
                                        ...lesson.exercise!,
                                        title: e.target.value
                                      }
                                    };
                                    setFormData(prev => ({ ...prev, modules: newModules }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />

                                <textarea
                                  placeholder="Описание упражнения"
                                  value={lesson.exercise.description}
                                  onChange={(e) => {
                                    const newModules = [...formData.modules];
                                    newModules[moduleIndex].lessons[lessonIndex] = {
                                      ...lesson,
                                      exercise: {
                                        ...lesson.exercise!,
                                        description: e.target.value
                                      }
                                    };
                                    setFormData(prev => ({ ...prev, modules: newModules }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  rows={2}
                                />

                                <textarea
                                  placeholder="Начальный код"
                                  value={lesson.exercise.starterCode}
                                  onChange={(e) => {
                                    const newModules = [...formData.modules];
                                    newModules[moduleIndex].lessons[lessonIndex] = {
                                      ...lesson,
                                      exercise: {
                                        ...lesson.exercise!,
                                        starterCode: e.target.value
                                      }
                                    };
                                    setFormData(prev => ({ ...prev, modules: newModules }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                                  rows={4}
                                />

                                <select
                                  value={lesson.exercise.difficulty}
                                  onChange={(e) => {
                                    const newModules = [...formData.modules];
                                    newModules[moduleIndex].lessons[lessonIndex] = {
                                      ...lesson,
                                      exercise: {
                                        ...lesson.exercise!,
                                        difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                                      }
                                    };
                                    setFormData(prev => ({ ...prev, modules: newModules }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                  <option value="easy">Легкий</option>
                                  <option value="medium">Средний</option>
                                  <option value="hard">Сложный</option>
                                </select>

                                {/* Test Cases Section */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h6 className="text-sm font-medium text-gray-700">Тестовые случаи</h6>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newModules = [...formData.modules];
                                        newModules[moduleIndex].lessons[lessonIndex] = {
                                          ...lesson,
                                          exercise: {
                                            ...lesson.exercise!,
                                            testCases: [
                                              ...lesson.exercise.testCases,
                                              { input: '', expectedOutput: '', description: '' }
                                            ]
                                          }
                                        };
                                        setFormData(prev => ({ ...prev, modules: newModules }));
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      Добавить тест
                                    </button>
                                  </div>

                                  {lesson.exercise.testCases.map((testCase, testIndex) => (
                                    <div key={testIndex} className="border border-gray-200 rounded p-3 space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Тест {testIndex + 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newModules = [...formData.modules];
                                            newModules[moduleIndex].lessons[lessonIndex] = {
                                              ...lesson,
                                              exercise: {
                                                ...lesson.exercise!,
                                                testCases: lesson.exercise.testCases.filter((_, i) => i !== testIndex)
                                              }
                                            };
                                            setFormData(prev => ({ ...prev, modules: newModules }));
                                          }}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Удалить
                                        </button>
                                      </div>

                                      <input
                                        type="text"
                                        placeholder="Входные данные"
                                        value={testCase.input}
                                        onChange={(e) => {
                                          const newModules = [...formData.modules];
                                          newModules[moduleIndex].lessons[lessonIndex] = {
                                            ...lesson,
                                            exercise: {
                                              ...lesson.exercise!,
                                              testCases: lesson.exercise.testCases.map((tc, i) =>
                                                i === testIndex ? { ...tc, input: e.target.value } : tc
                                              )
                                            }
                                          };
                                          setFormData(prev => ({ ...prev, modules: newModules }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      />

                                      <input
                                        type="text"
                                        placeholder="Ожидаемый результат"
                                        value={testCase.expectedOutput}
                                        onChange={(e) => {
                                          const newModules = [...formData.modules];
                                          newModules[moduleIndex].lessons[lessonIndex] = {
                                            ...lesson,
                                            exercise: {
                                              ...lesson.exercise!,
                                              testCases: lesson.exercise.testCases.map((tc, i) =>
                                                i === testIndex ? { ...tc, expectedOutput: e.target.value } : tc
                                              )
                                            }
                                          };
                                          setFormData(prev => ({ ...prev, modules: newModules }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      />

                                      <input
                                        type="text"
                                        placeholder="Описание теста"
                                        value={testCase.description}
                                        onChange={(e) => {
                                          const newModules = [...formData.modules];
                                          newModules[moduleIndex].lessons[lessonIndex] = {
                                            ...lesson,
                                            exercise: {
                                              ...lesson.exercise!,
                                              testCases: lesson.exercise.testCases.map((tc, i) =>
                                                i === testIndex ? { ...tc, description: e.target.value } : tc
                                              )
                                            }
                                          };
                                          setFormData(prev => ({ ...prev, modules: newModules }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      />
                                    </div>
                                  ))}
                                </div>

                                {/* Hints Section */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h6 className="text-sm font-medium text-gray-700">Подсказки</h6>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newModules = [...formData.modules];
                                        newModules[moduleIndex].lessons[lessonIndex] = {
                                          ...lesson,
                                          exercise: {
                                            ...lesson.exercise!,
                                            hints: [...lesson.exercise.hints, '']
                                          }
                                        };
                                        setFormData(prev => ({ ...prev, modules: newModules }));
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      Добавить подсказку
                                    </button>
                                  </div>

                                  {lesson.exercise.hints.map((hint, hintIndex) => (
                                    <div key={hintIndex} className="flex space-x-2">
                                      <input
                                        type="text"
                                        placeholder={`Подсказка ${hintIndex + 1}`}
                                        value={hint}
                                        onChange={(e) => {
                                          const newModules = [...formData.modules];
                                          newModules[moduleIndex].lessons[lessonIndex] = {
                                            ...lesson,
                                            exercise: {
                                              ...lesson.exercise!,
                                              hints: lesson.exercise.hints.map((h, i) =>
                                                i === hintIndex ? e.target.value : h
                                              )
                                            }
                                          };
                                          setFormData(prev => ({ ...prev, modules: newModules }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newModules = [...formData.modules];
                                          newModules[moduleIndex].lessons[lessonIndex] = {
                                            ...lesson,
                                            exercise: {
                                              ...lesson.exercise!,
                                              hints: lesson.exercise.hints.filter((_, i) => i !== hintIndex)
                                            }
                                          };
                                          setFormData(prev => ({ ...prev, modules: newModules }));
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Удалить
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const newModules = [...formData.modules];
                        newModules[moduleIndex].lessons.push({
                          title: '',
                          description: '',
                          content: '',
                          duration: '',
                          order: module.lessons.length,
                          completed: false
                        });
                        setFormData(prev => ({ ...prev, modules: newModules }));
                      }}
                      className="w-full"
                    >
                      Добавить урок
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                modules: [...prev.modules, {
                  title: '',
                  description: '',
                  order: prev.modules.length,
                  lessons: []
                }]
              }));
            }}
            className="w-full"
          >
            Добавить модуль
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        size="lg"
        className="w-full mt-6"
      >
        {loading ? 'Создание...' : 'Создать курс'}
      </Button>
    </form>
  );
};

export default CreateCourseForm; 