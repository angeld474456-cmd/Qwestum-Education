import { Quest } from "@/types/quest";

export class QuestService {
  async getAll(): Promise<Quest[]> {
    return [];
  }

  async getById(id: string): Promise<Quest | null> {
    return null;
  }

  async create(data: Quest) {
    return data;
  }

  async update(id: string, data: Partial<Quest>) {
    return { id, ...data };
  }

  async delete(id: string) {
    return true;
  }
}