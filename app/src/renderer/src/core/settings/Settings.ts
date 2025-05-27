interface Settings {
  get(id: string): string | undefined
  set(id: string, val: string): void
}

export default Settings
