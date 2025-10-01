export interface FeedCardDto {
  id: string;
  title?: string;
  artist?: string;
  period?: string[];
  source: string;
  license?: string;
  image: {
    feed?: string;
    detail?: {
      iiif?: string;
      full?: string;
    };
  };
  credit?: string;
  score: number;
  modelVersion: string;
}
