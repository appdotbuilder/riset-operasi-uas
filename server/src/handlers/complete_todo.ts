
import { type CompleteTodoInput, type Todo } from '../schema';

export const completeTodo = async (input: CompleteTodoInput): Promise<Todo> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is marking a todo task as complete/incomplete.
    // Should update the completed field and set updated_at to current timestamp
    // Should throw error if todo with given id doesn't exist
    return Promise.resolve({
        id: input.id,
        title: "Placeholder title",
        description: null,
        completed: input.completed,
        created_at: new Date(),
        updated_at: new Date()
    } as Todo);
};
