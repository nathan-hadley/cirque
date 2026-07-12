import axios from "axios";
import { ProblemSubmission } from "@/types/problemSubmission";
import { submitProblem } from "./problems";

let mockApiKey = "test-key";

jest.mock("axios", () => ({
  __esModule: true,
  default: { post: jest.fn(), isAxiosError: jest.fn(error => error?.isAxiosError === true) },
}));
jest.mock("@/constants/api", () => ({
  get API_KEY() {
    return mockApiKey;
  },
  API_ENDPOINTS: { submitProblem: "https://example.test/v1/problems" },
}));

const submission: ProblemSubmission = {
  id: "id-1",
  contact: { name: "A", email: "a@example.com" },
  problem: {
    name: "Problem",
    grade: "V1",
    subarea: "Area",
    description: "Desc",
    lat: 1,
    lng: 2,
    line: [],
  },
};
const mockAxios = axios as jest.Mocked<typeof axios>;

describe("submitProblem", () => {
  beforeEach(() => {
    mockApiKey = "test-key";
    jest.clearAllMocks();
  });

  it("fails before making a request without an API key", async () => {
    mockApiKey = "";
    await expect(submitProblem(submission)).rejects.toThrow("API key is not set");
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  it("rethrows Axios network errors", async () => {
    const error = { isAxiosError: true, response: undefined };
    mockAxios.post.mockRejectedValue(error);
    await expect(submitProblem(submission)).rejects.toBe(error);
  });

  it.each([
    [{ status: 400, data: { error: "Bad" } }, "Bad"],
    [{ status: 500, data: {} }, "Server error: 500"],
  ])("turns HTTP errors into helpful messages", async (response, message) => {
    mockAxios.post.mockRejectedValue({ isAxiosError: true, response });
    await expect(submitProblem(submission)).rejects.toThrow(message);
  });

  it("returns successful API data", async () => {
    const data = { success: true } as const;
    mockAxios.post.mockResolvedValue({ data });
    await expect(submitProblem(submission)).resolves.toEqual(data);
  });
});
