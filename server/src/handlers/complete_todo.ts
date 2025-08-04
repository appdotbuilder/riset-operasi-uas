
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CompleteTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const completeTodo = async (input: CompleteTodoInput): Promise<Todo> => {
  try {
    // Update the todo with new completion status and current timestamp
    const result = await db.update(todosTable)
      .set({
        completed: input.completed,
        updated_at: new Date()
      })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if todo was found and updated
    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Complete todo failed:', error);
    throw error;
  }
};
