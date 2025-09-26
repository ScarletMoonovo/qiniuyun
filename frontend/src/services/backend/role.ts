// // @ts-ignore
// /* eslint-disable */
// import { request } from '@umijs/max';

// /** 获取角色列表 GET /api/roles */
// export async function getRoleList(
//   params?: API.GetRoleListParams,
//   options?: { [key: string]: any }
// ) {
//   return request<API.GetRoleListResponse>('/api/roles', {
//     method: 'GET',
//     params,
//     ...(options || {}),
//   });
// }

// /** 获取角色详情 GET /api/roles/:id */
// export async function getRoleDetail(
//   params: API.GetRoleParams,
//   options?: { [key: string]: any }
// ) {
//   return request<API.GetRoleResponse>(`/api/roles/${params.id}`, {
//     method: 'GET',
//     ...(options || {}),
//   });
// }

// /** 搜索角色 GET /api/roles/search */
// export async function searchRoles(
//   params: API.SearchRoleParams,
//   options?: { [key: string]: any }
// ) {
//   return request<API.SearchRoleResponse>('/api/roles/search', {
//     method: 'GET',
//     params,
//     ...(options || {}),
//   });
// }

// /** 获取角色分类 GET /api/roles/categories */
// export async function getRoleCategories(options?: { [key: string]: any }) {
//   return request<API.RoleCategory[]>('/api/roles/categories', {
//     method: 'GET',
//     ...(options || {}),
//   });
// }

// /** 获取我的角色列表 GET /api/roles/my */
// export async function getMyRoles(
//   params?: API.GetMyRolesParams,
//   options?: { [key: string]: any }
// ) {
//   return request<API.GetMyRolesResponse>('/api/roles/my', {
//     method: 'GET',
//     params,
//     ...(options || {}),
//   });
// }

// /** 创建角色 POST /api/roles */
// export async function createRole(
//   body: API.CreateRoleRequest,
//   options?: { [key: string]: any }
// ) {
//   return request<API.Role>('/api/roles', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     data: body,
//     ...(options || {}),
//   });
// }

// /** 更新角色 PUT /api/roles/:id */
// export async function updateRole(
//   id: number,
//   body: API.UpdateRoleRequest,
//   options?: { [key: string]: any }
// ) {
//   return request<API.Role>(`/api/roles/${id}`, {
//     method: 'PUT',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     data: body,
//     ...(options || {}),
//   });
// }

// /** 删除角色 DELETE /api/roles/:id */
// export async function deleteRole(
//   id: number,
//   options?: { [key: string]: any }
// ) {
//   return request<{ success: boolean }>(`/api/roles/${id}`, {
//     method: 'DELETE',
//     ...(options || {}),
//   });
// }

// /** 获取语音模型列表 GET /api/voice/models */
// export async function getVoiceModels(options?: { [key: string]: any }) {
//   return request<API.GetVoiceModelsResponse>('/api/voice/models', {
//     method: 'GET',
//     ...(options || {}),
//   });
// }

// /** 获取角色统计信息 GET /api/roles/:id/stats */
// export async function getRoleStats(
//   id: number,
//   options?: { [key: string]: any }
// ) {
//   return request<{
//     totalChats: number;
//     totalMessages: number;
//     avgRating: number;
//     lastChatAt: string;
//   }>(`/api/roles/${id}/stats`, {
//     method: 'GET',
//     ...(options || {}),
//   });
// }
