import { Injectable } from '@angular/core';
import { Posthog } from '@capawesome/capacitor-posthog';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { ConfigService } from './config.service';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private queueKey = 'analytics_queue';
  private initialized = false;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async init() {
    if (this.initialized) return;

    console.log('[AnalyticsService] Starting initialization...');

    const posthogApiKey = this.configService.get('posthogApiKey');
    const posthogHost = this.configService.get('posthogHost');

    console.log('[AnalyticsService] Config values:', {
      posthogApiKey: posthogApiKey ? '***' + posthogApiKey.slice(-4) : 'NOT_FOUND',
      posthogHost,
    });

    if (!posthogApiKey) {
      console.warn('Posthog API key not found, analytics will not be initialized');
      return;
    }

    if (!posthogHost) {
      console.warn('Posthog host not found, analytics will not be initialized');
      return;
    }

    try {
      // Initialize Posthog using Capacitor plugin
      await Posthog.setup({
        apiKey: posthogApiKey,
        host: posthogHost,
      });

      // Register app version as a user property
      const appVersion = await this.getAppVersion();
      await Posthog.register({
        version: appVersion,
      });

      this.initialized = true;

      console.log('[AnalyticsService] Analytics initialized with Capacitor PostHog');

      // Flush queue when network is available
      Network.addListener('networkStatusChange', (status) => {
        console.log('[AnalyticsService] Network status changed:', status);
        if (status.connected) this.flushQueue();
      });

      this.flushQueue(); // try to flush on startup
    } catch (error) {
      console.error('[AnalyticsService] Error initializing PostHog:', error);
    }
  }

  async track(eventName: string, props?: Record<string, any>) {
    console.log('[AnalyticsService] Tracking event:', eventName, props);

    if (!this.initialized) {
      console.warn('[AnalyticsService] Analytics not initialized, event will be queued');
      await this.queueEvent({ eventName, props, timestamp: Date.now() });
      return;
    }

    try {
      const status = await Network.getStatus();
      console.log('[AnalyticsService] Network status:', status);

      if (status.connected) {
        console.log('[AnalyticsService] Network connected, sending event directly');

        // Add retry logic for network failures
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await Posthog.capture(eventName, props);
            console.log('[AnalyticsService] Event sent to PostHog:', eventName, props);
            break; // Success, exit retry loop
          } catch (captureError) {
            retryCount++;
            console.warn(`[AnalyticsService] Capture attempt ${retryCount} failed:`, captureError);

            if (retryCount >= maxRetries) {
              console.warn('[AnalyticsService] Max retries reached, queuing event');
              await this.queueEvent({ eventName, props, timestamp: Date.now() });
            } else {
              // Wait before retrying (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      } else {
        console.log('[AnalyticsService] Network disconnected, queuing event');
        await this.queueEvent({ eventName, props, timestamp: Date.now() });
      }
      console.log('Analytics event captured:', eventName, props);
    } catch (err) {
      console.warn('[AnalyticsService] Analytics failed, queuing event.', err);
      await this.queueEvent({ eventName, props, timestamp: Date.now() });
    }
  }

  private async queueEvent(event: any) {
    const raw = await Preferences.get({ key: this.queueKey });
    const queue = raw.value ? JSON.parse(raw.value) : [];
    queue.push(event);
    await Preferences.set({ key: this.queueKey, value: JSON.stringify(queue) });
  }

  async flushQueue() {
    const raw = await Preferences.get({ key: this.queueKey });
    const queue = raw.value ? JSON.parse(raw.value) : [];

    const remaining = [];
    for (const event of queue) {
      try {
        await Posthog.capture(event.eventName, event.props);
      } catch {
        remaining.push(event);
      }
    }

    await Preferences.set({ key: this.queueKey, value: JSON.stringify(remaining) });
  }

  /**
   * Debug method to check PostHog status and configuration
   * Call this method to get detailed information about the analytics setup
   */
  async debugAnalytics(): Promise<void> {
    console.log('=== PostHog Analytics Debug Info ===');
    console.log('Initialized:', this.initialized);

    if (this.initialized) {
      try {
        // Check network status
        const networkStatus = await Network.getStatus();
        console.log('Network status:', networkStatus);

        // Check queued events
        const raw = await Preferences.get({ key: this.queueKey });
        const queue = raw.value ? JSON.parse(raw.value) : [];
        console.log('Queued events:', queue.length);

        // Test a simple event
        console.log('Testing simple event...');
        await Posthog.capture('debug_test', { timestamp: Date.now() });
        console.log('Test event sent');
      } catch (error) {
        console.error('Error in debug:', error);
      }
    } else {
      console.log('Analytics not initialized');
    }
    console.log('=== End Debug Info ===');
  }

  /**
   * Test PostHog connectivity by making a direct API call
   * This helps verify if the PostHog instance is properly configured
   */
  async testPostHogConnectivity(): Promise<void> {
    console.log('=== Testing PostHog Connectivity ===');

    if (!this.initialized) {
      console.log('Analytics not initialized, cannot test connectivity');
      return;
    }

    try {
      // Test 1: Check if PostHog is working
      console.log('Testing PostHog capture...');
      await Posthog.capture('connectivity_test', {
        timestamp: Date.now(),
        platform: Capacitor.getPlatform(),
      });
      console.log('✅ PostHog capture successful');

      // Test 2: Check network status
      const networkStatus = await Network.getStatus();
      console.log('Network status:', networkStatus);

      // Test 3: Check queued events
      const raw = await Preferences.get({ key: this.queueKey });
      const queue = raw.value ? JSON.parse(raw.value) : [];
      console.log('Queued events count:', queue.length);
    } catch (error) {
      console.error('❌ PostHog connectivity test failed:', error);
    }

    console.log('=== End Connectivity Test ===');
  }

  /**
   * Test direct API connectivity to PostHog
   * This bypasses the PostHog library and tests direct HTTP connectivity
   */
  async testPostHogAPI(): Promise<void> {
    console.log('=== Testing PostHog API Directly ===');

    try {
      const apiKey = this.configService.get('posthogApiKey');
      const host = this.configService.get('posthogHost');

      if (!apiKey || !host) {
        console.log('API key or host not configured');
        return;
      }

      console.log('Testing direct API call to PostHog...');

      const event = {
        api_key: apiKey,
        event: 'api_test',
        properties: {
          timestamp: Date.now(),
          platform: Capacitor.getPlatform(),
          test: true,
        },
        distinct_id: 'test_user_' + Date.now(),
      };

      const response = await fetch(`${host}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Capacitor-App/1.0',
        },
        body: JSON.stringify(event),
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        console.log('✅ Direct API call successful');
      } else {
        console.log('❌ Direct API call failed:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Direct API test failed:', error);
    }

    console.log('=== End API Test ===');
  }

  /**
   * Test network connectivity using Capacitor Network
   * This helps verify if the device has internet connectivity
   */
  async testNetworkConnectivity(): Promise<void> {
    console.log('=== Testing Network Connectivity ===');

    try {
      // Test 1: Check network status
      const status = await Network.getStatus();
      console.log('Network status:', status);

      // Test 2: Test basic internet connectivity
      console.log('Testing basic internet connectivity...');
      try {
        const response = await fetch('https://httpbin.org/get', {
          method: 'GET',
          headers: {
            'User-Agent': 'Capacitor-App/1.0',
          },
        });
        console.log('Basic connectivity test status:', response.status);
        if (response.ok) {
          console.log('✅ Basic internet connectivity working');
        } else {
          console.log('❌ Basic connectivity failed:', response.status);
        }
      } catch (error) {
        console.log('❌ Basic connectivity test failed:', error);
      }

      // Test 3: Test PostHog host connectivity
      const posthogHost = this.configService.get('posthogHost');
      if (posthogHost) {
        console.log('Testing PostHog host connectivity...');
        try {
          const hostUrl = new URL(posthogHost);
          const response = await fetch(`${hostUrl.origin}/`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Capacitor-App/1.0',
            },
          });
          console.log('PostHog host test status:', response.status);
          if (response.ok) {
            console.log('✅ PostHog host reachable');
          } else {
            console.log('❌ PostHog host test failed:', response.status);
          }
        } catch (error) {
          console.log('❌ PostHog host test failed:', error);
        }
      }
    } catch (error) {
      console.error('Error testing network connectivity:', error);
    }

    console.log('=== End Network Connectivity Test ===');
  }

  private async getAppVersion(): Promise<string> {
    try {
      const info = await App.getInfo();
      return info.version;
    } catch (error) {
      console.warn('Could not get app version:', error);
      return 'unknown';
    }
  }
}
