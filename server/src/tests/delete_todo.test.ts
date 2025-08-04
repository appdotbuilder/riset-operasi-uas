
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const newTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .returning()
      .execute();

    const todoId = newTodo[0].id;
    const input: DeleteTodoInput = { id: todoId };

    // Delete the todo
    const result = await deleteTodo(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify todo no longer exists in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should throw error if todo does not exist', async () => {
    const input: DeleteTodoInput = { id: 999 };

    // Attempt to delete non-existent todo
    await expect(deleteTodo(input)).rejects.toThrow(/not found/i);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        description: 'First todo',
        completed: false
      })
      .returning()
      .execute();

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        description: 'Second todo',
        completed: true
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = { id: todo1[0].id };

    // Delete first todo
    const result = await deleteTodo(input);
    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1[0].id))
      .execute();
    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2[0].id))
      .execute();
    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
  });
});
