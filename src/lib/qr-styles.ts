
export type DotType = 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
export type CornerSquareType = 'dot' | 'square' | 'extra-rounded' | 'rounded';
export type CornerDotType = 'dot' | 'square';

export const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: 'square', label: 'Quadrado' },
  { value: 'dots', label: 'Pontos' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'extra-rounded', label: 'Extra Arredondado' },
  { value: 'classy', label: 'Elegante' },
  { value: 'classy-rounded', label: 'Elegante Arredondado' },
];

export const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Quadrado' },
  { value: 'dot', label: 'Círculo' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'extra-rounded', label: 'Extra Arredondado' },
];

export const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: 'square', label: 'Quadrado' },
  { value: 'dot', label: 'Círculo' },
];

export const REFERENCE_STYLE_PRESET = {
  dotStyle: 'extra-rounded' as DotType,
  cornerSquareStyle: 'extra-rounded' as CornerSquareType,
  cornerDotStyle: 'dot' as CornerDotType,
};
