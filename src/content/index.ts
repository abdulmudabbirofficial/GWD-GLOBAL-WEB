/**
 * The canonical, version-controlled GWD content snapshot.
 *
 * - `npm run db:seed` writes it into Postgres.
 * - With CONTENT_SOURCE=snapshot the site serves it directly (no database),
 *   which keeps previews and CI builds independent of infrastructure.
 */
export { company, stats, recognitions } from './company';
export { services } from './services';
export { products } from './products';
export { team } from './team';
export { organizations } from './organizations';
export { locations } from './locations';
export { highlights } from './highlights';
export { ecosystemEntities, ecosystemLinks } from './ecosystem';
