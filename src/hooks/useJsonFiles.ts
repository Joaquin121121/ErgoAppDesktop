import { invoke } from "@tauri-apps/api/core";

interface JsonResponse {
  message: string;
  data?: any;
}

interface FileData {
  name: string;
  content: any;
}

interface DirectoryJsonResponse {
  message: string;
  files: FileData[];
}

export const useJsonFiles = () => {
  const saveJson = async (
    filename: string,
    content: any,
    directory?: string
  ): Promise<JsonResponse> => {
    try {
      const response = await invoke<JsonResponse>("save_json", {
        filename,
        content,
        directory,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to save JSON: ${error}`);
    }
  };

  const readJson = async (
    filename: string,
    directory?: string
  ): Promise<JsonResponse> => {
    try {
      const response = await invoke<JsonResponse>("read_json", {
        filename,
        directory,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to read JSON: ${error}`);
    }
  };

  const readDirectoryJsons = async (
    directory: string
  ): Promise<DirectoryJsonResponse> => {
    try {
      const response = await invoke<DirectoryJsonResponse>(
        "read_directory_jsons",
        {
          directory,
        }
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to read directory JSONs: ${error}`);
    }
  };

  const deleteJson = async (
    filename: string,
    directory?: string
  ): Promise<JsonResponse> => {
    try {
      const response = await invoke<JsonResponse>("delete_json", {
        filename,
        directory,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to delete JSON: ${error}`);
    }
  };

  return {
    saveJson,
    readJson,
    readDirectoryJsons,
    deleteJson,
  };
};
