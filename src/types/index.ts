export type User = {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string;
  isActive: boolean;
  isEmailVerified: boolean;
  enrolledCourses?: {
    progress: number;
  };
  achievements?: any[];
  forumStats?: {
    replies: number;
  };
  createdAt: Date;
};

export interface Course {
  id: string;
  _id?: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  enrolled: number;
  modules: Module[];
  lessons?: number;
  progress?: number;
  isEnrolled?: boolean;
}

export interface Module {
  id: string;
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  _id?: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  order: number;
  completed?: boolean;
  exercise?: Exercise;
}

export type Hint = {
  text: string;
  order: number;
};

export interface Exercise {
  title: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  hints: Hint[];
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export type CourseDetails = {
  _id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  imageUrl: string;
  duration: string;
  enrolled: number;
  modules: {
    _id: string;
    title: string;
    description: string;
    order: number;
    lessons: {
      _id: string;
      title: string;
      description: string;
      content: string;
      duration: string;
      order: number;
      exercise?: {
        title: string;
        description: string;
        starterCode: string;
        testCases: {
          input: string;
          expectedOutput: string;
          description: string;
          isHidden?: boolean;
        }[];
        hints: string[];
        difficulty: 'easy' | 'medium' | 'hard';
      };
      completed?: boolean;
      completedBy?: string[];
    }[];
  }[];
  totalModules: number;
  totalLessons: number;
  progress?: number;
};

export interface ForumTopic {
  _id: string; 
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  tags: string[];
  views: number;
  replies: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export type ForumComment = {
  id: string;
  topicId: string;
  content: string;
  author: User;
  createdAt: string;
  likes: number;
  isAnswer?: boolean;
};
export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  isAnswer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
};

export interface Stats {
  coursesCompleted: number;
  achievementsCount: number;
  forumReplies: number;
  daysOnPlatform: number;
}