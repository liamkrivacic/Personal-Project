import type { Metadata } from "next";
import { ProjectsPage } from "@/components/projects/projects-page";

export const metadata: Metadata = {
  title: "Projects — Liam Krivacic",
  description:
    "RF plasma systems, robotics, software, and hardware projects by Liam Krivacic.",
};

export default function Projects() {
  return <ProjectsPage />;
}
