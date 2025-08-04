
import { type DeleteTodoInput } from '../schema';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean }> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is deleting a todo task from the database.
    // Should delete the todo with the specified id
    // Should throw error if todo with given id doesn't exist
    return Promise.resolve({ success: true });
};
