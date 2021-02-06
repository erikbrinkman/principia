export interface AlignArgs {
  abscompLabels?: boolean;
  abscompAxisLabels?: boolean;
  abscompTitle?: boolean;
  yticks?: number | null;
  ylabel?: number | null;
  xticks?: number | null;
  xlabel?: number | null;
  xshift?: number | null;
  evoLabels?: number | null;
}

export interface SvgSize {
  width: number;
  height: number;
}
