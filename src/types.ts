export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}
