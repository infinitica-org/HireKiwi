import { resolvePortalOriginsFromEnv } from '@hirekiwi/api-client';
import { NotFoundWall } from '@hirekiwi/ui';

const PORTAL_ORIGINS = resolvePortalOriginsFromEnv();

export default function NotFound() {
  return <NotFoundWall homeHref="/" portalOrigins={PORTAL_ORIGINS} />;
}
