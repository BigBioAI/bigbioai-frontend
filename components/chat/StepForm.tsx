"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StepFormSection,
  StepFormField,
  ValidationError,
} from "@/types/stepForm";
import { AlertCircle, Loader2 } from "lucide-react";
import { useStepFormStore } from "@/store/stepFormStore";

interface StepFormProps {
  sections: StepFormSection[];
  submitLabel?: string;
}

export function StepForm({ sections }: StepFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const {
    formData,
    openItems,
    completedSteps,
    errors,
    stepLoading,
    patch,
    initialize,
    updateField,
    clearFieldError,
    addCompletedStep,
    reset,
  } = useStepFormStore();

  useEffect(() => {
    initialize(sections);

    return () => {
      reset();
    };
    // sections is intentionally excluded to preserve in-progress form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialize, reset]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateField = useCallback(
    (
      field: StepFormField,
      value: string | number | boolean,
    ): string | undefined => {
      if (field.required && (!value || value === "")) {
        return `${field.label}은(는) 필수 항목입니다.`;
      }

      if (field.validation) {
        return field.validation(value);
      }

      if (field.type === "url" && value && typeof value === "string") {
        try {
          new URL(value);
          if (!value.includes("drive.google.com")) {
            return "Google Drive 링크를 입력해주세요.";
          }
          // 폴더 링크 체크
          if (
            value.includes("/folders/") ||
            value.includes("/drive/folders/")
          ) {
            return "❌ 폴더 링크는 지원하지 않습니다. 압축 파일(.zip, .tar.gz) 또는 .h5/.h5ad 파일 링크를 사용해주세요.";
          }
          // 파일 링크 체크
          if (!value.includes("/file/d/") && !value.includes("id=")) {
            return "올바른 Google Drive 파일 링크를 입력해주세요.";
          }
        } catch {
          return "유효한 URL을 입력해주세요.";
        }
      }

      if (field.type === "number" || field.type === "range") {
        const numValue = Number(value);
        if (field.min !== undefined && numValue < field.min) {
          return `최소값은 ${field.min}입니다.`;
        }
        if (field.max !== undefined && numValue > field.max) {
          return `최대값은 ${field.max}입니다.`;
        }
      }

      if (field.pattern && value && typeof value === "string") {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          return "올바른 형식이 아닙니다.";
        }
      }

      return undefined;
    },
    [],
  );

  const validateSection = useCallback(
    (section: StepFormSection): boolean => {
      const sectionErrors: ValidationError = {};
      let isValid = true;

      section.fields.forEach((field) => {
        const value = formData[field.name];
        const error = validateField(field, value);
        if (error) {
          sectionErrors[field.name] = error;
          isValid = false;
        }
      });

      const currentErrors = useStepFormStore.getState().errors;
      patch({ errors: { ...currentErrors, ...sectionErrors } });
      return isValid;
    },
    [formData, validateField, patch],
  );

  const handleFieldChange = useCallback(
    (name: string, value: string | number | boolean) => {
      updateField(name, value);
      // 필드 변경 시 해당 필드의 에러 제거
      clearFieldError(name);
    },
    [updateField, clearFieldError],
  );

  const handleStepComplete = useCallback(
    async (section: StepFormSection) => {
      if (!validateSection(section)) {
        return;
      }

      patch({ stepLoading: section.id });

      try {
        if (section.onStepComplete) {
          await section.onStepComplete(formData);
        }

        addCompletedStep(section.id);

        // 다음 단계 자동 열기
        const currentIndex = sections.findIndex((s) => s.id === section.id);
        if (currentIndex < sections.length - 1) {
          const nextSection = sections[currentIndex + 1];
          patch((state) => ({
            openItems: [
              ...state.openItems.filter((id) => id !== section.id),
              nextSection.id,
            ],
          }));
        }
      } catch (error) {
        console.error("Step completion error:", error);
        const currentErrors = useStepFormStore.getState().errors;
        patch({
          errors: {
            ...currentErrors,
            [`${section.id}_error`]: "단계 완료 중 오류가 발생했습니다.",
          },
        });
      } finally {
        patch({ stepLoading: null });
      }
    },
    [addCompletedStep, formData, patch, sections, validateSection],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 각 단계의 onStepComplete에서 처리되므로 이 함수는 사용되지 않음
  };

  const renderField = (field: StepFormField, sectionId: string) => {
    const value = formData[field.name] || "";
    const error = errors[field.name];
    const isDisabled = field.disabled || stepLoading === sectionId;

    const fieldProps = {
      id: field.name,
      "aria-required": field.required,
      "aria-invalid": !!error,
      "aria-describedby": error ? `${field.name}-error` : undefined,
      disabled: isDisabled,
    };

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...fieldProps}
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`min-h-20 ${error ? "border-red-500" : ""}`}
          />
        );

      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={(val) => handleFieldChange(field.name, val)}
            disabled={isDisabled}
          >
            <SelectTrigger
              {...fieldProps}
              className={error ? "border-red-500" : ""}
            >
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            {...fieldProps}
            type="number"
            placeholder={field.placeholder}
            value={value as string | number}
            onChange={(e) =>
              handleFieldChange(field.name, Number(e.target.value))
            }
            min={field.min}
            max={field.max}
            step={field.step}
            className={error ? "border-red-500" : ""}
          />
        );

      case "range":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                {...fieldProps}
                type="range"
                value={value as string | number}
                onChange={(e) =>
                  handleFieldChange(field.name, Number(e.target.value))
                }
                min={field.min || 0}
                max={field.max || 100}
                step={field.step || 1}
                className="flex-1"
              />
              <span className="w-12 text-sm text-right">{value}</span>
            </div>
          </div>
        );

      case "url":
        return (
          <Input
            {...fieldProps}
            type="url"
            placeholder={field.placeholder || "https://drive.google.com/..."}
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );

      case "text":
      default:
        return (
          <Input
            {...fieldProps}
            type="text"
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            pattern={field.pattern}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  const isStepAccessible = (section: StepFormSection, index: number) => {
    if (index === 0) return true;
    if (section.isLocked) return false;

    // 이전 단계가 완료되었는지 확인
    const previousSection = sections[index - 1];
    return completedSteps.includes(previousSection.id);
  };

  if (!isMounted) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2" aria-hidden="true" />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={(value) => patch({ openItems: value })}
        className="w-full"
      >
        {sections.map((section, index) => {
          const isAccessible = isStepAccessible(section, index);
          const isCompleted = completedSteps.includes(section.id);

          return (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger
                className="text-lg font-semibold"
                disabled={!isAccessible}
              >
                Step {index + 1}: {section.title}
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {section.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {section.description}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label
                        htmlFor={field.name}
                        className="text-sm font-medium"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {renderField(field, section.id)}
                      {field.description && !errors[field.name] && (
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {field.description}
                        </p>
                      )}
                      {errors[field.name] && (
                        <p
                          id={`${field.name}-error`}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {!isCompleted && (
                  <Button
                    type="button"
                    onClick={() => handleStepComplete(section)}
                    className="mt-4"
                    disabled={stepLoading === section.id}
                  >
                    {stepLoading === section.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : index === sections.length - 1 ? (
                      "Preprocess"
                    ) : (
                      "다음 단계로"
                    )}
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* 모든 단계가 완료되면 최종 제출 버튼 표시하지 않음 - 각 단계의 onStepComplete에서 처리 */}
    </form>
  );
}
