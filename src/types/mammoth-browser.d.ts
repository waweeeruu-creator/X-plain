declare module "mammoth/mammoth.browser.js" {
  interface ExtractInput {
    arrayBuffer: ArrayBuffer;
  }

  interface ExtractResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function extractRawText(input: ExtractInput): Promise<ExtractResult>;
}