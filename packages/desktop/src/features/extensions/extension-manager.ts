import { ExtensionManifest, ExtensionContext, ExtensionAPI } from './extension-api';
import { createExtensionHost } from './extension-host';
import { createSandbox } from './sandboxing';
import { loadExtension } from './extension-loader';
import fs from 'fs-extra';
import path from 'path';

export interface LoadedExtension {
  id: string;
  manifest: ExtensionManifest;
  context: ExtensionContext;
  api: ExtensionAPI;
  active: boolean;
}

class ExtensionManager {
  private extensions: Map<string, LoadedExtension> = new Map();
  private extensionsDir: string;

  constructor(extensionsDir: string) {
    this.extensionsDir = extensionsDir;
  }

  async loadExtensions(): Promise<void> {
    if (!fs.existsSync(this.extensionsDir)) {
      fs.mkdirSync(this.extensionsDir, { recursive: true });
      return;
    }

    const extensionDirs = fs.readdirSync(this.extensionsDir);

    for (const dir of extensionDirs) {
      const extensionPath = path.join(this.extensionsDir, dir);
      const manifestPath = path.join(extensionPath, 'package.json');

      if (!fs.existsSync(manifestPath)) {
        console.warn(`Extension ${dir} has no package.json`);
        continue;
      }

      try {
        const manifest: ExtensionManifest = fs.readJsonSync(manifestPath);
        await this.loadExtension(extensionPath, manifest);
      } catch (error) {
        console.error(`Failed to load extension ${dir}:`, error);
      }
    }
  }

  async loadExtension(extensionPath: string, manifest: ExtensionManifest): Promise<void> {
    const extensionId = manifest.name;

    if (this.extensions.has(extensionId)) {
      throw new Error(`Extension ${extensionId} is already loaded`);
    }

    // Create extension context
    const context: ExtensionContext = {
      extensionPath,
      storagePath: path.join(this.extensionsDir, '.storage', extensionId),
      globalState: new Map(),
      workspaceState: new Map(),
    };

    // Create extension API
    const api = createExtensionHost();

    // Create sandbox
    const sandbox = createSandbox(context, api);

    // Load extension code
    const extensionCode = await loadExtension(extensionPath, manifest);

    // Execute in sandbox
    try {
      const activateFunc = sandbox.executeExtension(extensionCode);
      if (typeof activateFunc === 'function') {
        await activateFunc(context);
      }

      this.extensions.set(extensionId, {
        id: extensionId,
        manifest,
        context,
        api,
        active: true,
      });

      console.log(`Extension ${extensionId} loaded successfully`);
    } catch (error) {
      console.error(`Failed to activate extension ${extensionId}:`, error);
      throw error;
    }
  }

  async unloadExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    // Deactivate extension
    extension.active = false;

    // Clear registered commands/panels
    extension.api.commands.clear();
    extension.api.panels.clear();

    this.extensions.delete(extensionId);
    console.log(`Extension ${extensionId} unloaded`);
  }

  getExtension(extensionId: string): LoadedExtension | undefined {
    return this.extensions.get(extensionId);
  }

  getAllExtensions(): LoadedExtension[] {
    return Array.from(this.extensions.values());
  }

  async reloadExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    const extensionPath = extension.context.extensionPath;
    const manifest = extension.manifest;

    await this.unloadExtension(extensionId);
    await this.loadExtension(extensionPath, manifest);
  }
}

export function createExtensionManager(extensionsDir: string): ExtensionManager {
  return new ExtensionManager(extensionsDir);
}
