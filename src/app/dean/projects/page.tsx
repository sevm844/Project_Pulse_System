import Link from "next/link";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { deanProjects } from "../_data/mockDeanData";

export default function DeanProjectsPage() {
  return (
    <DeanShell title="Projects Monitoring">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            All Projects
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Monitor all groups by course, section, adviser, stage, risk, and
            final requirement status.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
              <tr>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">Group</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Adviser</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf2ec]">
              {deanProjects.map((project) => (
                <tr key={project.id} className="hover:bg-[#fbfdfb]">
                  <td className="px-5 py-4">{project.course}</td>
                  <td className="px-5 py-4">{project.section}</td>
                  <td className="px-5 py-4 font-semibold text-[#203028]">
                    {project.groupName}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">
                    {project.projectTitle}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">
                    {project.adviser}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">
                    {project.stage}
                  </td>
                  <td className="px-5 py-4">{project.progress}%</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={project.riskLevel} />
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/dean/projects/${project.id}`}
                      className="rounded-lg bg-[#202823] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                    >
                      Open Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DeanShell>
  );
}
