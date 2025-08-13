import * as Linking from 'expo-linking';
import { ParsedScan } from '@/lib/types';

// Supported formats (MVP):
// punchme://add?establishmentId=abc&name=Coffee%20Shop&goal=10&reward=Free%20Drink&walletPassUrl=https://...
// punchme://punch?establishmentId=abc&token=xyz
export function parseScanData(data: string): ParsedScan {
  try {
    const url = new URL(data);
    if (url.protocol === 'punchme:' || url.protocol === 'punchme://') {
      const path = url.hostname || url.pathname.replace(/^\/?/, '');
      const params = new URLSearchParams(url.search);
      if (path === 'add') {
        return {
          type: 'add',
          establishmentId: params.get('establishmentId') || '',
          name: params.get('name') || 'Loyalty',
          goal: params.get('goal') ? Number(params.get('goal')) : undefined,
          reward: params.get('reward') || undefined,
          walletPassUrl: params.get('walletPassUrl') || undefined,
        };
      }
      if (path === 'punch') {
        return {
          type: 'punch',
          establishmentId: params.get('establishmentId') || '',
          token: params.get('token') || undefined,
        };
      }
    }
    // Also accept https://... links with path /punchme/add or /punchme/punch
    const parsed = Linking.parse(data);
    if (parsed.path?.startsWith('punchme/')) {
      const [, action] = parsed.path.split('/');
      const q = parsed.queryParams || {};
      if (action === 'add') {
        return {
          type: 'add',
          establishmentId: String(q.establishmentId || ''),
          name: String(q.name || 'Loyalty'),
          goal: q.goal ? Number(q.goal) : undefined,
          reward: q.reward ? String(q.reward) : undefined,
          walletPassUrl: q.walletPassUrl ? String(q.walletPassUrl) : undefined,
        };
      }
      if (action === 'punch') {
        return {
          type: 'punch',
          establishmentId: String(q.establishmentId || ''),
          token: q.token ? String(q.token) : undefined,
        };
      }
    }
  } catch {
    // ignore
  }
  return { type: 'unknown', raw: data };
}
