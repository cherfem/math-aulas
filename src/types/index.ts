export type UserRole = 'admin' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  childName?: string; // only for parent role
  childAge?: string;  // only for parent role
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  studentName: string; // could be user or child
  date: string; // ISO string
  time: string; // HH:MM
  address: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'parent' | 'student';
  childName?: string;
  childAge?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  content: string;
  read: boolean;
  createdAt: string;
}
