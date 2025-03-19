import { TestState } from "../types/TestReducer";
import { useJsonFiles } from "./useJsonFiles";
import { createTest } from "../types/Studies";
import { naturalToCamelCase } from "../utils/utils";

export async function saveTest({ state }: { state: TestState }) {
  const { saveJson } = useJsonFiles();

  try {
    const test = createTest(state);
    const athleteName = state.athlete.name;

    const newAthleteState = {
      ...state.athlete,
      completedStudies: [...state.athlete.completedStudies, test],
    };

    const result = await saveJson(
      `${naturalToCamelCase(athleteName)}.json`,
      newAthleteState,
      "athletes"
    );
    console.log(result.message);
  } catch (error) {
    console.log(error);
  }
}
