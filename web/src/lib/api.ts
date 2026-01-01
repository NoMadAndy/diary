/**
 * SmartDiary PWA - API Service
 * Entspricht dem APIService aus der iOS App
 */

import type {
  AuthResponse,
  User,
  Entry,
  CreateEntryRequest,
  UpdateEntryRequest,
  Track,
  CreateTrackRequest,
  Media,
  PaginatedResponse,
  ChangelogResponse,
  GuidePOIResponse,
  AISummaryResponse,
} from './types'

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class APIService {
  private baseUrl: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl
    // Load tokens from localStorage on init
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
      this.refreshToken = localStorage.getItem('refreshToken')
    }
  }

  // Update base URL
  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Get current tokens
  getTokens() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    }
  }

  // Clear auth state
  logout() {
    this.accessToken = null
    this.refreshToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  // MARK: - Auth

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/api/v1/auth/login', {
      email,
      password,
    })
    this.setTokens(response.access_token, response.refresh_token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  }

  async register(email: string, password: string, fullName?: string): Promise<User> {
    return this.post<User>('/api/v1/auth/register', {
      email,
      password,
      full_name: fullName,
    })
  }

  async refreshTokens(): Promise<void> {
    if (!this.refreshToken) {
      throw new APIError('No refresh token available', 401, 'UNAUTHORIZED')
    }
    const response = await this.post<AuthResponse>('/api/v1/auth/refresh', {
      refresh_token: this.refreshToken,
    })
    this.setTokens(response.access_token, response.refresh_token)
  }

  async getMe(): Promise<User> {
    return this.get<User>('/api/v1/auth/me')
  }

  // MARK: - Entries

  async getEntries(page = 1, pageSize = 20): Promise<PaginatedResponse<Entry>> {
    return this.get<PaginatedResponse<Entry>>(
      `/api/v1/entries?page=${page}&page_size=${pageSize}`
    )
  }

  async getEntry(id: number): Promise<Entry> {
    return this.get<Entry>(`/api/v1/entries/${id}`)
  }

  async createEntry(entry: CreateEntryRequest): Promise<Entry> {
    return this.post<Entry>('/api/v1/entries', entry)
  }

  async updateEntry(id: number, update: UpdateEntryRequest): Promise<Entry> {
    return this.put<Entry>(`/api/v1/entries/${id}`, update)
  }

  async deleteEntry(id: number): Promise<void> {
    await this.delete(`/api/v1/entries/${id}`)
  }

  // MARK: - Tracks

  async getTracks(page = 1, pageSize = 20): Promise<PaginatedResponse<Track>> {
    return this.get<PaginatedResponse<Track>>(
      `/api/v1/tracks?page=${page}&page_size=${pageSize}`
    )
  }

  async getTrack(id: number): Promise<Track> {
    return this.get<Track>(`/api/v1/tracks/${id}`)
  }

  async createTrack(track: CreateTrackRequest): Promise<Track> {
    return this.post<Track>('/api/v1/tracks', track)
  }

  async deleteTrack(id: number): Promise<void> {
    await this.delete(`/api/v1/tracks/${id}`)
  }

  // MARK: - Media

  async getMedia(page = 1, pageSize = 20): Promise<PaginatedResponse<Media>> {
    return this.get<PaginatedResponse<Media>>(
      `/api/v1/media?page=${page}&page_size=${pageSize}`
    )
  }

  async uploadMedia(file: File, entryId?: number): Promise<Media> {
    const formData = new FormData()
    formData.append('file', file)
    if (entryId) {
      formData.append('entry_id', String(entryId))
    }
    return this.postFormData<Media>('/api/v1/media/upload', formData)
  }

  async deleteMedia(id: number): Promise<void> {
    await this.delete(`/api/v1/media/${id}`)
  }

  // MARK: - AI

  async getGuidePOI(latitude: number, longitude: number, mode: string): Promise<GuidePOIResponse> {
    return this.post<GuidePOIResponse>('/api/v1/ai/guide/next', {
      latitude,
      longitude,
      mode,
    })
  }

  async getSummary(entryId: number): Promise<AISummaryResponse> {
    return this.post<AISummaryResponse>('/api/v1/ai/summarize', {
      entry_id: entryId,
    })
  }

  async getDailySummary(date: string): Promise<AISummaryResponse> {
    return this.post<AISummaryResponse>('/api/v1/ai/daily-summary', {
      date,
    })
  }

  // MARK: - Meta

  async getChangelog(): Promise<ChangelogResponse> {
    return this.get<ChangelogResponse>('/api/v1/meta/changelog')
  }

  async getHealth(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/api/v1/meta/health')
  }

  // MARK: - Private Methods

  private setTokens(access: string, refresh: string) {
    this.accessToken = access
    this.refreshToken = refresh
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = new Headers(options.headers)

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Try to refresh token on 401
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/')) {
      try {
        await this.refreshTokens()
        // Retry the request with new token
        headers.set('Authorization', `Bearer ${this.accessToken}`)
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        })
        return this.handleResponse<T>(retryResponse)
      } catch {
        this.logout()
        throw new APIError('Session expired', 401, 'SESSION_EXPIRED')
      }
    }

    return this.handleResponse<T>(response)
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let message = 'An error occurred'
      let code: string | undefined
      try {
        const error = await response.json()
        message = error.detail || error.message || message
        code = error.code
      } catch {
        message = response.statusText
      }
      throw new APIError(message, response.status, code)
    }

    // Handle empty responses
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  private async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    })
  }

  private async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  private async delete(endpoint: string): Promise<void> {
    await this.request<void>(endpoint, { method: 'DELETE' })
  }
}

// Singleton instance
let apiInstance: APIService | null = null

export function getAPIService(baseUrl?: string): APIService {
  if (!apiInstance) {
    apiInstance = new APIService(baseUrl)
  } else if (baseUrl) {
    apiInstance.setBaseUrl(baseUrl)
  }
  return apiInstance
}

export { APIService, APIError }
