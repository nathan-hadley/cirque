import { VALIDATION_CONSTRAINTS } from "@/types/problemSubmission";
import { FieldName, getVisibleErrors, validateForm } from "./validation";

jest.mock("@/components/ui/text", () => ({ Text: "Text" }));

const validForm = {
  contactName: "Climber",
  contactEmail: "climber@example.com",
  name: "Problem",
  grade: "V3",
  area: "Area",
  latitude: "47.5",
  longitude: "-120.5",
  description: "A great climb.",
  topoData: { selectedTopoKey: null, selectedTopoUri: null, pickedImage: null, linePixels: [] },
};

describe("validateForm", () => {
  it.each([
    ["contactName", { contactName: "" }, "Please enter your name."],
    ["contactEmail", { contactEmail: "" }, "Please enter your email."],
    ["name", { name: "" }, "Please enter a problem name."],
    ["area", { area: "" }, "Please enter an area."],
    ["description", { description: "" }, "Please enter a description."],
    ["grade", { grade: null }, "Select a grade."],
  ] as const)("reports missing %s", (field, changes, message) => {
    expect(validateForm({ ...validForm, ...changes })[field]).toBe(message);
  });

  it("checks maximum lengths and email format", () => {
    expect(
      validateForm({
        ...validForm,
        contactName: "a".repeat(VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH + 1),
      }).contactName
    ).toBe(`Name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less.`);
    expect(
      validateForm({ ...validForm, name: "a".repeat(VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH + 1) })
        .name
    ).toBe(`Problem name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less.`);
    expect(
      validateForm({
        ...validForm,
        description: "a".repeat(VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH + 1),
      }).description
    ).toBe(
      `Description must be ${VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters or less.`
    );
    expect(validateForm({ ...validForm, contactEmail: "not-an-email" }).contactEmail).toBe(
      "Please enter a valid email."
    );
    expect(validateForm(validForm).contactEmail).toBeUndefined();
  });

  it.each([
    ["91", "0"],
    ["0", "181"],
    ["not-a-number", "0"],
  ])("rejects invalid coordinates %s, %s", (latitude, longitude) => {
    expect(validateForm({ ...validForm, latitude, longitude }).coordinates).toBeDefined();
  });

  it("accepts in-range coordinates, optional topos, and a complete form", () => {
    expect(validateForm(validForm)).toEqual({});
  });

  it("requires a route line only when a topo is selected", () => {
    expect(validateForm(validForm).topo).toBeUndefined();
    expect(
      validateForm({
        ...validForm,
        topoData: { ...validForm.topoData, selectedTopoKey: "topo-key" },
      }).topo
    ).toBe("Please draw the route line.");
  });

  it("requires a route line when a picked topo image is present", () => {
    expect(
      validateForm({
        ...validForm,
        topoData: {
          ...validForm.topoData,
          pickedImage: { uri: "file:///topo.jpg", width: 1, height: 1 },
        },
      }).topo
    ).toBe("Please draw the route line.");
  });

  it("rejects route lines with too many points", () => {
    expect(
      validateForm({
        ...validForm,
        topoData: {
          ...validForm.topoData,
          linePixels: Array.from(
            { length: VALIDATION_CONSTRAINTS.LINE_MAX_POINTS + 1 },
            () => [0, 0] as [number, number]
          ),
        },
      }).topo
    ).toBe(`Line must have ${VALIDATION_CONSTRAINTS.LINE_MAX_POINTS} points or fewer.`);
  });
});

describe("getVisibleErrors", () => {
  const errors = { name: "Required", grade: "Select a grade." };

  it("hides untouched errors until submit is attempted", () => {
    expect(getVisibleErrors(errors, new Set<FieldName>(["name"]), false)).toEqual({
      name: "Required",
    });
    expect(getVisibleErrors(errors, new Set<FieldName>(), true)).toEqual(errors);
  });
});
