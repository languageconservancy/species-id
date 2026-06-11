import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { CapacitorHttp } from '@capacitor/core';
import { ConfigService } from './config.service';

type AnalyticsProps = Record<string, string | number | boolean | null>;

interface QueuedEvent {
  eventName: string;
  props?: AnalyticsProps;
  timestamp: number;
}

/**
 * Sends minimal custom events to PostHog via the capture API (no PostHog SDK).
 *
 * Each event includes only an ISO timestamp plus caller-supplied properties
 * (e.g. searchTerm). We use a shared distinct_id and disable person profiles.
 *
 * Each event sets $geoip_disable so PostHog skips city/postal/lat/long enrichment.
 * We do not send $session_id (direct API capture, not the mobile/web SDK).
 * Optionally in PostHog: Project Settings → discard client IP; disable GeoIP
 * transformation in Data Pipeline for defense in depth.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private queueKey = 'analytics_queue';
  private initialized = false;
  private apiKey = '';
  private host = '';
  /** Single shared ID — no per-user or per-device tracking. */
  private readonly distinctId = 'anonymous';

  constructor(private configService: ConfigService) {}

  async init() {
    if (this.initialized) return;

    const posthogApiKey = this.configService.get('posthogApiKey');
    const posthogHost = this.configService.get('posthogHost');

    if (!posthogApiKey) {
      console.warn('Posthog API key not found, analytics will not be initialized');
      return;
    }

    if (!posthogHost) {
      console.warn('Posthog host not found, analytics will not be initialized');
      return;
    }

    this.apiKey = posthogApiKey;
    this.host = posthogHost.replace(/\/$/, '');
    this.initialized = true;

    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) this.flushQueue();
    });

    await this.flushQueue();
  }

  async track(eventName: string, props?: AnalyticsProps) {
    if (!this.initialized) {
      await this.queueEvent({ eventName, props, timestamp: Date.now() });
      return;
    }

    try {
      const status = await Network.getStatus();
      if (status.connected) {
        await this.sendEvent(eventName, props);
      } else {
        await this.queueEvent({ eventName, props, timestamp: Date.now() });
      }
    } catch {
      await this.queueEvent({ eventName, props, timestamp: Date.now() });
    }
  }

  private sanitizeProps(props?: AnalyticsProps): AnalyticsProps {
    if (!props) return {};
    const sanitized: AnalyticsProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private buildCaptureBody(eventName: string, props: AnalyticsProps | undefined, timestampMs: number) {
    const timestamp = new Date(timestampMs).toISOString();
    return {
      api_key: this.apiKey,
      event: eventName,
      distinct_id: this.distinctId,
      timestamp,
      properties: {
        timestamp,
        $process_person_profile: false,
        $geoip_disable: true,
        ...this.sanitizeProps(props),
      },
    };
  }

  private async sendEvent(eventName: string, props?: AnalyticsProps, timestampMs = Date.now()) {
    const response = await CapacitorHttp.post({
      url: `${this.host}/capture/`,
      headers: { 'Content-Type': 'application/json' },
      data: this.buildCaptureBody(eventName, props, timestampMs),
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`PostHog capture failed with status ${response.status}`);
    }
  }

  private async queueEvent(event: QueuedEvent) {
    const raw = await Preferences.get({ key: this.queueKey });
    const queue: QueuedEvent[] = raw.value ? JSON.parse(raw.value) : [];
    queue.push(event);
    await Preferences.set({ key: this.queueKey, value: JSON.stringify(queue) });
  }

  async flushQueue() {
    if (!this.initialized) return;

    const raw = await Preferences.get({ key: this.queueKey });
    const queue: QueuedEvent[] = raw.value ? JSON.parse(raw.value) : [];

    const remaining: QueuedEvent[] = [];
    for (const event of queue) {
      try {
        await this.sendEvent(event.eventName, event.props, event.timestamp);
      } catch {
        remaining.push(event);
      }
    }

    await Preferences.set({ key: this.queueKey, value: JSON.stringify(remaining) });
  }
}
