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

  async getIncidents(): Promise<Incident[]> {
    const res = await apiClient.get<APIResponse<Incident[]>>('/incidents');
    return res.data.data;
  },

  async submitReport(report: UserReportCreate): Promise<Incident> {
    const res = await apiClient.post<APIResponse<Incident>>('/reports', report);
    return res.data.data;
  },
};
