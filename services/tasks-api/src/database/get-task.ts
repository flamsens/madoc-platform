import { DatabasePoolConnectionType, sql } from 'slonik';
import { mapSingleTask } from '../utility/map-single-task';

export async function getTask(
  connection: DatabasePoolConnectionType,
  {
    id,
    user,
    scope,
    context,
    page = 1,
    perPage = 20,
  }: {
    id: string;
    scope: string[];
    user: { id: string; name: string };
    context: string[];
    page?: number;
    perPage?: number;
  }
) {
  const isAdmin = scope.indexOf('tasks.admin') !== -1;
  const userId = user.id;
  const userCheck = isAdmin ? sql`` : sql`AND (t.creator_id = ${userId} OR t.assignee_id = ${userId})`;

  const offset = (page - 1) * perPage;
  const subtaskPagination = sql`limit ${perPage} offset ${offset}`;

  const fullTaskList = sql`
      select *
      from tasks
      where context ?& ${sql.array(context, 'text')}
        ${userCheck}
        and (id = ${id} or parent_task = ${id}) order by created_at
    `;

  const { rowCount } = await connection.query(fullTaskList);

  // Not an admin.
  const taskList = await connection.many(
    sql`
        with task_list as (${fullTaskList})
        select *
        from task_list
        where id = ${id}
        union
        ( 
            select *
            from task_list
            where parent_task = ${id}
            ${subtaskPagination}
        )
    `
  );

  const actualTask = taskList.find(t => t.id === id);
  const subtasks = taskList.filter(t => t.id !== id);

  const task = mapSingleTask(actualTask, subtasks);

  task.pagination = {
    page,
    total_results: rowCount,
    total_pages: Math.ceil(rowCount / perPage),
  };

  return task;
}