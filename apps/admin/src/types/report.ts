export interface Report {
  id: string;
  name: string;
  description: string;
  type: "user-analytics" | "content-performance" | "project-status" | "financial" | "system-health" | "custom";
  category: "analytics" | "performance" | "business" | "technical" | "compliance";
  status: "active" | "inactive" | "scheduled";
  frequency: "real-time" | "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
  lastRun?: string;
  nextRun?: string;
  createdBy: string;
  createdByName: string;
  recipients: string[];
  format: "dashboard" | "pdf" | "excel" | "csv" | "json";
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportData {
  id: string;
  reportId: string;
  data: any;
  generatedAt: string;
  generatedBy: string;
  format: string;
  size: number;
  downloadUrl?: string;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType: "increase" | "decrease" | "neutral";
  unit: string;
  category: string;
  updatedAt: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface CreateReportData {
  name: string;
  description: string;
  type: "user-analytics" | "content-performance" | "project-status" | "financial" | "system-health" | "custom";
  category: "analytics" | "performance" | "business" | "technical" | "compliance";
  frequency: "real-time" | "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
  recipients: string[];
  format: "dashboard" | "pdf" | "excel" | "csv" | "json";
  parameters: Record<string, any>;
}

export interface ReportFilters {
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  frequency?: string;
  page?: number;
  limit?: number;
}
