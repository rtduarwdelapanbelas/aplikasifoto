export type TemplateType =
  | 'polaroid_classic'
  | 'minimalist_white'
  | 'film_strip'
  | 'journal_kraft'
  | string;

export type CaptionCategory = 'aesthetic' | 'casual' | 'funny';

export type FontOption =
  | 'caveat'
  | 'kalam'
  | 'typewriter'
  | 'courier'
  | 'playfair'
  | 'cormorant'
  | 'sans'
  | 'pacifico'
  | 'dancing'
  | 'cinzel'
  | 'merriweather'
  | 'montserrat'
  | string;

export type FontStyleType = 'normal' | 'bold' | 'italic' | 'bold_italic';

export interface CustomTemplate {
  id: string;
  name: string;
  description?: string;
  frameImage?: string; // Data URL or Image URL for custom frame border/overlay/card
  layoutType?: 'polaroid' | 'classic_frame' | 'overlay' | 'card';
  defaultBg: string;
  defaultFont: string;
  defaultTextColor: string;
  defaultFontSize: number;
  defaultFontStyle?: FontStyleType;
  defaultTextAlign?: 'left' | 'center' | 'right';
  createdAt: string;
  author?: string;
}

export type FilterType =
  | 'none'
  | 'warm_vintage'
  | 'noir'
  | 'golden_hour'
  | 'film_fade'
  | 'vivid';

export type AspectRatioType = '1:1' | '4:5' | '3:4' | '16:9';

export type AccentType = 'none' | 'tape_top' | 'tape_diagonal' | 'push_pin' | 'stamp_postal' | 'stamp_retro_date';

export interface AIAnalysisResult {
  title?: string;
  captions: {
    aesthetic: string;
    casual: string;
    funny: string;
  };
  design_recommendation: {
    dominant_color_hex: string;
    recommended_template: TemplateType;
    recommended_bg_color_hex: string;
    reason: string;
  };
  palette?: string[];
  vibe_tags?: string[];
  isFallback?: boolean;
}

export interface FrameState {
  imageSrc: string;
  template: string;
  customTemplateData?: CustomTemplate;
  title: string;
  caption: string;
  subCaption: string;
  selectedCategory: CaptionCategory;
  font: string;
  fontSize: number; // in pt/px (14 to 48)
  textColor: string;
  fontStyle?: FontStyleType; // 'normal' | 'bold' | 'italic' | 'bold_italic'
  textAlign: 'left' | 'center' | 'right';
  bgColor: string;
  filter: FilterType;
  accent: AccentType;
  aspectRatio: AspectRatioType;
  zoom: number; // 1 to 2
  panX: number; // -50 to 50
  panY: number; // -50 to 50
  showDate: boolean;
  dateText: string;
}

export interface SavedCreation {
  id: string;
  timestamp: number;
  previewUrl: string;
  frameState: FrameState;
  analysis?: AIAnalysisResult;
}
