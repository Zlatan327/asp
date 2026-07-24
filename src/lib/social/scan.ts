import { prisma } from '@/lib/db/prisma';

type SocialAccountRecord = {
  id: string;
  userId: string;
  platform: string;
  handle: string;
  profileUrl: string | null;
  accessToken: string | null;
  refreshToken?: string | null;
};

type SocialScanData = {
  platform: string;
  handle: string;
  profileUrl: string | null;
  scannedAt: string;
  ok: boolean;
  warnings: string[];
  profile?: Record<string, any>;
  metrics?: Record<string, any>;
  evidence?: Record<string, any>;
};

const GITHUB_API = 'https://api.github.com';
const TWITTER_API = 'https://api.twitter.com/2';

function normalizePlatform(platform: string) {
  return platform.toUpperCase();
}

async function fetchJson(url: string, token: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return data;
}

async function scanGitHub(account: SocialAccountRecord): Promise<SocialScanData> {
  const warnings: string[] = [];
  if (!account.accessToken) {
    return {
      platform: 'GITHUB',
      handle: account.handle,
      profileUrl: account.profileUrl,
      scannedAt: new Date().toISOString(),
      ok: false,
      warnings: ['GitHub access token is missing. Reconnect GitHub to enable repository verification.'],
    };
  }

  const user = await fetchJson(`${GITHUB_API}/user`, account.accessToken);
  const repos = await fetchJson(
    `${GITHUB_API}/user/repos?per_page=50&sort=updated&affiliation=owner,collaborator,organization_member`,
    account.accessToken,
  );

  const repoSummaries = Array.isArray(repos)
    ? repos.slice(0, 25).map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language,
        topics: repo.topics || [],
        pushedAt: repo.pushed_at,
      }))
    : [];

  const languageTotals: Record<string, number> = {};
  await Promise.all(
    repoSummaries.slice(0, 10).map(async (repo) => {
      try {
        const langs = await fetchJson(`${GITHUB_API}/repos/${repo.fullName}/languages`, account.accessToken!);
        for (const [language, bytes] of Object.entries(langs || {})) {
          languageTotals[language] = (languageTotals[language] || 0) + Number(bytes || 0);
        }
      } catch (error) {
        warnings.push(`Could not scan languages for ${repo.fullName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
  );

  const stars = repoSummaries.reduce((sum, repo) => sum + repo.stars, 0);
  const forks = repoSummaries.reduce((sum, repo) => sum + repo.forks, 0);

  return {
    platform: 'GITHUB',
    handle: user.login || account.handle,
    profileUrl: user.html_url || account.profileUrl,
    scannedAt: new Date().toISOString(),
    ok: true,
    warnings,
    profile: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      company: user.company,
      location: user.location,
      followers: user.followers,
      publicRepos: user.public_repos,
      profileUrl: user.html_url,
    },
    metrics: {
      repos: Array.isArray(repos) ? repos.length : 0,
      sampledRepos: repoSummaries.length,
      stars,
      forks,
      languages: languageTotals,
      contributions: 0,
    },
    evidence: {
      repositories: repoSummaries,
      languages: languageTotals,
    },
  };
}

async function scanTwitter(account: SocialAccountRecord): Promise<SocialScanData> {
  const warnings: string[] = [];
  if (!account.accessToken) {
    return {
      platform: 'TWITTER',
      handle: account.handle,
      profileUrl: account.profileUrl,
      scannedAt: new Date().toISOString(),
      ok: false,
      warnings: ['X/Twitter access token is missing. Reconnect X to enable social verification.'],
    };
  }

  const userResponse = await fetchJson(
    `${TWITTER_API}/users/me?user.fields=description,public_metrics,verified,verified_type,created_at,url,username,name`,
    account.accessToken,
  );
  const user = userResponse?.data || {};

  let tweets: any[] = [];
  if (user.id) {
    try {
      const timeline = await fetchJson(
        `${TWITTER_API}/users/${user.id}/tweets?max_results=20&tweet.fields=created_at,public_metrics,context_annotations,entities`,
        account.accessToken,
      );
      tweets = Array.isArray(timeline?.data) ? timeline.data : [];
    } catch (error) {
      warnings.push(`Could not scan recent tweets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const techSignals = Array.from(
    new Set(
      tweets
        .flatMap((tweet) => String(tweet.text || '').match(/#?[A-Za-z][A-Za-z0-9.+#-]{2,}/g) || [])
        .filter((word) => /react|next|node|solidity|web3|ai|typescript|javascript|python|design|dao|defi|okx|x layer/i.test(word))
        .map((word) => word.replace(/^#/, '')),
    ),
  ).slice(0, 20);

  const engagementScore = tweets.reduce((sum, tweet) => {
    const metrics = tweet.public_metrics || {};
    return sum + Number(metrics.like_count || 0) + Number(metrics.retweet_count || 0) + Number(metrics.reply_count || 0);
  }, 0);

  return {
    platform: 'TWITTER',
    handle: user.username || account.handle,
    profileUrl: user.username ? `https://x.com/${user.username}` : account.profileUrl,
    scannedAt: new Date().toISOString(),
    ok: true,
    warnings,
    profile: {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.description,
      verified: user.verified,
      verifiedType: user.verified_type,
      publicMetrics: user.public_metrics,
      profileUrl: user.username ? `https://x.com/${user.username}` : account.profileUrl,
    },
    metrics: {
      tweets: tweets.length,
      techSignals,
      engagementScore,
      followers: user.public_metrics?.followers_count || 0,
    },
    evidence: {
      tweets: tweets.map((tweet) => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        metrics: tweet.public_metrics,
      })),
    },
  };
}

function scanUnsupported(account: SocialAccountRecord): SocialScanData {
  return {
    platform: normalizePlatform(account.platform),
    handle: account.handle,
    profileUrl: account.profileUrl,
    scannedAt: new Date().toISOString(),
    ok: false,
    warnings: [`${account.platform} scanning is not implemented yet.`],
  };
}

export async function scanSocialAccount(account: SocialAccountRecord): Promise<SocialScanData> {
  try {
    const platform = normalizePlatform(account.platform);
    if (platform === 'GITHUB') return await scanGitHub(account);
    if (platform === 'TWITTER' || platform === 'X') return await scanTwitter(account);
    return scanUnsupported(account);
  } catch (error) {
    return {
      platform: normalizePlatform(account.platform),
      handle: account.handle,
      profileUrl: account.profileUrl,
      scannedAt: new Date().toISOString(),
      ok: false,
      warnings: [error instanceof Error ? error.message : 'Social scan failed.'],
    };
  }
}

export async function scanAndPersistSocialAccounts(userId: string) {
  const accounts = await prisma.socialAccount.findMany({ where: { userId } });
  const scans = await Promise.all(accounts.map((account) => scanSocialAccount(account)));

  await Promise.all(
    scans.map((scan, index) =>
      prisma.socialAccount.update({
        where: { id: accounts[index].id },
        data: {
          handle: scan.handle || accounts[index].handle,
          profileUrl: scan.profileUrl || accounts[index].profileUrl,
          scanData: scan,
          lastScanned: new Date(scan.scannedAt),
          verified: scan.ok || accounts[index].verified,
        },
      }),
    ),
  );

  return scans;
}
