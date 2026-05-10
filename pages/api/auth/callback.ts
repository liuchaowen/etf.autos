/**
 * GitHub OAuth 回调 API
 * 处理 code 换取 access_token
 */

import { NextApiRequest, NextApiResponse } from 'next';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GitHub OAuth credentials not configured' });
  }

  try {
    // 向 GitHub 请求 access_token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        state,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ 
        error: data.error,
        error_description: data.error_description 
      });
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub API error: ${userResponse.status}`);
    }

    const user = await userResponse.json();

    // 返回 token 和用户信息
    return res.status(200).json({
      access_token: data.access_token,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
      },
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}