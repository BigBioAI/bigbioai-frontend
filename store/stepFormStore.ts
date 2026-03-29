import { create } from 'zustand';
import { StepFormData, StepFormSection } from '@/types/stepForm';
import { StepFormStoreData, StepFormStoreState } from '@/types/stepFormStore';

const createInitialState = (): StepFormStoreData => ({
  formData: {},
  openItems: [],
  completedSteps: [],
  errors: {},
  stepLoading: null,
  initialized: false,
});

const buildInitialFormData = (sections: StepFormSection[]): StepFormData => {
  const initialData: StepFormData = {};

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      }
    });
  });

  return initialData;
};

export const useStepFormStore = create<StepFormStoreState>((set, get) => ({
  ...createInitialState(),
  patch: (payload) =>
    set((state) =>
      typeof payload === 'function'
        ? payload(state as StepFormStoreData)
        : payload
    ),
  initialize: (sections) => {
    const newFormData = buildInitialFormData(sections);
    const currentFormData = get().formData;

    // Merge new default values with existing form data
    // This preserves user-entered values while updating defaults from extractedParams
    const mergedFormData = { ...newFormData, ...currentFormData };

    // Update form data with new defaults from sections
    Object.keys(newFormData).forEach(key => {
      // Only update if the current value is undefined or still the old default
      if (currentFormData[key] === undefined) {
        mergedFormData[key] = newFormData[key];
      }
    });

    set({
      initialized: true,
      formData: mergedFormData,
      openItems: get().openItems.length > 0 ? get().openItems : (sections[0]?.id ? [sections[0].id] : []),
      completedSteps: get().completedSteps,
      errors: get().errors,
      stepLoading: get().stepLoading,
    });
  },
  updateField: (name, value) =>
    set((state) => ({
      formData: { ...state.formData, [name]: value },
    })),
  clearFieldError: (name) =>
    set((state) => {
      if (!state.errors[name]) {
        return state;
      }

      const nextErrors = { ...state.errors };
      delete nextErrors[name];
      return { errors: nextErrors };
    }),
  addCompletedStep: (stepId) =>
    set((state) => ({
      completedSteps: state.completedSteps.includes(stepId)
        ? state.completedSteps
        : [...state.completedSteps, stepId],
    })),
  reset: () => set(createInitialState()),
  updateFormDefaults: (sections) => {
    const newFormData = buildInitialFormData(sections);

    set((state) => ({
      formData: { ...state.formData, ...newFormData },
    }));
  },
}));
