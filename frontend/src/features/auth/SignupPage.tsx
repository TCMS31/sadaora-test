import { useSignupMutation } from '../../services/api';
import { AuthForm } from './AuthForm';

export default function SignupPage() {
  const [signup, { isLoading }] = useSignupMutation();
  return <AuthForm mode="signup" submit={signup} isLoading={isLoading} />;
}
