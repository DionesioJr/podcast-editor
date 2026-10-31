import { useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorScreen } from '@src/components/ui';
import { ErrorActionType } from '@src/i18n/error-actions';

const HOME_ROUTE = '/';
const BACK_FALLBACK = Symbol('back');

type ErrorActionDestination = string | typeof BACK_FALLBACK;

function projectRoute(suffix = '') {
  return (projectId?: string): ErrorActionDestination =>
    projectId ? `/p/${projectId}${suffix}` : BACK_FALLBACK;
}

const ERROR_ACTION_ROUTES: Record<
  ErrorActionType,
  (projectId?: string) => ErrorActionDestination
> = {
  choose_file: () => BACK_FALLBACK,
  wait: () => BACK_FALLBACK,
  retry: () => BACK_FALLBACK,
  continue: () => BACK_FALLBACK,
  discard: () => BACK_FALLBACK,
  retry_later: () => BACK_FALLBACK,
  continue_manually: () => BACK_FALLBACK,
  rewrite: () => BACK_FALLBACK,
  adjust: projectRoute(),
  go_to_review: projectRoute('/review'),
  select_format: projectRoute('/export'),
  download: projectRoute('/export'),
  new_project: () => HOME_ROUTE,
};

export default function ErrorRoute() {
  const { code, title, projectId } = useLocalSearchParams<{
    code?: string;
    title?: string;
    projectId?: string;
  }>();
  const router = useRouter();

  function handleAction(type: ErrorActionType) {
    const destination = ERROR_ACTION_ROUTES[type](projectId);

    if (destination !== BACK_FALLBACK) {
      router.replace(destination);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(HOME_ROUTE);
  }

  return (
    <ErrorScreen
      code={code ?? 'SERVER_ERROR'}
      title={title}
      onAction={handleAction}
    />
  );
}
