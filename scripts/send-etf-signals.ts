/**
 * ETF信号检测和邮件发送脚本
 * 用于GitHub Actions定时任务，每个工作日检测ETF买卖信号并发送邮件通知
 */

import * as nodemailer from 'nodemailer';

// ============================================
// 配置
// ============================================
const API_BASE_URL = 'https://ttfund.etf.xlap.top';
const SMTP_HOST = 'smtp.exmail.qq.com';
const SMTP_PORT = 465;
const SMTP_USER = 'cheman@xlap.top';
const SMTP_PASS = process.env.SMTP_PASSWORD || 'uiQJ2JMz5viJbMiB';

// GitHub 配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

// ETF列表
const ETF_LIST = [
  { fund_code: '588000', abbr: 'KC50ETF', name: '科创50ETF华夏' },
  { fund_code: '510050', abbr: 'SZ50ETF', name: '上证50ETF华夏' },
  { fund_code: '510300', abbr: 'HS300ETF', name: '沪深300ETF华泰柏瑞' },
  { fund_code: '159338', abbr: 'ZZA500ETFGT', name: '中证A500ETF国泰' },
  { fund_code: '159915', abbr: 'CYBETFYFD', name: '创业板ETF易方达' },
  { fund_code: '518880', abbr: 'HJETFHA', name: '黄金ETF华安' },
  { fund_code: '510880', abbr: 'HLETFHT', name: '红利ETF华泰柏瑞' },
  { fund_code: '516150', abbr: 'XTETFJS', name: '稀土ETF嘉实' },
  { fund_code: '512690', abbr: 'JETFPH', name: '酒ETF鹏华' },
];

// ============================================
// 类型定义
// ============================================
interface HistoryItem {
  x: number;
  y: number;
  unit: string;
  date: string;
}

interface TradeSignal {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  grid_level: number;
}

interface Subscriber {
  email: string;
  subscribedAt: string;
}

interface SubscribersData {
  subscribers: Subscriber[];
}

interface ETFSignalResult {
  fund_code: string;
  name: string;
  abbr: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  signals: TradeSignal[];
  hasSignal: boolean;
}

// ============================================
// 获取基金历史数据
// ============================================
async function fetchFundHistory(code: string): Promise<HistoryItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fund/history?code=${code}`);
    
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data as HistoryItem[];
  } catch (error) {
    console.error(`获取基金 ${code} 历史数据失败:`, error);
    throw error;
  }
}

// ============================================
// 计算网格交易信号
// ============================================
function calculateGridSignals(
  history: HistoryItem[],
  gridWidth: number = 0.05,
  gridCount: number = 10
): TradeSignal[] {
  if (history.length < 2) return [];

  const prices = history.map(h => h.y);
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];

  // 计算价格区间
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // 计算网格线
  const gridLines: number[] = [];
  for (let i = 0; i <= gridCount; i++) {
    gridLines.push(minPrice + (priceRange * i / gridCount));
  }

  // 判断当前价格所在的网格层级
  const getGridLevel = (price: number): number => {
    for (let i = 0; i < gridLines.length - 1; i++) {
      if (price >= gridLines[i] && price < gridLines[i + 1]) {
        return i;
      }
    }
    return gridLines.length - 1;
  };

  const currentGridLevel = getGridLevel(currentPrice);
  const previousGridLevel = getGridLevel(previousPrice);

  const signals: TradeSignal[] = [];

  // 检测网格穿越信号
  if (currentGridLevel < previousGridLevel) {
    // 价格下跌穿越网格线 -> 买入信号
    signals.push({
      date: history[history.length - 1].date,
      type: 'buy',
      price: currentPrice,
      grid_level: currentGridLevel,
    });
  } else if (currentGridLevel > previousGridLevel) {
    // 价格上涨穿越网格线 -> 卖出信号
    signals.push({
      date: history[history.length - 1].date,
      type: 'sell',
      price: currentPrice,
      grid_level: currentGridLevel,
    });
  }

  return signals;
}

// ============================================
// 检测所有ETF信号
// ============================================
async function detectETFSignals(): Promise<ETFSignalResult[]> {
  const results: ETFSignalResult[] = [];

  for (const etf of ETF_LIST) {
    try {
      console.log(`正在检测 ${etf.name} (${etf.fund_code})...`);
      
      const history = await fetchFundHistory(etf.fund_code);
      
      if (history.length < 2) {
        console.log(`  数据不足，跳过`);
        continue;
      }

      const currentPrice = history[history.length - 1].y;
      const previousPrice = history[history.length - 2].y;
      const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

      const signals = calculateGridSignals(history);

      results.push({
        fund_code: etf.fund_code,
        name: etf.name,
        abbr: etf.abbr,
        currentPrice,
        previousPrice,
        changePercent,
        signals,
        hasSignal: signals.length > 0,
      });

      console.log(`  当前价格: ${currentPrice.toFixed(3)}, 涨跌: ${changePercent.toFixed(2)}%, 信号: ${signals.length > 0 ? signals[0].type : '无'}`);
    } catch (error) {
      console.error(`检测 ${etf.name} 失败:`, error);
    }
  }

  return results;
}

// ============================================
// 从 GitHub 获取订阅者列表
// ============================================
async function getSubscribers(): Promise<string[]> {
  // 如果 GitHub 配置存在，从 GitHub API 获取
  if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/subscribers.json`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        console.log('GitHub API 获取订阅者失败:', response.status);
        return [];
      }

      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const data: SubscribersData = JSON.parse(content);
      
      console.log(`从 GitHub 获取订阅者: ${data.subscribers.length} 个`);
      return data.subscribers.map(s => s.email);
    } catch (error) {
      console.error('从 GitHub 获取订阅者失败:', error);
      return [];
    }
  }

  // 否则返回空数组（GitHub Actions 环境应该有配置）
  console.log('GitHub 配置不完整，无法获取订阅者');
  return [];
}

// ============================================
// 生成邮件内容
// ============================================
function generateEmailContent(signals: ETFSignalResult[]): { subject: string; html: string } {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const signalsWithAlert = signals.filter(s => s.hasSignal);
  const signalsWithoutAlert = signals.filter(s => !s.hasSignal);

  // 生成信号表格
  const signalTable = signalsWithAlert.length > 0
    ? signalsWithAlert.map(s => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 8px; font-weight: 500;">${s.name}</td>
          <td style="padding: 12px 8px;">${s.fund_code}</td>
          <td style="padding: 12px 8px; text-align: right;">${s.currentPrice.toFixed(3)}</td>
          <td style="padding: 12px 8px; text-align: right; color: ${s.changePercent >= 0 ? '#22c55e' : '#ef4444'};">
            ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%
          </td>
          <td style="padding: 12px 8px; text-align: center;">
            <span style="padding: 4px 12px; border-radius: 4px; font-weight: 500;
              background-color: ${s.signals[0]?.type === 'buy' ? '#dcfce7' : '#fee2e2'};
              color: ${s.signals[0]?.type === 'buy' ? '#16a34a' : '#dc2626'};">
              ${s.signals[0]?.type === 'buy' ? '买入' : '卖出'}
            </span>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #666;">今日无买卖信号</td></tr>';

  // 生成其他ETF概览
  const otherETFs = signalsWithoutAlert.length > 0
    ? signalsWithoutAlert.map(s => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 8px;">${s.name}</td>
          <td style="padding: 10px 8px; text-align: right;">${s.currentPrice.toFixed(3)}</td>
          <td style="padding: 10px 8px; text-align: right; color: ${s.changePercent >= 0 ? '#22c55e' : '#ef4444'};">
            ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%
          </td>
        </tr>
      `).join('')
    : '';

  const subject = signalsWithAlert.length > 0
    ? `【ETF信号提醒】${signalsWithAlert.length}个ETF有买卖信号 - ${today}`
    : `【ETF日报】今日无买卖信号 - ${today}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ETF信号日报</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📊 ETF信号日报</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">${today}</p>
      </div>
      
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 12px 12px;">
        ${signalsWithAlert.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #1f2937; margin: 0 0 15px; display: flex; align-items: center;">
              <span style="background: #fef3c7; padding: 4px 8px; border-radius: 4px; margin-right: 8px;">🔔</span>
              今日买卖信号
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">名称</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">代码</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600;">现价</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600;">涨跌</th>
                  <th style="padding: 12px 8px; text-align: center; font-weight: 600;">信号</th>
                </tr>
              </thead>
              <tbody>
                ${signalTable}
              </tbody>
            </table>
          </div>
        ` : `
          <div style="text-align: center; padding: 30px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #6b7280; margin: 0;">✅ 今日无买卖信号</p>
            <p style="font-size: 14px; color: #9ca3af; margin: 8px 0 0;">市场波动平稳，暂无操作建议</p>
          </div>
        `}
        
        ${signalsWithoutAlert.length > 0 ? `
          <div style="margin-top: 20px;">
            <h3 style="font-size: 16px; color: #6b7280; margin: 0 0 10px;">其他ETF行情</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <th style="padding: 10px 8px; text-align: left; font-weight: 500;">名称</th>
                  <th style="padding: 10px 8px; text-align: right; font-weight: 500;">现价</th>
                  <th style="padding: 10px 8px; text-align: right; font-weight: 500;">涨跌</th>
                </tr>
              </thead>
              <tbody>
                ${otherETFs}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
          <p style="margin: 0;">此邮件由系统自动发送，请勿回复</p>
          <p style="margin: 5px 0 0;">
            <a href="https://etf.autos" style="color: #667eea; text-decoration: none;">ETF Autos</a> · 
            <a href="https://etf.autos/guestbook" style="color: #667eea; text-decoration: none;">取消订阅</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// ============================================
// 发送邮件
// ============================================
async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (to.length === 0) {
    console.log('没有订阅者，跳过发送');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true, // SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"ETF Autos" <${SMTP_USER}>`,
      to: to.join(', '),
      subject,
      html,
    });

    console.log('邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log('========================================');
  console.log('ETF信号检测开始');
  console.log('时间:', new Date().toISOString());
  console.log('========================================');

  // 检测ETF信号
  const signals = await detectETFSignals();
  console.log(`\n检测完成，共 ${signals.length} 个ETF`);

  const signalsWithAlert = signals.filter(s => s.hasSignal);
  console.log(`有信号的ETF: ${signalsWithAlert.length} 个`);

  // 读取订阅者
  const subscribers = await getSubscribers();
  console.log(`订阅者数量: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log('没有订阅者，退出');
    return;
  }

  // 生成邮件内容
  const { subject, html } = generateEmailContent(signals);

  // 发送邮件
  console.log('\n开始发送邮件...');
  const success = await sendEmail(subscribers, subject, html);

  if (success) {
    console.log('邮件发送完成');
  } else {
    console.log('邮件发送失败');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('ETF信号检测完成');
  console.log('========================================');
}

// 执行主函数
main().catch((error) => {
  console.error('执行失败:', error);
  process.exit(1);
});