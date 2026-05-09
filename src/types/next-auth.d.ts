import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'HOMESCHOOL_PARENT';
      accountType: string;
      districtId: string;
      districtName: string;
      selectedAvatar: string;
      isHomeschoolParent: boolean;
      gradeLevel: string;
      isMasterDemo: boolean;
      isDemo: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'HOMESCHOOL_PARENT';
    accountType: string;
    districtId: string;
    districtName: string;
    selectedAvatar: string;
    isHomeschoolParent: boolean;
    gradeLevel: string;
    isMasterDemo: boolean;
    // isDemo is computed in the jwt callback from the email, not set on the initial User
    isDemo?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'HOMESCHOOL_PARENT';
    accountType: string;
    districtId: string;
    districtName: string;
    selectedAvatar: string;
    isHomeschoolParent: boolean;
    gradeLevel: string;
    isMasterDemo: boolean;
    isDemo: boolean;
  }
}
