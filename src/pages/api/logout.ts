import type { APIRoute } from 'astro';
import { deleteSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get('session_token')?.value;
  if (token) {
    await deleteSession(token);
  }
  cookies.delete('session_token', { path: '/' });
  return redirect('/login');
};
