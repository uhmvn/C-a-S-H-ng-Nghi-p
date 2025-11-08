
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Key, Lock, CheckSquare, Square, Save, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

export default function AdminRBAC() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [newRole, setNewRole] = useState({
    role_key: '',
    role_name: '',
    description: '',
    level: 1,
    is_active: true
  });
  const [newPermission, setNewPermission] = useState({
    permission_key: '',
    permission_name: '',
    description: '',
    resource: 'student',
    action: 'read',
    scope: 'own',
    is_active: true
  });

  // Fetch data
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: []
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Permission.list(),
    initialData: []
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => base44.entities.RolePermission.list(),
    initialData: []
  });

  // Group permissions by resource
  const permissionsByResource = useMemo(() => {
    const grouped = {};
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) grouped[perm.resource] = [];
      grouped[perm.resource].push(perm);
    });
    return grouped;
  }, [permissions]);

  // Get permissions for selected role
  const getRolePermissions = (roleKey) => {
    return rolePermissions
      .filter(rp => rp.role_key === roleKey && rp.is_granted)
      .map(rp => rp.permission_key);
  };

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsAddRoleOpen(false);
      setNewRole({ role_key: '', role_name: '', description: '', level: 1, is_active: true });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.Permission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setIsAddPermissionOpen(false);
      setNewPermission({
        permission_key: '',
        permission_name: '',
        description: '',
        resource: 'student',
        action: 'read',
        scope: 'own',
        is_active: true
      });
    }
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Permission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setEditingPermission(null);
    }
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: (id) => base44.entities.Permission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    }
  });

  // Toggle permission mutation
  const togglePermissionMutation = useMutation({
    mutationFn: async ({ roleKey, permissionKey, isGranted }) => {
      const existing = rolePermissions.find(
        rp => rp.role_key === roleKey && rp.permission_key === permissionKey
      );

      if (existing) {
        return await base44.entities.RolePermission.update(existing.id, {
          ...existing,
          is_granted: !isGranted
        });
      } else {
        return await base44.entities.RolePermission.create({
          role_key: roleKey,
          permission_key: permissionKey,
          is_granted: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
    }
  });

  const handleTogglePermission = (roleKey, permissionKey, isCurrentlyGranted) => {
    togglePermissionMutation.mutate({ roleKey, permissionKey, isGranted: isCurrentlyGranted });
  };

  const rolePermissionsMap = useMemo(() => {
    const map = {};
    roles.forEach(role => {
      map[role.role_key] = getRolePermissions(role.role_key);
    });
    return map;
  }, [roles, rolePermissions]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-gray-500">Admin</li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Quản lý phân quyền (RBAC)</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Phân Quyền</h1>
          <p className="text-gray-600">
            Role-Based Access Control - Quản lý vai trò và quyền truy cập hệ thống
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-xl mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-blue-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Hệ thống RBAC (Role-Based Access Control)
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Role</strong>: Vai trò xác định vị trí của người dùng (Học sinh, GV, Admin...)</p>
                <p>• <strong>Permission</strong>: Quyền xác định hành động được phép (Xem, Sửa, Tạo, Xóa...)</p>
                <p>• <strong>Scope</strong>: Phạm vi áp dụng quyền (Own, Class, Subject, School, All)</p>
                <p>• <strong>Matrix</strong>: Ma trận Role × Permission để gán quyền</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("roles")}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === "roles"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Shield className="w-5 h-5 inline mr-2" />
            Vai trò ({roles.length})
            {activeTab === "roles" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === "permissions"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Key className="w-5 h-5 inline mr-2" />
            Quyền ({permissions.length})
            {activeTab === "permissions" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === "matrix"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Lock className="w-5 h-5 inline mr-2" />
            Ma trận phân quyền
            {activeTab === "matrix" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsAddRoleOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Thêm vai trò
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vai trò</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mô tả</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cấp độ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Số quyền</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Shield className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{role.role_name}</p>
                              <p className="text-xs text-gray-500">{role.role_key}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-6 rounded ${
                                  i < role.level ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            <Key className="w-3 h-3" />
                            {rolePermissionsMap[role.role_key]?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            role.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {role.is_active ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRole(role)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Xóa vai trò "${role.role_name}"?`)) {
                                  deleteRoleMutation.mutate(role.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="space-y-6">
            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <div key={resource} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                  {resource.replace('_', ' ')}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{perm.permission_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {perm.action}
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {perm.scope}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "matrix" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                      Quyền / Vai trò
                    </th>
                    {roles.map((role) => (
                      <th key={role.id} className="px-4 py-4 text-center text-sm font-semibold text-gray-900 min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          <span>{role.role_name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <React.Fragment key={resource}>
                      <tr className="bg-gray-50">
                        <td colSpan={roles.length + 1} className="px-6 py-3 text-sm font-bold text-gray-900 uppercase">
                          {resource.replace('_', ' ')}
                        </td>
                      </tr>
                      {perms.map((perm) => (
                        <tr key={perm.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 sticky left-0 bg-white">
                            <div>
                              <p className="font-medium">{perm.permission_name}</p>
                              <p className="text-xs text-gray-500">{perm.permission_key}</p>
                            </div>
                          </td>
                          {roles.map((role) => {
                            const isGranted = rolePermissionsMap[role.role_key]?.includes(perm.permission_key);
                            return (
                              <td key={role.id} className="px-4 py-4 text-center">
                                <button
                                  onClick={() => handleTogglePermission(role.role_key, perm.permission_key, isGranted)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  {isGranted ? (
                                    <CheckSquare className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <Square className="w-6 h-6 text-gray-300" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modals */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">Thêm vai trò mới</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="role_key (vd: new_role)"
                value={newRole.role_key}
                onChange={(e) => setNewRole({...newRole, role_key: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Tên vai trò"
                value={newRole.role_name}
                onChange={(e) => setNewRole({...newRole, role_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Mô tả"
                value={newRole.description}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <input
                type="number"
                placeholder="Level (1-5)"
                value={newRole.level}
                onChange={(e) => setNewRole({...newRole, level: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg"
                min="1"
                max="5"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddRoleOpen(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => createRoleMutation.mutate(newRole)}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg"
              >
                Tạo
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">Chỉnh sửa vai trò</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="role_key (vd: new_role)"
                value={editingRole.role_key}
                onChange={(e) => setEditingRole({...editingRole, role_key: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                disabled // Role key usually not editable after creation
              />
              <input
                type="text"
                placeholder="Tên vai trò"
                value={editingRole.role_name}
                onChange={(e) => setEditingRole({...editingRole, role_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Mô tả"
                value={editingRole.description}
                onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <input
                type="number"
                placeholder="Level (1-5)"
                value={editingRole.level}
                onChange={(e) => setEditingRole({...editingRole, level: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg"
                min="1"
                max="5"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="role-active"
                  checked={editingRole.is_active}
                  onChange={(e) => setEditingRole({...editingRole, is_active: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="role-active" className="text-sm font-medium text-gray-700">Hoạt động</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingRole(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => updateRoleMutation.mutate({ id: editingRole.id, data: editingRole })}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg"
              >
                Lưu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
