import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import { resources } from "../_data/mockStudentData";

export default function ResourcesPage() {
  return (
    <StudentShell title="Resources">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[#203028]">Resources</h2>
        <p className="mt-1 text-sm text-[#7b877f]">
          Templates, guides, rubrics, and academic references for capstone
          completion.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <div key={resource} className="rounded-xl bg-[#f8faf7] p-4">
              <p className="text-sm font-semibold text-[#203028]">
                {resource}
              </p>
              <button className="mt-4 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                Open Resource
              </button>
            </div>
          ))}
        </div>
      </Card>
    </StudentShell>
  );
}
