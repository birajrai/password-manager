import { findSession, touchSession } from './lib/auth';

export async function onRequest(context: any, next: any) {
  const token = context.cookies.get('session_token')?.value;

  if (token) {
    const session = await findSession(token);
    if (session) {
      context.locals.session = session;
      context.locals.userId = session.userId;
      await touchSession(token);
    } else {
      context.cookies.delete('session_token', { path: '/' });
      context.locals.session = null;
      context.locals.userId = null;
    }
  } else {
    context.locals.session = null;
    context.locals.userId = null;
  }

  const path = context.url.pathname;

  if (
    (path === '/login' || path === '/register' || path === '/') &&
    context.locals.session
  ) {
    return context.redirect('/vault');
  }

  if (
    path.startsWith('/vault') &&
    !context.locals.session
  ) {
    return context.redirect('/login');
  }

  return next();
}
