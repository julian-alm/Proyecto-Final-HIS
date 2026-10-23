export class MedicalSupply {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly stock: number,
    public readonly description?: string, // Lo hacemos opcional con el "?"
  ) {}
}