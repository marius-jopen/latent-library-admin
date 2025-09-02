import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  const isAdmin = cookies().get('admin')?.value === '1';
  redirect(isAdmin ? '/admin' : '/login');
}
