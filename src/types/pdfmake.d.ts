// pdfmake ships no type definitions; this is the small part of it the manuscript export uses.
declare module "pdfmake/build/pdfmake" {
  const pdfMake: {
    addFonts(fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>): void;
    setUrlAccessPolicy(policy: (url: string) => boolean): void;
    createPdf(definition: unknown): { getBlob(): Promise<Blob> };
  };
  export default pdfMake;
}
