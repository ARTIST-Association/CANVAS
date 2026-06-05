import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { initTheme } from "@/core/theme";
import { ProjectOverview } from "@/ui/ProjectOverview";

initTheme();
window.addEventListener("DOMContentLoaded", () => {
  new ProjectOverview();
});
