/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  getTodos,
  createTodo,
  USER_ID,
  deleteTodo,
  updateTodo,
} from './api/todos';
import { NewTodo } from './Components/NewTodo';
import { TodoList } from './Components/TodoList';
import { ErrorNotification } from './Components/ErrorNotification';
import { Todo } from './types/Todo';
import { Footer } from './Components/Footer/Footer';
import { FILTERS } from './types/Filters';

function getFilteredTodos(todos: Todo[], selectedStatus: FILTERS) {
  return todos.filter(todo => {
    switch (selectedStatus) {
      case FILTERS.active:
        return !todo.completed;

      case FILTERS.completed:
        return todo.completed;

      case FILTERS.all:
      default:
        return true;
    }
  });
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(FILTERS.all);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const visibleTodos = useMemo(() => {
    return getFilteredTodos(todos, selectedStatus);
  }, [todos, selectedStatus]);

  useEffect(() => {
    setErrorMessage('');
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  function addTodo(title: string) {
    setErrorMessage('');

    setTempTodo({
      id: 0,
      title,
      userId: USER_ID,
      completed: false,
    });

    return createTodo({
      title,
      userId: USER_ID,
      completed: false,
    })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch(err => {
        setErrorMessage('Unable to add a todo');
        throw err;
      })
      .finally(() => {
        setTempTodo(null);
      });
  }

  function removeTodo(todoId: number) {
    setErrorMessage('');

    setLoadingTodoIds(currentIds => [...currentIds, todoId]);

    return deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(err => {
        setErrorMessage('Unable to delete a todo');
        throw err;
      })
      .finally(() => {
        setLoadingTodoIds(currentTodos =>
          currentTodos.filter(id => id !== todoId),
        );
        inputRef.current?.focus();
      });
  }

  function handleClearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed === true);

    completedTodos.forEach(todo => removeTodo(todo.id));
  }

  function toggleTodo(todoToUpdate: Todo) {
    setErrorMessage('');
    setLoadingTodoIds(currentIds => [...currentIds, todoToUpdate.id]);

    return updateTodo({
      ...todoToUpdate,
      completed: !todoToUpdate.completed,
    })
      .then(updatedTodo => {
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo,
          ),
        );
      })
      .catch(err => {
        setErrorMessage('Unable to update a todo');
        throw err;
      })
      .finally(() => {
        setLoadingTodoIds(currentIds =>
          currentIds.filter(id => id !== todoToUpdate.id),
        );
      });
  }

  function renameTodo(todoToUpdate: Todo, newTitle: string) {
    setErrorMessage('');
    setLoadingTodoIds(currentIds => [...currentIds, todoToUpdate.id]);

    return updateTodo({
      ...todoToUpdate,
      title: newTitle,
    })
      .then(updatedTodo => {
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo,
          ),
        );
      })
      .catch(err => {
        setErrorMessage('Unable to update a todo');
        throw err;
      })
      .finally(() => {
        setLoadingTodoIds(currentIds =>
          currentIds.filter(id => id !== todoToUpdate.id),
        );
      });
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <NewTodo
          todos={todos}
          onAdd={addTodo}
          onErrorMessage={setErrorMessage}
          inputRef={inputRef}
          onToggle={toggleTodo}
        />

        {(todos.length > 0 || tempTodo) && (
          <TodoList
            todos={visibleTodos}
            tempTodo={tempTodo}
            loadingTodoIds={loadingTodoIds}
            onDelete={removeTodo}
            onToggle={toggleTodo}
            onRename={renameTodo}
          />
        )}

        {todos.length > 0 && (
          <Footer
            todos={todos}
            selectedStatus={selectedStatus}
            onSelectedStatus={setSelectedStatus}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        onErrorMessage={setErrorMessage}
      />
    </div>
  );
};
