import { useLoginMutation } from '../../services/api';
import { AuthForm } from './AuthForm';

export default function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  return <AuthForm mode="login" submit={login} isLoading={isLoading} />;
}
