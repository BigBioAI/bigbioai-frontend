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
    if (get().initialized) {
      return;
    }

    set({
      initialized: true,
      formData: buildInitialFormData(sections),
      openItems: sections[0]?.id ? [sections[0].id] : [],
      completedSteps: [],
      errors: {},
      stepLoading: null,
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
}));
