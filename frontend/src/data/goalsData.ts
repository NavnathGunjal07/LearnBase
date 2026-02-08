import {
  Briefcase,
  BookOpen,
  User,
  Target,
  GraduationCap,
  TrendingUp,
  Globe,
  Award,
  Zap,
  Code,
  Search,
  RefreshCw,
  Palette,
  Rocket,
  ClipboardCheck,
  Lightbulb,
  FileText,
  CalendarCheck,
  Compass,
  Layers,
} from "lucide-react";
import { InterestNode } from "./interestsData";

// Reusing InterestNode interface as the structure is identical
export const goalsTree: InterestNode[] = [
  {
    id: "career",
    label: "Career Growth",
    icon: Briefcase,
    description: "Advance my professional path",
    children: [
      { id: "promotion", label: "Get Promoted", icon: TrendingUp },
      { id: "new-job", label: "Find a New Job", icon: Search },
      { id: "switch-career", label: "Switch Careers", icon: RefreshCw },
      { id: "interview-prep", label: "Interview Prep", icon: ClipboardCheck },
      { id: "portfolio", label: "Build Portfolio", icon: FileText },
    ],
  },
  {
    id: "skills",
    label: "Learn New Skills",
    icon: BookOpen,
    description: "Master new tools and technologies",
    children: [
      { id: "coding", label: "Coding", icon: Code },
      { id: "languages", label: "Languages", icon: Globe },
      { id: "soft-skills", label: "Soft Skills", icon: User },
      { id: "project-based", label: "Project-Based Learning", icon: Rocket },
      { id: "certs", label: "Earn Certifications", icon: Award },
    ],
  },
  {
    id: "academic",
    label: "Academic Success",
    icon: GraduationCap,
    description: "Excel in studies and research",
    children: [
      { id: "better-grades", label: "Improve Grades", icon: Target },
      { id: "exam-prep", label: "Exam Prep", icon: Award },
      { id: "research", label: "Research Skills", icon: Lightbulb },
    ],
  },
  {
    id: "personal",
    label: "Personal Growth",
    icon: User,
    description: "Improve myself and my life",
    children: [
      { id: "productivity", label: "Boost Productivity", icon: Zap },
      { id: "creativity", label: "Enhance Creativity", icon: Palette },
      { id: "habits", label: "Build Habits", icon: CalendarCheck },
      { id: "direction", label: "Find Direction", icon: Compass },
      { id: "knowledge-base", label: "Organize Knowledge", icon: Layers },
    ],
  },
];
