import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
      districtId: string;
      districtName: string;
      selectedAvatar: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    districtId: string;
    districtName: string;
    selectedAvatar: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    districtId: string;
    districtName: string;
    selectedAvatar: string;
  }
}
