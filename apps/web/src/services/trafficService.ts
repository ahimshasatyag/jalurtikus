import { apiClient } from './api';
import type {
  APIResponse,
  TrafficSnapshot,
  TrafficSegment,
  Incident,
  UserReportCreate,
} from '../types';

export const trafficService = {
  async getCurrentTraffic(): Promise<TrafficSnapshot> {
    const res = await apiClient.get<APIResponse<TrafficSnapshot>>('/traffic/current');
    return res.data.data;
  },

  async getEdgeTraffic(edgeId: string): Promise<TrafficSegment> {
    const res = await apiClient.get<APIResponse<TrafficSegment>>(`/traffic/segments/${edgeId}`);
    return res.data.data;
  },

  async getIncidents(bbox?: string, key?: string): Promise<Incident[]> {
    const params: Record<string, string> = {};
    if (bbox) params.bbox = bbox;
    if (key) params.key = key;
    const res = await apiClient.get<APIResponse<Incident[]>>('/incidents', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return res.data.data;
  },

  async submitReport(report: UserReportCreate): Promise<Incident> {
    const res = await apiClient.post<APIResponse<Incident>>('/reports', report);
    return res.data.data;
  },

  async saveConfig(apiKey: string, bbox?: string): Promise<any> {
    const res = await apiClient.post<APIResponse<any>>('/traffic/config', {
      api_key: apiKey,
      bbox,
    });
    return res.data.data;
  },
};
