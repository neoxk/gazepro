abstract class SportController {
  abstract getFields(): Field[]
  abstract resetFields(): void
  abstract flushFields(): Promise<boolean>
  abstract getTimestampsOf(video_id: string): Promise<any>
  abstract getAllTimestamps(): Promise<any>
  abstract loadField(id: number): Promise<boolean>
}

export default SportController
