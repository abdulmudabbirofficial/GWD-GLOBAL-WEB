import { handler } from '@/server/http/handler';
import { AppError } from '@/server/lib/errors';

/** Unknown API routes answer in the API's JSON error format, not an HTML 404 page. */
const notFound = handler<{ path: string[] }>({}, async () => {
  throw new AppError('NOT_FOUND', 'No such endpoint. See /api/v1/health for status.');
});

export { notFound as GET, notFound as POST, notFound as PATCH, notFound as PUT, notFound as DELETE };
