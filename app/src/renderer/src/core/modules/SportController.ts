abstract class SportController {
  abstract getFields(): Field[]
  abstract resetFields(): void
  abstract flushFields(): Promise<boolean>
}

export default SportController
