<script lang="ts">
  import {
    getAllTodo,
    createTodo,
    updateTodo,
    deleteTodo,
    type Todo,
  } from "@nota/db-local";
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { slide } from "svelte/transition";

  let todos = $state<Todo[]>([]);
  let newTitle = $state("");
  let newDescription = $state("");
  let isLoading = $state(true);

  // Derived state: active todos top, completed todos bottom
  let sortedTodos = $derived(
    [...todos].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    }),
  );

  onMount(async () => {
    try {
      todos = await getAllTodo();
    } catch (e) {
      console.error("Failed to load todos:", e);
    } finally {
      isLoading = false;
    }
  });

  async function handleAddTodo(e: SubmitEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const added = await createTodo({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        completed: 0,
      });
      todos = [added, ...todos];
      newTitle = "";
      newDescription = "";
    } catch (e) {
      console.error("Failed to create todo:", e);
    }
  }

  async function handleToggle(todo: Todo) {
    const nextCompleted = todo.completed ? 0 : 1;
    todos = todos.map((t) =>
      t.id === todo.id ? { ...t, completed: nextCompleted } : t,
    );

    try {
      await updateTodo(todo.id, { completed: nextCompleted });
    } catch (e) {
      console.error("Failed to update todo:", e);
      todos = todos.map((t) =>
        t.id === todo.id ? { ...t, completed: todo.completed } : t,
      );
    }
  }

  async function handleDelete(id: string) {
    const prev = todos;
    todos = todos.filter((t) => t.id !== id);

    try {
      await deleteTodo(id);
    } catch (e) {
      console.error("Failed to delete todo:", e);
      todos = prev;
    }
  }
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
  <header class="flex items-center justify-between border-b pb-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tasks</h1>
      <p class="text-sm text-muted-foreground">
        Manage your daily tasks and to-dos.
      </p>
    </div>
    <span class="text-xs font-semibold px-3 py-1 bg-secondary rounded-full">
      {todos.filter((t) => !t.completed).length} remaining
    </span>
  </header>

  <!-- Create Form -->
  <form
    onsubmit={handleAddTodo}
    class="space-y-3 bg-card p-4 rounded-xl border shadow-sm"
  >
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={newTitle}
        placeholder="What needs to be done?"
        class="flex-1 bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <button
        type="submit"
        disabled={!newTitle.trim()}
        class="bg-primary text-primary-foreground font-medium text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
      >
        Add
      </button>
    </div>
    <input
      type="text"
      bind:value={newDescription}
      placeholder="Optional description..."
      class="w-full bg-background border rounded-lg px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  </form>

  <!-- Todo List -->
  {#if isLoading}
    <div class="py-12 text-center text-sm text-muted-foreground">
      Loading tasks...
    </div>
  {:else if sortedTodos.length === 0}
    <div class="py-12 text-center border border-dashed rounded-xl space-y-1">
      <p class="font-medium text-sm">No tasks found</p>
      <p class="text-xs text-muted-foreground">Add one above to get started!</p>
    </div>
  {:else}
    <ul class="space-y-2">
      {#each sortedTodos as todo (todo.id)}
        <li
          animate:flip={{ duration: 300 }}
          transition:slide={{ duration: 200 }}
          class="group flex items-start justify-between gap-3 p-3 bg-card rounded-xl border shadow-sm transition-all hover:border-primary/30"
          class:opacity-60={todo.completed}
        >
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <button
              type="button"
              onclick={() => handleToggle(todo)}
              class="mt-0.5 text-muted-foreground hover:text-primary transition"
              aria-label={todo.completed
                ? "Mark as incomplete"
                : "Mark as complete"}
            >
              {#if todo.completed}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                  />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              {/if}
            </button>
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-medium leading-tight truncate"
                class:line-through={todo.completed}
                class:text-muted-foreground={todo.completed}
              >
                {todo.title}
              </p>
              {#if todo.description}
                <p class="text-xs text-muted-foreground mt-0.5 truncate">
                  {todo.description}
                </p>
              {/if}
            </div>
          </div>

          <button
            type="button"
            onclick={() => handleDelete(todo.id)}
            class="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition p-1 rounded-md"
            aria-label="Delete task"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
