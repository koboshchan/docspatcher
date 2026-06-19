import * as fs from 'fs';
import * as path from 'path';
import { Config } from './types.js';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data) as Config;
    }
  } catch (err) {
    console.error('Error reading config.json:', err);
  }
  return {};
}

export function saveConfig(config: Config): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing config.json:', err);
  }
}

export function getWebAppUrl(): string | undefined {
  return loadConfig().webAppUrl;
}

export function setWebAppUrl(url: string): void {
  const config = loadConfig();
  config.webAppUrl = url;
  saveConfig(config);
}

export function getCachedToken(): { token?: string; tokenExpiresAt?: number } {
  const config = loadConfig();
  return { token: config.token, tokenExpiresAt: config.tokenExpiresAt };
}

export function setCachedToken(token: string, expiresAt: number): void {
  const config = loadConfig();
  config.token = token;
  config.tokenExpiresAt = expiresAt;
  saveConfig(config);
}
export function clearCachedToken(): void {
  const config = loadConfig();
  delete config.token;
  delete config.tokenExpiresAt;
  saveConfig(config);
}
