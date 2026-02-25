import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
      accountType: 'DISTRICT' | 'HOMESCHOOL' | 'INDIVIDUAL';
      districtId: string;
      districtName: string;
      selectedAvatar: string;
      isHomeschoolParent: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    accountType: string;
    districtId: string;
    districtName: string;
    selectedAvatar: string;
    isHomeschoolParent: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    accountType: string;
    districtId: string;
    districtName: string;
    selectedAvatar: string;
    isHomeschoolParent: boolean;
  }
}
