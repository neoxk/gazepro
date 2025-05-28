interface SettingsController {
  get(id: string): string 
  set(id: string, val: string): void
  init(settings_path: string, default_settings: {[id: string]: string}): void
}

export default SettingsController
