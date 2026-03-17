export interface StepFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'url' | 'range';
  placeholder?: string;
  defaultValue?: string | number;
  options?: { label: string; value: string }[];
  description?: string;
  required?: boolean;
  validation?: (value: unknown) => string | undefined;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
}

export interface StepFormSection {
  id: string;
  title: string;
  description?: string;
  fields: StepFormField[];
  isCompleted?: boolean;
  isLocked?: boolean; // 이전 단계 완료 전 잠금
  onStepComplete?: (data: StepFormData) => Promise<unknown> | unknown; // 단계 완료 시 실행
}

export interface StepFormData {
  [key: string]: string | number | boolean;
}

export interface ValidationError {
  [key: string]: string;
}

export interface PreprocessingParams {
  minCells?: number;
  minGenes?: number;
  maxGenes?: number;
  mitochondrialThreshold?: number;
  normalizationMethod?: 'logNormalize' | 'SCTransform' | 'none';
  scalingFactor?: number;
  nPCs?: number;
  resolution?: number;
}
