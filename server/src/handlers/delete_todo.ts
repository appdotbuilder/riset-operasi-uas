
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean }> => {
  try {
    // First check if the todo exists
    const existingTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (existingTodo.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    // Delete the todo
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};
