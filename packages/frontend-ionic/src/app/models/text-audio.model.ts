export interface TextAudio {
  text: string;
  fileName: string;
  urlPrefix: string;
  ipa: string;
}

export function mapTextAudio(row: any): TextAudio {
  return {
    text: row.text,
    fileName: row.file_name,
    urlPrefix: row.url_prefix,
    ipa: row.ipa,
  };
}
