import { Injectable } from '@angular/core';
import { Posthog } from '@capawesome/capacitor-posthog';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { ConfigService } from './config.service';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';
import posthog from 'posthog-js';

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
      // Initialize Posthog. This will be used to track events and user properties.
      // Autocapture is turned off because we don't want to track events automatically, because
      // it will track too many events automatically.
      Posthog.setup({
        apiKey: posthogApiKey,
        host: posthogHost,
      });

      this.initialized = true;

      console.log('[AnalyticsService] Analytics initialized');

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
            Posthog.capture({
              event: eventName,
              properties: props,
            });
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
        Posthog.capture({
          event: event.eventName,
          properties: event.props,
        });
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
  // async debugAnalytics(): Promise<void> {
  //   console.log('=== PostHog Analytics Debug Info ===');
  //   console.log('Initialized:', this.initialized);

  //   if (this.initialized) {
  //     try {
  //       // Check if PostHog is available globally
  //       console.log('PostHog available:', typeof posthog !== 'undefined');

  //       // Get PostHog configuration
  //       const config = (posthog as any).__loaded ? (posthog as any).config : 'Not loaded';
  //       console.log('PostHog config:', config);

  //       // Check if PostHog has a token
  //       const token = (posthog as any).token;
  //       console.log('PostHog token:', token ? '***' + token.slice(-4) : 'No token');

  //       // Check network status
  //       const networkStatus = await Network.getStatus();
  //       console.log('Network status:', networkStatus);

  //       // Check queued events
  //       const raw = await Preferences.get({ key: this.queueKey });
  //       const queue = raw.value ? JSON.parse(raw.value) : [];
  //       console.log('Queued events:', queue.length);

  //       // Test a simple event
  //       console.log('Testing simple event...');
  //       posthog.capture('debug_test', { timestamp: Date.now() });
  //       console.log('Test event sent');
  //     } catch (error) {
  //       console.error('Error in debug:', error);
  //     }
  //   } else {
  //     console.log('Analytics not initialized');
  //   }
  //   console.log('=== End Debug Info ===');
  // }

  // /**
  //  * Test PostHog connectivity by making a direct API call
  //  * This helps verify if the PostHog instance is properly configured
  //  */
  // async testPostHogConnectivity(): Promise<void> {
  //   console.log('=== Testing PostHog Connectivity ===');

  //   if (!this.initialized) {
  //     console.log('Analytics not initialized, cannot test connectivity');
  //     return;
  //   }

  //   try {
  //     // Test 1: Check if PostHog is loaded
  //     console.log('PostHog loaded:', (posthog as any).__loaded);

  //     // Test 2: Check PostHog configuration
  //     const apiKey = this.configService.get('posthogApiKey');
  //     const host = this.configService.get('posthogHost');
  //     console.log('API Key configured:', !!apiKey);
  //     console.log('Host configured:', host);

  //     // Test 3: Check if PostHog has the correct token
  //     const token = (posthog as any).token;
  //     console.log('PostHog token matches config:', token === apiKey);

  //     // Test 4: Check network connectivity
  //     const networkStatus = await Network.getStatus();
  //     console.log('Network connected:', networkStatus.connected);
  //     console.log('Connection type:', networkStatus.connectionType);

  //     // Test 5: Try to capture a test event
  //     console.log('Sending test event...');
  //     posthog.capture('connectivity_test', {
  //       timestamp: Date.now(),
  //       platform: Capacitor.getPlatform(),
  //       networkType: networkStatus.connectionType,
  //       test: true,
  //     });
  //     console.log('Test event sent successfully');

  //     // Test 6: Check if PostHog has any pending events
  //     const pendingEvents = (posthog as any).__loaded ? (posthog as any).pending_events : 'Unknown';
  //     console.log('Pending events:', pendingEvents);
  //   } catch (error) {
  //     console.error('Error testing PostHog connectivity:', error);
  //   }

  //   console.log('=== End Connectivity Test ===');
  // }

  // /**
  //  * Test PostHog API directly to verify project configuration
  //  * This makes a direct HTTP request to the PostHog API
  //  */
  // async testPostHogAPI(): Promise<void> {
  //   console.log('=== Testing PostHog API Directly ===');

  //   try {
  //     const apiKey = this.configService.get('posthogApiKey');
  //     const host = this.configService.get('posthogHost');

  //     if (!apiKey || !host) {
  //       console.log('API key or host not configured');
  //       return;
  //     }

  //     // Test the PostHog API directly
  //     const testEvent = {
  //       api_key: apiKey,
  //       event: 'api_test',
  //       properties: {
  //         timestamp: Date.now(),
  //         platform: Capacitor.getPlatform(),
  //         test: true,
  //         distinct_id: 'test_user_' + Date.now(),
  //       },
  //       distinct_id: 'test_user_' + Date.now(),
  //     };

  //     console.log('Sending test event to PostHog API...');

  //     const response = await fetch(`${host}/capture/`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(testEvent),
  //     });

  //     console.log('API Response status:', response.status);
  //     console.log('API Response ok:', response.ok);

  //     if (response.ok) {
  //       const responseText = await response.text();
  //       console.log('API Response body:', responseText);
  //       console.log('✅ PostHog API test successful');
  //     } else {
  //       console.log('❌ PostHog API test failed');
  //       const errorText = await response.text();
  //       console.log('Error response:', errorText);
  //     }
  //   } catch (error) {
  //     console.error('Error testing PostHog API:', error);
  //   }

  //   console.log('=== End API Test ===');
  // }

  // /**
  //  * Test network connectivity to PostHog servers
  //  * This helps identify if the issue is with network connectivity
  //  */
  // async testNetworkConnectivity(): Promise<void> {
  //   console.log('=== Testing Network Connectivity ===');

  //   try {
  //     const host = this.configService.get('posthogHost');

  //     if (!host) {
  //       console.log('PostHog host not configured');
  //       return;
  //     }

  //     // Test 1: Basic connectivity to PostHog domain
  //     console.log('Testing basic connectivity to PostHog...');
  //     const testUrl = `${host}/capture/`;

  //     try {
  //       const response = await fetch(testUrl, {
  //         method: 'HEAD', // Just test connectivity, don't send data
  //         headers: {
  //           'User-Agent': 'Capacitor/Test',
  //         },
  //       });
  //       console.log('✅ Basic connectivity test passed:', response.status);
  //     } catch (error) {
  //       console.log('❌ Basic connectivity test failed:', error);
  //     }

  //     // Test 2: Check if we can reach the domain
  //     console.log('Testing domain reachability...');
  //     try {
  //       const response = await fetch(`${host}/`, {
  //         method: 'GET',
  //         headers: {
  //           'User-Agent': 'Capacitor/Test',
  //         },
  //       });
  //       console.log('✅ Domain reachability test passed:', response.status);
  //     } catch (error) {
  //       console.log('❌ Domain reachability test failed:', error);
  //     }

  //     // Test 3: Check network status
  //     const networkStatus = await Network.getStatus();
  //     console.log('Network status:', networkStatus);

  //     // Test 4: Check if we're on a restricted network
  //     console.log('Testing if we can make external requests...');
  //     try {
  //       const response = await fetch('https://httpbin.org/get', {
  //         method: 'GET',
  //       });
  //       console.log('✅ External request test passed:', response.status);
  //     } catch (error) {
  //       console.log('❌ External request test failed:', error);
  //     }
  //   } catch (error) {
  //     console.error('Error testing network connectivity:', error);
  //   }

  //   console.log('=== End Network Connectivity Test ===');
  // }
}
