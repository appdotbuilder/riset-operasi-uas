
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithDescription: CreateTodoInput = {
  title: 'Complete project',
  description: 'Finish the todo application'
};

const testInputWithoutDescription: CreateTodoInput = {
  title: 'Buy groceries'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with description', async () => {
    const result = await createTodo(testInputWithDescription);

    // Basic field validation
    expect(result.title).toEqual('Complete project');
    expect(result.description).toEqual('Finish the todo application');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo without description', async () => {
    const result = await createTodo(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Buy groceries');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInputWithDescription);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Complete project');
    expect(todos[0].description).toEqual('Finish the todo application');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description properly', async () => {
    const result = await createTodo(testInputWithoutDescription);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Buy groceries');
    expect(todos[0].description).toBeNull();
    expect(todos[0].completed).toEqual(false);
  });

  it('should create multiple todos with unique IDs', async () => {
    const todo1 = await createTodo({ title: 'First todo' });
    const todo2 = await createTodo({ title: 'Second todo' });

    expect(todo1.id).not.toEqual(todo2.id);
    expect(todo1.title).toEqual('First todo');
    expect(todo2.title).toEqual('Second todo');

    // Verify both exist in database
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(2);
  });
});
