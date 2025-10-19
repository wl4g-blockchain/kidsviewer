import { ApiResponse } from '../types';

export interface SysConfig {
    id: string;
    type: string;
    key: string;
    value: any;
    version: number;
    remark?: string;
    createDate: string;
    updateDate: string;
}

export interface SysConfigResponse {
    [key: string]: SysConfig;
}

/**
 * System configuration management service
 * Responsible for fetching configuration from the server and caching it in localStorage
 */
export class ConfigService {
    private static instance: ConfigService;
    private configCache: SysConfigResponse = {};
    private readonly CACHE_KEY = 'kidsviewer_sys_config';
    private readonly CACHE_EXPIRY_KEY = 'kidsviewer_sys_config_expiry';
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    private constructor() {
        this.loadFromCache();
    }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Fetch system configuration from the server
     */
    public async fetchConfig(type?: string, key?: string): Promise<ApiResponse<SysConfigResponse>> {
        try {
            const params = new URLSearchParams();
            if (type) params.append('type', type);
            if (key) params.append('key', key);

            const response = await fetch(`/api/v1/sys/config?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Update cache
            this.configCache = data;
            this.saveToCache();

            return {
                errcode: '200',
                errmsg: 'ok',
                data,
            };
        } catch (error) {
            console.error('Failed to get system configuration:', error);
            return {
                errcode: '5000',
                errmsg: error instanceof Error ? error.message : 'Failed to get system configuration',
            };
        }
    }

    /**
     * Get specified configuration item
     */
    public getConfig(key: string): SysConfig | null {
        return this.configCache[key] || null;
    }

    /**
     * Get specified type of configuration
     */
    public getConfigsByType(type: string): SysConfig[] {
        return Object.values(this.configCache).filter(config => config.type === type);
    }

    /**
     * Get configuration value
     */
    public getConfigValue(key: string): any {
        const config = this.getConfig(key);
        return config ? config.value : null;
    }

    /**
     * Get string configuration value
     */
    public getStringConfig(key: string, defaultValue: string = ''): string {
        const value = this.getConfigValue(key);
        return typeof value === 'string' ? value : defaultValue;
    }

    /**
     * Get number configuration value
     */
    public getNumberConfig(key: string, defaultValue: number = 0): number {
        const value = this.getConfigValue(key);
        return typeof value === 'number' ? value : defaultValue;
    }

    /**
     * Get boolean configuration value
     */
    public getBooleanConfig(key: string, defaultValue: boolean = false): boolean {
        const value = this.getConfigValue(key);
        return typeof value === 'boolean' ? value : defaultValue;
    }

    /**
     * Get object configuration value
     */
    public getObjectConfig<T = any>(key: string, defaultValue: T | null = null): T | null {
        const value = this.getConfigValue(key);
        return value && typeof value === 'object' ? value : defaultValue;
    }

    /**
     * Check if configuration exists
     */
    public hasConfig(key: string): boolean {
        return key in this.configCache;
    }

    /**
     * Get all configurations
     */
    public getAllConfigs(): SysConfigResponse {
        return { ...this.configCache };
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.configCache = {};
        localStorage.removeItem(this.CACHE_KEY);
        localStorage.removeItem(this.CACHE_EXPIRY_KEY);
    }

    /**
     * Check if cache is expired
     */
    private isCacheExpired(): boolean {
        const expiry = localStorage.getItem(this.CACHE_EXPIRY_KEY);
        if (!expiry) return true;

        const expiryTime = parseInt(expiry, 10);
        return Date.now() > expiryTime;
    }

    /**
     * Load configuration from cache
     */
    private loadFromCache(): void {
        try {
            if (this.isCacheExpired()) {
                this.clearCache();
                return;
            }

            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                this.configCache = JSON.parse(cached);
            }
        } catch (error) {
            console.error('Failed to load configuration cache:', error);
            this.clearCache();
        }
    }

    /**
     * Save configuration to cache
     */
    private saveToCache(): void {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.configCache));
            localStorage.setItem(this.CACHE_EXPIRY_KEY, (Date.now() + this.CACHE_DURATION).toString());
        } catch (error) {
            console.error('Failed to save configuration cache:', error);
        }
    }

    /**
     * Force refresh configuration (ignore cache)
     */
    public async refreshConfig(type?: string, key?: string): Promise<ApiResponse<SysConfigResponse>> {
        this.clearCache();
        return this.fetchConfig(type, key);
    }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
