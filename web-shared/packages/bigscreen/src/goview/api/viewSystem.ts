import { post } from './http';

export interface ViewSystemUptimeResp {
  days?: number;
  hours?: number;
  startTime?: number | string;
  uptimeSeconds?: number;
}

export const getSystemUptime = () => post('/api/v1/view/system/uptime', {});
