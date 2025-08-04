
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper to create a test todo
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      completed: false
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    const todo = await createTestTodo({
      title: 'Test Todo',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.description).toEqual('Updated description');
    expect(result.title).toEqual('Test Todo'); // Unchanged
  });

  it('should update completed status', async () => {
    const todo = await createTestTodo({
      title: 'Test Todo',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.completed).toEqual(true);
    expect(result.title).toEqual('Test Todo'); // Unchanged
    expect(result.description).toEqual('Test description'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    const todo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const todo = await createTestTodo({
      title: 'Test Todo',
      description: 'Has description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Test Todo'); // Unchanged
  });

  it('should save changes to database', async () => {
    const todo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Database Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes are persisted
    const savedTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo.id))
      .execute();

    expect(savedTodo).toHaveLength(1);
    expect(savedTodo[0].title).toEqual('Database Title');
    expect(savedTodo[0].completed).toEqual(true);
    expect(savedTodo[0].description).toEqual('Original description');
    expect(savedTodo[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999,
      title: 'Non-existent todo'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    const todo = await createTestTodo({
      title: 'Test Todo',
      description: 'Test description'
    });

    const originalUpdatedAt = todo.updated_at;

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTodoInput = {
      id: todo.id
    };

    const result = await updateTodo(updateInput);

    expect(result.title).toEqual('Test Todo'); // Unchanged
    expect(result.description).toEqual('Test description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});
