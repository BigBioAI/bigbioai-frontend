import { StepFormData, ValidationError, StepFormSection } from '@/types/stepForm';

export interface StepFormStoreData {
  formData: StepFormData;
  openItems: string[];
  completedSteps: string[];
  errors: ValidationError;
  stepLoading: string | null;
  initialized: boolean;
}

export interface StepFormStoreState extends StepFormStoreData {
  patch: (
    payload:
      | Partial<StepFormStoreData>
      | ((state: StepFormStoreData) => Partial<StepFormStoreData>)
  ) => void;
  initialize: (sections: StepFormSection[]) => void;
  updateField: (name: string, value: string | number | boolean) => void;
  clearFieldError: (name: string) => void;
  addCompletedStep: (stepId: string) => void;
  reset: () => void;
}
