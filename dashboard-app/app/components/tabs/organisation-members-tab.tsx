"use client";

import { FiTrash2, FiEdit2 } from "react-icons/fi";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: string;
  status: string;
  lastLogin: Date | null;
};

type MembersTabProps = {
  members: Member[];
};

export function MembersTab({ members }: MembersTabProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Add Member
          </button>
        </div>
        <p className="text-gray-600">
          Manage your organisation's team members and their access levels.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="my-table">
          <thead>
            <tr>
              <th>                Name
              </th>
              <th>
                Email
              </th>
              <th >
                Role
              </th>
              <th >
                Status
              </th>
              <th >
                Last Login
              </th>
              <th >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} >
                <td>
                  {member.firstName} {member.lastName}
                </td>
                <td>{member.email}</td>
                <td>
                  <span className="px-3 py-1 bg-[#649DAD]/10 text-[#649DAD] rounded-full font-medium">
                    {member.accountType}
                  </span>
                </td>
                <td >
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    {member.status}
                  </span>
                </td>
                <td >
                  {member.lastLogin ? member.lastLogin.toLocaleString() : "Never"}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                      title="Edit member"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    {member.accountType !== "Account owner" && (
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete member"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
