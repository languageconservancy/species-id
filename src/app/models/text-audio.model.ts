export interface TextAudio {
  id: number;
  text: string;
  fileName: string;
  urlPrefix: string;
  ipa: string;
}

export function mapTextAudio(row: any): TextAudio {
  return {
    id: row.id,
    text: row.text,
    fileName: row.file_name,
    urlPrefix: row.url_prefix,
    ipa: row.ipa,
  };
}
