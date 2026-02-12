"use client";

/**
 * Organisation Members Tab
 * Shared component in tabs/organisation-members-tab.tsx.
 */

import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";

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
    <div className="bg-white rounded-xl border border-[var(--color-border-light)] p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <DSButton>Add Member</DSButton>
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
                    <DSIconButton icon={<FiEdit2 size={18} />} label="Edit member" />
                    {member.accountType !== "Account owner" && (
                      <DSIconButton variant="danger" icon={<FiTrash2 size={18} />} label="Delete member" />
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
