import { useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorScreen } from '@src/components/ui';
import { ErrorActionType } from '@src/i18n/error-actions';

export default function ErrorRoute() {
  const { code, title } = useLocalSearchParams<{
    code?: string;
    title?: string;
  }>();
  const router = useRouter();

  function handleAction(type: ErrorActionType) {
    if (type === 'new_project') {
      router.replace('/');
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  return (
    <ErrorScreen
      code={code ?? 'SERVER_ERROR'}
      title={title}
      onAction={handleAction}
    />
  );
}
