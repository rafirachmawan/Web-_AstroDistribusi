// /src/types/pdfkit.d.ts
declare module "pdfkit" {
  export default class PDFDocument {
    constructor(opts?: any);
    on(event: string, cb: (...args: any[]) => void): this;
    addPage(opts?: any): this;
    end(): void;
    // … biarkan minimal, kita hanya butuh tipe longgar
  }
}
