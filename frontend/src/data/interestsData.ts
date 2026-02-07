import {
  Code,
  Palette,
  Laptop,
  Globe,
  Server,
  Database,
  Smartphone,
  Layout,
  PenTool,
  Image,
  Music,
  Video,
  Cpu,
  Activity,
  Zap,
} from "lucide-react";
import React from "react";

export interface InterestNode {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  children?: InterestNode[];
}

export const interestsTree: InterestNode[] = [
  {
    id: "tech",
    label: "Technology",
    icon: Laptop,
    description: "Software, Hardware, and Digital Innovation",
    children: [
      {
        id: "web-dev",
        label: "Web Development",
        icon: Globe,
        description: "Building modern web applications",
        children: [
          {
            id: "frontend",
            label: "Frontend",
            icon: Layout,
            description: "UI/UX, React, Vue",
          },
          {
            id: "backend",
            label: "Backend",
            icon: Server,
            description: "Node.js, Python, Go",
          },
          {
            id: "fullstack",
            label: "Full Stack",
            icon: Code,
            description: "End-to-end development",
          },
        ],
      },
      {
        id: "mobile-dev",
        label: "Mobile Dev",
        icon: Smartphone,
        description: "iOS, Android, and Cross-platform",
        children: [
          {
            id: "ios",
            label: "iOS",
            icon: Smartphone,
            description: "Swift, SwiftUI",
          },
          {
            id: "android",
            label: "Android",
            icon: Smartphone,
            description: "Kotlin, Jetpack Compose",
          },
          {
            id: "flutter",
            label: "Flutter",
            icon: Zap,
            description: "Cross-platform apps",
          },
        ],
      },
      {
        id: "data-science",
        label: "Data Science",
        icon: Database,
        description: "AI, ML, and Big Data",
      },
    ],
  },
  {
    id: "design",
    label: "Design",
    icon: Palette,
    description: "Visual, UI/UX, and Graphic Design",
    children: [
      {
        id: "ui-ux",
        label: "UI/UX Design",
        icon: Layout,
        description: "User interfaces and experiences",
      },
      {
        id: "graphic-design",
        label: "Graphic Design",
        icon: Image,
        description: "Branding, logos, and illustrations",
      },
      {
        id: "illustration",
        label: "Illustration",
        icon: PenTool,
        description: "Digital art and drawing",
      },
    ],
  },
  {
    id: "creative",
    label: "Creative Arts",
    icon: Music,
    description: "Music, Video, and Writing",
    children: [
      {
        id: "music-prod",
        label: "Music Production",
        icon: Music,
        description: "Composition and mixing",
      },
      {
        id: "video-editing",
        label: "Video Editing",
        icon: Video,
        description: "Post-production and VFX",
      },
    ],
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Activity,
    description: "Optimization and Workflow",
    children: [
      {
        id: "automation",
        label: "Automation",
        icon: Cpu,
        description: "Scripting and workflow automation",
      },
    ],
  },
];
