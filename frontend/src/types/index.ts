// ─── User Types ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_uploads: number;
  total_recognitions: number;
}

export type UserRole = 'admin' | 'researcher' | 'user';

// ─── Auth Types ────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Image Types ───────────────────────────────────────────────────────────────
export interface ImageRecord {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  width: number;
  height: number;
  status: ImageStatus;
  upload_date: string;
  thumbnail_path?: string;
  metadata?: ImageMetadata;
}

export type ImageStatus = 'uploaded' | 'processing' | 'enhanced' | 'analyzed' | 'failed';

export interface ImageMetadata {
  format: string;
  mode: string;
  size_bytes: number;
  width: number;
  height: number;
  dpi?: [number, number];
  bit_depth?: number;
  channels: number;
  mean_brightness: number;
  std_deviation: number;
  histogram?: number[];
}

// ─── Enhancement Types ─────────────────────────────────────────────────────────
export interface EnhancementParams {
  brightness: number;
  contrast: number;
  sharpness: number;
  blur_type: 'none' | 'gaussian' | 'median' | 'bilateral';
  blur_radius: number;
  equalize_histogram: boolean;
  normalize: boolean;
  denoise: boolean;
  grayscale: boolean;
  edge_enhance: boolean;
  rotation: number;
  flip_horizontal: boolean;
  flip_vertical: boolean;
}

export interface EnhancementResult {
  id: string;
  image_id: string;
  enhanced_path: string;
  thumbnail_path: string;
  processing_time_ms: number;
  params: EnhancementParams;
  before_stats: ImageStats;
  after_stats: ImageStats;
  created_at: string;
}

export interface ImageStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  entropy: number;
}

// ─── Harris Corner Types ───────────────────────────────────────────────────────
export interface HarrisParams {
  block_size: number;
  ksize: number;
  k: number;
  threshold: number;
}

export interface HarrisResult {
  id: string;
  image_id: string;
  corner_image_path: string;
  heatmap_path: string;
  corner_count: number;
  corner_coordinates: [number, number][];
  processing_time_ms: number;
  params: HarrisParams;
  created_at: string;
}

// ─── SIFT Types ────────────────────────────────────────────────────────────────
export interface SIFTParams {
  n_features: number;
  n_octave_layers: number;
  contrast_threshold: number;
  edge_threshold: number;
  sigma: number;
}

export interface SIFTResult {
  id: string;
  image_id: string;
  keypoint_image_path: string;
  keypoint_count: number;
  descriptor_shape: [number, number];
  processing_time_ms: number;
  params: SIFTParams;
  keypoints: Keypoint[];
  created_at: string;
}

export interface Keypoint {
  x: number;
  y: number;
  size: number;
  angle: number;
  response: number;
  octave: number;
}

export interface SIFTMatchResult {
  id: string;
  image1_id: string;
  image2_id: string;
  match_image_path: string;
  total_matches: number;
  good_matches: number;
  similarity_score: number;
  processing_time_ms: number;
  created_at: string;
}

// ─── PCA Types ─────────────────────────────────────────────────────────────────
export interface PCAParams {
  n_components: number;
  whiten: boolean;
}

export interface PCAResult {
  id: string;
  image_id: string;
  n_components: number;
  explained_variance_ratio: number[];
  cumulative_variance: number[];
  original_dims: number;
  reduced_dims: number;
  compression_ratio: number;
  processing_time_ms: number;
  created_at: string;
}

// ─── Recognition Types ─────────────────────────────────────────────────────────
export interface RecognitionResult {
  id: string;
  image_id: string;
  user_id: string;
  predicted_class: string;
  confidence_score: number;
  all_predictions: Prediction[];
  top_k_predictions: Prediction[];
  processing_pipeline: PipelineStep[];
  total_processing_time_ms: number;
  enhancement_result_id?: string;
  harris_result_id?: string;
  sift_result_id?: string;
  pca_result_id?: string;
  created_at: string;
  image?: ImageRecord;
}

export interface Prediction {
  class_name: string;
  confidence: number;
  rank: number;
}

export interface PipelineStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration_ms?: number;
  result?: string;
}

// ─── Analytics Types ───────────────────────────────────────────────────────────
export interface DashboardStats {
  total_images: number;
  total_recognitions: number;
  avg_accuracy: number;
  avg_processing_time_ms: number;
  images_today: number;
  recognitions_today: number;
  success_rate: number;
  active_users: number;
}

export interface RecognitionTrend {
  date: string;
  count: number;
  avg_confidence: number;
}

export interface ObjectDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'upload' | 'recognition' | 'report' | 'login' | 'export';
  description: string;
  user: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

// ─── Report Types ──────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  user_id: string;
  title: string;
  type: 'recognition' | 'enhancement' | 'analytics' | 'system';
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'generating' | 'ready' | 'failed';
  file_path?: string;
  created_at: string;
  expires_at?: string;
}

// ─── Notification Types ────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  link?: string;
}

// ─── Object Category Types ─────────────────────────────────────────────────────
export interface ObjectCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parent_id?: string;
  image_count: number;
  is_active: boolean;
  created_at: string;
}

// ─── Activity Log Types ────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  user_id: string;
  user?: User;
  action: string;
  resource: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  created_at: string;
}

// ─── System Settings Types ─────────────────────────────────────────────────────
export interface SystemSettings {
  max_upload_size_mb: number;
  allowed_image_types: string[];
  max_images_per_user: number;
  default_enhancement_params: EnhancementParams;
  enable_rate_limiting: boolean;
  rate_limit_requests: number;
  rate_limit_window_minutes: number;
  enable_notifications: boolean;
  maintenance_mode: boolean;
  app_name: string;
  app_description: string;
  contact_email: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ─── UI State Types ────────────────────────────────────────────────────────────
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface UploadState {
  files: File[];
  previews: string[];
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface PipelineProgress {
  currentStep: number;
  totalSteps: number;
  steps: PipelineStep[];
  isRunning: boolean;
  isComplete: boolean;
  hasError: boolean;
}

// ─── Filter & Sort Types ───────────────────────────────────────────────────────
export interface FilterParams {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  user_id?: string;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface QueryParams extends FilterParams, SortParams, PaginationParams {}

// ─── Chart Data Types ──────────────────────────────────────────────────────────
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  date: string;
  uploads: number;
  recognitions: number;
  accuracy: number;
}

// ─── Admin Types ───────────────────────────────────────────────────────────────
export interface AdminStats extends DashboardStats {
  total_users: number;
  new_users_today: number;
  storage_used_gb: number;
  storage_limit_gb: number;
  api_calls_today: number;
  failed_api_calls: number;
}
