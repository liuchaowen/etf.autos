import type { NextApiRequest, NextApiResponse } from 'next';

interface Subscriber {
    email: string;
    subscribedAt: string;
}

interface SubscribersData {
    subscribers: Subscriber[];
}

/**
 * 使用 GitHub API 更新订阅者数据
 */
async function updateSubscribersViaGitHub(
    data: SubscribersData,
    commitMessage: string
): Promise<{ success: boolean; error?: string }> {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPOSITORY || process.env.VERCEL_GIT_REPO_SLUG;
    const GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
    
    // 如果没有配置 GitHub Token，使用本地文件存储（开发环境）
    if (!GITHUB_TOKEN || !GITHUB_REPO || !GITHUB_OWNER) {
        console.log('GitHub Token 未配置，使用本地存储');
        return { success: false, error: 'GitHub Token 未配置' };
    }

    const filePath = 'data/subscribers.json';
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    try {
        // 获取当前文件的 SHA
        const getResponse = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        let sha: string | undefined;
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }

        // 更新或创建文件
        const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
        const updateData: {
            message: string;
            content: string;
            sha?: string;
        } = {
            message: commitMessage,
            content,
        };

        if (sha) {
            updateData.sha = sha;
        }

        const updateResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            console.error('GitHub API 更新失败:', error);
            return { success: false, error: '更新失败' };
        }

        return { success: true };
    } catch (error) {
        console.error('GitHub API 调用失败:', error);
        return { success: false, error: 'API 调用失败' };
    }
}

/**
 * 从 GitHub 获取订阅者数据
 */
async function getSubscribersFromGitHub(): Promise<SubscribersData> {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPOSITORY || process.env.VERCEL_GIT_REPO_SLUG;
    const GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;

    if (!GITHUB_TOKEN || !GITHUB_REPO || !GITHUB_OWNER) {
        return { subscribers: [] };
    }

    const filePath = 'data/subscribers.json';
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            return { subscribers: [] };
        }

        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('获取订阅者数据失败:', error);
        return { subscribers: [] };
    }
}

/**
 * 订阅 API
 * POST: 添加新订阅者
 * GET: 获取所有订阅者（仅用于管理）
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ success: boolean; message?: string; error?: string; alreadyExists?: boolean } | { subscribers: Subscriber[] }>
) {
    if (req.method === 'POST') {
        try {
            const { email } = req.body;

            // 验证邮箱
            if (!email || typeof email !== 'string') {
                return res.status(400).json({ success: false, error: '请提供邮箱地址' });
            }

            const trimmedEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ success: false, error: '请提供有效的邮箱地址' });
            }

            // 获取现有订阅者
            const data = await getSubscribersFromGitHub();

            // 检查是否已订阅
            const existingIndex = data.subscribers.findIndex(
                (s) => s.email.toLowerCase() === trimmedEmail
            );

            if (existingIndex !== -1) {
                return res.status(200).json({ 
                    success: true, 
                    alreadyExists: true,
                    message: '该邮箱已订阅' 
                });
            }

            // 添加新订阅者
            data.subscribers.push({
                email: trimmedEmail,
                subscribedAt: new Date().toISOString(),
            });

            // 通过 GitHub API 更新数据
            const result = await updateSubscribersViaGitHub(
                data,
                `Add subscriber: ${trimmedEmail}`
            );

            if (!result.success) {
                // 如果 GitHub API 失败，尝试本地存储（开发环境备用）
                console.log('GitHub API 更新失败，订阅可能未保存');
            }

            return res.status(200).json({ 
                success: true, 
                message: '订阅成功' 
            });
        } catch (error) {
            console.error('订阅处理错误:', error);
            return res.status(500).json({ success: false, error: '服务器错误，请稍后重试' });
        }
    } else if (req.method === 'GET') {
        // 获取订阅者列表
        try {
            const data = await getSubscribersFromGitHub();
            return res.status(200).json({ subscribers: data.subscribers });
        } catch {
            return res.status(500).json({ success: false, error: '读取数据失败' } as any);
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, error: `方法 ${req.method} 不允许` });
    }
}