import './api/axios';  // Import axios configuration
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import ForumPage from './pages/ForumPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import TeacherRoute from './components/TeacherRoute';
import AdminNav from './components/AdminNav';
import TeacherNav from './components/TeacherNav';
import { AdminUsersPage } from './pages/AdminUsersPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminStatsPage from './pages/AdminStatsPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import TeacherCoursesPage from './pages/TeacherCoursesPage';
import TopicPage from './pages/TopicPage';
import CoursePage from './pages/CoursePage';
import LessonPage from './pages/LessonPage';
import MyCoursesPage from './pages/MyCoursesPage';
import MyForumTopicsPage from './pages/MyForumTopicsPage';
import { Toaster } from 'react-hot-toast';
import ActivityTracker from './components/dashboard/ActivityTracker';
import ScrollToTop from './components/utils/ScrollToTop';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Toaster position="top-right" />
          <Header />
          {isAuthenticated && <ActivityTracker />}
          <main className="flex-grow">
            <Routes>
              <Route path="/forum/:id" element={<TopicPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/my-courses" element={
                <ProtectedRoute>
                  <MyCoursesPage />
                </ProtectedRoute>
              } />
              <Route path="/my-forum-topics" element={
                <ProtectedRoute>
                  <MyForumTopicsPage />
                </ProtectedRoute>
              } />
              <Route path="/forum" element={<ForumPage />} />
              <Route 
                path="/courses/:courseId" 
                element={
                  <ProtectedRoute>
                    <CoursePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" 
                element={
                  <ProtectedRoute>
                    <LessonPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/achievements" 
                element={
                  <ProtectedRoute>
                    <AchievementsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <AccountSettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordForm />} />

              {/* Админ роуты */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <div className="flex flex-col">
                      <AdminNav />
                      <div className="container mx-auto px-4">
                        <Routes>
                          <Route index element={<Navigate to="/admin/users" replace />} />
                          <Route path="users" element={<AdminUsersPage />} />
                          <Route path="courses" element={<AdminCoursesPage />} />
                          <Route path="stats" element={<AdminStatsPage />} />
                        </Routes>
                      </div>
                    </div>
                  </AdminRoute>
                }
              />

              {/* Учительские роуты */}
              <Route
                path="/teacher/*"
                element={
                  <TeacherRoute>
                    <>
                      <TeacherNav />
                      <Routes>
                        <Route path="students" element={<TeacherStudentsPage />} />
                        <Route path="courses" element={<TeacherCoursesPage />} />
                      </Routes>
                    </>
                  </TeacherRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;