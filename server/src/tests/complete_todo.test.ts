
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CompleteTodoInput } from '../schema';
import { completeTodo } from '../handlers/complete_todo';
import { eq } from 'drizzle-orm';

describe('completeTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark todo as complete', async () => {
    // Create a test todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const testInput: CompleteTodoInput = {
      id: createdTodo[0].id,
      completed: true
    };

    const result = await completeTodo(testInput);

    // Verify the todo was marked as complete
    expect(result.id).toEqual(createdTodo[0].id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo[0].updated_at.getTime());
  });

  it('should mark todo as incomplete', async () => {
    // Create a completed test todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed todo',
        completed: true
      })
      .returning()
      .execute();

    const testInput: CompleteTodoInput = {
      id: createdTodo[0].id,
      completed: false
    };

    const result = await completeTodo(testInput);

    // Verify the todo was marked as incomplete
    expect(result.id).toEqual(createdTodo[0].id);
    expect(result.title).toEqual('Completed Todo');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo[0].updated_at.getTime());
  });

  it('should update todo in database', async () => {
    // Create a test todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const testInput: CompleteTodoInput = {
      id: createdTodo[0].id,
      completed: true
    };

    await completeTodo(testInput);

    // Query the database to verify the update
    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo[0].id))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    expect(updatedTodos[0].completed).toEqual(true);
    expect(updatedTodos[0].updated_at).toBeInstanceOf(Date);
    expect(updatedTodos[0].updated_at.getTime()).toBeGreaterThan(createdTodo[0].updated_at.getTime());
  });

  it('should throw error for non-existent todo', async () => {
    const testInput: CompleteTodoInput = {
      id: 999999, // Non-existent ID
      completed: true
    };

    await expect(completeTodo(testInput)).rejects.toThrow(/todo with id 999999 not found/i);
  });

  it('should preserve other todo fields when updating completion status', async () => {
    // Create a test todo with specific values
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Preserve Fields Todo',
        description: 'This should remain unchanged',
        completed: false
      })
      .returning()
      .execute();

    const testInput: CompleteTodoInput = {
      id: createdTodo[0].id,
      completed: true
    };

    const result = await completeTodo(testInput);

    // Verify all fields are preserved except completed and updated_at
    expect(result.title).toEqual('Preserve Fields Todo');
    expect(result.description).toEqual('This should remain unchanged');
    expect(result.created_at).toEqual(createdTodo[0].created_at);
    expect(result.completed).toEqual(true);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo[0].updated_at.getTime());
  });
});
