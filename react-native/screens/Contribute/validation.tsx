import React from "react";
import { VALIDATION_CONSTRAINTS } from "@cirque-api/types";
import { Text } from "@/components/ui/text";
import { GRADES } from "@/models/problems";
import type { TopoData } from "./TopoPicker";

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

type ValidateFormProps = {
  contactName: string;
  contactEmail: string;
  name: string;
  grade: string | null;
  area: string;
  latitude: string;
  longitude: string;
  description: string;
  topoData: TopoData;
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
  topoData,
}: ValidateFormProps): FieldErrors {
  const errors: FieldErrors = {};

  // Contact name validation
  if (!contactName.trim()) {
    errors.contactName = "Please enter your name.";
  } else if (contactName.length > VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH) {
    errors.contactName = `Name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less.`;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contactEmail.trim()) {
    errors.contactEmail = "Please enter your email.";
  } else if (!emailRegex.test(contactEmail)) {
    errors.contactEmail = "Please enter a valid email.";
  }

  // Problem name validation
  if (!name.trim()) {
    errors.name = "Please enter a problem name.";
  } else if (name.length > VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH) {
    errors.name = `Problem name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less.`;
  }

  // Grade validation
  if (!grade || !GRADES.includes(grade)) {
    errors.grade = "Select a grade.";
  }

  // Area validation
  if (!area.trim()) {
    errors.area = "Please enter an area.";
  }

  // Coordinates validation
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const isValidCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= VALIDATION_CONSTRAINTS.LAT_MIN &&
    lat <= VALIDATION_CONSTRAINTS.LAT_MAX &&
    lng >= VALIDATION_CONSTRAINTS.LNG_MIN &&
    lng <= VALIDATION_CONSTRAINTS.LNG_MAX;

  if (!isValidCoords) {
    errors.coordinates = `Latitude must be ${VALIDATION_CONSTRAINTS.LAT_MIN} to ${VALIDATION_CONSTRAINTS.LAT_MAX}, longitude ${VALIDATION_CONSTRAINTS.LNG_MIN} to ${VALIDATION_CONSTRAINTS.LNG_MAX}.`;
  }

  // Description validation
  if (!description.trim()) {
    errors.description = "Please enter a description.";
  } else if (description.length > VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters or less.`;
  }

  // Topo validation
  const hasTopo = topoData.selectedTopoKey?.trim() || topoData.pickedImage;

  if (!hasTopo) {
    errors.topo = "Please select or upload a topo image.";
  }

  if (hasTopo && topoData.linePixels.length === 0) {
    errors.topo = "Please draw the route line.";
  }

  if (topoData.linePixels.length > VALIDATION_CONSTRAINTS.LINE_MAX_POINTS) {
    errors.topo = `Line must have ${VALIDATION_CONSTRAINTS.LINE_MAX_POINTS} points or fewer.`;
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

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="text-error-600">{message}</Text>;
}
