import LoginClient, { type EnabledSocialProvider } from '@/components/LoginClient';

const socialLoginEnabled = process.env.ENABLE_SOCIAL_LOGIN === 'true';

function hasCredentials(idName: string, secretName: string) {
  return Boolean(process.env[idName] && process.env[secretName]);
}

export default function LoginPage() {
  const enabledSocialProviders: EnabledSocialProvider[] = [];

  if (socialLoginEnabled && hasCredentials('GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET')) {
    enabledSocialProviders.push('github');
  }

  if (socialLoginEnabled && hasCredentials('TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET')) {
    enabledSocialProviders.push('twitter');
  }

  if (socialLoginEnabled && hasCredentials('DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET')) {
    enabledSocialProviders.push('discord');
  }

  return <LoginClient enabledSocialProviders={enabledSocialProviders} />;
}
