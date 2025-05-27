export default interface Timestamper<NewT, SavedT extends NewT & { id: number }> {
  save(ts: NewT): Promise<SavedT>
  delete(id: number): Promise<boolean>
}
