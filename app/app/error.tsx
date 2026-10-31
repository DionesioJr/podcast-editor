import { useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorScreen } from '@src/components/ui';

export default function ErrorRoute() {
  const { code, title } = useLocalSearchParams<{
    code?: string;
    title?: string;
  }>();
  const router = useRouter();

  return (
    <ErrorScreen
      code={code ?? 'SERVER_ERROR'}
      title={title}
      onAction={() => router.back()}
    />
  );
}
