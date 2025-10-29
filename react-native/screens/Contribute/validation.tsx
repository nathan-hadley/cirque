import React from "react";
import { Text } from "@/components/ui/text";
import { GRADES } from "@/models/problems";

export type FieldErrors = {
  contactName?: string;
  contactEmail?: string;
  name?: string;
  grade?: string;
  area?: string;
  coordinates?: string;
  description?: string;
  topo?: string;
};

export type FieldName = keyof FieldErrors;

export function FieldError({ message }: { message?: string }): React.JSX.Element | null {
  if (!message) return null;
  return <Text className="text-error-600">{message}</Text>;
}

type ValidateFormProps = {
  contactName: string;
  contactEmail: string;
  name: string;
  grade: string | null;
  area: string;
  latitude: string;
  longitude: string;
  description: string;
  topo: string | null;
  line: number[][];
};

export function validateForm({
  contactName,
  contactEmail,
  name,
  grade,
  area,
  latitude,
  longitude,
  description,
  line,
  topo,
}: ValidateFormProps): FieldErrors {
  const errors: FieldErrors = {};

  if (!contactName.trim()) {
    errors.contactName = "Please enter your name.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contactEmail.trim()) {
    errors.contactEmail = "Please enter your email.";
  } else if (!emailRegex.test(contactEmail)) {
    errors.contactEmail = "Please enter a valid email.";
  }

  if (!name.trim()) {
    errors.name = "Please enter a problem name.";
  }

  if (!grade || !GRADES.includes(grade)) {
    errors.grade = "Select a grade.";
  }

  if (!area.trim()) {
    errors.area = "Please enter an area.";
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const isValidCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!isValidCoords) {
    errors.coordinates = "Enter valid lat and lng.";
  }

  if (!description.trim()) {
    errors.description = "Please enter a description.";
  }

  const hasTopo = topo?.trim();

  if (!hasTopo) {
    errors.topo = "Please select or upload a topo image.";
  }

  if (hasTopo && !line.length) {
    errors.topo = "Please draw the route line.";
  }

  return errors;
}

export function getVisibleErrors(
  errors: FieldErrors,
  touched: Set<FieldName>,
  submitAttempted: boolean
): FieldErrors {
  if (submitAttempted) return errors;

  return Object.entries(errors).reduce((visible, [field, message]) => {
    if (touched.has(field as FieldName)) {
      visible[field as FieldName] = message;
    }
    return visible;
  }, {} as FieldErrors);
}

